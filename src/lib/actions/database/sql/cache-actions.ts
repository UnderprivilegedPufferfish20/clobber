"use cache";

import prisma from "@/lib/db";
import { t } from "@/lib/utils";
import { cacheTag } from "next/cache";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";

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