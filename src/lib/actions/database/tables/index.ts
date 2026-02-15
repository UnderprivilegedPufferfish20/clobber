'use server';

import { createTableSchema } from "@/lib/types/schemas";
import { createFkeyName, rowsToCsv, rowsToJson, rowsToSql, t } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import z from "zod";
import { getUser } from "../../auth";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";
import { ColumnType, DATA_EXPORT_FORMATS, DATA_TYPES, FkeyType, TableType } from "@/lib/types";
import { addColumn, deleteColumn, editColumn } from "../columns";

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
    let colDef = `"${col.name}" ${col.dtype}${col.is_array ? '[]' : ''}`;
    if (!col.is_nullable) colDef += ' NOT NULL';
    if (col.is_unique) colDef += ' UNIQUE';

    if (col.default !== undefined) {
      colDef += ` ${col.default ? col.is_array ? `DEFAULT ARRAY[${col.default}]` : `DEFAULT ${col.default}` : ""}`;
    }

    if (col.is_pkey) {
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
          FOREIGN KEY (${fk.cols.map(fkc => `"${fkc.referencor_column}"`).join(", ")}) REFERENCES "${fk.cols[0].referencee_schema}"."${fk.cols[0].referencee_table}"(${fk.cols.map(fkc => `"${fkc.referencee_column}"`).join(", ")})
          ON DELETE ${fk.delete_action} ON UPDATE ${fk.update_action}
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

  const q = await pool.query(
      `SELECT 
         conname AS constraint_name, 
         contype AS constraint_type_code
       FROM pg_constraint con
       JOIN pg_class c ON c.oid = con.conrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(con.conkey)
       WHERE n.nspname = $1
         AND c.relname = $2`,
      [schema, table]
    );

    for (const row of q.rows) {
      if (row.constraint_type_code === 'p') continue;

      await pool.query(`ALTER TABLE ${schema}.${table} RENAME CONSTRAINT "${row.constraint_name}" TO ${row.constraint_name.replaceAll(table, newName)}`);
    }

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
  editedCols: { old: string, new: string }[],
  deletedCols: string[],
  newCols: string[]
) {


  const user = await getUser();
  if (!user) throw new Error("No user");

  const project = await getProjectById(projectId);
  if (!project) throw new Error("No project found");

  function colChanged(a: ColumnType, b: ColumnType) {
    return (
      a.name !== b.name ||
      a.dtype !== b.dtype ||
      a.is_array !== b.is_array ||
      (a.default ?? "") !== (b.default ?? "") ||
      a.is_nullable !== b.is_nullable ||
      a.is_unique !== b.is_unique ||
      a.is_pkey !== b.is_pkey
      // include fkey etc if applicable
    );
  }


  const map = new Map<string, { old: ColumnType; new: ColumnType }>();

  for (const ec of editedCols) {
    const oldC = JSON.parse(ec.old) as ColumnType;
    const newC = JSON.parse(ec.new) as ColumnType;
    map.set(oldC.name, { old: oldC, new: newC }); // overwrites duplicates
  }

  const deduped = [...map.values()].filter(({ old, new: news }) => colChanged(old, news));



  try {
    for (const { old, new: neu } of deduped) {
      await editColumn(projectId, schema, oldTable.name, old, neu);
    }

  
    await Promise.all(
      deletedCols.map(async n => {
        await deleteColumn(
          projectId,
          schema,
          oldTable.name,
          n
        )
      })
    )
  
    await Promise.all(
      newCols.map(async nc => {
        await addColumn(
          JSON.parse(nc),
          schema,
          projectId,
          oldTable.name
        )
      })
    )
  
    if (oldTable.name !== newTable.name) await renameTable(projectId, schema, oldTable.name, newTable.name);

  } catch (e) {
    throw e
  }

}

export async function addRow(
  project_id: string,
  schema: string,
  table: string,
  cache: string,
  data: Record<string, any>
) {

  const user = await getUser();
  if (!user) throw new Error("No user");

  const project = await getProjectById(project_id);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  });

  const q = `
    INSERT INTO "${schema}"."${table}" 
    (${Object.keys(data).map(k => `"${k}"`).join(", ")}) 
    VALUES (${Object.values(data).map(v => {
      if (v instanceof Date) v = v.toISOString()
      return `'${v}'`
    }).join(", ")});
  `

  console.log("@ ADD ROW QUERY: ", q)

  await pool.query(q)


  revalidateTag(t(cache, project_id, schema, table), "max")
}

export async function deleteSelectedRows(
  rows: any[],
  schema: string,
  table: string,
  projectId: string,
  cacheTag: string,
  pkey_cols: Set<string>
) {
  if (pkey_cols.size === 0) {
    throw new Error("Must have at least on pkey col");
  }

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




  if (rows.length === 0) return;

  await Promise.all(
    rows.map(async r => {
      const clauses = Object.entries(r).filter(([k, v]) => Boolean(v) && pkey_cols.has(k)).map(([k, v]) => {
        
        if (v instanceof Date) {
          v = v.toISOString()
          k = `DATE_TRUNC('milliseconds', "${k}")`
        } else {
          k = `"${k}"`
        }

        
        return `${k} = '${v}'`
      })
      console.log("@CLAUSES: ", clauses)
      const q = `DELETE FROM "${schema}"."${table}" WHERE ${clauses.join(" AND ")};`

      console.log("@DELSEL QUERY: ", q)

      await pool.query(q)
    })
  )

  revalidateTag(t(cacheTag, projectId, schema, table), "max")
}

export async function downloadSelectedRows(
  rows: any[],
  format: DATA_EXPORT_FORMATS,
  tablename: string,
  schema: string,
  columns: ColumnType[]
) {
  if (rows.length===0) return;

  switch (format) {
    case DATA_EXPORT_FORMATS.JSON:
      return {
        fileName: `${tablename}-selected.json`,
        contentType: "application/json; charset=utf-8",
        data: rowsToJson(rows, columns),
      }
    case DATA_EXPORT_FORMATS.CSV:
      return {
        fileName: `${tablename}-selected.json`,
        contentType: "text/csv; charset=utf-8",
        data: rowsToCsv(rows, columns),
      }
    case DATA_EXPORT_FORMATS.SQL:
      return {
        fileName: `${tablename}-selected.json`,
        contentType: "application/sql; charset=utf-8",
        data: rowsToSql(schema, tablename, rows, columns)
      }
  }
}

export async function deleteRow(
  project_id: string,
  schema: string,
  cache: string,
  table: string,
  pkey_cols: ColumnType[],
  pkey_vals: any[]
) {
  if (pkey_cols.length !== pkey_vals.length) throw new Error("Pkey count mismatch");

  const user = await getUser();
  if (!user) throw new Error("No user");

  const project = await getProjectById(project_id);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name,
  });

  const q = `
  DELETE FROM "${schema}"."${table}" WHERE ${pkey_cols.map((c, idx) => `"${c.name}" = '${pkey_vals[idx]}'`).join(" AND ")};  
  `

  console.log("@DEL ROW QUERY: ", q)

  await pool.query(q)

  revalidateTag(t(cache, project_id, schema, table), "max")
}

export async function editRow(
  project_id: string,
  schema: string,
  cache: string,
  table: string,
  pkey_cols: ColumnType[],
  pkey_vals: any[],
  newData: Record<string, any>
) {
  if (pkey_cols.length !== pkey_vals.length) throw new Error("Pkey count mismatch");

  const user = await getUser();
  if (!user) throw new Error("No user");

  const project = await getProjectById(project_id);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name,
  });

  await pool.query(`
  UPDATE "${schema}"."${table}" 
  SET ${Object.entries(newData).map(([k, v], idx) => {
    if (v instanceof  Date) {
      v = v.toISOString()
    }

    return `"${k}" = '${v}'`
  }).join(", ")}
  WHERE ${pkey_cols.map((c, idx) => `"${c.name}" = '${pkey_vals[idx]}'`).join(" AND ")};
  `)

  revalidateTag(t(cache, project_id, schema, table), "max")
}