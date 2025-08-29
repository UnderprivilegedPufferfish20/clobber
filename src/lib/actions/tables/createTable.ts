'use server';

import prisma from "@/lib/db";
import { createTableSchema } from "@/lib/types/schemas/createTableSchema";
import z from "zod";
import { getUser } from "../auth/getUser";
import { revalidatePath } from "next/cache";
import { getDatabaseById } from "../database/getDatabaseById";

export default async function createTable(
  form: z.infer<typeof createTableSchema>,
  databaseId: string
) {
  const user = await getUser()
  
  if (!user) throw new Error("No user");

  const database = await getDatabaseById(databaseId)
  if (!database) throw new Error("Couldn't find database");

  const { success, data } = createTableSchema.safeParse(form)
  if (!success) throw new Error("Invalid form data");
    
  const result = await prisma.table.create({
    data: {
      name: data.name,
      databaseId
    }
  })

  // Revalidate the path to ensure server components get fresh data
  revalidatePath(`/proj/${database.projectId}/database/${databaseId}`)
  
  // Return the created table so the client can use the ID
  return result
}