"use server";

import { createFunctionSchema } from "@/lib/types/schemas";
import { t } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import z from "zod";
import { getUser } from "../../auth";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";

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

export async function renameFunction(
  projectId: string,
  schema: string,
  sig: string,
  newName: string
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

  const [funcName, args] = sig.split("(")
  let argPart = "(" + args.split(/,\s*/).map(i => i.split(" ")[1]).join(", ")

  if (args === ")") argPart = "()";

  const query = `
    ALTER FUNCTION ${schema}.${funcName + argPart} RENAME TO ${newName};
  `

  console.log("@@Query: ", query)

  await pool.query(query)

  revalidateTag(t("functions", projectId, schema), 'max')

}

export async function changeFunctionSchema(
  projectId: string,
  schema: string,
  sig: string,
  newSchema: string 
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

  const [funcName, args] = sig.split("(")
  let argPart = "(" + args.split(/,\s*/).map(i => i.split(" ")[1]).join(", ")

  if (args === ")") argPart = "()";

  const query = `
    ALTER FUNCTION ${schema}.${funcName + argPart} SET SCHEMA ${newSchema};
  `

  console.log("@@Query: ", query)

  await pool.query(query)

  revalidateTag(t("functions", projectId, schema), 'max')
}