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