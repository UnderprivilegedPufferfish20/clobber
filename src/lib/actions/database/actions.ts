'use server';

import { createSchemaScheam, createTableSchema } from "@/lib/types/schemas";
import { getTenantPool } from ".";
import { getUser } from "../auth";
import { getProjectById } from "../projects";
import z from "zod";
import { FilterOperator, QueryFilters } from "@/lib/types";

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
  sort?: { column: string; direction: "asc" | "desc" }
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

  const whereClauses: string[] = [];
  const whereParams: any[] = [];
  let paramCount = 1;

  for (const [column, [op, raw]] of Object.entries(filters)) {
    const value = (raw ?? "").trim();
    if (!value && op !== FilterOperator.IS) continue;

    const col = `"${column}"`;
    const textCol = `${col}::text`;

    switch (op) {
      case FilterOperator.LIKE: {
        // use ILIKE so it's case-insensitive, keep your previous behavior
        whereClauses.push(`${textCol} ILIKE $${paramCount}`);
        whereParams.push(`%${value}%`);
        paramCount++;
        break;
      }

      case FilterOperator.IN: {
        // accept comma-separated values: "a,b,c"
        const items = value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        if (!items.length) break;

        // safest: use ANY($n) with a text[] param
        whereClauses.push(`${textCol} = ANY($${paramCount}::text[])`);
        whereParams.push(items);
        paramCount++;
        break;
      }

      case FilterOperator.IS: {
        // common values: "NULL", "NOT NULL", "TRUE", "FALSE"
        const upper = value.toUpperCase();

        if (upper === "NULL") {
          whereClauses.push(`${col} IS NULL`);
        } else if (upper === "NOT NULL") {
          whereClauses.push(`${col} IS NOT NULL`);
        } else if (upper === "TRUE" || upper === "FALSE") {
          whereClauses.push(`${col} IS ${upper}`);
        } else {
          // fallback: treat as literal compare using IS (rare, but keeps type)
          whereClauses.push(`${textCol} IS $${paramCount}`);
          whereParams.push(value);
          paramCount++;
        }
        break;
      }

      case FilterOperator.EQUALS:
      case FilterOperator.NOT_EQUAL:
      case FilterOperator.GREATER_THAN:
      case FilterOperator.LESS_THAN:
      case FilterOperator.GREATER_THAN_OR_EQUAL_TO:
      case FilterOperator.LESS_THAN_OR_EQUAL_TO: {
        // compare as text to keep it generic across types like your old code
        whereClauses.push(`${textCol} ${op} $${paramCount}`);
        whereParams.push(value);
        paramCount++;
        break;
      }

      default: {
        // ignore unknown ops
        break;
      }
    }
  }

  const whereClause =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const orderBy = sort
    ? `"${sort.column}" ${sort.direction}, "$id" DESC`
    : '"$id" DESC';

  const countQuery = `
    SELECT COUNT(*) as total 
    FROM "${schema}"."${table}" ${whereClause};
  `;

  const countResult = await pool.query(countQuery, whereParams);
  const total = parseInt(countResult.rows[0].total);

  const offset = (page - 1) * pageSize;

  const dataQuery = `
    SELECT * 
    FROM "${schema}"."${table}"
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${paramCount} OFFSET $${paramCount + 1};
  `;

  const dataResult = await pool.query(dataQuery, [...whereParams, pageSize, offset]);

  const columnsResult = await pool.query(
    `
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = $1 AND table_name = $2
    ORDER BY ordinal_position;
  `,
    [schema, table]
  );

  return {
    rows: dataResult.rows,
    columns: columnsResult.rows,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}