'use server';

import { createTableSchema, EnumTypeSchema } from "@/lib/types/schemas";
import { createFkeyName, rowsToCsv, rowsToJson, rowsToSql, t } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import z from "zod";
import { getUser } from "../../auth";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";
import { ColumnType, DATA_EXPORT_FORMATS, DATA_TYPES, EnumType, FkeyType, TableType } from "@/lib/types";
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

  const { success, data, error } = createTableSchema.safeParse(form)

  if (!success) {
    console.log("@MAKE TABLE ERROR: ", error)
    throw new Error("Invalid form data")
  };

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
    console.log("@DTYPE: ", col.dtype)

    let dtype: string;

    const { error, data } = EnumTypeSchema.safeParse(col.dtype)

    
    if (!error) {
      console.log("@PARSE DATA: ", data)
      dtype = `"${data.enum_schema}"."${data.enum_name}"`
    } else {
      dtype = `${col.dtype}`
    }

    let colDef = `"${col.name}" ${dtype}${col.is_array ? '[]' : ''}`;
    if (!col.is_nullable) colDef += ' NOT NULL';
    if (col.is_unique) colDef += ' UNIQUE';

    if (col.default !== undefined) {
      colDef += ` ${col.default ? col.is_array ? `DEFAULT ARRAY[${col.default}]` : `DEFAULT ${col.default.endsWith("()") ? col.default : `'${col.default}'`}` : ""}`;
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

      constraints.unshift(`
        CONSTRAINT ${createFkeyName(data.name, fk)}
          FOREIGN KEY (${fk.cols.map(fkc => `"${fkc.referencor_column}"`).join(", ")}) REFERENCES "${fk.cols[0].referencee_schema}"."${fk.cols[0].referencee_table}"(${fk.cols.map(fkc => `"${fkc.referencee_column}"`).join(", ")})
          ON DELETE ${fk.delete_action} ON UPDATE ${fk.update_action}
      `)
    })
  }

  const allDefs = [...columnDefs, ...constraints];
  const sql = `
    CREATE TABLE ${tableName} (\n  ${allDefs.join(',\n  ')}\n);

    ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;
    
  `;

  console.log("@SQL: ",sql)


  const result = await pool.query(sql);


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
  newCols: string[],
  editedFkeys: { old: string, new: string }[],
  deletedFkeys: string[],
  newFkeys: string[]
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

  function fkeyChanged(a: FkeyType, b: FkeyType) {
    return (
      a.delete_action !== b.delete_action ||
      a.update_action !== b.update_action ||

      JSON.stringify(a.cols) !== JSON.stringify(b.cols)
    )
  }


  const map = new Map<string, { old: ColumnType; new: ColumnType }>();

  for (const ec of editedCols) {
    const oldC = JSON.parse(ec.old) as ColumnType;
    const newC = JSON.parse(ec.new) as ColumnType;
    map.set(oldC.name, { old: oldC, new: newC }); // overwrites duplicates
  }

  const deduped = [...map.values()].filter(({ old, new: news }) => colChanged(old, news));

  const fkeyMap = new Map<string, {old: FkeyType, new: FkeyType}>()

  for (const ef of editedFkeys) {
    const oldK = JSON.parse(ef.old) as FkeyType
    const newC = JSON.parse(ef.new) as FkeyType
    fkeyMap.set(createFkeyName(newC.cols[0]!.referencor_table, newC), { old: oldK, new: newC })
  }

  const fkeyDeduped = [...fkeyMap.values()].filter(({ old, new: news }) => fkeyChanged(old, news));



  try {
    for (const { old, new: neu } of deduped) {
      await editColumn(projectId, schema, oldTable.name, old, neu);
    }

    for (const { old, new: neu } of fkeyDeduped) {
      await update_fkey(projectId, old, neu)
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

    await Promise.all(
      newFkeys.map(async f => {
        const newKeyObj: FkeyType = JSON.parse(f)

        console.log("@NEW KEY OBJ: ", newKeyObj)

        await create_fkey(projectId, newKeyObj)
      })
    )

    await Promise.all(
      deletedFkeys.map(async d => {
        const delKeyObj: FkeyType = JSON.parse(d)

        console.log("@DELETE KEY OBJ: ", delKeyObj)

        await delete_fkey(projectId, delKeyObj)
      })
    )
  
    if (oldTable.name !== newTable.name) await renameTable(projectId, schema, oldTable.name, newTable.name);
    await toggle_rls(projectId, schema, newTable.name, oldTable.rls, newTable.rls)



  } catch (e) {
    throw e
  }

}

export async function create_fkey(
  project_id: string,
  key: FkeyType
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


  const table_name = key.cols[0]!.referencor_table



  const q = `
    ALTER TABLE "${key.cols[0]!.referencor_schema}"."${table_name}" ADD CONSTRAINT ${createFkeyName(table_name, key)}
    FOREIGN KEY (${key.cols.map(fkc => `"${fkc.referencor_column}"`).join(", ")}) REFERENCES "${key.cols[0].referencee_schema}"."${key.cols[0].referencee_table}"(${key.cols.map(fkc => `"${fkc.referencee_column}"`).join(", ")})
    ON UPDATE ${key.update_action}
    ON DELETE ${key.delete_action}
  `

  console.log("@CREATE FKEY Q: ", q)

  await pool.query(q)

  const c_obj = key.cols[0]!

  revalidateTag(t("table-schema", project_id, c_obj.referencor_schema, c_obj.referencor_table), "max")
  revalidateTag(t("schema", project_id, c_obj.referencor_schema), "max")
  revalidateTag(t("columns", project_id, c_obj.referencor_schema, c_obj.referencor_table), "max")
  revalidateTag(t("tables", project_id, c_obj.referencor_schema), 'max')
  revalidateTag(t("table-data", project_id, c_obj.referencor_schema, c_obj.referencor_table), "max")

  revalidateTag(t("table-schema", project_id, c_obj.referencee_schema, c_obj.referencee_table), "max")
  revalidateTag(t("schema", project_id, c_obj.referencee_schema), "max")
  revalidateTag(t("columns", project_id, c_obj.referencee_schema, c_obj.referencee_table), "max")
  revalidateTag(t("tables", project_id, c_obj.referencee_schema), 'max')
  revalidateTag(t("table-data", project_id, c_obj.referencee_schema, c_obj.referencee_table), "max")
}

export async function delete_fkey(
  project_id: string,
  key: FkeyType
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


  const table_name = key.cols[0]!.referencor_table



  const q = `
   ALTER TABLE "${key.cols[0]!.referencor_schema}"."${table_name}" DROP CONSTRAINT ${createFkeyName(table_name, key)};
  `

  console.log("@DELETE FKEY Q: ", q)

  await pool.query(q)

  const c_obj = key.cols[0]!

  revalidateTag(t("table-schema", project_id, c_obj.referencor_schema, c_obj.referencor_table), "max")
  revalidateTag(t("schema", project_id, c_obj.referencor_schema), "max")
  revalidateTag(t("columns", project_id, c_obj.referencor_schema, c_obj.referencor_table), "max")
  revalidateTag(t("tables", project_id, c_obj.referencor_schema), 'max')
  revalidateTag(t("table-data", project_id, c_obj.referencor_schema, c_obj.referencor_table), "max")

  revalidateTag(t("table-schema", project_id, c_obj.referencee_schema, c_obj.referencee_table), "max")
  revalidateTag(t("schema", project_id, c_obj.referencee_schema), "max")
  revalidateTag(t("columns", project_id, c_obj.referencee_schema, c_obj.referencee_table), "max")
  revalidateTag(t("tables", project_id, c_obj.referencee_schema), 'max')
  revalidateTag(t("table-data", project_id, c_obj.referencee_schema, c_obj.referencee_table), "max")
}

export async function update_fkey(
  project_id: string,
  oldFkey: FkeyType,
  newFkey: FkeyType
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

  const table_name = oldFkey.cols[0]!.referencor_table

  const drop_q = `ALTER TABLE "${oldFkey.cols[0]!.referencor_schema}"."${table_name}" DROP CONSTRAINT ${createFkeyName(table_name, oldFkey)};`

  console.log("@@DROP QUERY: ", drop_q)

  const cl = await pool.connect()

  try {
    await cl.query("BEGIN")
    await cl.query(drop_q)

    const add_q = `ALTER TABLE "${oldFkey.cols[0]!.referencor_schema}"."${table_name}" ADD CONSTRAINT ${createFkeyName(table_name, newFkey)}
        FOREIGN KEY (${newFkey.cols.map(fkc => `"${fkc.referencor_column}"`).join(", ")}) REFERENCES "${newFkey.cols[0].referencee_schema}"."${newFkey.cols[0].referencee_table}"(${newFkey.cols.map(fkc => `"${fkc.referencee_column}"`).join(", ")})
        ON UPDATE ${newFkey.update_action}
        ON DELETE ${newFkey.delete_action};
  `
  
    console.log("@@ADD QUERY: ", add_q)
  
    await cl.query(add_q)

    await cl.query("COMMIT")
  } catch (e) {
    await cl.query("ROLLBACK")
    throw e
  } finally {
    cl.release()
  }


  
  const c_obj = oldFkey.cols[0]!

  revalidateTag(t("table-schema", project_id, c_obj.referencor_schema, c_obj.referencor_table), "max")
  revalidateTag(t("schema", project_id, c_obj.referencor_schema), "max")
  revalidateTag(t("columns", project_id, c_obj.referencor_schema, c_obj.referencor_table), "max")
  revalidateTag(t("tables", project_id, c_obj.referencor_schema), 'max')
  revalidateTag(t("table-data", project_id, c_obj.referencor_schema, c_obj.referencor_table), "max")

  revalidateTag(t("table-schema", project_id, c_obj.referencee_schema, c_obj.referencee_table), "max")
  revalidateTag(t("schema", project_id, c_obj.referencee_schema), "max")
  revalidateTag(t("columns", project_id, c_obj.referencee_schema, c_obj.referencee_table), "max")
  revalidateTag(t("tables", project_id, c_obj.referencee_schema), 'max')
  revalidateTag(t("table-data", project_id, c_obj.referencee_schema, c_obj.referencee_table), "max")
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

      const q = `DELETE FROM "${schema}"."${table}" WHERE ${clauses.join(" AND ")};`

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

export async function toggle_rls(
  project_id: string,
  schema: string,
  table: string,
  oldRls: boolean,
  newRls: boolean
) {
  if (oldRls === newRls) return;

  const project = await getProjectById(project_id);
  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name,
  });

  if (newRls === false) {
    await pool.query(`
      ALTER TABLE "${schema}"."${table}" DISABLE ROW LEVEL SECURITY;
    `)
  } else {
    await pool.query(`
      ALTER TABLE "${schema}"."${table}" ENABLE ROW LEVEL SECURITY;
    `)
  }


  revalidateTag(t("table-schema", project_id, schema, table), "max")
  revalidateTag(t("schema", project_id, schema), "max")
  revalidateTag(t("columns", project_id, schema, table), "max")
  revalidateTag(t("tables", project_id, schema), 'max')
  revalidateTag(t("table-data", project_id, schema, table), "max")

}