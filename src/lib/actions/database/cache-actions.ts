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



