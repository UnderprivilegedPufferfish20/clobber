"use server";

import { createIndexSchema } from "@/lib/types/schemas";
import { t } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import z from "zod";
import { getUser } from "../../auth";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";

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

export async function createIndex(
  form: z.infer<typeof createIndexSchema>,
  projectId: string,
) {
  const { data, success } = createIndexSchema.safeParse(form);
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
    CREATE INDEX "${data.table}_${data.cols.map(c => c.name).join("_")}_idx" ON "${data.schema}"."${data.table}" USING ${data.type.toString().toLowerCase()} (${data.cols.map(c => c.name).join(", ")});
  `

  console.log("@QUERY: ", query)

  await pool.query(query)

  revalidateTag(t("indexes", projectId, data.schema), 'max')
}