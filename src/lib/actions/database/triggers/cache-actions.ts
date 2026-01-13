"use cache";

import { t } from "@/lib/utils";
import { cacheTag } from "next/cache";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";
import { TriggerType } from "@/lib/types";

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

    console.log("@@GET TRIGGERS: ", result.rows)

  return result.rows as TriggerType[]
}