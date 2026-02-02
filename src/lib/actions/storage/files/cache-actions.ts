"use cache";

import prisma from "@/lib/db";
import { t } from "@/lib/utils";
import { cacheTag } from "next/cache";
import { getProjectById } from "../../database/cache-actions";
import { getTenantPool } from "../../database/tennantPool";
import { FileStorageBucket } from "@/lib/types";

export async function getBucketNames(
  projectId: string
) {
  cacheTag(t("buckets", projectId))

  const project = await getProjectById(projectId)
  if (!project) throw new Error("Project not found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  })

  const result = await pool.query(`SELECT * FROM "storage"."buckets" WHERE project_id = $1`, [project.id])

  return result.rows as FileStorageBucket[]
}

