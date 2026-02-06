"use server";

import { VECTOR_INDEX_METRIC, VECTOR_INDEX_TYPE } from "@/lib/types";
import { t } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import { getProjectById } from "../../database/cache-actions";
import { getTenantPool } from "../../database/tennantPool";


export async function createVector(
  project_id: string,
  index: string,
  namespace: string,
  id: string,
  text: string
) {

}

export async function deleteVector(
  project_id: string,
  index: string,
  id: string
) {

}

export async function createIndex(
  project_id: string,
  name: string,
  type: VECTOR_INDEX_TYPE,
  dims: number,
  metric: VECTOR_INDEX_METRIC,
) {
  const project = await getProjectById(project_id);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  });

  const q = `
    INSERT INTO "storage"."indexes" (project_id, namespaces, name, dimensions, vector_type, metric) VALUES (
      '${project_id}',
      ${`ARRAY['_default_']`},
      '${name}',
      '${dims}',
      '${type}',
      '${metric}'
    );
    `

  console.log("@QQ: ", q)

  await pool.query(q)

  revalidateTag(t('indexes', project_id), "max")
}

export async function deleteIndex(
  project_id: string,
  name: string
) {

}