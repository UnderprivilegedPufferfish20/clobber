'use server';

import { getUser } from "../auth";
import { ExecuteQuery } from "@/lib/types";
import { getProjectById } from "./cache-actions";
import { 
  SqlUsersServiceClient,
  SqlDatabasesServiceClient,
  SqlOperationsServiceClient
 } from '@google-cloud/sql';
import { getTenantPool } from "./tennantPool";
import { Pool } from 'pg';

const projectId = process.env.GCP_PROJECT_ID!;
const instanceId = process.env.CLOUD_SQL_INSTANCE_ID!;
const con = process.env.CLOUD_SQL_CONNECTION_NAME!;
const adminPassword = process.env.CLOUD_SQL_ADMIN_PASSWORD!;

if (!projectId) throw new Error('Missing env GCP_PROJECT_ID');
if (!instanceId) throw new Error('Missing env CLOUD_SQL_INSTANCE_ID');
if (!con) throw new Error("No con str in env");
if (!adminPassword) throw new Error('Missing env CLOUD_SQL_ADMIN_PASSWORD');


// Initialize clients with credentials if provided
const getClientOptions = () => {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    console.log('🔑 Using credentials from JSON string');
    try {
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      return { credentials };
    } catch (error) {
      console.error('❌ Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', error);
      throw new Error('Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON format');
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('🔑 Using credentials from file:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
    return { keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS };
  } else {
    console.log('🔑 Using Application Default Credentials (ADC)');
    return {};
  }
};

const clientOptions = getClientOptions();


const dbs = new SqlDatabasesServiceClient({...clientOptions, fallback: true});
const users = new SqlUsersServiceClient({...clientOptions, fallback: true});
const ops = new SqlOperationsServiceClient({...clientOptions, fallback: true});

async function waitOp(opName: string) {
  console.log(`⏳ Waiting for operation: ${opName}`);
  let attempts = 0;
  
  while (true) {
    attempts++;
    const [op] = await ops.get({ project: projectId, operation: opName });
    
    console.log(`   Attempt ${attempts}: Operation status = ${op.status}`, {
      operationType: op.operationType,
      startTime: op.startTime,
    });
    
    if (op.status === 'DONE') {
      const errs = op.error?.errors || [];
      if (errs.length) {
        const msg = errs.map(e => e.message).filter(Boolean).join('; ');
        console.error('❌ Operation failed:', {
          operation: opName,
          errors: errs,
        });
        throw new Error(`Cloud SQL op failed: ${msg || 'unknown error'}`);
      }
      console.log(`✅ Operation completed: ${opName}`);
      return;
    }
    
    await new Promise(r => setTimeout(r, 1500));
  }
}

function safeIdent(input: string) {
  const result = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  
  console.log(`🔤 Sanitized identifier: "${input}" → "${result}"`);
  return result;
}

export async function createTenantDatabase(opts: {
  projectUuid: string;
  projectName: string;
  password: string;
}) {
  const dbName = `db_${safeIdent(opts.projectName)}_${opts.projectUuid.slice(0, 8)}`;
  const dbUser = `u_${opts.projectUuid.replace(/-/g, '').slice(0, 16)}`;


  try {

    const [op] = await dbs.insert({
      project: projectId,
      instance: instanceId,
      body: { name: dbName },
    });
    
    if (!op?.name) {
      console.error('❌ No operation name returned from databases.insert');
      throw new Error('Missing op name for databases.insert');
    }
    
    console.log(`📋 Database insert operation created: ${op.name}`);
    await waitOp(op.name);
    console.log(`✅ Database "${dbName}" created successfully`);
  } catch (error) {
    console.error('❌ Failed to create database:', error);
    throw error;
  }

  try {
    const [op] = await users.insert({
      project: projectId,
      instance: instanceId,
      body: { name: dbUser, password: opts.password },
    });
    
    if (!op?.name) {
      console.error('❌ No operation name returned from users.insert');
      throw new Error('Missing op name for users.insert');
    }
    
    console.log(`📋 User insert operation created: ${op.name}`);
    await waitOp(op.name);
    console.log(`✅ User "${dbUser}" created successfully`);
  } catch (error) {
    console.error('❌ Failed to create user:', error);
    console.log('⚠️  Note: Database was created but user creation failed. You may need to clean up.');
    throw error;
  }

  // Connect as admin to grant privileges, create schemas, and tables
  try {
    const adminPool = new Pool({
      user: dbUser,
      password: opts.password,
      database: dbName,
      host: process.env.CLOUD_SQL_PUBLIC_IP!,
      port: 5432,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Grant privileges to the new user
    await adminPool.query(`GRANT ALL PRIVILEGES ON DATABASE "${dbName}" TO "${dbUser}";`);

    // Create UUID extension
    await adminPool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // Create schemas
    await adminPool.query('CREATE SCHEMA auth;');
    await adminPool.query('CREATE SCHEMA vault;');
    await adminPool.query('CREATE SCHEMA storage;');
    await adminPool.query('CREATE SCHEMA realtime;');

    // Create tables in storage schema
    await adminPool.query(`
      CREATE TABLE storage.buckets (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name text UNIQUE NOT NULL,
        project_id text NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL,
        size_lim_bytes BIGINT,
        allowed_types VARCHAR[],
        is_public BOOLEAN DEFAULT false
      );
    `);

    await adminPool.query(`
      CREATE TABLE storage.objects (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name text NOT NULL,
        bucket_id uuid NOT NULL,
        metadata jsonb,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL,
        last_accessed_at timestamp with time zone NOT NULL,
        CONSTRAINT objects_bucket_fkey FOREIGN KEY ("bucket_id") REFERENCES storage.buckets(id)
      );

      -- Custom enum types (fixed syntax with comma-separated values)
      CREATE TYPE "storage"."VECTOR_INDEX_TYPE" AS ENUM ('DENSE', 'SPARSE');
      CREATE TYPE "storage"."VECTOR_INDEX_METRIC" AS ENUM ('DOT_PRODUCT', 'EUCLIDEAN', 'COSINE');

      -- Indexes table (added missing comma after metric)
      CREATE TABLE "storage"."indexes" (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id uuid NOT NULL,
        namespaces TEXT[],
        name TEXT NOT NULL,
        dimensions INTEGER NOT NULL,
        vector_type "storage"."VECTOR_INDEX_TYPE" NOT NULL,
        metric "storage"."VECTOR_INDEX_METRIC" NOT NULL,
        CONSTRAINT unique_project_index_name UNIQUE (project_id, name)
      );

      -- Vectors table (added embedding column, fixed PRIMARY KEY)
      CREATE TABLE "storage"."vectors" (
        id TEXT NOT NULL,
        "namespace" TEXT NOT NULL,
        "text" TEXT NOT NULL,
        PRIMARY KEY (id, "namespace")
      );
    `);

    // Create table in vault schema
    await adminPool.query(`
      CREATE TABLE vault.secrets (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name text UNIQUE NOT NULL,
        value text NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    await adminPool.query(`
      CREATE TABLE "auth"."users" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id TEXT NOT NULL,
      email TEXT,
      encrypted_password TEXT,
      last_sign_in_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      phone TEXT UNIQUE
    );

CREATE TABLE "auth"."sso_providers" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid, -- Assuming this refers to a project table not shown
  callback_url TEXT,
  client_id TEXT,
  client_secret TEXT,
  enabled BOOLEAN DEFAULT true,
  allow_no_email BOOLEAN DEFAULT true
);

CREATE TABLE "auth"."sessions" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES "auth"."users"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE "auth"."access_token" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES "auth"."sessions"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  user_id uuid REFERENCES "auth"."users"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  payload TEXT,
  revoked BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  -- Stored generated column for expiration logic
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE "auth"."refresh_token" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token_id uuid REFERENCES "auth"."access_token"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  user_id uuid REFERENCES "auth"."users"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  payload TEXT,
  revoked BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  -- Stored generated column for expiration logic
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE VIEW "auth"."active_access_tokens" AS
SELECT *,
       (expires_at < now()) AS expired
FROM "auth"."access_token";

CREATE VIEW "auth"."active_refresh_tokens" AS
SELECT *,
       (expires_at < now()) AS expired
FROM "auth"."refresh_token";



      `)

    // Transfer ownership to the new user for full control
    await adminPool.query(`ALTER SCHEMA auth OWNER TO "${dbUser}";`);
    await adminPool.query(`ALTER SCHEMA vault OWNER TO "${dbUser}";`);
    await adminPool.query(`ALTER SCHEMA storage OWNER TO "${dbUser}";`);
    await adminPool.query(`ALTER SCHEMA realtime OWNER TO "${dbUser}";`);

    await adminPool.query(`ALTER TABLE vault.secrets OWNER TO "${dbUser}";`);
    await adminPool.query(`ALTER TABLE storage.buckets OWNER TO "${dbUser}";`);
    await adminPool.query(`ALTER TABLE storage.objects OWNER TO "${dbUser}";`);

    await adminPool.end();
    console.log(`✅ Schemas and tables created, ownership transferred to "${dbUser}"`);
  } catch (error) {
    console.error('❌ Failed to set up schemas and tables:', error);
    console.log('⚠️  Note: Database and user were created but schema setup failed. You may need to clean up.');
    throw error;
  }

  console.log('\n✅ === CREATE TENANT DATABASE COMPLETED ===\n');
  return { dbName, dbUser };
}

export async function deleteTenantDatabase(opts: { dbName: string; dbUser: string }) {
  console.log('\n🗑️  === DELETE TENANT DATABASE STARTED ===');
  console.log('Deleting:', opts);

  try {
    const [op] = await dbs.delete({
      project: projectId,
      instance: instanceId,
      database: opts.dbName,
    });
    if (op?.name) {
      console.log(`📋 Database delete operation: ${op.name}`);
      await waitOp(op.name);
    }
    console.log(`✅ Database "${opts.dbName}" deleted`);
  } catch (error) {
    console.error(`❌ Failed to delete database "${opts.dbName}":`, error);
  }

  try {
    const [op] = await users.delete({
      project: projectId,
      instance: instanceId,
      name: opts.dbUser,
    });
    if (op?.name) {
      console.log(`📋 User delete operation: ${op.name}`);
      await waitOp(op.name);
    }
    console.log(`✅ User "${opts.dbUser}" deleted`);
  } catch (error) {
    console.error(`❌ Failed to delete user "${opts.dbUser}":`, error);
  }

  console.log('✅ === DELETE TENANT DATABASE COMPLETED ===\n');
}

export async function executeQuery(request: ExecuteQuery) {
  console.log('\n🔍 === EXECUTE QUERY STARTED ===');
  console.log('Query:', request.query.substring(0, 100) + '...');
  
  const user = await getUser();
  if (!user) throw new Error('No active user');

  const { query, projectId } = request;
  const project = await getProjectById(projectId);
  if (!project) throw new Error('Execute query: project not found');

  const pool = await getTenantPool({
    connectionName: con,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name,
  });

  const result = await pool.query(query);
  console.log(`✅ Query executed, returned ${result.rows.length} rows`);
  console.log('✅ === EXECUTE QUERY COMPLETED ===\n');

  return {
    rows: result.rows,
    columns: result.fields.map(f => f.name)
  }
}

export async function applyTenantGrants(opts: {
  connectionName: string;
  adminUser: string;
  adminPassword: string;
  dbName: string;
  dbUser: string;
}) {
  console.log('\n🔐 === APPLY TENANT GRANTS STARTED ===');
  console.log('Grant parameters:', {
    connectionName: opts.connectionName,
    adminUser: opts.adminUser,
    dbName: opts.dbName,
    dbUser: opts.dbUser,
    hasPassword: !!opts.adminPassword,
  });

  try {
    console.log('🔌 Connecting as admin user...');
    const adminPool = await getTenantPool({
      connectionName: opts.connectionName,
      user: opts.adminUser,
      password: opts.adminPassword,
      database: opts.dbName,
    });
    console.log('✅ Admin connection established');

    // Tighten default permissions
    console.log('🔒 Revoking public permissions on database...');
    await adminPool.query(`REVOKE ALL ON DATABASE "${opts.dbName}" FROM PUBLIC;`);
    
    console.log('🔓 Granting connect & temporary to tenant user...');
    await adminPool.query(`GRANT CONNECT, TEMPORARY ON DATABASE "${opts.dbName}" TO "${opts.dbUser}";`);

    // schema permissions (public schema)
    console.log('🔒 Revoking public permissions on schema...');
    await adminPool.query(`REVOKE ALL ON SCHEMA public FROM PUBLIC;`);
    
    console.log('🔓 Granting usage & create on schema to tenant user...');
    await adminPool.query(`GRANT USAGE, CREATE ON SCHEMA public TO "${opts.dbUser}";`);

    // future tables/sequences/functions
    console.log('🔓 Setting default privileges for tables...');
    await adminPool.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "${opts.dbUser}";`);
    
    console.log('🔓 Setting default privileges for sequences...');
    await adminPool.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO "${opts.dbUser}";`);
    
    console.log('🔓 Setting default privileges for functions...');
    await adminPool.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO "${opts.dbUser}";`);

    console.log('✅ === APPLY TENANT GRANTS COMPLETED ===\n');
  } catch (error) {
    console.error('❌ Failed to apply grants:', error);
    throw error;
  }
}