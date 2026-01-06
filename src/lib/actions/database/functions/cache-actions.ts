"use cache";

import { t } from "@/lib/utils";
import { cacheTag } from "next/cache";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";

export async function getFunctions(projectId: string, schema: string) {
  cacheTag(t("functions", projectId, schema))


  const project = await getProjectById(projectId);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  });

  const result = await pool.query(`
    SELECT
      n.nspname AS schema_name,
      p.proname AS function_name,
      r.routine_type AS function_type,
      r.data_type AS data_type,
      pg_catalog.pg_get_function_arguments(p.oid) AS arguments,
      pg_catalog.pg_get_functiondef(p.oid) AS definition
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n
      ON n.oid = p.pronamespace
    JOIN information_schema.routines r
      ON r.routine_name = p.proname
    AND r.routine_schema = n.nspname
    WHERE
      r.routine_type = 'FUNCTION'
      AND n.nspname = '${schema}';


    `);

  return result.rows
}