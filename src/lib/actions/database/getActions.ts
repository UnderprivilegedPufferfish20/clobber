'use cache';

import prisma from "@/lib/db";
import { getTenantPool } from "./tennantPool";
import { buildWhereClause, mapPostgresType, t } from "@/lib/utils";
import { cacheTag } from "next/cache";
import { DATA_TYPES, QueryFilters, SchemaEditorTable } from "@/lib/types";
import { getUser } from "../auth";

export async function getProjectById(id: string) {
  cacheTag(t("project", id))

  return await prisma.project.findUnique({
    where: {
      id,
    },
    include: {
      collaborators: true,
      owner: true,
    }
  })
}

export async function getSchemas(projectId: string) {
  cacheTag(t("schemas", projectId))

  const project = await getProjectById(projectId);

  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  })

  const result = await pool.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE SCHEMA_NAME NOT IN ('pg_catalog', 'information_schema', 'google_vacuum_mgmt')
    ORDER BY schema_name;
  `);

  return result.rows.map(row => row.schema_name);
}

export async function getFolders(projectId: string) {
  cacheTag(t("folders", projectId))

  return await prisma.sqlFolder.findMany({
    where: { projectId }, include: { queries: true }
  })
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

export async function getQueries(projectId: string) {
  cacheTag(t("queries", projectId))

  return await prisma.sql.findMany({
    where: { projectId }
  })
}



export async function getSqlQueryById(id: string, projectId: string) {
  cacheTag(t("query", projectId, id))
  return prisma.sql.findUnique({ where: { projectId, id } })
}

export async function getSchema(
  projectId: string,
  schema: string
): Promise<SchemaEditorTable[]> {
  cacheTag(t("schema", projectId, schema))

  const project = await getProjectById(projectId);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  });

  const result = await pool.query(`
    WITH
  params AS (
  SELECT
    '${schema}'::text AS target_schema ),
  tables AS (
  SELECT
    n.nspname AS SCHEMA,
    c.relname AS name,
    c.oid AS table_oid
  FROM
    pg_catalog.pg_class c
  JOIN
    pg_catalog.pg_namespace n
  ON
    n.oid = c.relnamespace
  WHERE
    c.relkind = 'r'
    AND n.nspname = (
    SELECT
      target_schema
    FROM
      params)
    AND n.nspname NOT IN ('pg_catalog',
      'information_schema') ),
  columns_base AS (
  SELECT
    t.schema,
    t.name AS table_name,
    a.attname AS name,
    pg_catalog.format_type(a.atttypid,
      a.atttypmod) AS datatype,
    NOT a.attnotnull AS is_nullable,
    CASE
      WHEN d.adbin IS NOT NULL THEN pg_catalog.pg_get_expr(d.adbin, d.adrelid)
  END
    AS default_value,
    EXISTS (
    SELECT
      1
    FROM
      pg_catalog.pg_constraint con
    WHERE
      con.conrelid = t.table_oid
      AND con.contype = 'p'
      AND a.attnum = ANY(con.conkey) ) AS is_primary_key,
    EXISTS (
    SELECT
      1
    FROM
      pg_catalog.pg_constraint con
    WHERE
      con.conrelid = t.table_oid
      AND con.contype = 'u'
      AND con.conkey = ARRAY[a.attnum]::smallint[] ) AS is_unique,
    t.table_oid,
    a.attnum
  FROM
    tables t
  JOIN
    pg_catalog.pg_attribute a
  ON
    a.attrelid = t.table_oid
    AND a.attnum > 0
    AND NOT a.attisdropped
  LEFT JOIN
    pg_catalog.pg_attrdef d
  ON
    d.adrelid = t.table_oid
    AND d.adnum = a.attnum ),
  foreign_keys AS (
  SELECT
    con.conname AS name,
    n.nspname AS SCHEMA,
    cl.relname AS TABLE,
    local_cols.attname AS from_column,
    ref_n.nspname AS to_schema,
    ref_cl.relname AS to_table,
    ref_cols.attname AS to_column,
    CASE con.confupdtype
      WHEN 'a' THEN 'NO ACTION'
      WHEN 'r' THEN 'RESTRICT'
      WHEN 'c' THEN 'CASCADE'
      WHEN 'n' THEN 'SET NULL'
      WHEN 'd' THEN 'SET DEFAULT'
  END
    AS on_update,
    CASE con.confdeltype
      WHEN 'a' THEN 'NO ACTION'
      WHEN 'r' THEN 'RESTRICT'
      WHEN 'c' THEN 'CASCADE'
      WHEN 'n' THEN 'SET NULL'
      WHEN 'd' THEN 'SET DEFAULT'
  END
    AS on_delete
  FROM
    pg_catalog.pg_constraint con
  JOIN
    pg_catalog.pg_namespace n
  ON
    con.connamespace = n.oid
  JOIN
    pg_catalog.pg_class cl
  ON
    con.conrelid = cl.oid
  JOIN
    pg_catalog.pg_class ref_cl
  ON
    con.confrelid = ref_cl.oid
  JOIN
    pg_catalog.pg_namespace ref_n
  ON
    ref_cl.relnamespace = ref_n.oid
  CROSS JOIN
    UNNEST(con.conkey, con.confkey) AS k(local_attnum,
      ref_attnum)
  JOIN
    pg_catalog.pg_attribute local_cols
  ON
    local_cols.attrelid = con.conrelid
    AND local_cols.attnum = k.local_attnum
  JOIN
    pg_catalog.pg_attribute ref_cols
  ON
    ref_cols.attrelid = con.confrelid
    AND ref_cols.attnum = k.ref_attnum
  WHERE
    con.contype = 'f'
    AND n.nspname = (
    SELECT
      target_schema
    FROM
      params) ),
  columns_with_fk AS (
  SELECT
    cb.*,
    COALESCE( (
      SELECT
        json_agg( json_build_object( 'name',
            fk.name,
            'to',
            json_build_object( 'schema',
              fk.to_schema,
              'table',
              fk.to_table,
              'column',
              fk.to_column ),
            'onDelete',
            fk.on_delete,
            'onUpdate',
            fk.on_update ) )
      FROM
        foreign_keys fk
      WHERE
        fk.schema = cb.schema
        AND fk.table = cb.table_name
        AND fk.from_column = cb.name ), '[]'::json ) AS foreign_keys
  FROM
    columns_base cb )
SELECT
  json_agg( json_build_object( 'schema',
      t.schema,
      'name',
      t.name,
      'columns',
      (
      SELECT
        json_agg( json_build_object( 'name',
            cf.name,
            'datatype',
            cf.datatype,
            'isPrimaryKey',
            cf.is_primary_key,
            'isUnique',
            cf.is_unique,
            'isNullable',
            cf.is_nullable,
            'defaultValue',
            cf.default_value,
            'foreignKeys',
            cf.foreign_keys )
        ORDER BY
          cf.attnum )
      FROM
        columns_with_fk cf
      WHERE
        cf.schema = t.schema
        AND cf.table_name = t.name ) ) )
FROM
  tables t;
  `)

  return result.rows[0].json_agg as SchemaEditorTable[]
}

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

export async function getTriggers(
  projectId: string,
  schema: string
) {
  cacheTag(t("triggers", projectId, schema))


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
    t.trigger_name AS name, 
    t.event_object_table AS table_name, 
    t.event_object_schema AS schema_name, 
    p.proname AS function_name, 
    string_agg(t.event_manipulation, ', ') AS events, -- Aggregates events into a list
    t.action_timing AS timing, 
    t.action_orientation AS orientation 
FROM information_schema.triggers t 
JOIN pg_catalog.pg_class c ON c.relname = t.event_object_table 
JOIN pg_catalog.pg_namespace n_schema ON n_schema.oid = c.relnamespace 
JOIN pg_catalog.pg_trigger tr ON tr.tgrelid = c.oid AND tr.tgname = t.trigger_name 
JOIN pg_catalog.pg_proc p ON p.oid = tr.tgfoid 
WHERE t.event_object_schema = '${schema}' 
GROUP BY 
    t.trigger_name, t.event_object_table, t.event_object_schema, 
    p.proname, t.action_timing, t.action_orientation
ORDER BY schema_name, table_name, name;



    `);

  return result.rows
}

export async function getEnums(
  projectId: string,
  schema: string
) {
  cacheTag(t("enums", projectId, schema))


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
    n.nspname AS enum_schema,
    t.typname AS enum_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS enum_values
FROM
    pg_type t
JOIN
    pg_enum e ON t.oid = e.enumtypid
JOIN
    pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE
    n.nspname = '${schema}' -- Replace 'public' with your schema name
GROUP BY
    n.nspname, t.typname
ORDER BY
    enum_name;
    `);

  return result.rows
}