'use server';

import { revalidateTag } from "next/cache";
import getBucket from "."
import { t } from "@/lib/utils";
import prisma from "@/lib/db";





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