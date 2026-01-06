"use server";

import { createTriggerSchema } from "@/lib/types/schemas";
import { t } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import z from "zod";
import { getUser } from "../../auth";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";

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

export async function createTrigger(
  form: z.infer<typeof createTriggerSchema>,
  projectId: string
) {
  const { data, success } = createTriggerSchema.safeParse(form);
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
    CREATE TRIGGER ${data.name}
    ${data.type} ${data.event.join(" OR ")} ON "${data.schema}"."${data.table}"
    FOR EACH ${data.orientation}
    EXECUTE FUNCTION ${data.functionSchema}.${data.functionName}();
  `

  console.log("@@QUERY: ", query)

  await pool.query(query)

  revalidateTag(t("triggers", projectId, data.schema), 'max')
}