"use server";

import { createFunctionSchema } from "@/lib/types/schemas";
import { t } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import z from "zod";
import { getUser } from "../../auth";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";
import { DatabaseFunctionType } from "@/lib/types";

export async function deleteFunction(
  projectId: string,
  schema: string,
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

  const [funcName, args] = name.split("(")
  let argPart = "(" + args.split(/,\s*/).map(i => i.split(" ")[1]).join(", ")

  if (args === ")") argPart = "()";

  const query = `
    DROP FUNCTION ${schema}.${funcName + argPart} RESTRICT;
  `

  console.log("@@Query: ", query)

  await pool.query(query)

  revalidateTag(t("functions", projectId, schema), 'max')
}


export async function createFunction(
  form: z.infer<typeof createFunctionSchema>,
  projectId: string, 
) {
  const { data, success, error } = createFunctionSchema.safeParse(form);

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

  const argument_string = data.args
    .map(({ name, dtype }) => `${name} ${dtype}`)
    .join(", ");

  await pool.query(`
    CREATE OR REPLACE FUNCTION ${data.schema}.${data.name}(${argument_string})
    RETURNS ${data.returnType} AS $$
    BEGIN
      ${data.definition}
    END;
    $$ LANGUAGE plpgsql;
  `)
  revalidateTag(t("functions", projectId, data.schema), "max")
}

export async function editFunction(
  oldFunc: DatabaseFunctionType,
  newFunc: DatabaseFunctionType,
  projectId: string
) {
  const argTypes = oldFunc.arguments.split(", ").map(a => a.split(" ")[1])

  const alterStatement = `${oldFunc.function_name}${oldFunc.arguments ? `(${oldFunc.arguments})` : "()"}`

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

  const queries: string[] = []

  if (oldFunc.definition !== newFunc.definition) {
    queries.push(`
      CREATE OR REPLACE FUNCTION ${oldFunc.schema_name}.${alterStatement} RETURNS ${oldFunc.return_type}
      LANGUAGE plpgsql
      AS $$
      BEGIN
          ${newFunc.definition}
      END;
      $$;
    `)
  }

  if (oldFunc.schema_name !== newFunc.schema_name) {
    queries.push(`
      ALTER FUNCTION ${oldFunc.schema_name}.${alterStatement} SET SCHEMA ${newFunc.schema_name};
    `)
  }

  if (oldFunc.function_name !== newFunc.function_name) {
    queries.push(`
      ALTER FUNCTION ${newFunc.schema_name}.${alterStatement} RENAME TO ${newFunc.function_name};
      `)
  }

  try {
    await pool.query("BEGIN");
    for (const q of queries) {
      console.log("@@QUERY:", q);
      await pool.query(q);
    }
    await pool.query("COMMIT");
  } catch (e) {
    await pool.query("ROLLBACK");
    throw e;
  }

  revalidateTag(t("functions", projectId, oldFunc.schema_name), 'max')
  if (oldFunc.schema_name !== newFunc.schema_name) {
    revalidateTag(t("functions", projectId, newFunc.schema_name), 'max')
  }
}