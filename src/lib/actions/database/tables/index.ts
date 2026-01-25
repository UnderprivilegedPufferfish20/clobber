'use server';

import { createTableSchema } from "@/lib/types/schemas";
import { createFkeyName, rowsToCsv, rowsToJson, rowsToSql, t } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import z from "zod";
import { getUser } from "../../auth";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";
import { ColumnType, DATA_EXPORT_FORMATS, DATA_TYPES, FkeyType, TableType, UpdateTableInput } from "@/lib/types";
import { addColumn, editColumn } from "../columns";

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

export async function exportTableData(
  projectId: string,
  schema: string,
  name: string,
  format: DATA_EXPORT_FORMATS
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

  const result = await pool.query(`SELECT * FROM "${schema}"."${name}"`)

  console.log("@@esult", result)

  switch (format) {
    case DATA_EXPORT_FORMATS.JSON:
      return {
        fileName: `${name}.json`,
        contentType: "application/json; charset=utf-8",
        data: rowsToJson(result.rows, result.fields),
      }
    case DATA_EXPORT_FORMATS.CSV:
      return {
        fileName: `${name}.csv`,
        contentType: "text/csv; charset=utf-8",
        data: rowsToCsv(result.rows, result.fields),
      }
    case DATA_EXPORT_FORMATS.SQL:
      return {
        fileName: `${name}.sql`,
        contentType: "application/sql; charset=utf-8",
        data: rowsToSql(schema, name, result.rows, result.fields)
      }
  }


  
}

export async function duplicateTable(
  projectId: string,
  schema: string,
  table: string,
  newName: string,
  schemaOnly = false
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

  const dataStatement = schemaOnly ? " WITH NO DATA" : ""


  await pool.query(`
    CREATE TABLE "${schema}"."${newName}" AS TABLE "${schema}"."${table}"${dataStatement};
  `)

  revalidateTag(t("table-schema", projectId, schema, table), "max")
  revalidateTag(t("schema", projectId, schema), "max")
  revalidateTag(t("columns", projectId, schema, table), "max")
  revalidateTag(t("tables", projectId, schema), 'max')
  revalidateTag(t("table-data", projectId, schema, table), "max")
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
    let colDef = `"${col.name}" ${col.dtype}${col.isArray ? '[]' : ''}`;
    if (!col.isNullable) colDef += ' NOT NULL';
    if (col.isUnique) colDef += ' UNIQUE';

    if (col.default !== undefined) {
      colDef += ` ${col.default ? col.isArray ? `DEFAULT ARRAY[${col.default}]` : `DEFAULT ${col.default}` : ""}`;
    }

    if (col.isPkey) {
      pkeyCols.push(`"${col.name}"`);
    }

    columnDefs.push(colDef);
  }

  if (pkeyCols.length > 0) {
    constraints.unshift(`PRIMARY KEY (${pkeyCols.join(', ')})`);
  }

  if (data.fkeys && data.fkeys.length > 0) {
    data.fkeys.map(fk => {
      console.log("@SA FKEY: ", fk)

      constraints.unshift(`
        CONSTRAINT ${createFkeyName(data.name, fk)}
          FOREIGN KEY (${fk.cols.map(fkc => `"${fkc.referencorColumn}"`).join(", ")}) REFERENCES "${fk.cols[0].referenceeSchema}"."${fk.cols[0].referenceeTable}"(${fk.cols.map(fkc => `"${fkc.referenceeColumn}"`).join(", ")})
          ON DELETE ${fk.deleteAction} ON UPDATE ${fk.updateAction}
      `)
    })
  }

  const allDefs = [...columnDefs, ...constraints];
  const sql = `CREATE TABLE ${tableName} (\n  ${allDefs.join(',\n  ')}\n);`;

  console.log("@@ MAKE TABLE QUERY: ",sql)

  const result = await pool.query(sql);

  console.log("@@ CREATE TABLE: ", result);

  revalidateTag(t("tables", projectId, schema), "max")
  revalidateTag(t("schema", projectId, schema), "max")
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

export async function updateTable(
  projectId: string,
  schema: string,
  oldTable: TableType,
  newTable: UpdateTableInput
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

  const oldTableName = oldTable.name;
  const newTableName = newTable.name;
  let alterStatement = `ALTER TABLE "${schema}"."${oldTableName}"`;

  // Drop all constraints first
  const constraintQuery = (type: string) => `
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class cl ON con.conrelid = cl.oid
    JOIN pg_namespace ns ON cl.relnamespace = ns.oid
    WHERE con.contype = '${type}' AND ns.nspname = $1 AND cl.relname = $2
  `;

  try {
    await pool.query("BEGIN")
    const fkNames = (await pool.query(constraintQuery('f'), [schema, oldTableName])).rows.map(r => r.conname);
    for (const name of fkNames) {
      await pool.query(`${alterStatement} DROP CONSTRAINT "${name}" CASCADE`);
    }
  
    const uniqueNames = (await pool.query(constraintQuery('u'), [schema, oldTableName])).rows.map(r => r.conname);
    for (const name of uniqueNames) {
      await pool.query(`${alterStatement} DROP CONSTRAINT "${name}" CASCADE`);
    }
  
  
    const pkName = (await pool.query(constraintQuery('p'), [schema, oldTableName])).rows[0]?.conname;
    if (pkName) {
      await pool.query(`${alterStatement} DROP CONSTRAINT "${pkName}" CASCADE`);
    }
  
  
    const currentOriginalNames = newTable.columns.filter(c => c.originalName !== null).map(c => c.originalName!);
    const deletedColumns = oldTable.columns.filter(c => !currentOriginalNames.includes(c.name)).map(c => c.name);
    if (deletedColumns.length > 0) {
      const dropParts = deletedColumns.map(col => `DROP COLUMN "${col}" CASCADE`).join(', ');
      await pool.query(`${alterStatement} ${dropParts};`);
    }
  
    for (const newCol of newTable.columns.filter(c => c.originalName !== null)) {
      const oldCol = oldTable.columns.find(o => o.name === newCol.originalName)!;
      const colName = newCol.name; // After rename
      const colAlter = `ALTER COLUMN "${colName}"`;
      const commands: string[] = [];
  
      const newType = `${newCol.dtype}${newCol.isArray ? '[]' : ''}`;
      const oldType = `${oldCol.dtype}${oldCol.isArray ? '[]' : ''}`;
      if (newType !== oldType) {
        commands.push(`${colAlter} TYPE ${newType} USING "${colName}"::${newType}`);
      }
  
      if (newCol.default !== oldCol.default) {
        if (newCol.default === undefined) {
          commands.push(`${colAlter} DROP DEFAULT`);
        } else {
          commands.push(`${colAlter} SET DEFAULT ${newCol.default}`);
        }
      }
  
      if (newCol.isNullable !== oldCol.isNullable) {
        if (newCol.isNullable) {
          commands.push(`${colAlter} DROP NOT NULL`);
        } else {
          commands.push(`${colAlter} SET NOT NULL`);
        }
      }
  
      if (commands.length > 0) {
        await pool.query(`${alterStatement} ${commands.join(', ')};`);
      }
    }
  
    // Add new columns
    for (const newCol of newTable.columns.filter(c => c.originalName === null)) {
      const fullType = `${newCol.dtype}${newCol.isArray ? '[]' : ''}`;
      const commands: string[] = [`ADD COLUMN "${newCol.name}" ${fullType}`];
      if (newCol.default !== undefined) {
        commands.push(`ALTER COLUMN "${newCol.name}" SET DEFAULT ${newCol.default}`);
      }
      if (!newCol.isNullable) {
        commands.push(`ALTER COLUMN "${newCol.name}" SET NOT NULL`);
      }
      await pool.query(`${alterStatement} ${commands.join(', ')};`);
    }
  
    // Rename table
    let currentTableName = oldTableName;
    if (newTableName !== oldTableName) {
      await pool.query(`${alterStatement} RENAME TO "${newTableName}";`);
      currentTableName = newTableName;
      alterStatement = `ALTER TABLE "${schema}"."${currentTableName}"`;
    }
  
    // Add constraints
    // Add uniques
    const uniqueCols = newTable.columns.filter(c => c.isUnique);
    for (const col of uniqueCols) {
      const constName = `${currentTableName}_${col.name}_key`;
      await pool.query(`${alterStatement} ADD CONSTRAINT "${constName}" UNIQUE ("${col.name}");`);
    }
  
    // Add PK
    const pkCols = newTable.columns.filter(c => c.isPkey).map(c => c.name);
    if (pkCols.length > 0) {
      const constName = `${currentTableName}_pkey`;
      await pool.query(`${alterStatement} ADD CONSTRAINT "${constName}" PRIMARY KEY (${pkCols.map(c => `"${c}"`).join(', ')});`);
    }
  
    // Add FKs
    for (const fkey of newTable.fkeys) {
      const localCols = fkey.cols.map(c => c.referencorColumn);
      const foreignCols = fkey.cols.map(c => c.referenceeColumn);
      const foreignTable = `"${fkey.cols[0].referenceeSchema}"."${fkey.cols[0].referenceeTable}"`;
      const constName = `${currentTableName}_${localCols.join('_')}_fkey`;
      const updateStr = fkey.updateAction;
      const deleteStr = fkey.deleteAction;
      await pool.query(
        `${alterStatement} ADD CONSTRAINT "${constName}" FOREIGN KEY (${localCols.map(c => `"${c}"`).join(', ')}) ` +
        `REFERENCES ${foreignTable} (${foreignCols.map(c => `"${c}"`).join(', ')}) ` +
        `ON UPDATE ${updateStr} ON DELETE ${deleteStr};`
      );
    }
  } catch (e) {
    await pool.query("ROLLBACK")
  }

  // Revalidate tags
  revalidateTag(t("table-schema", projectId, schema, oldTableName), "max");
  revalidateTag(t("schema", projectId, schema), "max");
  revalidateTag(t("columns", projectId, schema, oldTableName), "max");
  revalidateTag(t("tables", projectId, schema), "max");
  revalidateTag(t("table-data", projectId, schema, oldTableName), "max");

  if (newTableName !== oldTableName) {
    revalidateTag(t("table-schema", projectId, schema, newTableName), "max");
    revalidateTag(t("columns", projectId, schema, newTableName), "max");
    revalidateTag(t("table-data", projectId, schema, newTableName), "max");
  }
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
    cols_to_dtype[col_details.rows[i].column_name] = col_details.rows[i].data_type
  }

  console.log("@@Cols: ", cols_to_dtype)


}