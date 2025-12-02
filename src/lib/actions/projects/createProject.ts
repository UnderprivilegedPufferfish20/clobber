'use server';

import { createProjectSchema } from "@/lib/types/schemas/createProjectSchema";
import z from "zod";
import { getUser } from "../auth/getUser";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import B_URL from "@/lib/constants";
import authFetch from "../auth/authFetch";
import { generateProjectPassword } from "@/lib/utils";

export default async function createProject(
  form: z.infer<typeof createProjectSchema>
) {

  const user = await getUser()

  if (!user) throw new Error("No user");

  const { success, data } = createProjectSchema.safeParse(form)

  if (!success) throw new Error("Invalid form data");

  const result = await prisma.project.create({
    data: {
      ownerId: user.id,
      name: data.name
    }
  })

  if (!result) throw new Error("No result");

  const backend_create_proj_res = await authFetch(`${B_URL}/project/new`, {
    method: "POST",
    body: JSON.stringify({
      project_name: data.name,
      password: generateProjectPassword()
    })
  })

  //TODO: Map port to project name in database and store password


  revalidatePath('/proj')
  redirect(`/proj/${result.id}`)

}