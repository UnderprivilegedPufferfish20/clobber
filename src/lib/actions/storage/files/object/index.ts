"use server";

import prisma from "@/lib/db";
import { joinPosix, t } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import getBucket from "..";
import pathPosix from 'path/posix'
import JSZip from "jszip";
import { getProjectById } from "@/lib/actions/database/cache-actions";
import { getTenantPool } from "@/lib/actions/database/tennantPool";
import { FileObject } from "@/lib/types";

export async function deleteObject(
  objectId: string,
  projectId: string
) {
  const project = await getProjectById(projectId)
  if (!project) throw new Error("Project not found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  })

  const result = await pool.query(`SELECT * FROM "storage"."objects" WHERE id = $1`, [objectId])

  if (result.rowCount !== 1) throw new Error("Object not found");

  const bucket = getBucket()
  if (!bucket) throw new Error("Cannot connect to bucket");

  const obj = result.rows[0] as FileObject

  const file = bucket.file(obj.name)
  if (!file) throw new Error("File not found");

  await file.delete()

  await pool.query(`DELETE FROM "storage"."objects" WHERE id = $1`, [objectId])

  revalidateTag(t("folder-data", obj.name.split("/").slice(0, -1).join("/")), 'max')
}

export async function uploadFile(
  projectId: string,
  path: string,
  name: string,
  buffer: ArrayBuffer
) {
  const project = await getProjectById(projectId)
  if (!project) throw new Error("Project not found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  })

  const bucket = getBucket()
  if (!bucket) throw new Error("Cannot connect to bucket");

  const safePath = (path || "").replace(/^\/+|\/+$/g, ""); // trim leading/trailing slashes
  const dest = pathPosix.join(projectId, safePath, name);

  const file = bucket.file(dest);

  // Convert ArrayBuffer -> Node Buffer
  const nodeBuffer = Buffer.from(buffer);

  await file.save(nodeBuffer, {
    resumable: false, // good for small/medium uploads; set true for very large files
    gzip: true,
    metadata: {
      // contentType: "application/octet-stream", // optionally set from the client file.type
      cacheControl: "public, max-age=31536000",
    },
  });

  const bucketName = path.split("/")[0];
  const dbBucketResult = await pool.query(`SELECT * FROM "storage"."buckets" WHERE name = $1`, [bucketName]);

  if (dbBucketResult.rowCount !== 1) throw new Error("Database bucket not found");

  const dbBucket = dbBucketResult.rows[0];

  const metadata = await file.getMetadata();

  await pool.query(`
    INSERT INTO "storage"."objects" ("lastAccessedAt", name, "bucketId", metadata)
    VALUES ($1, $2, $3, $4)
  `, [new Date(), dest, dbBucket.id, JSON.stringify(metadata)]);

  revalidateTag(t('folder-data', `${projectId}/${path}`), "max")
}




export async function renameObject(
  projectId: string,
  objectId: string,
  path: string,
  newName: string
) {
  const project = await getProjectById(projectId)
  if (!project) throw new Error("Project not found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  })

  console.log("@RenameObjectArgs: ", projectId, objectId, path, newName)
  
  const bucket = getBucket();
  if (!bucket) throw new Error("Cannot connect to bucket");
  
  // Normalize
  const oldKey = path.replace(/^\/+|\/+$/g, "");
  const parentPrefix = oldKey.split("/").slice(0, -1).join("/"); // everything before last segment
  const newKey = joinPosix(parentPrefix, newName); // new path of object
  
  const oldPrefix = oldKey.endsWith("/") ? oldKey : `${oldKey}/`;
  const newPrefix = newKey.endsWith("/") ? newKey : `${newKey}/`;
  
  const [maybeChildren] = await bucket.getFiles({ prefix: oldPrefix, maxResults: 1 });
  const isFolderMove = maybeChildren.length > 0;
  
  if (!isFolderMove) {
    // ───────────────
    // Single object rename
    // ───────────────
    const file = bucket.file(oldKey);
    await file.rename(newKey);
    
    // Update DB row (store full key, not just newName)
    await pool.query(`
      UPDATE "storage"."objects"
      SET name = $1
      WHERE id = $2
    `, [newKey, objectId]);
    
    revalidateTag(t("folder-data", parentPrefix), 'max');
    return;
  }
  
  const dbObjectsResult = await pool.query(`
    SELECT id, name
    FROM "storage"."objects"
    WHERE name LIKE $1 || '%'
  `, [oldPrefix]);
  
  const dbObjects = dbObjectsResult.rows;
  
  // 2) Copy+delete each object in GCS
  // (GCS has no atomic rename for folders)
  await Promise.all(
    dbObjects.map(async (o) => {
      const rel = o.name.slice(oldPrefix.length); // everything after the folder prefix
      const dest = joinPosix(newPrefix, rel);
      
      console.log("@@NEW OBJECT DESTINATION: ", dest)
      
      const srcFile = bucket.file(o.name);
      const destFile = bucket.file(dest);
      
      
      await srcFile.copy(destFile);
      await srcFile.delete();
    })
  );
  
  // 3) Update DB names to the new prefix
  await Promise.all(
    dbObjects.map((o) => {
      const rel = o.name.slice(oldPrefix.length);
      const updatedName = joinPosix(newPrefix, rel);
      return pool.query(`
        UPDATE "storage"."objects"
        SET name = $1
        WHERE id = $2
      `, [updatedName, o.id]);
    })
  );
  
  // 4) Update the “folder object” itself (the one the user clicked)
  // If you store a folder marker object (like ".placeholder") in DB, it will already be updated above.
  
  revalidateTag(t("folder-data", parentPrefix), 'max');
}

export async function moveObject(
  projectId: string,
  objectId: string,
  newPath: string
) {
  const project = await getProjectById(projectId)
  if (!project) throw new Error("Project not found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  })

  const objResult = await pool.query(`
    SELECT *
    FROM "storage"."objects"
    WHERE id = $1
  `, [objectId]);
  
  if (objResult.rowCount !== 1) throw new Error("Object not found");
  
  const obj = objResult.rows[0];
  
  const bucket = getBucket();
  if (!bucket) throw new Error("Cannot connect to bucket");
  
  const file = bucket.file(obj.name)
  if (!file) throw new Error("File not found");
  
  await file.move(`${projectId}/${newPath}`)
  
  
  await pool.query(`
    UPDATE "storage"."objects"
    SET name = $1
    WHERE id = $2
  `, [`${projectId}/${newPath}`, objectId]);
  
  revalidateTag(t('folder-data', obj.name.split("/").slice(0, -1).join("/")), "max")
  revalidateTag(t('folder-data', `${projectId}/${newPath}`.split("/").slice(0, -1).join("/")), "max")
}

export async function downloadSelected(
  projectId: string,
  objects: FileObject[]
) { 
  const bucket = getBucket();
  if (!bucket) throw new Error("Cannot connect to bucket");
  
  const zip = new JSZip();
  
  const streams = objects.map(o => bucket.file(o.name).createReadStream())
  
  
  for (let i = 0; i < objects.length; i++) {
    const filename = objects[i].name.split("/").at(-1)
    zip.file(filename!, streams[i], { binary: true })
  }
  
  return zip.generateAsync({ 
    type: 'blob',
    streamFiles: true  // Lower memory usage for large folders [web:38]
  });
}
export async function getURL(
  path: string,
  expirationTimeInMilliseconds: number 
) {
  const bucket = getBucket()
  if (!bucket) throw new Error("Cannot connect to bucket");
  const file = bucket.file(path)
  if (!file) throw new Error("File not found");

  const [url] = await file.getSignedUrl({
    version: 'v2',
    action: "read",
    expires: Date.now() + expirationTimeInMilliseconds
  })

  return url
}

export async function downloadObject(
  path: string
) {
  const bucket = getBucket()
  if (!bucket) throw new Error("Cannot connect to bucket");

  const file = bucket.file(path)
  if (!file) throw new Error("File not found");

  const [metadata] = await file.getMetadata()

  const [result] = await file.download()
  
  return { data: result, fileType: metadata.contentType };
}