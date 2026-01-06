'use cache';

import { t } from "@/lib/utils";
import { cacheTag } from "next/cache";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";

export async function getCols(
  schema: string,
  projectId: string,
  table: string
) {
  cacheTag(t("columns", projectId, schema, table))
  const project = await getProjectById(projectId);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  });

  const col_details = await pool.query(`
    SELECT *
    FROM information_schema.columns
    WHERE table_schema = '${schema.toLowerCase()}'
      AND table_name = '${table.toLowerCase()}';
  `)

  const returnval = col_details.rows.map(r => ({ name: r.column_name, dtype: r.data_type }))

  console.log("@@getCols final: ", returnval)

  return returnval
}