'use server';

import { revalidateTag } from "next/cache";
import getBucket from "."
import { t } from "@/lib/utils";
import prisma from "@/lib/db";
import { getProjectById } from "../../database/cache-actions";
import { getTenantPool } from "../../database/tennantPool";
import { FileStorageBucket } from "@/lib/types";
import { createFileBucketSchema } from "@/lib/types/schemas";
import z from "zod";





export async function createBucket(
  form: z.infer<typeof createFileBucketSchema>,
  projectId: string,
) {
  const { data, error } = createFileBucketSchema.safeParse(form)

  if (error) throw new Error("Invalid data.");


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
    INSERT INTO "storage"."buckets"
    (name, project_id, created_at, updated_at, is_public, allowed_types, size_lim_bytes)
    VALUES ($1, $2, $3, $3, $4, $5, $6)
  `, [
    data.name,
    projectId,
    new Date().toISOString(),
    data.is_public,
    (data.allowed_types && data.allowed_types.length > 0) ? data.allowed_types : null,
    (data.file_size_limit && data.file_size_limit !== BigInt(0)) ? data.file_size_limit : null,
  ]);

  revalidateTag(t("buckets", projectId), "max")

  const fullPath = `${projectId}/${data.name}/.placeholder`;
  const file = bucket.file(fullPath);
  const content = Buffer.from('placeholder', 'utf-8');

  await file.save(content, {
    metadata: { contentType: 'text/plain' }
  });

  return result.rows[0] as FileStorageBucket
}

export async function deleteBucket(
  project_id: string,
  name: string,
  id: string
) {
  const bucket = getBucket()
  if (!bucket) throw new Error("Cannot connect to bucket");

  const project = await getProjectById(project_id)
  if (!project) throw new Error("Project not found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  })



await bucket.deleteFiles({ prefix: `${project_id}/${name}` })

  await pool.query(`
    DELETE
    FROM
      "storage"."buckets"
    WHERE
      "id" = '${id}';  
  `)

  revalidateTag(t("buckets", project_id), "max")
}

export async function editBucket(
  project_id: string,
  id: string,
  oldBucket: z.infer<typeof createFileBucketSchema>,
  newBucket: z.infer<typeof createFileBucketSchema>
) {

  const project = await getProjectById(project_id)
  if (!project) throw new Error("Project not found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  })



  const alterStatement = `UPDATE "storage"."buckets"`
  const otherStatements = []


  otherStatements.push(`
    "allowed_types" = ${
      newBucket.allowed_types && newBucket.allowed_types.length > 0   
      ? `ARRAY[${newBucket.allowed_types.map(t => `'${t}'`).join(", ")}]`
      : "NULL"
    }
  `)
  

  if (oldBucket.is_public !== newBucket.is_public) {
    otherStatements.push(`
      "is_public" = ${newBucket.is_public ? "TRUE" : "FALSE"}
    `)
  }

  if (oldBucket.file_size_limit !== newBucket.file_size_limit) {
    otherStatements.push(`
      "size_lim_bytes" = ${
        newBucket.file_size_limit && newBucket.file_size_limit !== BigInt(0)
          ? newBucket.file_size_limit 
          : "NULL"
      }
    `)
  }

  const q = `
    ${alterStatement} \n
    SET
      ${otherStatements.join(", \n")}
    WHERE
      "id" = '${id}';
  `

  console.log("@UPDATE BUCKET QUERY: ", q)

  await pool.query(q)

  revalidateTag(t("buckets", project_id), "max")
}