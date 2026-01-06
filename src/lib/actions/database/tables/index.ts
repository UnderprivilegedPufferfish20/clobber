'use server';

import { createTableSchema } from "@/lib/types/schemas";
import { getPostgresType, mapPostgresType, t } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import z from "zod";
import { getUser } from "../../auth";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";
import { DATA_TYPES } from "@/lib/types";

export async function deleteTable(
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

  await pool.query(`
    DROP TABLE ${schema}.${name} RESTRICT;
  `)

  revalidateTag(t("table-schema", projectId, schema, name), "max")
  revalidateTag(t("schema", projectId, schema), "max")
  revalidateTag(t("columns", projectId, schema, name), "max")
  revalidateTag(t("tables", projectId, schema), 'max')
  revalidateTag(t("table-data", projectId, schema, name), "max")
}

export async function addTable(
  form: z.infer<typeof createTableSchema>, 
  projectId: string,
  schema: string
) {
  const user = await getUser()

  if (!user) throw new Error("No user");

  const project = await getProjectById(projectId);

  if (!project) throw new Error("No project found");

  const { success, data } = createTableSchema.safeParse(form)

  if (!success) throw new Error("Invalid form data");

  if (!data) throw new Error("No data");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  })

  const tableName = `"${schema}"."${data.name}"`;
  let columnDefs: string[] = [];
  let constraints: string[] = [];
  const pkeyCols: string[] = [];

  for (const col of data.columns) {
    let colDef = `"${col.name}" ${getPostgresType(col.dtype)}${col.isArray ? '[]' : ''}`;
    if (!col.isNullable) colDef += ' NOT NULL';
    if (col.isUnique) colDef += ' UNIQUE';

    if (col.default !== undefined) {
      let quotedDefault: string;
      switch (col.dtype) {
        case 'string':
        case 'datetime':
        case 'JSON':
          quotedDefault = `'${col.default.replace(/'/g, "''")}'`;
          if (col.dtype === 'JSON') quotedDefault += '::JSONB';
          break;
        case 'boolean':
          quotedDefault = col.default.toUpperCase();
          break;
        case 'integer':
        case 'float':
          quotedDefault = col.default;
          break;
        case 'uuid':
        case 'bytes':
          quotedDefault = col.default; // Assume raw value (e.g., function call or hex)
          break;
        default:
          quotedDefault = col.default;
      }
      colDef += ` DEFAULT ${quotedDefault}`;
    }

    if (col.isPkey) {
      pkeyCols.push(`"${col.name}"`);
    }

    columnDefs.push(colDef);

    if (col.fkey) {
      const fk = col.fkey;
      const constName = `fk_${data.name}_${col.name}`;
      const refTable = `"${fk.keySchema}"."${fk.keyTable}"`;
      const fkDef = `CONSTRAINT "${constName}" FOREIGN KEY ("${col.name}") REFERENCES ${refTable} ("${fk.keyColumn}") ON UPDATE ${fk.updateAction} ON DELETE ${fk.deleteAction}`;
      constraints.push(fkDef);
    }
  }

  if (pkeyCols.length > 0) {
    constraints.unshift(`PRIMARY KEY (${pkeyCols.join(', ')})`);
  }

  const allDefs = [...columnDefs, ...constraints];
  const sql = `CREATE TABLE ${tableName} (\n  ${allDefs.join(',\n  ')}\n);`;

  const result = await pool.query(sql);

  console.log("@@ CREATE TABLE: ", result);

  revalidateTag(t("tables", projectId, schema), "max")
}

export async function addRow(
  schema: string,
  projectId: string,
  table: string,
  form: Record<string, any>
) {

  const user = await getUser();
  if (!user) throw new Error("No user");

  const project = await getProjectById(projectId);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  });

  const col_details = await pool.query(`
    SELECT *
    FROM information_schema.columns
    WHERE table_schema = '${schema}'
      AND table_name = '${table}';
  `)

  const cols_to_dtype: Record<string, DATA_TYPES> = {}

  for (let i = 0; i < col_details.rows.length; i++) {
    cols_to_dtype[col_details.rows[i].column_name] = mapPostgresType(col_details.rows[i].data_type)
  }

  console.log("@@Cols: ", cols_to_dtype)


}