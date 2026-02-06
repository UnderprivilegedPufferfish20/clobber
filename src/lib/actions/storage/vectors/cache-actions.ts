"use cache";

import { INDEX_SEARCH_METHOD, StorageIndex } from "@/lib/types";
import { t } from "@/lib/utils";
import { cacheTag } from "next/cache";
import { getProjectById } from "../../database/cache-actions";
import { getTenantPool } from "../../database/tennantPool";

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
  top_k: number,
  query: string
) {
  cacheTag(t(`index-search`, project_id, index, namespace, query))


}