"use cache";

import { INDEX_SEARCH_METHOD, IndexVector, IndexVectorWithScore, StorageIndex, VECTOR_INDEX_METRIC } from "@/lib/types";
import { t } from "@/lib/utils";
import { cacheTag } from "next/cache";
import { getProjectById } from "../../database/cache-actions";
import { getTenantPool } from "../../database/tennantPool";
import { OpenAI } from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_KEY!
})

export async function getIndexes(project_id: string) {
  cacheTag(t('indexes', project_id))

  const project = await getProjectById(project_id);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  });


  const result = await pool.query('SELECT * FROM "storage"."indexes";')

  return result.rows as StorageIndex[]
}

export async function searchIndex(
  project_id: string,
  index: string,
  namespace: string,
  method: INDEX_SEARCH_METHOD,
  metric: VECTOR_INDEX_METRIC,
  top_k: number,
  query: string
) {
  cacheTag(t(`index-search`, project_id, index, namespace, method))

  const project = await getProjectById(project_id);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  });

  const queryResponse = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
    encoding_format: "float"
  });

  const vectorForQuery = queryResponse.data[0].embedding;

  switch (method) {
    case INDEX_SEARCH_METHOD.TEXT:
      const score_query = 
        metric === VECTOR_INDEX_METRIC.COSINE ?
          `1 - (embedding <=> '[${vectorForQuery}]'::vector(1536))` :
          metric === VECTOR_INDEX_METRIC.DOTPRODUCT ?
          `(embedding <#> '[${vectorForQuery}]'::vector(1536)) * -1` :
          `1 / (1 + (embedding <-> '[${vectorForQuery}]'::vector(1536)))`
        

      const result = await pool.query(`
        SELECT
          *,
          ${score_query} AS score
        FROM "storage"."vectors"
        WHERE "namespace" = '${namespace}'
        ORDER BY "score" DESC
        LIMIT ${top_k};
        
      `)

      return result.rows as IndexVectorWithScore[]

    case INDEX_SEARCH_METHOD.ID:
      const id_res = await pool.query(`
        SELECT * FROM "storage"."vectors"
        WHERE "id" IN '[${query}]' AND "namespace" = '${namespace}'
        LIMIT ${top_k};
        `)

      return id_res.rows as IndexVector[]
    case INDEX_SEARCH_METHOD.LIST_IDS:
      const list_res = await pool.query(`
        SELECT * FROM "storage"."vectors"
        ${query.length > 0 ? `WHERE "id" ^@ '${query}'` : ""}
        LIMIT ${top_k};
      `) 

      return list_res.rows as IndexVectorWithScore[]

  }
  
  

}