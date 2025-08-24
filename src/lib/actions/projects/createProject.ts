'use server';

import { createProjectSchema } from "@/lib/types/schemas/createProjectSchema";
import z from "zod";
import { getUser } from "../auth/getUser";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

  revalidatePath('/proj')
  redirect(`/proj/${result.id}`)

}