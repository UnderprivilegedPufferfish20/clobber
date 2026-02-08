"use server";

import { INDEX_SEARCH_METHOD, VECTOR_INDEX_METRIC, VECTOR_INDEX_TYPE } from "@/lib/types";
import { t } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import { getProjectById } from "../../database/cache-actions";
import { getTenantPool } from "../../database/tennantPool";
import { OpenAI } from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_KEY!
})

export async function createVector(
  project_id: string,
  index: string,
  namespace: string,
  id: string,
  text: string
) {
  const project = await getProjectById(project_id);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  });

  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float"
  });

  const vector = response.data[0].embedding;

  await pool.query(`
    INSERT INTO "storage"."vectors" (id, namespace, text, embedding) VALUES
    ('${id}', '${namespace}', '${text}', '[${vector}]')
  `)

  revalidateTag(t(`index-search`, project_id, index, namespace, INDEX_SEARCH_METHOD.ID), "max")
  revalidateTag(t(`index-search`, project_id, index, namespace, INDEX_SEARCH_METHOD.LIST_IDS), "max")
  revalidateTag(t(`index-search`, project_id, index, namespace, INDEX_SEARCH_METHOD.SPARSE_VECTOR), "max")
  revalidateTag(t(`index-search`, project_id, index, namespace, INDEX_SEARCH_METHOD.TEXT), "max")
}

export async function deleteVector(
  project_id: string,
  index: string,
  namespace: string,
  id: string
) {
  const project = await getProjectById(project_id);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  });

  await pool.query(`
    DELETE FROM "storage"."vectors" WHERE "id" = '${id}' AND "namespace" = '${namespace}'    
  `)

  revalidateTag(t(`index-search`, project_id, index, namespace, INDEX_SEARCH_METHOD.ID), "max")
  revalidateTag(t(`index-search`, project_id, index, namespace, INDEX_SEARCH_METHOD.LIST_IDS), "max")
  revalidateTag(t(`index-search`, project_id, index, namespace, INDEX_SEARCH_METHOD.SPARSE_VECTOR), "max")
  revalidateTag(t(`index-search`, project_id, index, namespace, INDEX_SEARCH_METHOD.TEXT), "max")
}

export async function createNamespace(
  project_id: string,
  index: string,
  namespace: string
) {
  const project = await getProjectById(project_id);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  });

  await pool.query(`
    UPDATE "storage"."indexes" SET "namespaces" = ARRAY_APPEND("namespaces", '${namespace}')
    WHERE "project_id" = '${project.id}' AND "name" = '${index}';
    `)

  revalidateTag(t('indexes', project_id), "max")
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