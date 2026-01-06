"use server";

import { createEnumSchema } from "@/lib/types/schemas";
import { t } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import z from "zod";
import { getUser } from "../../auth";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";

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

export async function createEnum(
  form: z.infer<typeof createEnumSchema>,
  projectId: string,
  schema: string
) {
  const { data, success } = createEnumSchema.safeParse(form);
  if (!success) throw new Error("Invalid form data");

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

  const query = `
    CREATE TYPE ${schema}.${data.name} AS ENUM (${data.values.map(v => `'${v}'`).join(", ")});
  `

  console.log("@@QUERY: ", query)

  await pool.query(query)

  revalidateTag(t("enums", projectId, schema), "max")
}

export async function renameEnum(
  projectId: string,
  schema: string,
  name: string,
  newName: string
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

  const query = `
    ALTER TYPE ${schema}.${name} RENAME TO ${newName};
  `

  console.log("@@QUERY: ", query)

  await pool.query(query)

  revalidateTag(t("enums", projectId, schema), "max")
}

export async function renameEnumValue(
  projectId: string,
  schema: string,
  name: string,
  valName: string,
  newValName: string
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

  const query = `
    ALTER TYPE ${schema}.${name} RENAME VALUE '${valName}' TO '${newValName}';
  `

  console.log("@@QUERY: ", query)

  await pool.query(query)

  revalidateTag(t("enums", projectId, schema), "max")
}

export async function addValueToEnum(
  projectId: string,
  schema: string,
  name: string,
  newValName: string
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

  const query = `
    ALTER TYPE ${schema}.${name} ADD VALUE '${newValName}';
  `

  console.log("@@QUERY: ", query)

  await pool.query(query)

  revalidateTag(t("enums", projectId, schema), "max")
}