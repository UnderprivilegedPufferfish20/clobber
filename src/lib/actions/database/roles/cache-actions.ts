"use cache";

import { t } from "@/lib/utils";
import { cacheTag } from "next/cache";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";
import { RoleType } from "@/lib/types";

export async function getRoles(
  projectId: string
) {
  cacheTag(t("roles", projectId));

  const project = await getProjectById(projectId);
  
    if (!project) throw new Error("No project found");
  
    const pool = await getTenantPool({
      connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
      user: project.db_user,
      password: project.db_pwd,
      database: project.db_name
    })
  
    const result = await pool.query(`
      SELECT
    rolname AS name,
    rolcanlogin AS can_login,
    rolcreaterole AS can_create_roles,
    rolbypassrls AS can_bypass_rls,
    rolsuper AS is_superuser
FROM
    pg_roles
WHERE
    rolname NOT LIKE 'pg\_%' ESCAPE '\'
    AND rolname NOT LIKE 'u\_%' ESCAPE '\'
    AND rolname NOT LIKE 'cloudsql%'
    AND rolname NOT LIKE 'postgres%'
ORDER BY
    rolname;

    `);
  
    return result.rows as RoleType[];
}