'use server'

import prisma from "@/lib/db";
import { getUser } from "../auth/getUser";

export async function getDatabaseById(id: string) {
  const user = await getUser()
    
  if (!user) throw new Error("No active user");

  return await prisma.database.findUnique({where: { id }, include: { project: true }})
}