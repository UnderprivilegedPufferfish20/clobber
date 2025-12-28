'use server';

import { revalidateTag } from "next/cache";
import getBucket from "."
import { t } from "@/lib/utils";
import prisma from "@/lib/db";

export async function uploadFile(
  path: string,
  localPath: string,
) {
  const bucket = getBucket()

  if (!bucket) throw new Error("Cannot connect to bucket");

  const result = bucket.upload(localPath, {
    destination: path,
    gzip: true,

  })
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

  revalidateTag(t("folder-data", path), "max")
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