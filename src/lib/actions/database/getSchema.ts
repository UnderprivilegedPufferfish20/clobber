'use server';

import prisma from "@/lib/db";
import { getUser } from "../auth/getUser";
import authFetch from "../auth/authFetch";
import { B_URL } from "@/lib/constants";

export default async function getSchema(
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
      "query": `SELECT nspname
FROM pg_catalog.pg_namespace
WHERE nspname NOT IN ('pg_catalog', 'information_schema')
AND nspname NOT LIKE 'pg_toast%';`,
      "con_str": project.con_string
    })
  })

  console.log("@@Get Schemas Response - ", res)

  return res
}