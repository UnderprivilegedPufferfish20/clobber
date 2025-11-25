'use server'

import prisma from "@/lib/db";
import { getUser } from "../auth/getUser";

export async function getTableById(id: string) {
  const user = await getUser()
    
  if (!user) throw new Error("No active user");

  return await prisma.table.findUnique({
    where: { id }, 
    include: { 
      database: {
        include: {
          project: true
        }
      }
    }
  })
}