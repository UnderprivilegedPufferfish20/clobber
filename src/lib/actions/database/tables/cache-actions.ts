"use cache";

import { ColumnSortType, DATA_TYPES, FilterConfig } from "@/lib/types";
import { t, buildWhereClause } from "@/lib/utils";
import { cacheTag } from "next/cache";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";
import { getCols } from "../columns/cache-actions";

export async function getTableData<T>(
  projectId: string,
  schema: string,
  table: string,
  limit: number = 50,
  offset: number = 0,
  filters: FilterConfig[],
  caceTag: string,
  sort: ColumnSortType[],
) {
  cacheTag(t(caceTag, projectId, schema, table))

  const project = await getProjectById(projectId);
  if (!project) throw new Error("No project found");



  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name,
  });

  // First, get column types
  const columns = await getCols(schema, projectId, table)



  const columnTypes = new Map<string, DATA_TYPES>();
  for (const col of columns) {
    columnTypes.set(col.name, col.dtype);
  }

  // Build WHERE clause with type safety
  const { whereClause, errors } = buildWhereClause(filters, columnTypes);

  // Return errors if any filters are invalid
  if (Object.keys(errors).length > 0) {
    throw new Error(`Invalid filters: ${JSON.stringify(errors)}`);
  }

  const sortClauses = sort && sort[0] && sort[0].column !== '' ? sort.map(s => {
    return `"${s.column}" ${s.dir}`
  }) : []

  console.log("@SRT: ", sort)

  const q = `
    SELECT 
      * 
    FROM "${schema}"."${table}"
    ${whereClause}
    ${sortClauses.length > 0 ? `ORDER BY ${sortClauses.join(", ")}` : ''}
    LIMIT ${limit} OFFSET ${offset};
  `
  console.log("@Q: ", q)

  const result = await pool.query(q)

  const rowCountResult = await pool.query(`SELECT COUNT(*) FROM "${schema}"."${table}";`)

  return {
    rows: result.rows as T[],
    columns,
    rowCount: rowCountResult.rows[0].count,
  };
}

export async function getTableSchema(
  projectId: string,
  schema: string,
  table: string
) {
  cacheTag(t("table-schema", projectId, schema, table))

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
        'CREATE TABLE ' || a.attrelid::regclass::text || ' (' || 
        string_agg(
            a.attname || ' ' || 
            pg_catalog.format_type(a.atttypid, a.atttypmod) || 
            CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END, 
            ', ' ORDER BY a.attnum
        ) || ');' AS create_table_sql
    FROM pg_catalog.pg_attribute a
    JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
    WHERE a.attrelid = '${schema}.${table}'::regclass  -- Replace with your table name
      AND a.attnum > 0 
      AND NOT a.attisdropped
      AND c.relkind = 'r'
    GROUP BY a.attrelid;
  `)

  return result.rows[0].create_table_sql
}




export async function getTables(schemaName: string, projectId: string) {
  cacheTag(t("tables", projectId, schemaName))

  const project = await getProjectById(projectId);

  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  })

  const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = '${schemaName}'
    AND table_type = 'BASE TABLE';
  `);

  return result.rows.map(row => row.table_name);
}