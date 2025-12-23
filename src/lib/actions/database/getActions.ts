'use cache';

import prisma from "@/lib/db";
import { getTenantPool } from "./tennantPool";
import { DATA_TYPES } from "@/lib/types";
import { mapPostgresType, t } from "@/lib/utils";
import { cacheTag } from "next/cache";

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

  console.log("@@ GET SCHEMAS: ", result);

  return result.rows.map(row => row.schema_name);
}

export async function getTables(projectId: string, schemaName: string) {
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

  console.log("@@ GET TABLES: ", result);

  return result.rows.map(row => row.table_name);
}

export async function getFolders(projectId: string) {
  cacheTag(t("folders", projectId))

  return await prisma.sqlFolder.findMany({
    where: { projectId }, include: { queries: true }
  })
}

export async function getQueries(projectId: string) {
  cacheTag(t("queries", projectId))

  return await prisma.sql.findMany({
    where: { projectId }
  })
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

  const cols_to_dtype: Record<string, DATA_TYPES> = {}

  for (let i = 0; i < col_details.rows.length; i++) {
    cols_to_dtype[col_details.rows[i].column_name] = mapPostgresType(col_details.rows[i].data_type)
  }

  return cols_to_dtype
}

export async function getSqlQueryById(id: string, projectId: string) {
  return prisma.sql.findUnique({ where: { projectId, id } })
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
        n.nspname                                 AS schema_name,
        p.proname                                AS function_name,
        r.routine_type                           AS function_type,
        r.data_type                              AS data_type,
        pg_catalog.pg_get_function_arguments(p.oid) AS arguments
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

export async function getColsForTable(
  schema: string,
  table: string,
  projectId: string
) {
  cacheTag(t("cols-for-table", projectId, schema, table))


  const project = await getProjectById(projectId);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  });

  const result = await pool.query(`
    SELECT column_name
FROM information_schema.columns
WHERE table_name = '${table}'
  AND table_schema = '${schema}';


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


export async function getFunctionsForSchema(
  projectId: string,
  schema: string
) {
  cacheTag(t("functions-for-schema", projectId, schema))


  const project = await getProjectById(projectId);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name,
  });

  const reult = await pool.query(`
  SELECT
    p.proname AS function_name,
    n.nspname AS schema_name
FROM
    pg_proc p
JOIN
    pg_namespace n ON p.pronamespace = n.oid
WHERE
    p.prorettype = 'trigger'::regtype AND
    n.nspname = '${schema}';

    `)
  

  return reult.rows
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