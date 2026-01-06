"use cache";

import { t } from "@/lib/utils";
import { cacheTag } from "next/cache";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";

export async function getIndexes(
  projectId: string,
  schema: string
) {
  cacheTag(t("indexes", projectId, schema))


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
    t.relname AS table_name,
    i.relname AS index_name,
    am.amname AS access_method,
    pg_get_indexdef(idx.indexrelid) AS index_definition,
    -- A more complex join is needed to list columns individually (see description below)
    -- This simply shows the full definition which includes the columns/expressions
    idx.indisunique AS is_unique,
    idx.indisprimary AS is_primary
FROM
    pg_catalog.pg_class i
JOIN
    pg_catalog.pg_index idx ON i.oid = idx.indexrelid
JOIN
    pg_catalog.pg_class t ON idx.indrelid = t.oid
JOIN
    pg_catalog.pg_namespace n ON n.oid = t.relnamespace
JOIN
    pg_catalog.pg_am am ON am.oid = i.relam
WHERE
    n.nspname = '${schema}' -- Replace with your schema name, e.g., 'public'
ORDER BY
    schema_name,
    table_name,
    index_name;

    `);

  return result.rows
}