'use server';

import { revalidateTag } from "next/cache";
import getBucket from ".";
import { t } from "@/lib/utils";
import prisma from "@/lib/db";

export async function deleteObject(
  path: string,
  objectId: string
) {
  const bucket = getBucket()
  if (!bucket) throw new Error("Cannot connect to bucket");

  const file = bucket.file(path)
  if (!file) throw new Error("File not found");

  await file.delete()

  await prisma.object.delete({
    where: { id: objectId }
  })

  revalidateTag(t("folder-data", path.split("/").slice(0, -1).join("/")), 'max')
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