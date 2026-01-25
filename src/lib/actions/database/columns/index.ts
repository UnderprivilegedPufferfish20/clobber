"use server";

import { createColumnSchema } from "@/lib/types/schemas";
import { t } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import z from "zod";
import { getUser } from "../../auth";
import { getProjectById } from "../cache-actions";
import { getTenantPool } from "../tennantPool";
import { ColumnType } from "@/lib/types";

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

  const query = `
    ALTER TABLE "${schema}"."${table}" DROP COLUMN "${colName}" CASCADE;
  `

  console.log("@@DELETE COL QUERY: ",query)

  await pool.query(query)
  
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
  const baseType = data.dtype;
  const finalType = data.isArray ? `${baseType}[]` : baseType;

  // 2) Column constraints
  const constraints: string[] = [];
  if (data.isPkey) constraints.push("PRIMARY KEY");
  if (data.isUnique) constraints.push("UNIQUE");
  if (!data.isNullable) constraints.push("NOT NULL");
  const constraintString = constraints.join(" ");

  console.log("@@ DEFAULT: ", data.default)
  console.log("@@ ISFUNC: ", data.default?.endsWith("()"))

  let defaultStatement = "";
  if (data.default && data.default.length > 0) {
    const isFunction = data.default.endsWith("()");
    
    if (data.isArray) {
      if (isFunction) {
        defaultStatement = `DEFAULT ${data.default.replace(/'/g, "''")}`;
      } else {
        const escapedValue = data.default.replace(/'/g, "''");
        defaultStatement = `DEFAULT ARRAY[${escapedValue}]::${baseType}[]`;
      }
    } else {
      defaultStatement = isFunction 
        ? `DEFAULT ${data.default.replace(/'/g, "''")}`
        : `DEFAULT '${data.default.replace(/'/g, "''")}'`;
    }
  }


  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const q = `
      ALTER TABLE "${schema}"."${table}"
      ADD COLUMN IF NOT EXISTS "${data.name}" ${finalType} ${defaultStatement} ${constraintString}
    `.trim();


    console.log("@@CREATE-col query: ", q)

    // Add the column
    await client.query(q);

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



export async function editColumn(
  projectId: string,
  schema: string,
  table: string,
  oldCol: ColumnType,
  newCol: ColumnType
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

  const queries: string[] = []


  if (oldCol.default === null) {
    oldCol.default = "";
    newCol.default = ""
  }


  if (oldCol.default !== newCol.default) {
    if (!newCol.default) {
      queries.push(`ALTER COLUMN "${oldCol.name}" DROP DEFAULT`);
    } else {
      const def = newCol.default.endsWith("()")
        ? newCol.default
        : `'${newCol.default.replace(/'/g, "''")}'`;
      
      let statement = `ALTER COLUMN "${oldCol.name}" SET DEFAULT ${def}`

      if (oldCol.isArray === false && newCol.isArray === true) {
        statement = `ALTER COLUMN "${oldCol.name}" SET DEFAULT ARRAY[${def}]`
      }
      queries.push(statement);
    }
  }

  if (oldCol.dtype !== newCol.dtype || oldCol.isArray !== newCol.isArray) {
    const targetType = `${newCol.dtype}${newCol.isArray ? "[]" : ""}`;

    let using = "";
    if (oldCol.isArray !== newCol.isArray) {
      using = newCol.isArray
        ? ` USING ARRAY["${oldCol.name}"]`
        : "";
    }

    queries.push(`ALTER COLUMN "${oldCol.name}" TYPE ${targetType}${using}`);
  }

    

    // NULLABILITY change
  if (oldCol.isNullable !== newCol.isNullable) {
    queries.push(
      `ALTER COLUMN "${oldCol.name}" ${newCol.isNullable ? "DROP NOT NULL" : "SET NOT NULL"}`
    );
  }


  if (oldCol.isUnique !== newCol.isUnique) {
    if (newCol.isUnique) {
      queries.push(
        `ADD CONSTRAINT "${table}_${newCol.name}_key" UNIQUE ("${oldCol.name}")`
      );
    } else {
      queries.push(`DROP CONSTRAINT IF EXISTS "${table}_${oldCol.name}_key"`);
    }
  }

  // Add new PK if changed and exists
  if (oldCol.isPkey !== newCol.isPkey) {
    if (oldCol.isPkey) {
      queries.push(
        `DROP CONSTRAINT "${table}_pkey" CASCADE`
      );
    } else {
      queries.push(
        `ADD PRIMARY KEY (${oldCol.name})`
      );
    }
  }

  if (oldCol.name !== newCol.name) {
    // 1. Get constraints and their types
    const q = await pool.query(
      `SELECT 
         conname AS constraint_name, 
         contype AS constraint_type_code
       FROM pg_constraint con
       JOIN pg_class c ON c.oid = con.conrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(con.conkey)
       WHERE n.nspname = $1
         AND c.relname = $2
         AND a.attname = $3
         AND contype IN ('p','u','f','c','x')`,
      [schema, table, oldCol.name]
    );

    // 2. Map constraint codes to standard Postgres suffixes
    const suffixMap = {
      'u': 'key',   // Unique
      'f': 'fkey',  // Foreign Key
      'c': 'check', // Check
      'x': 'excl'   // Exclusion
    };

    for (const row of q.rows) {
      if (row.constraint_type_code === 'p') continue;
      const suffix = suffixMap[row.constraint_type_code as keyof typeof suffixMap] || 'key';
      
      const newConstraintName = `"${table}_${newCol.name}_${suffix}"`;

      queries.push(`RENAME CONSTRAINT "${row.constraint_name}" TO ${newConstraintName}`);
    }

    // 3. Rename the column itself
    queries.push(`RENAME COLUMN "${oldCol.name}" TO "${newCol.name}"`);
  }



  try {
    await pool.query("BEGIN");
    for (const query of queries) {
      const q = `ALTER TABLE "${schema}"."${table}" ${query};`
      console.log("@@QUERY:", q);
      await pool.query(q);
    }
    await pool.query("COMMIT");
  } catch (e) {
    await pool.query("ROLLBACK");
    throw e;
  }


  revalidateTag(t("table-schema", projectId, schema, table), "max")
  revalidateTag(t("schema", projectId, schema), "max")
  revalidateTag(t("columns", projectId, schema, table), "max")
  revalidateTag(t("tables", projectId, schema), 'max')
  revalidateTag(t("table-data", projectId, schema, table), "max")
}