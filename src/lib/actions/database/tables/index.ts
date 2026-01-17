'use server';

import { createTableSchema } from "@/lib/types/schemas";
import { createFkeyName, rowsToCsv, rowsToJson, rowsToSql, t } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import z from "zod";
import { getUser } from "../../auth";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";
import { ColumnType, DATA_EXPORT_FORMATS, DATA_TYPES, TableType } from "@/lib/types";

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
      constraints.unshift(`
        CONSTRAINT ${createFkeyName(data.name, fk)}
          FOREIGN KEY (${fk.cols.map(fkc => `"${fkc.referencorColumn}"`).join(", ")}) REFERENCES "${fk.cols[0].referenceeSchema}"."${fk.cols[0].referenceeTable}"(${fk.cols.map(fkc => `"${fkc.referenceeColumn}"`).join(", ")})
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
  newTable: TableType,
  renamedCols: { oldName: string; newName: string }[],
  deletedCols: string[]
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
  let currentTableName = oldTableName;
  const queries: string[] = [];

  // Build map: oldColName (non-deleted) -> newCol
  const colMap = new Map<string, { oldCol: ColumnType; newCol: ColumnType }>();
  const renamedMap = new Map(renamedCols.map((r) => [r.oldName, r.newName] as const));

  for (const oldCol of oldTable.columns) {
    if (deletedCols.includes(oldCol.name)) continue;
    const newName = renamedMap.get(oldCol.name) ?? oldCol.name;
    const newCol = newTable.columns.find((c) => c.name === newName);
    if (!newCol) throw new Error(`Missing new column for ${oldCol.name}`);
    colMap.set(oldCol.name, { oldCol, newCol });
  }

  // New columns (not in old or renamed)
  const oldNames = new Set(oldTable.columns.map((c) => c.name));
  const renamedNewNames = new Set(renamedCols.map((r) => r.newName));
  const newCols = newTable.columns.filter(
    (c) => !oldNames.has(c.name) && !renamedNewNames.has(c.name)
  );

  // PK handling (account for renames)
  const getPKCols = (cols: ColumnType[], isNew = false) =>
    cols
      .filter((c) => c.isPkey)
      .map((c) => (isNew ? c.name : renamedMap.get(c.name) ?? c.name))
      .sort();

  const oldPK = getPKCols(oldTable.columns);
  const newPK = getPKCols(newTable.columns, true);
  const pkChanged = oldPK.join(",") !== newPK.join(",");

  // Drop old PK if changed
  if (pkChanged && oldPK.length > 0) {
    queries.push(
      `ALTER TABLE "${schema}"."${currentTableName}" DROP CONSTRAINT "${oldTableName}_pkey" CASCADE`
    );
  }

  // Rename table
  if (oldTableName !== newTable.name) {
    queries.push(`ALTER TABLE "${schema}"."${currentTableName}" RENAME TO "${newTable.name}"`);
    currentTableName = newTable.name;
  }

  // Deletes (combined)
  if (deletedCols.length > 0) {
    const dropActions = deletedCols.map((col) => `DROP COLUMN "${col}" CASCADE`).join(", ");
    queries.push(`ALTER TABLE "${schema}"."${currentTableName}" ${dropActions}`);
  }

  // New columns (combined)
  if (newCols.length > 0) {
    const addActions = newCols
      .map((nc) => {
        const baseType = `${nc.dtype}${nc.isArray ? "[]" : ""}`;
        const notNull = nc.isNullable ? "" : "NOT NULL";
        const def =
          nc.default
            ? nc.default.endsWith("()")
              ? nc.default
              : `'${nc.default.replace(/'/g, "''")}'`
            : null;

        // Note: ordering here is valid in Postgres
        return `ADD COLUMN "${nc.name}" ${baseType} ${notNull} ${def ? nc.isArray ? `DEFAULT ARRAY[${def}] ` : `DEFAULT ${def} ` : ""} ${
          nc.isUnique ? "UNIQUE" : ""
        }`.replace(/\s+/g, " ").trim();
      })
      .join(", ");

    queries.push(`ALTER TABLE "${schema}"."${currentTableName}" ${addActions}`);
  }

  // Edited columns
  for (const [oldName, { oldCol, newCol }] of colMap) {
    let currentColName = oldName;

    // 1) RENAME COLUMN must be its own statement (cannot be combined)
    if (oldName !== newCol.name) {
      queries.push(
        `ALTER TABLE "${schema}"."${currentTableName}" RENAME COLUMN "${currentColName}" TO "${newCol.name}"`
      );
      currentColName = newCol.name;
    }

    // 2) Remaining subcommands can be combined in ONE ALTER TABLE
    const sub: string[] = [];

    // DEFAULT change
    if (oldCol.default !== newCol.default) {
      if (!newCol.default) {
        sub.push(`ALTER COLUMN "${currentColName}" DROP DEFAULT`);
      } else {
        const def = newCol.default.endsWith("()")
          ? newCol.default
          : `'${newCol.default.replace(/'/g, "''")}'`;
        
        let statement = `ALTER COLUMN "${currentColName}" SET DEFAULT ${def}`

        if (oldCol.isArray === false && newCol.isArray === true) {
          statement = `ALTER COLUMN "${currentColName}" SET DEFAULT ARRAY[${def}]`
        }
        sub.push(statement);
      }
    }

    // TYPE change (handle dtype and array together so you don’t emit two TYPE commands)
    if (oldCol.dtype !== newCol.dtype || oldCol.isArray !== newCol.isArray) {
      const targetType = `${newCol.dtype}${newCol.isArray ? "[]" : ""}`;

      // NOTE: your USING logic here is simplistic; adjust as needed for real conversions.
      // This version keeps your intent but avoids invalid syntax.
      let using = "";
      if (oldCol.isArray !== newCol.isArray) {
        using = newCol.isArray
          ? ` USING ARRAY["${currentColName}"]`
          : ""; // e.g. ` USING "${currentColName}"[1]` if you want array->scalar
      }

      sub.push(`ALTER COLUMN "${currentColName}" TYPE ${targetType}${using}`);
    }

    

    // NULLABILITY change
    if (oldCol.isNullable !== newCol.isNullable) {
      sub.push(
        `ALTER COLUMN "${currentColName}" ${newCol.isNullable ? "DROP NOT NULL" : "SET NOT NULL"}`
      );
    }

    // UNIQUE change
    if (oldCol.isUnique !== newCol.isUnique) {
      if (newCol.isUnique) {
        sub.push(
          `ADD CONSTRAINT "${currentTableName}_${currentColName}_key" UNIQUE ("${currentColName}")`
        );
      } else {
        // be defensive: the existing constraint name might be old/new table/col based
        // use IF EXISTS so execution doesn't fail on naming mismatch
        sub.push(`DROP CONSTRAINT IF EXISTS "${oldTableName}_${oldName}_key"`);
        sub.push(`DROP CONSTRAINT IF EXISTS "${currentTableName}_${currentColName}_key"`);
      }
    }

    if (sub.length > 0) {
      queries.push(`ALTER TABLE "${schema}"."${currentTableName}" ${sub.join(", ")}`);
    }
  }

  // Add new PK if changed and exists
  if (pkChanged && newPK.length > 0) {
    queries.push(
      `ALTER TABLE "${schema}"."${currentTableName}" ADD PRIMARY KEY (${newPK
        .map((c) => `"${c}"`)
        .join(", ")})`
    );
  }

  try {
    await pool.query("BEGIN");
    for (const query of queries) {
      const q = query.trim().replace(/;+\s*$/, "") + ";"; // normalize single trailing semicolon
      console.log("@@QUERY:", q);
      await pool.query(q);
    }
    await pool.query("COMMIT");
  } catch (e) {
    await pool.query("ROLLBACK");
    throw e;
  }

  revalidateTag(t("table-schema", projectId, schema, oldTable.name), "max");
  revalidateTag(t("schema", projectId, schema), "max");
  revalidateTag(t("columns", projectId, schema, oldTable.name), "max");
  revalidateTag(t("tables", projectId, schema), "max");
  revalidateTag(t("table-data", projectId, schema, oldTable.name), "max");
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