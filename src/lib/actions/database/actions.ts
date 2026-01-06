'use server';

import { createColumnSchema, createEnumSchema, createFolderSchema, createFunctionSchema, createIndexSchema, createProjectSchema, createQuerySchema, createSchemaScheam, createTableSchema, createTriggerSchema, inviteUsersSchema } from "@/lib/types/schemas";
import { applyTenantGrants, createTenantDatabase } from ".";
import { getTenantPool } from "./tennantPool";
import { getUser } from "../auth";
import z from "zod";
import { DATA_TYPES, QueryFilters, SchemaEditorTable } from "@/lib/types";
import { mapPostgresType, buildWhereClause, getPostgresType, t, generateProjectPassword } from "@/lib/utils";
import prisma from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { getProjectById } from "./getActions";

export async function addSchema(projectId: string, form: z.infer<typeof createSchemaScheam>) {
  const user = await getUser()

  if (!user) throw new Error("No user");

  const project = await getProjectById(projectId);

  if (!project) throw new Error("No project found");

  const { success, data } = createSchemaScheam.safeParse(form)

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

  revalidateTag(t("schemas", projectId), "max")
}

export async function addCollaborator(form: z.infer<typeof inviteUsersSchema>, projectId: string) {
    const user = await getUser()
    
    if (!user) {
        throw new Error("No user authenticated");
    }

    const { success, data } = inviteUsersSchema.safeParse(form)

    if (!success) {
        throw new Error("Invalid form data"); 
    }

    const invitedUser = await prisma.user.findUnique({
        where: {
            email: data.email
        },
        select: { id: true } 
    })

    if (!invitedUser) {
        throw new Error("User not found"); 
    }

    if (invitedUser.id === user.id) throw new Error("You're the owner");


    const project = await prisma.project.findUnique({
        where: {
            id: projectId
        },
        include: {
            collaborators: {
                select: { id: true }
            }
        }
    })

    if (!project) {
        throw new Error("Project not found");
    }

    const isAlreadyCollaborator = project.collaborators.some(c => c.id === invitedUser.id);
    if (isAlreadyCollaborator) {
        throw new Error("User is already a collaborator");
    }

    // --- The finished part ---
    await prisma.project.update({
        where: {
            id: projectId
        },
        data: {
            collaborators: {
                connect: {
                    id: invitedUser.id,
                }
            }
        }
    });


    revalidatePath(`/dashboard/projects/${projectId}`); 
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

export async function createFolder(form: z.infer<typeof createFolderSchema>, projectId: string) {
  const { data, success } = createFolderSchema.safeParse(form)

  if (!success) throw new Error("Invalid new folder data");

  const result = prisma.sqlFolder.create({
    data: {
      projectId,
      name: data.name
    }
  })

  revalidateTag(t("folders", projectId), "max")

  return result
}

export async function createQuery(
  form: z.infer<typeof createQuerySchema>,
  projectId: string,
  folderId?: string
) {
  const { data, success } = createQuerySchema.safeParse(form)

  if (!success) throw new Error("Invalid new query data");

  let result;

  if (folderId === "") {
    result = prisma.sql.create({
    data: {
      name: data.name,
      projectId,
      query: ""
    }
  })
  } else {
    result = prisma.sql.create({
    data: {
      name: data.name,
      folderId,
      projectId,
      query: ""
    }
  })
  }

  revalidateTag(t("queries", projectId), "max")
  revalidateTag(t('folders', projectId), "max")

  return result

  
}

export async function moveQueryIntoFolder(
  projectId: string,
  queryId: string,
  folderId: string
) {
  const result = await prisma.sql.update({
    where: {
      id: queryId
    },
    data: {
      folder: {
        connect: {
          id: folderId
        }
      }
    }
  })

  revalidateTag(t('query', projectId, queryId), "max")
  revalidateTag(t('queries', projectId), "max")
  revalidateTag(t('folders', projectId), "max")

  return result
}

export async function renameFolder(projectId: string, id: string, newName: string) {
  const result = await prisma.sqlFolder.update({
    where: {  id},
    data: { name: newName }
  })

  revalidateTag(t('folders', projectId), "max")

  return result
}

export async function moveQueryToRoot(
  projectId: string,
  queryId: string
) {
  const result = await prisma.sql.update({
    where: {id: queryId},
    data: {
      folder: {
        disconnect: true
      }
    }
  })

  revalidateTag(t('query', projectId, queryId), "max")
  revalidateTag(t('queries', projectId), "max")
  revalidateTag(t('folders', projectId), "max")

  return result
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

  revalidateTag(t("columns", projectId, schema, table), "max");
  revalidateTag(t("schema", projectId, schema), "max");
  revalidateTag(t("table-schema", projectId, schema, table), "max");
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

export async function updateSqlQuery(id: string, projectId: string, query: string) {
  const user = await getUser();
  if (!user) throw new Error("No user");

  const q = await prisma.sql.findUnique({ where: { projectId, id } })

  if (!q) throw new Error("Query not found");

  const result = await prisma.sql.update({
    where: { projectId, id },
    data: { query }
  })

  revalidateTag(t("query", projectId, id), 'max')

  return result
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
    .map(({ name, dtype }) => `${name} ${getPostgresType(dtype)}`)
    .join(", ");

  await pool.query(`
    CREATE OR REPLACE FUNCTION ${data.schema}.${data.name}(${argument_string})
    RETURNS ${getPostgresType(data.returnType)} AS $$
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

export async function renameEnum(
  projectId: string,
  schema: string,
  name: string,
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

  const query = `
    ALTER TYPE ${schema}.${name} RENAME TO ${newName};
  `

  console.log("@@QUERY: ", query)

  await pool.query(query)

  revalidateTag(t("enums", projectId, schema), "max")
}

export async function renameEnumValue(
  projectId: string,
  schema: string,
  name: string,
  valName: string,
  newValName: string
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
    ALTER TYPE ${schema}.${name} RENAME VALUE '${valName}' TO '${newValName}';
  `

  console.log("@@QUERY: ", query)

  await pool.query(query)

  revalidateTag(t("enums", projectId, schema), "max")
}

export async function addValueToEnum(
  projectId: string,
  schema: string,
  name: string,
  newValName: string
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
    ALTER TYPE ${schema}.${name} ADD VALUE '${newValName}';
  `

  console.log("@@QUERY: ", query)

  await pool.query(query)

  revalidateTag(t("enums", projectId, schema), "max")
}

export async function createIndex(
  form: z.infer<typeof createIndexSchema>,
  projectId: string,
) {
  const { data, success } = createIndexSchema.safeParse(form);
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

  const query = `
    CREATE INDEX "${data.table}_${data.cols.map(c => c.name).join("_")}_idx" ON "${data.schema}"."${data.table}" USING ${data.type.toString().toLowerCase()} (${data.cols.map(c => c.name).join(", ")});
  `

  console.log("@QUERY: ", query)

  await pool.query(query)

  revalidateTag(t("indexes", projectId, data.schema), 'max')
}

export async function createTrigger(
  form: z.infer<typeof createTriggerSchema>,
  projectId: string
) {
  const { data, success } = createTriggerSchema.safeParse(form);
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

  const query = `
    CREATE TRIGGER ${data.name}
    ${data.type} ${data.event.join(" OR ")} ON "${data.schema}"."${data.table}"
    FOR EACH ${data.orientation}
    EXECUTE FUNCTION ${data.functionSchema}.${data.functionName}();
  `

  console.log("@@QUERY: ", query)

  await pool.query(query)

  revalidateTag(t("triggers", projectId, data.schema), 'max')
}

export async function renameQuery(
  projectId: string,
  id: string,
  newName: string
) {
  const result = await prisma.sql.update({
    where: {
      projectId,
      id
    },
    data: {
      name: newName
    }
  })

  revalidateTag(t('query', projectId, id), "max")
  revalidateTag(t('queries', projectId), "max")
  revalidateTag(t('folders', projectId), "max")

  return result
}


export async function createEnum(
  form: z.infer<typeof createEnumSchema>,
  projectId: string,
  schema: string
) {
  const { data, success } = createEnumSchema.safeParse(form);
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

  const query = `
    CREATE TYPE ${schema}.${data.name} AS ENUM (${data.values.map(v => `'${v}'`).join(", ")});
  `

  console.log("@@QUERY: ", query)

  await pool.query(query)

  revalidateTag(t("enums", projectId, schema), "max")
}

export default async function createProject(
  form: z.infer<typeof createProjectSchema>,
  ownerId: string
) {
  console.log('\n🎯 === CREATE PROJECT STARTED ===');
  console.log('Owner ID:', ownerId);
  console.log('Project name:', form.name);

  const user = await getUser();
  if (!user) {
    console.error('❌ No active user found');
    throw new Error('No active user');
  }
  console.log('✅ User authenticated:', user.id);

  const parsed = createProjectSchema.safeParse(form);
  if (!parsed.success) {
    console.error('❌ Invalid form data:', parsed.error);
    throw new Error('Invalid form data');
  }

  const password = generateProjectPassword();
  console.log('✅ Generated project password (length:', password.length, ')');

  // Validate environment variables before proceeding
  const connectionName = process.env.CLOUD_SQL_CONNECTION_NAME;
  const adminUser = process.env.CLOUD_SQL_ADMIN_USER;
  const adminPassword = process.env.CLOUD_SQL_ADMIN_PASSWORD;

  console.log('🔍 Checking environment variables:', {
    hasConnectionName: !!connectionName,
    hasAdminUser: !!adminUser,
    hasAdminPassword: !!adminPassword,
    connectionName: connectionName || 'MISSING',
    adminUser: adminUser || 'MISSING',
  });

  if (!connectionName || !adminUser || !adminPassword) {
    const missing = [
      !connectionName && 'CLOUD_SQL_CONNECTION_NAME',
      !adminUser && 'CLOUD_SQL_ADMIN_USER',
      !adminPassword && 'CLOUD_SQL_ADMIN_PASSWORD',
    ].filter(Boolean);
    
    console.error('❌ Missing environment variables:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // create project first to get a stable uuid for db/user names
  console.log('\n📝 Creating Prisma project record...');
  const project = await prisma.project.create({
    data: {
      ownerId,
      name: parsed.data.name,
      db_name: 'PENDING',
      db_user: 'PENDING',
      db_pwd: password,
    },
  });
  console.log('✅ Prisma project created:', {
    id: project.id,
    name: project.name,
  });

  try {
    console.log('\n🏗️  Creating tenant database...');
    const { dbName, dbUser } = await createTenantDatabase({
      projectUuid: project.id,
      projectName: project.name,
      password,
    });

    console.log('✅ Tenant database created:', { dbName, dbUser });

    console.log('\n🔐 Applying tenant grants...');
    await applyTenantGrants({
      connectionName,
      adminUser,
      adminPassword,
      dbName,
      dbUser,
    });

    console.log('✅ Grants applied successfully');

    console.log('\n💾 Updating Prisma project with database credentials...');
    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: {
        db_name: dbName,
        db_user: dbUser,
        db_pwd: password,
      },
    });

    console.log('✅ Project updated with credentials');
    console.log('✅ === CREATE PROJECT COMPLETED ===\n');
    
    return updatedProject;
  } catch (error) {
    console.error('\n❌ === CREATE PROJECT FAILED ===');
    console.error('Error details:', error);
    
    console.log('🧹 Cleaning up pending project...');
    try {
      await prisma.project.delete({
        where: { id: project.id },
      });
      console.log('✅ Pending project cleaned up');
    } catch (cleanupError) {
      console.error('❌ Failed to clean up project:', cleanupError);
    }
    
    console.log('❌ === CREATE PROJECT CLEANUP COMPLETED ===\n');
    throw error;
  }
}



