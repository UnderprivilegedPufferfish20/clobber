'use server';

import prisma from "@/lib/db";
import { getUser } from "../auth/getUser";
import authFetch from "../auth/authFetch";
import { B_URL } from "@/lib/constants";

export default async function getTables(
  projectId: string,
  databaseId: string
) {
  const user = await getUser()
  
  if (!user) throw new Error("No user");

  const database = await prisma.database.findUnique( {where: {id: databaseId}})

  if (!database) throw new Error("database not found.");

  const project = await prisma.project.findUnique( {where: {id: projectId}})

  if (!project) throw new Error("project not found.");

  const res = await authFetch(`${B_URL}/project/exec`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      "query": `SELECT table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema') AND table_type = 'BASE TABLE';`,
      "con_str": project.con_string
    })
  })

  console.log("@@Get Tables Response - ", res)

  return res
}