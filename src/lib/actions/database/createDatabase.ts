'use server';

import { createDatabaseSchema } from "@/lib/types/schemas/createDatabaseSchema";
import z from "zod";
import { getUser } from "../auth/getUser";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default async function createDatabase(
  form: z.infer<typeof createDatabaseSchema>,
  projectId: string
) {

  const user = await getUser()

  if (!user) throw new Error("No user");

  const { success, data } = createDatabaseSchema.safeParse(form)

  if (!success) throw new Error("Invalid form data");

  const result = await prisma.database.create({
    data: {
      name: data.name,
      projectId
    }
  })

  if (!result) throw new Error("No result");

  revalidatePath('/proj')
  redirect(`/proj/${projectId}/database/${result.id}`)

}