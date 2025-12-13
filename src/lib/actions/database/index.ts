'use server';

import { getUser } from "../auth";
import prisma from "@/lib/db";
import { ExecuteQuery } from "@/lib/types";
import { getProjectById } from "../projects";
import pg from 'pg';
import { Connector, IpAddressTypes } from '@google-cloud/cloud-sql-connector';
import { 
  SqlUsersServiceClient,
  SqlDatabasesServiceClient,
  SqlOperationsServiceClient
 } from '@google-cloud/sql';

const projectId = process.env.GCP_PROJECT_ID!;
const instanceId = process.env.CLOUD_SQL_INSTANCE_ID!;
const con = process.env.CLOUD_SQL_CONNECTION_NAME!;

if (!projectId) throw new Error('Missing env GCP_PROJECT_ID');
if (!instanceId) throw new Error('Missing env CLOUD_SQL_INSTANCE_ID');
if (!con) throw new Error("No con str in env");

console.log('🔧 Database module initialized with:', {
  projectId,
  instanceId,
  hasAdminUser: !!process.env.CLOUD_SQL_ADMIN_USER,
  hasAdminPassword: !!process.env.CLOUD_SQL_ADMIN_PASSWORD,
  hasConnectionName: !!process.env.CLOUD_SQL_CONNECTION_NAME,
  hasCredentialsFile: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
  hasCredentialsJson: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
});

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
console.log('Admin clientOptions:', {
  hasCredentials: !!clientOptions.credentials,
  hasKeyFilename: !!(clientOptions as any).keyFilename,
});

const dbs = new SqlDatabasesServiceClient({...clientOptions, fallback: true});
console.log('Admin client config:', {
  projectId,
  instanceId,
  endpoint: dbs.apiEndpoint,            // or (dbs as any).apiEndpoint
});
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
  console.log('\n🚀 === CREATE TENANT DATABASE STARTED ===');
  console.log('Input parameters:', {
    projectUuid: opts.projectUuid,
    projectName: opts.projectName,
    passwordLength: opts.password.length,
  });

  const dbName = `db_${safeIdent(opts.projectName)}_${opts.projectUuid.slice(0, 8)}`;
  const dbUser = `u_${opts.projectUuid.replace(/-/g, '').slice(0, 16)}`;

  console.log('Generated names:', { dbName, dbUser });

  // 1) create database
  console.log('\n📦 Step 1: Creating database...');

  console.log('Admin API call params:', {
    projectId,
    instanceId,
    typeOfProjectId: typeof projectId,
    typeOfInstanceId: typeof instanceId,
  });

  console.log('Env connection name:', process.env.CLOUD_SQL_CONNECTION_NAME);

  try {

    const [listResp] = await dbs.list({
      project: projectId,
      instance: instanceId,
    });

    console.log('List databases response:', {
      databaseNames: listResp.items?.map(d => d.name),
    });

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

  // 2) create user
  console.log('\n👤 Step 2: Creating user...');
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

  console.log('Executing for project:', {
    projectId: project.id,
    dbName: project.db_name,
    dbUser: project.db_user,
  });

  const pool = await getTenantPool({
    connectionName: con,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name,
  });

  const result = await pool.query(query);
  console.log(`✅ Query executed, returned ${result.rows.length} rows`);
  console.log('✅ === EXECUTE QUERY COMPLETED ===\n');
  
  return { success: true, rows: result.rows };
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

const g = globalThis as unknown as {
  __connector?: Connector;
  __pools?: Map<string, pg.Pool>;
};

function connector() {
  if (!g.__connector) {
    console.log('🔌 Initializing Cloud SQL Connector...');
    g.__connector = new Connector();
  }
  return g.__connector;
}

function pools() {
  if (!g.__pools) {
    console.log('💾 Initializing connection pool cache...');
    g.__pools = new Map();
  }
  return g.__pools;
}

export async function getTenantPool(opts: {
  connectionName: string;
  user: string;
  password: string;
  database: string;
}) {
  const key = `${opts.connectionName}:${opts.database}:${opts.user}`;
  const existing = pools().get(key);
  
  if (existing) {
    console.log('♻️  Reusing existing pool:', key);
    return existing;
  }

  console.log('🆕 Creating new connection pool:', {
    connectionName: opts.connectionName,
    database: opts.database,
    user: opts.user,
  });

  const ipTypeEnv = (process.env.CLOUD_SQL_IP_TYPE || 'PUBLIC').toUpperCase();
  const ipType =
    ipTypeEnv === 'PRIVATE'
      ? IpAddressTypes.PRIVATE
      : ipTypeEnv === 'PSC'
        ? IpAddressTypes.PSC
        : IpAddressTypes.PUBLIC;

  console.log(`🌐 Using IP type: ${ipTypeEnv}`);

  try {
    const clientOpts = await connector().getOptions({
      instanceConnectionName: opts.connectionName,
      ipType,
    });

    const pool = new pg.Pool({
      ...clientOpts,
      user: opts.user,
      password: opts.password,
      database: opts.database,
      max: 5,
    });

    pools().set(key, pool);
    console.log('✅ Connection pool created and cached');
    return pool;
  } catch (error) {
    console.error('❌ Failed to create connection pool:', error);
    throw error;
  }
}