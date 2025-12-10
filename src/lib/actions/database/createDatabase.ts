'use server';

import { createDatabaseSchema } from "@/lib/types/schemas/createDatabaseSchema";
import z from "zod";
import { getUser } from "../auth/getUser";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import authFetch from "../auth/authFetch";
import B_URL from "@/lib/constants";

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

  await fetch(`${B_URL}/db/new`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `${project?.con_string}`
    },
    body: JSON.stringify({
      "name": data.name,
      "con_str": project.con_string
    })
  })

  revalidatePath('/proj')
  redirect(`/proj/${projectId}/database/${result.id}`)

}