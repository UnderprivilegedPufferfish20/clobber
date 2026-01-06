"use server";

import prisma from "@/lib/db";
import { createFolderSchema, createQuerySchema } from "@/lib/types/schemas";
import { t } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import z from "zod";
import { getUser } from "../../auth";

export async function deleteQuery(
  projectId: string,
  id: string
) {
  const result = await prisma.sql.delete({
    where: {
      projectId,
      id
    }
  })

  revalidateTag(t('query', projectId, id), "max")
  revalidateTag(t('queries', projectId), "max")
  revalidateTag(t('folders', projectId), "max")

  return result
}

export async function deleteFolder(
  projectId: string,
  id: string
) {
  const result = await prisma.sqlFolder.delete({
    where: { id }
  })

  revalidateTag(t('queries', projectId), "max")
  revalidateTag(t('folders', projectId), "max")

  return result
}

export async function createFolder(form: z.infer<typeof createFolderSchema>, projectId: string) {
  const { data, success } = createFolderSchema.safeParse(form)

  if (!success) throw new Error("Invalid new folder data");

  const result = prisma.sqlFolder.create({
    data: {
      projectId,
      name: data.name
    }
  })

  revalidateTag(t("folders", projectId), "max")

  return result
}

export async function createQuery(
  form: z.infer<typeof createQuerySchema>,
  projectId: string,
  folderId?: string
) {
  const { data, success } = createQuerySchema.safeParse(form)

  if (!success) throw new Error("Invalid new query data");

  let result;

  if (folderId === "") {
    result = prisma.sql.create({
    data: {
      name: data.name,
      projectId,
      query: ""
    }
  })
  } else {
    result = prisma.sql.create({
    data: {
      name: data.name,
      folderId,
      projectId,
      query: ""
    }
  })
  }

  revalidateTag(t("queries", projectId), "max")
  revalidateTag(t('folders', projectId), "max")

  return result

  
}

export async function moveQueryIntoFolder(
  projectId: string,
  queryId: string,
  folderId: string
) {
  const result = await prisma.sql.update({
    where: {
      id: queryId
    },
    data: {
      folder: {
        connect: {
          id: folderId
        }
      }
    }
  })

  revalidateTag(t('query', projectId, queryId), "max")
  revalidateTag(t('queries', projectId), "max")
  revalidateTag(t('folders', projectId), "max")

  return result
}

export async function renameFolder(projectId: string, id: string, newName: string) {
  const result = await prisma.sqlFolder.update({
    where: {  id},
    data: { name: newName }
  })

  revalidateTag(t('folders', projectId), "max")

  return result
}

export async function moveQueryToRoot(
  projectId: string,
  queryId: string
) {
  const result = await prisma.sql.update({
    where: {id: queryId},
    data: {
      folder: {
        disconnect: true
      }
    }
  })

  revalidateTag(t('query', projectId, queryId), "max")
  revalidateTag(t('queries', projectId), "max")
  revalidateTag(t('folders', projectId), "max")

  return result
}



export async function renameQuery(
  projectId: string,
  id: string,
  newName: string
) {
  const result = await prisma.sql.update({
    where: {
      projectId,
      id
    },
    data: {
      name: newName
    }
  })

  revalidateTag(t('query', projectId, id), "max")
  revalidateTag(t('queries', projectId), "max")
  revalidateTag(t('folders', projectId), "max")

  return result
}




export async function updateSqlQuery(id: string, projectId: string, query: string) {
  const user = await getUser();
  if (!user) throw new Error("No user");

  const q = await prisma.sql.findUnique({ where: { projectId, id } })

  if (!q) throw new Error("Query not found");

  const result = await prisma.sql.update({
    where: { projectId, id },
    data: { query }
  })

  revalidateTag(t("query", projectId, id), 'max')

  return result
}