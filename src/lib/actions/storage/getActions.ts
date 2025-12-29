"use cache";

import prisma from "@/lib/db";
import { t } from "@/lib/utils";
import { cacheTag } from "next/cache";
import getBucket from ".";

export async function getBucketNames(
  projectId: string
) {
  cacheTag(t("buckets", projectId))

  return prisma.bucket.findMany({
    where: { projectId }
  })
}

export async function getFolderData(
  projectId: string,
  path: string
) {
  cacheTag(t("folder-data", `${projectId}/${path}`))

  const bucket = await prisma.bucket.findUnique({
    where: { projectId, name: path.split("/")[0] }
  })

  if (!bucket) throw new Error("Bucket not found");

  return prisma.object.findMany({
    where: {
      name: {
        startsWith: `${projectId}/${path}`
      }
    }
  })
}