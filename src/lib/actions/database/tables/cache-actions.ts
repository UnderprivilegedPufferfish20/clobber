"use cache";

import { DATA_TYPES } from "@/lib/types";
import { t, mapPostgresType, buildWhereClause } from "@/lib/utils";
import { QueryFilters } from "@/lib/types";
import { cacheTag } from "next/cache";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";

export async function getTableData(
  projectId: string,
  schema: string,
  table: string,
  page: number = 1,
  pageSize: number = 50,
  filters: QueryFilters = {},
  sort?: { column: string; direction: "ASC" | "DESC" }
) {
  console.log("@@GETTABLEDATA ARGS: ", projectId, schema, table, page, pageSize, filters, sort)

  cacheTag(t("table-data", projectId, schema, table))

  const project = await getProjectById(projectId);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name,
  });

  // First, get column types
  const columnsResult = await pool.query(
    `
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = $1 AND table_name = $2
    ORDER BY ordinal_position;
  `,
    [schema, table]
  );

  // Build column type map
  const columnTypes = new Map<string, DATA_TYPES>();
  for (const col of columnsResult.rows) {
    columnTypes.set(col.column_name, mapPostgresType(col.data_type));
  }

  // Build WHERE clause with type safety
  const { whereClause, whereParams, errors } = buildWhereClause(filters, columnTypes);

  // Return errors if any filters are invalid
  if (Object.keys(errors).length > 0) {
    throw new Error(`Invalid filters: ${JSON.stringify(errors)}`);
  }

  const countQuery = `
    SELECT COUNT(*) as total 
    FROM "${schema}"."${table}" ${whereClause};
  `;

  const countResult = await pool.query(countQuery, whereParams);
  const total = parseInt(countResult.rows[0].total);

  const offset = (page - 1) * pageSize;
  const paramCount = whereParams.length + 1;

  const dataQuery = `
    SELECT * 
    FROM "${schema}"."${table}"
    ${whereClause}
    ${sort ? `ORDER BY "${sort.column}" ${sort.direction}` : ''}
    LIMIT $${paramCount} OFFSET $${paramCount + 1};
  `;

  const dataResult = await pool.query(dataQuery, [...whereParams, pageSize, offset]);

  return {
    rows: dataResult.rows,
    columns: columnsResult.rows.map(col => ({
      ...col,
      data_type_enum: mapPostgresType(col.data_type)
    })),
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
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
  cacheTag(t("tables", projectId,schemaName))

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