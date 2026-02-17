"use cache";

import { cacheTag } from "next/cache";
import { getProjectById } from "../database/cache-actions";
import { getTenantPool } from "../database/tennantPool";
import { t } from "@/lib/utils";
import { OauthSSOProvider } from "@/lib/types";
import prisma from "@/lib/db";

export async function get_sso_providers(
  project_id: string
) {
  cacheTag(t("oauth", project_id))
  
  const project = await getProjectById(project_id)
  if (!project) throw new Error("Project not found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  })

  const enabled = await pool.query(`SELECT * FROM "auth"."sso_providers" WHERE project_id = $1`, [project.id])

  
  const db_res = await prisma.sso_providers.findMany()
  const enabled_names = new Set(enabled.rows.map(r => r.name))

  const result = [] as OauthSSOProvider[]

  for (let p of db_res) {
    if (enabled_names.has(p.name)) {
      const en = enabled.rows.find(f => f.name === p.name)!
      if (!en) throw new Error("Failed to find db result");

      result.push({
        allow_no_email: en.allow_no_email,
        client_id: en.client_id,
        client_secret: en.client_secret,
        enabled: true,
        img_path: p.img_path!,
        name: p.name,
        project_id
      })

    } else {
      result.push({
        allow_no_email: null,
        client_id: null,
        client_secret: null,
        enabled: false,
        img_path: p.img_path!,
        name: p.name,
        project_id
      })
    }
  }

  
  console.log("@PROVIDERS: ", result)

  return result
}