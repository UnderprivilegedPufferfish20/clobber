"use server";

import { createRoleSchema } from "@/lib/types/schemas";
import z from "zod";
import { getUser } from "../../auth";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";
import { t } from "@/lib/utils";
import { revalidateTag } from "next/cache";

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
  
    await pool.query(`
      CREATE ROLE ${data.name}${anyprivileges && ` WITH
        ${data.can_login && "LOGIN"}
        ${data.can_bypass_rls && "BYPASSRLS"}
        ${data.can_create_roles && "CREATEROLE"}
        ${data.is_superuser && "SUPERUSER"}`}
    ;`)


    revalidateTag(t("roles", projectId), "max")
}