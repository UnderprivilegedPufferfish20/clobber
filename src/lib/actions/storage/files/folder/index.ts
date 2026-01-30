"use server";

import { t } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import getBucket from "..";
import JSZip from "jszip";
import { getProjectById } from "@/lib/actions/database/cache-actions";
import { getTenantPool } from "@/lib/actions/database/tennantPool";



export async function createFolder(
  projectId: string,
  name: string,
  path: string
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

  const fullPath = `${projectId}/${path}/${name}/.placeholder`;
  const file = bucket.file(fullPath);
  const content = Buffer.from('placeholder', 'utf-8');
  
  await file.save(content, {
    metadata: { contentType: 'text/plain' }
  });

  const bucketName = path.split("/")[0];
  const dbBucketResult = await pool.query(`
    SELECT *
    FROM "storage"."buckets"
    WHERE name = $1
  `, [bucketName]);

  if (dbBucketResult.rowCount !== 1) throw new Error("Bucket doesn't exist in database");

  const dbBucket = dbBucketResult.rows[0];

  await pool.query(`
    INSERT INTO "storage"."objects" ("lastAccessedAt", name, "bucketId")
    VALUES ($1, $2, $3)
  `, [new Date(), fullPath, dbBucket.id]);

  revalidateTag(t("folder-data", `${projectId}/${path}`), "max")
}

export async function deleteFolder(
  projectId: string,
  path: string
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

  const prefix = `${projectId}/${path}`
  const parentFolder = prefix.split("/").slice(0, -1).join("/");

  await bucket.deleteFiles({
    prefix
  })

  await pool.query(`
    DELETE FROM "storage"."objects"
    WHERE name LIKE $1 || '%'
  `, [prefix]);

  revalidateTag(t("folder-data", parentFolder), 'max')
}


export async function downloadFolder(
  projectId: string,
  path: string  // e.g. 'projects/123/folder/'
) {
  const bucket = getBucket();
  if (!bucket) throw new Error("Cannot connect to bucket");

  const zip = new JSZip();

  const [files] = await bucket.getFiles({ prefix: path });

  for (const file of files) {
    const fullPath = file.name;  // Full path like 'projects/123/folder/subdir/file.txt' [web:24]
    const pathParts = fullPath.split("/");  // ['projects', '123', 'folder', 'subdir', 'file.txt']

    // Skip if outside target path (edge case)
    if (!fullPath.startsWith(path)) continue;

    // Relative parts after the target path prefix
    const relParts = fullPath.replace(path, '').split("/").filter(Boolean);  // ['subdir', 'file.txt']
    if (relParts.length === 0) continue;

    let currentFolder = zip;
    // Recursively create nested folders up to the parent
    for (let i = 0; i < relParts.length - 1; i++) {
      currentFolder = currentFolder.folder(relParts[i])!;  // zip.folder('subdir') [web:29][web:30]
    }

    const filename = relParts.at(-1)!;  // 'file.txt' or '.placeholder'

    if (filename === ".placeholder") {
      // Create the folder (don't add empty file)
      currentFolder.folder("");  // Ensures folder exists [web:29]
    } else {
      // Add the file to the final folder
      const stream = file.createReadStream();
      currentFolder.file(filename, stream, { binary: true });  // [web:29][web:19]
    }
  }

  return zip.generateAsync({ 
    type: 'blob',
    streamFiles: true  // Lower memory usage for large folders [web:38]
  });
}




