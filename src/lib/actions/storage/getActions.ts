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

export async function getFolderData(projectId: string, path: string) {
  cacheTag(t("folder-data", `${projectId}/${path}`));


  const bucket = await prisma.bucket.findUnique({
    where: { projectId, name: path.split("/")[0] },
  });

  if (!bucket) throw new Error("Bucket not found");

  const normalizedPath = path.replace(/^\/+|\/+$/g, "");
  const prefix = `${projectId}/${normalizedPath}/`;
  const prefixDepth = prefix.split('/').length;

  // Fetch all potential children (starting with prefix)
  const allObjects = await prisma.object.findMany({
    where: {
      AND: [
        {
          name: {
            startsWith: prefix
          }
        },
        {
          name: {
            not: `${prefix}.placeholder`
          }
        }
      ]
    },
    orderBy: { name: "asc" },
  });

  // Filter in code to get only immediate children
  const immediateChildren = allObjects.filter(obj => {
    const remainingPath = obj.name.slice(prefix.length);
    const parts = remainingPath.split('/');

    // Direct file: one part, not ending with .placeholder
    if (parts.length === 1 && parts[0] !== '.placeholder') {
      return true;
    }

    // Immediate child folder: two parts, second is .placeholder
    if (parts.length === 2 && parts[1] === '.placeholder') {
      return true;
    }

    return false;
  });

  return immediateChildren;
}