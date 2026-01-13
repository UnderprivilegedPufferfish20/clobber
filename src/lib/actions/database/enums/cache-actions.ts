'use cache';

import { t } from "@/lib/utils";
import { cacheTag } from "next/cache";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";
import { EnumType } from "@/lib/types";

export async function getEnums(
  projectId: string,
  schema: string
) {
  cacheTag(t("enums", projectId, schema))


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
    n.nspname AS enum_schema,
    t.typname AS enum_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS enum_values
FROM
    pg_type t
JOIN
    pg_enum e ON t.oid = e.enumtypid
JOIN
    pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE
    n.nspname = '${schema}' -- Replace 'public' with your schema name
GROUP BY
    n.nspname, t.typname
ORDER BY
    enum_name;
    `);


    console.log("@@GET ENUMS: ", result.rows)

  return result.rows as EnumType[]
}