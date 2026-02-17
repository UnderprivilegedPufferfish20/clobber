'use server'

import prisma from "@/lib/db";
import { OauthSSOProvider, UserCookie } from "@/lib/types";
import { t } from "@/lib/utils";
import { User } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers"
import { getProjectById } from "../database/cache-actions";
import { getTenantPool } from "../database/tennantPool";

export async function getUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    
    if (!cookieStore) {
      console.error('getUser - cannot access cookies');
      return null;
    }

    const userCookie = cookieStore.get('user');
    
    if (!userCookie || !userCookie.value) {
      console.log('getUser - no user cookie found');
      return null;
    }

    const user = JSON.parse(userCookie.value) as User;

    const full_user = await prisma.user.findUnique({
      where: {
        id: user.id
      }
    })

    if (!full_user) throw new Error("GetUser - user in cookie not found");

    return full_user;
  } catch (error) {
    console.error('getUser - error parsing user cookie:', error);
    return null;
  }
}

export async function getUserById(id: string) {
  return await prisma.user.findUnique({where: {id}, include: { projects: true   , SharedProjects: true }})
}

export async function update_sso_providor(
  project_id: string,
  old: OauthSSOProvider,
  _new: OauthSSOProvider
) {
  const project = await getProjectById(project_id)
  if (!project) throw new Error("Project not found")

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  })

  await pool.query("BEGIN")

  try {
    const wasEnabled = old.enabled
    const isEnabled = _new.enabled

    if (!wasEnabled && isEnabled) {
      // Enable → INSERT
      await pool.query(
        `INSERT INTO "auth"."sso_providers" 
         (project_id, name, client_id, client_secret, allow_no_email)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          project_id,
          _new.name,
          _new.client_id,
          _new.client_secret,
          _new.allow_no_email ?? false,
        ]
      )
    } 
    else if (wasEnabled && !isEnabled) {
      // Disable → DELETE
      await pool.query(
        `DELETE FROM "auth"."sso_providers" 
         WHERE project_id = $1 AND name = $2`,
        [project_id, _new.name]
      )
    } 
    else if (wasEnabled && isEnabled) {
      // Already enabled → UPDATE changed fields
      const sets: string[] = []
      const params: any[] = []
      let paramIndex = 1

      if (old.allow_no_email !== _new.allow_no_email) {
        sets.push(`"allow_no_email" = $${paramIndex++}`)
        params.push(_new.allow_no_email)
      }
      if (old.client_id !== _new.client_id) {
        sets.push(`"client_id" = $${paramIndex++}`)
        params.push(_new.client_id)
      }
      if (old.client_secret !== _new.client_secret) {
        sets.push(`"client_secret" = $${paramIndex++}`)
        params.push(_new.client_secret)
      }

      if (sets.length > 0) {
        const q = `
          UPDATE "auth"."sso_providers" 
          SET ${sets.join(", ")} 
          WHERE project_id = $${paramIndex} AND name = $${paramIndex + 1}
        `
        params.push(project_id, _new.name)
        await pool.query(q, params)
      }
    }

    await pool.query("COMMIT")
  } catch (e) {
    await pool.query("ROLLBACK")
    throw e
  } finally {
    revalidateTag(t("oauth", project_id), "max")
  }
}