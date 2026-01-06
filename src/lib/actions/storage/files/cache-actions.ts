"use cache";

import prisma from "@/lib/db";
import { t } from "@/lib/utils";
import { cacheTag } from "next/cache";

export async function getBucketNames(
  projectId: string
) {
  cacheTag(t("buckets", projectId))

  return prisma.bucket.findMany({
    where: { projectId }
  })
}

