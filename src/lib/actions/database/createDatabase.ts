'use server';

import { createDatabaseSchema } from "@/lib/types/schemas/createDatabaseSchema";
import z from "zod";
import { getUser } from "../auth/getUser";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import authFetch from "../auth/authFetch";
import {B_URL, OWNER_NAME } from "@/lib/constants";

export default async function createDatabase(
  form: z.infer<typeof createDatabaseSchema>,
  projectId: string
) {

  const user = await getUser()

  if (!user) throw new Error("No user");

  const { success, data } = createDatabaseSchema.safeParse(form)

  if (!success) throw new Error("Invalid form data");

  const project = await prisma.project.findUnique( {where: {id: projectId}})

  if (!project) throw new Error("Project not found.");

  const result = await prisma.database.create({
    data: {
      name: data.name,
      LastUsed: new Date(),
      projectId
    }
  })

  if (!result) throw new Error("No result");

  await authFetch(`${B_URL}/project/exec`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      "query": `CREATE DATABASE ${data.name} OWNER ${OWNER_NAME} ENCODING 'UTF8'`,
      "con_str": project.con_string
    })
  })

  revalidatePath('/proj')
  redirect(`/proj/${projectId}/database/${result.id}`)

}