"use server";

import { createRoleSchema } from "@/lib/types/schemas";
import z from "zod";
import { getUser } from "../../auth";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";
import { t } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import { RoleType } from "@/lib/types";

export async function createRole(
  projectId: string,
  form: z.infer<typeof createRoleSchema>
) {
    const { data, success, error } = createRoleSchema.safeParse(form);
  
    if (error) {
      console.log("@@createFunction form parse errror: ", error)
    }
  
    if (!success) throw new Error("Invalid form data");
  
    const user = await getUser();
    if (!user) throw new Error("No user");
  
    const project = await getProjectById(projectId);
    if (!project) throw new Error("No project found");
  
    const pool = await getTenantPool({
      connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
      user: project.db_user,
      password: project.db_pwd,
      database: project.db_name,
    });

    const anyprivileges = data.can_login || data.can_bypass_rls || data.is_superuser || data.can_create_roles

    const q = `
      CREATE ROLE ${data.name}${anyprivileges ? ` WITH
        ${data.can_login ? "LOGIN" : ""}
        ${data.can_bypass_rls ? "BYPASSRLS" : ""}
        ${data.can_create_roles ? "CREATEROLE" : ""}` : ""}
    ;`

    console.log(q)
  
    await pool.query(q)


    revalidateTag(t("roles", projectId), "max")
}

export async function deleteRole(
  projectId: string,
  schema: string | undefined,
  name: string
) {
  const user = await getUser();
  if (!user) throw new Error("No user");

  const project = await getProjectById(projectId);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name,
  });

  try {
    await pool.query("BEGIN")

    const q1 = `
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.usename = '${name}';
    `

    console.log(q1)

    await pool.query(q1)

    const q2 = `
      DROP ROLE IF EXISTS ${name};
    `

    console.log(q2)

    await pool.query(q2)

  } catch (e) {
    await pool.query("ROLLBACK")
    throw e
  }

  revalidateTag(t("roles", projectId), "max")
}

export async function editRole(
  projectId: string,
  oldRole: RoleType,
  newRole: RoleType
) {
  const user = await getUser();
  if (!user) throw new Error("No user");

  const project = await getProjectById(projectId);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name,
  });

  const alterStatement = `ALTER ROLE ${oldRole.name} WITH`

  try {
    await pool.query("BEGIN")

    if (oldRole.can_login !== newRole.can_login) {
      if (oldRole.can_login) {
        await pool.query(`${alterStatement} NOLOGIN`)
      } else {
        await pool.query(`${alterStatement} LOGIN`)
      }
    }

    if (oldRole.can_bypass_rls !== newRole.can_bypass_rls) {
      if (oldRole.can_bypass_rls) {
        await pool.query(`${alterStatement} NOBYPASSRLS;`)
      } else {
        await pool.query(`${alterStatement} BYPASSRLS;`)
      }
    }

    if (oldRole.can_create_roles !== newRole.can_create_roles) {
      if (oldRole.can_create_roles) {
        await pool.query(`${alterStatement} NOCREATEROLE;`)
      } else {
        await pool.query(`${alterStatement} CREATEROLE;`)
      }
    }

    if (oldRole.name !== newRole.name) {
      await pool.query(`ALTER ROLE ${oldRole.name} RENAME TO ${newRole.name};`)
    }


  } catch (e) {
    await pool.query("ROLLBACK");
    throw e
  }

  revalidateTag(t("roles", projectId), "max")
}