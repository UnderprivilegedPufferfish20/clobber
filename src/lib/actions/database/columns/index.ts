"use server";

import { DATA_TYPES_LIST } from "@/lib/constants";
import { createColumnSchema } from "@/lib/types/schemas";
import { getPostgresType, t } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import z from "zod";
import { getUser } from "../../auth";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";

export async function deleteColumn(
  projectId: string,
  schema: string,
  table: string,
  colName: string
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

  await pool.query(`
    ALTER TABLE ${schema}.${table} DROP COLUMN ${colName} CASCADE;
  `)
  
  revalidateTag(t("table-schema", projectId, schema, table), "max")
  revalidateTag(t("schema", projectId, schema), "max")
  revalidateTag(t("columns", projectId, schema, table), "max")
  revalidateTag(t("tables", projectId, schema), 'max')
  revalidateTag(t("table-data", projectId, schema, table), "max")
}

export async function addColumn(
  form: z.infer<typeof createColumnSchema>,
  schema: string,
  projectId: string,
  table: string
) {
  const parsed = createColumnSchema.safeParse(form);
  if (!parsed.success) throw new Error("Invalid form");
  const data = parsed.data;

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

  // 1) Resolve Postgres data type (handling arrays)
  const baseType = getPostgresType(data.dtype);
  const finalType = data.isArray ? `${baseType}[]` : baseType;

  // 2) Column constraints
  const constraints: string[] = [];
  if (data.isPkey) constraints.push("PRIMARY KEY");
  if (data.isUnique) constraints.push("UNIQUE");
  if (!data.isNullable) constraints.push("NOT NULL");
  const constraintString = constraints.join(" ");

  // 3) Default value (explicit cast)
  const defaultStatement =
    data.default && data.default.length > 0
      ? `DEFAULT '${data.default.replace(/'/g, "''")}'::${finalType}`
      : "";

  // 4) Foreign key (added as a separate constraint)
  // Keep constraint name deterministic (and <= 63 chars)
  const fk = data.fkey;
  const fkNameRaw = `${table}_${data.name}_fkey`;
  const fkConstraintName = fkNameRaw.length > 63 ? fkNameRaw.slice(0, 63) : fkNameRaw;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // If adding a Primary Key, drop existing PK constraint (your prior behavior)
    if (data.isPkey) {
      await client.query(`
        ALTER TABLE "${schema}"."${table}"
        DROP CONSTRAINT IF EXISTS "${table}_pkey" CASCADE
      `);
    }

    // Add the column
    await client.query(
      `
      ALTER TABLE "${schema}"."${table}"
      ADD COLUMN IF NOT EXISTS "${data.name}" ${finalType} ${defaultStatement} ${constraintString}
      `.trim()
    );

    // Add FK constraint if provided
    if (fk) {
      const fkSql = `
        ALTER TABLE "${schema}"."${table}"
        ADD CONSTRAINT "${fkConstraintName}"
        FOREIGN KEY ("${data.name}")
        REFERENCES "${fk.keySchema}"."${fk.keyTable}" ("${fk.keyColumn}")
        ON UPDATE ${fk.updateAction}
        ON DELETE ${fk.deleteAction}
      `.trim();

      try {
        await client.query(fkSql);
      } catch (err: any) {
        // If it already exists, ignore; otherwise rethrow
        // Postgres duplicate_object: 42710
        if (err?.code !== "42710") throw err;
      }
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  revalidateTag(t("table-schema", projectId, schema, table), "max")
  revalidateTag(t("schema", projectId, schema), "max")
  revalidateTag(t("columns", projectId, schema, table), "max")
  revalidateTag(t("tables", projectId, schema), 'max')
  revalidateTag(t("table-data", projectId, schema, table), "max")
}

export async function renameTable(
  projectId: string,
  schema: string,
  table: string,
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

  await pool.query(`
    ALTER TABLE ${schema}.${table} RENAME TO ${newName};
  `)

  revalidateTag(t("table-schema", projectId, schema, table), "max")
  revalidateTag(t("schema", projectId, schema), "max")
  revalidateTag(t("columns", projectId, schema, table), "max")
  revalidateTag(t("tables", projectId, schema), 'max')
  revalidateTag(t("table-data", projectId, schema, table), "max")
}

export async function renameColumn(
  projectId: string,
  schema: string,
  table: string,
  column: string,
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

  await pool.query(`
    ALTER TABLE ${schema}.${table} RENAME COLUMN ${column} TO ${newName};
  `)

  revalidateTag(t("table-schema", projectId, schema, table), "max")
  revalidateTag(t("schema", projectId, schema), "max")
  revalidateTag(t("columns", projectId, schema, table), "max")
  revalidateTag(t("tables", projectId, schema), 'max')
  revalidateTag(t("table-data", projectId, schema, table), "max")
}

export async function changeColumnDataType(
  projectId: string,
  schema: string,
  table: string,
  column: string,
  newDtype: (typeof DATA_TYPES_LIST)[number],
  isArray: boolean
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

  const dtypeDef = `${getPostgresType(newDtype)}${isArray ? "[]" : ""}`

  await pool.query(`
    ALTER TABLE ${schema}.${table} ALTER COLUMN ${column} TYPE ${dtypeDef};
  `)

  revalidateTag(t("table-schema", projectId, schema, table), "max")
  revalidateTag(t("schema", projectId, schema), "max")
  revalidateTag(t("columns", projectId, schema, table), "max")
  revalidateTag(t("tables", projectId, schema), 'max')
  revalidateTag(t("table-data", projectId, schema, table), "max")
}

export async function changeColumnDefault(
  projectId: string,
  schema: string,
  table: string,
  column: string,
  newDefault: string,
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

  await pool.query(`
    ALTER TABLE ${schema}.${table} ALTER COLUMN ${column} SET DEFAULT ${newDefault};
  `)

  revalidateTag(t("table-schema", projectId, schema, table), "max")
  revalidateTag(t("schema", projectId, schema), "max")
  revalidateTag(t("columns", projectId, schema, table), "max")
  revalidateTag(t("tables", projectId, schema), 'max')
  revalidateTag(t("table-data", projectId, schema, table), "max")
}