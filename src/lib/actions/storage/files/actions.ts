'use server';

import { revalidateTag } from "next/cache";
import getBucket from "."
import { t } from "@/lib/utils";
import prisma from "@/lib/db";
import { getProjectById } from "../../database/cache-actions";
import { getTenantPool } from "../../database/tennantPool";
import { FileStorageBucket } from "@/lib/types";





export async function createBucket(
  projectId: string,
  name: string
) {
  const bucket = getBucket()
  if (!bucket) throw new Error("Cannot connect to bucket");

  const project = await getProjectById(projectId)
  if (!project) throw new Error("Project not found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  })

  const result = await pool.query(`
    INSERT INTO "storage"."buckets" (name, "projectId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $3)
  `, [name, projectId, new Date().toLocaleDateString()])

  revalidateTag(t("buckets", projectId), "max")

  const fullPath = `${projectId}/${name}/.placeholder`;
  const file = bucket.file(fullPath);
  const content = Buffer.from('placeholder', 'utf-8');

  await file.save(content, {
    metadata: { contentType: 'text/plain' }
  });

  return result.rows[0] as FileStorageBucket
}