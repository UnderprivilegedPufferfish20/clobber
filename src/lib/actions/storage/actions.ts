'use server';

import { revalidateTag } from "next/cache";
import getBucket from "."
import { joinPosix, t } from "@/lib/utils";
import prisma from "@/lib/db";
import pathPosix from 'path/posix'
import JSZip from 'jszip'

export async function uploadFile(
  projectId: string,
  path: string,
  name: string,
  buffer: ArrayBuffer
) {
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

  const dbBucket = await prisma.bucket.findUnique({ where: { name: path.split("/")[0] } })

  if (!dbBucket) throw new Error("Database bucket not found");

  const metadata = await file.getMetadata()

  await prisma.object.create({
    data: {
      lastAccessedAt: new Date(),
      name: dest,
      bucketId: dbBucket.id,
      metadata: JSON.stringify(metadata)
    }
  })

  revalidateTag(t('folder-data', `${projectId}/${path}`), "max")
}

export async function createFolder(
  projectId: string,
  name: string,
  path: string
) { 
  const bucket = getBucket()
  if (!bucket) throw new Error("Cannot connect to bucket");

  const fullPath = `${projectId}/${path}/${name}/.placeholder`;
  const file = bucket.file(fullPath);
  const content = Buffer.from('placeholder', 'utf-8');
  
  await file.save(content, {
    metadata: { contentType: 'text/plain' }
  });

  const dbBucket = await prisma.bucket.findUnique({ where: { name: path.split("/")[0] } })
  if (!dbBucket) throw new Error("Bucket doesn't exist in prisma");

  await prisma.object.create({
    data: {
      lastAccessedAt: new Date(),
      name: fullPath,
      bucketId: dbBucket.id
    }
  })

  revalidateTag(t("folder-data", `${projectId}/${path}`), "max")
}

export async function createBucket(
  projectId: string,
  name: string
) {
  const bucket = getBucket()
  if (!bucket) throw new Error("Cannot connect to bucket");

  const result =  prisma.bucket.create({
    data: {
      name,
      projectId
    }
  })

  revalidateTag(t("buckets", projectId), "max")

  const fullPath = `${projectId}/${name}/.placeholder`;
  const file = bucket.file(fullPath);
  const content = Buffer.from('placeholder', 'utf-8');

  await file.save(content, {
    metadata: { contentType: 'text/plain' }
  });

  return result
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


export async function renameObject(
  projectId: string,
  objectId: string,
  path: string,
  newName: string
) {
  console.log("@RenameObjectArgs: ", projectId, objectId, path, newName)

  const bucket = getBucket();
  if (!bucket) throw new Error("Cannot connect to bucket");

  // Normalize
  const oldKey = path.replace(/^\/+|\/+$/g, "");
  const parentPrefix = oldKey.split("/").slice(0, -1).join("/"); // everything before last segment
  const newKey = joinPosix(parentPrefix, newName); // new path of object

  const oldPrefix = oldKey.endsWith("/") ? oldKey : `${oldKey}/`;
  const newPrefix = newKey.endsWith("/") ? newKey : `${newKey}/`;

  console.log("@@ParentPrefix: ", parentPrefix)
  console.log("@@oldKey: ", oldKey)
  console.log("@@newKey: ", newKey)
  console.log("@@OldPrefix: ", oldPrefix)
  console.log("@@NewPrefix: ", newPrefix)

  const [maybeChildren] = await bucket.getFiles({ prefix: oldPrefix, maxResults: 1 });
  const isFolderMove = maybeChildren.length > 0;

  if (!isFolderMove) {
    // ───────────────
    // Single object rename
    // ───────────────
    const file = bucket.file(oldKey);
    await file.rename(newKey);

    // Update DB row (store full key, not just newName)
    await prisma.object.update({
      where: { id: objectId },
      data: { name: newKey },
    });

    revalidateTag(t("folder-data", parentPrefix), 'max');
    return;
  }

  const dbObjects = await prisma.object.findMany({
    where: {
      name: { startsWith: oldPrefix },
      // and bucketId if you have it available / want safety:
      // bucketId: ...
    },
    select: { id: true, name: true },
  });

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
      return prisma.object.update({
        where: { id: o.id },
        data: { name: updatedName },
      });
    })
  );

  // 4) Update the “folder object” itself (the one the user clicked)
  // If you store a folder marker object (like ".placeholder") in DB, it will already be updated above.

  revalidateTag(t("folder-data", parentPrefix), 'max');
}

export async function moveObject(
  projectId: string,
  objectId: string,
  path: string,
  newPath: string
) {
  console.log("@OLDPATH: ", path)
  console.log("@NEWPATH: ", newPath)

  const bucket = getBucket();
  if (!bucket) throw new Error("Cannot connect to bucket");

  const file = bucket.file(path)
  if (!file) throw new Error("File not found");

  await file.move(`${projectId}/${newPath}`)


  await prisma.object.update({
    where: { id: objectId },
    data: {
      name: `${projectId}/${newPath}`
    }
  })

  revalidateTag(t('folder-data', path.split("/").slice(0, -1).join("/")), "max")
  revalidateTag(t('folder-data', `${projectId}/${newPath}`.split("/").slice(0, -1).join("/")), "max")
}