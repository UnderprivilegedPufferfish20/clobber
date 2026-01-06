"use server";

import prisma from "@/lib/db";
import { t } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import getBucket from "..";
import JSZip from "jszip";

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

export async function deleteFolder(
  projectId: string,
  path: string
) {
  const bucket = getBucket()
  if (!bucket) throw new Error("Cannot connect to bucket");

  const prefix = `${projectId}/${path}`
  const parentFolder = prefix.split("/").slice(0, -1).join("/");

  await bucket.deleteFiles({
    prefix
  })

  await prisma.object.deleteMany({
    where: {
      name: {
        startsWith: prefix
      }
    }
  })

  revalidateTag(t("folder-data", parentFolder), 'max')
}