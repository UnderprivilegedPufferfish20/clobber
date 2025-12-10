'use server'

import prisma from "@/lib/db";
import { getUser } from "../auth/getUser";

export async function getProjectById(id: string) {
  const user = await getUser()
    
  if (!user) throw new Error("No active user");

  return await prisma.project.findUnique({
    where: {
      id,
    },
    include: {
      collaborators: true,
      owner: true,
      databases: true,
    }
  })
}