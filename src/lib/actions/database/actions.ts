'use server';

import { createColumnSchema, createFolderSchema, createQuerySchema, createSchemaScheam, createTableSchema } from "@/lib/types/schemas";
import { getTenantPool } from ".";
import { getUser } from "../auth";
import { getProjectById } from "../projects";
import z from "zod";
import { DATA_TYPES, FilterOperator, QueryFilters } from "@/lib/types";
import { getPostgresCast, castFilterValue, mapPostgresType, buildWhereClause, getPostgresType } from "@/lib/utils";
import prisma from "@/lib/db";

export async function getSchemas(projectId: string) {
  const user = await getUser()

  if (!user) throw new Error("No user");

  const project = await getProjectById(projectId);

  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  })

  const result = await pool.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE SCHEMA_NAME NOT IN ('pg_catalog', 'information_schema', 'google_vacuum_mgmt')
    ORDER BY schema_name;
  `);

  console.log("@@ GET SCHEMAS: ", result);

  return result.rows.map(row => row.schema_name);
}

export async function addSchema(projectId: string, form: z.infer<typeof createSchemaScheam>) {
  const user = await getUser()

  if (!user) throw new Error("No user");

  const project = await getProjectById(projectId);

  if (!project) throw new Error("No project found");

  const { success, data } = createTableSchema.safeParse(form)

  if (!success) throw new Error("Invalid form data");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  })

  const result = await pool.query(`
    CREATE SCHEMA ${data.name} AUTHORIZATION ${project.db_user};
  `);

  console.log("@@ CREATE SCHEMA: ", result);
}

export async function getTables(projectId: string, schemaName: string) {
  console.log("@@GET TABLES: schema: ", schemaName)

  const user = await getUser()

  if (!user) throw new Error("No user");

  const project = await getProjectById(projectId);

  if (!project) throw new Error("No project found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  })

  const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = '${schemaName}'
    AND table_type = 'BASE TABLE';
  `);

  console.log("@@ GET TABLES: ", result);

  return result.rows.map(row => row.table_name);
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


  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  })

  const result = await pool.query(`
    CREATE TABLE ${schema}.${data.name} (
      "$id"   BIGINT  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      "$createdAt" timestamptz NOT NULL DEFAULT now(),      
      "$updatedAt" timestamptz NOT NULL DEFAULT now()  
    );

    CREATE OR REPLACE FUNCTION my_schema_set_updated_at()
    RETURNS trigger AS $$
    BEGIN
      NEW."$updatedAt" := now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER my_table_set_updated_at
    BEFORE UPDATE ON ${schema}.${data.name}
    FOR EACH ROW
    EXECUTE FUNCTION my_schema_set_updated_at();

    GRANT ALL PRIVILEGES ON TABLE ${schema}.${data.name} TO ${project.db_user};
  `);

  console.log("@@ CREATE TABLE: ", result);
}


export async function getTableData(
  projectId: string,
  schema: string,
  table: string,
  page: number = 1,
  pageSize: number = 50,
  filters: QueryFilters = {},
  sort?: { column: string; direction: "ASC" | "DESC" }
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

  // First, get column types
  const columnsResult = await pool.query(
    `
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = $1 AND table_name = $2
    ORDER BY ordinal_position;
  `,
    [schema, table]
  );

  // Build column type map
  const columnTypes = new Map<string, DATA_TYPES>();
  for (const col of columnsResult.rows) {
    columnTypes.set(col.column_name, mapPostgresType(col.data_type));
  }

  // Build WHERE clause with type safety
  const { whereClause, whereParams, errors } = buildWhereClause(filters, columnTypes);

  // Return errors if any filters are invalid
  if (Object.keys(errors).length > 0) {
    throw new Error(`Invalid filters: ${JSON.stringify(errors)}`);
  }

  const countQuery = `
    SELECT COUNT(*) as total 
    FROM "${schema}"."${table}" ${whereClause};
  `;

  const countResult = await pool.query(countQuery, whereParams);
  const total = parseInt(countResult.rows[0].total);

  const offset = (page - 1) * pageSize;
  const paramCount = whereParams.length + 1;

  const dataQuery = `
    SELECT * 
    FROM "${schema}"."${table}"
    ${whereClause}
    ${sort && `ORDER BY ${sort.column} ${sort.direction}`}
    LIMIT $${paramCount} OFFSET $${paramCount + 1};
  `;

  const dataResult = await pool.query(dataQuery, [...whereParams, pageSize, offset]);

  return {
    rows: dataResult.rows,
    columns: columnsResult.rows.map(col => ({
      ...col,
      data_type_enum: mapPostgresType(col.data_type)
    })),
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getFolders(projectId: string) {
  const user = await getUser();
  if (!user) throw new Error("No user");

  return await prisma.sqlFolder.findMany({
    where: { projectId }, include: { queries: true }
  })
}

export async function getQueries(projectId: string) {
  const user = await getUser();
  if (!user) throw new Error("No user");

  return await prisma.sql.findMany({
    where: { projectId }
  })
}

export async function createFolder(form: z.infer<typeof createFolderSchema>, projectId: string) {
  const { data, success } = createFolderSchema.safeParse(form)

  if (!success) throw new Error("Invalid new folder data");

  return prisma.sqlFolder.create({
    data: {
      projectId,
      name: data.name
    }
  })
}

export async function createQuery(
  form: z.infer<typeof createQuerySchema>,
  projectId: string,
  folderId?: string
) {
  const { data, success } = createQuerySchema.safeParse(form)

  if (!success) throw new Error("Invalid new query data");

  if (folderId === "") {
    return prisma.sql.create({
    data: {
      name: data.name,
      projectId,
      query: ""
    }
  })
  } else {
    return prisma.sql.create({
    data: {
      name: data.name,
      folderId,
      projectId,
      query: ""
    }
  })
  }

  
}

export async function addColumn(
  form: z.infer<typeof createColumnSchema>,
  schema: string,
  projectId: string,
  table: string
) {
  const { success, data } = createColumnSchema.safeParse(form);
  if (!success) throw new Error("Invalid form");

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

  // 1. Resolve Postgres Data Type (handling arrays)
  const baseType = getPostgresType(data.dtype);
  const finalType = data.isArray ? `${baseType}[]` : baseType;

  // 2. Handle Constraints
  const constraints = [];
  if (data.isPkey) constraints.push("PRIMARY KEY");
  if (data.isUnique) constraints.push("UNIQUE");
  if (!data.isNullable) constraints.push("NOT NULL");

  // 3. Handle Default Value with explicit casting for safety
  // We wrap the default in single quotes and cast it to ensure type safety
  const defaultStatement = data.default 
    ? `DEFAULT '${data.default.replace(/'/g, "''")}'::${finalType}` 
    : "";

  const constraintString = constraints.join(" ");

  // 4. Execute with Transaction
  // Primary Keys require extra care: a table can only have one.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // If adding a Primary Key, we first drop any existing PK constraint on this table
    if (data.isPkey) {
      await client.query(`
        ALTER TABLE "${schema}"."${table}" 
        DROP CONSTRAINT IF EXISTS "${table}_pkey" CASCADE
      `);
    }

    const query = `
      ALTER TABLE "${schema}"."${table}"
      ADD COLUMN IF NOT EXISTS "${data.name}" ${finalType} ${defaultStatement} ${constraintString}
    `.trim();

    await client.query(query);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function getCols(
  schema: string,
  projectId: string,
  table: string
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
    WHERE table_schema = '${schema.toLowerCase()}'
      AND table_name = '${table.toLowerCase()}';
  `)

  const cols_to_dtype: Record<string, DATA_TYPES> = {}

  for (let i = 0; i < col_details.rows.length; i++) {
    cols_to_dtype[col_details.rows[i].column_name] = mapPostgresType(col_details.rows[i].data_type)
  }

  return cols_to_dtype
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
