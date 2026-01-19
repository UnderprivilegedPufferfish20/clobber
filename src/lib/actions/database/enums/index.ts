"use server";

import { createEnumSchema } from "@/lib/types/schemas";
import { t } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import z from "zod";
import { getUser } from "../../auth";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";
import { EnumType } from "@/lib/types";

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

export async function editEnum(
  old: EnumType,
  edited: EnumType,
  renamedVals: { oldName: string, newName: string }[],
  projectId: string
) {
  const oldVals = old.enum_values.split(", ")
  const editedVals = edited.enum_values.split(", ")

  const oldValsSet = new Set(oldVals)

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

  const queries: string[] = []

  const newVals = editedVals.filter(v => !oldValsSet.has(v) && !new Set(renamedVals.map(rv => rv.newName)).has(v))

  for (const newVal of newVals) {
    queries.push(`ALTER TYPE "${old.enum_schema}"."${old.enum_name}" ADD VALUE '${newVal}';`)
  }

  for (const renamedVal of renamedVals) {
    queries.push(`ALTER TYPE "${old.enum_schema}"."${old.enum_name}" RENAME VALUE '${renamedVal.oldName}' TO '${renamedVal.newName}';`)
  }

  if (old.enum_name !== edited.enum_name) {
    queries.push(`ALTER TYPE "${old.enum_schema}"."${old.enum_name}" RENAME TO '${edited.enum_name}'`)
  }

  try {
    await pool.query("BEGIN");
    for (const q of queries) {
      console.log("@@QUERY:", q);
      await pool.query(q);
    }
    await pool.query("COMMIT");
  } catch (e) {
    await pool.query("ROLLBACK");
    throw e;
  }

  revalidateTag(t("enums", projectId, old.enum_schema), 'max')
  if (old.enum_schema !== edited.enum_schema) {
    revalidateTag(t("enums", projectId, edited.enum_schema), 'max')
  }
}