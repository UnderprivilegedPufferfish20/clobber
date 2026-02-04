'use cache';

import { t } from "@/lib/utils";
import { cacheTag } from "next/cache";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";
import { ColumnType } from "@/lib/types";

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
    SELECT 
      c.column_name,
      c.data_type,
      c.column_default,
      c.is_nullable,
      CASE WHEN c.data_type LIKE 'ARRAY' OR c.data_type LIKE '%[]' THEN true ELSE false END as is_array,
      CASE WHEN tc.constraint_type = 'PRIMARY KEY' THEN true ELSE false END as is_pkey,
      CASE WHEN tc.constraint_type = 'UNIQUE' THEN true ELSE false END as is_unique
    FROM information_schema.columns c
    LEFT JOIN information_schema.key_column_usage kcu 
      ON c.table_schema = kcu.table_schema 
      AND c.table_name = kcu.table_name 
      AND c.column_name = kcu.column_name
    LEFT JOIN information_schema.table_constraints tc 
      ON kcu.constraint_name = tc.constraint_name 
      AND kcu.table_schema = tc.table_schema
    WHERE c.table_schema = '${schema.toLowerCase()}'
      AND c.table_name = '${table.toLowerCase()}';
  `)

  const returnval = col_details.rows.map(r => ({
    name: r.column_name,
    dtype: r.data_type,
    is_array: r.is_array || false,
    default: r.column_default || '',
    is_pkey: r.is_pkey || false,
    is_unique: r.is_unique || false,
    is_nullable: r.is_nullable === 'YES'
  }))

  return returnval as ColumnType[]
}