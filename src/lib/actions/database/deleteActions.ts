'use server';

import { revalidateTag } from "next/cache";
import { getUser } from "../auth";
import { getProjectById } from "./getActions";
import { getTenantPool } from "./tennantPool";
import { t } from "@/lib/utils";

export async function deleteIndex(
  projectId: string,
  schema: string,
  name: string
) {
  const user = await getUser();
  if (!user) throw new Error("No user");

  const project = await getProjectById(projectId);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name,
  });

  await pool.query(`
    DROP INDEX ${schema}.${name} RESTRICT
  `)

  revalidateTag(t("indexes", projectId, schema), 'max')
}

export async function deleteEnum(
  projectId: string,
  schema: string,
  name: string
) {
  const user = await getUser();
  if (!user) throw new Error("No user");

  const project = await getProjectById(projectId);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name,
  });

  await pool.query(`
    DROP TYPE ${schema}.${name} RESTRICT;
  `)

  revalidateTag(t("enums", projectId, schema), 'max')
}

export async function deleteFunction(
  projectId: string,
  schema: string,
  name: string
) {
  const user = await getUser();
  if (!user) throw new Error("No user");

  const project = await getProjectById(projectId);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name,
  });

  const [funcName, args] = name.split("(")
  let argPart = "(" + args.split(/,\s*/).map(i => i.split(" ")[1]).join(", ")

  if (args === ")") argPart = "()";

  const query = `
    DROP FUNCTION ${schema}.${funcName + argPart} RESTRICT;
  `

  console.log("@@Query: ", query)

  await pool.query(query)

  revalidateTag(t("functions", projectId, schema), 'max')
}


export async function deleteTrigger(
  projectId: string,
  schema: string,
  name: string,
  table?: string
) {

  console.log("@@DeleteTrigger table provided: ", table)

  if (!table) throw new Error("Must provide table to delete trigger");

  const user = await getUser();
  if (!user) throw new Error("No user");

  const project = await getProjectById(projectId);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name,
  });

  await pool.query(`
    DROP TRIGGER ${name} ON ${schema}.${table} RESTRICT;
  `)

  revalidateTag(t("triggers", projectId, schema), 'max')
}