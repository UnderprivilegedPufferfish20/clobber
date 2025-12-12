'use server';

import { PORT_FILE, INITIAL_PORT, SUPERUSER_NAME } from "@/lib/constants";
import { Client } from "pg";
import fs from 'fs/promises'
import path from "path";
import os from 'os'
import { getUser } from "../auth";
import prisma from "@/lib/db";
import { ExecuteQuery } from "@/lib/types";
import { getProjectById } from "../projects";
import { promisify } from "util";
import { exec } from "child_process";
import { spawn } from "child_process";
import { winCmdPath } from "@/lib/utils";

const EXEC_ASYNC = promisify(exec);

const PG_CTL_EXE = "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_ctl.exe"

export async function getDatabaseById(id: string) {
  const user = await getUser()
    
  if (!user) throw new Error("No active user");

  return await prisma.database.findUnique({where: { id }, include: { project: true }})
}

export async function executeQuery(request: ExecuteQuery) {
  let client: Client | null = null;

  try {
    const { query, projectId } = request;

    const project = await getProjectById(projectId);

    if (!project) throw new Error("Execute query: project not found")

    // Create PostgreSQL client
    client = new Client({ connectionString: project.con_string });

    // Connect
    await client.connect();

    // Execute query
    const result = await client.query(query);

    console.log('Query executed successfully');

    return {
      success: true,
      rows: result.rows,
    };
  } catch (error: any) {
    throw new Error("Error executing query: ", error)
  } finally {
    // Close connection
    if (client) {
      await client.end().catch(err => {
        throw new Error("Error closing connection: ", err)
      });
    }
  }
}

export async function allocatePort(): Promise<number> {
  try {
    // Try to read the current port
    const content = await fs.readFile(PORT_FILE, 'utf-8');
    let port = parseInt(content.trim(), 10);

    if (isNaN(port) || port < INITIAL_PORT) {
      port = INITIAL_PORT;
    }

    // Skip reserved ports
    while (port === 3000) {
      port++;
    }

    // Check if port limit reached
    if (port >= 49150) {
      throw new Error('No more ports available');
    }

    // Save next port
    await fs.writeFile(PORT_FILE, `${port + 1}`);

    return port;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create it
      await fs.writeFile(PORT_FILE, `${INITIAL_PORT + 1}`);
      return INITIAL_PORT;
    }
    throw error;
  }
}

export async function initializeDatabase(
  dataDir: string,
  password: string,
  port: number
): Promise<void> {
  console.log('Initializing PostgreSQL data directory...');

  // Create parent directory
  const parent = path.dirname(dataDir);
  await fs.mkdir(parent, { recursive: true });

  // Create temporary password file
  const pwfilePath = path.join(
    os.tmpdir(),
    `pg_pwfile_${Date.now()}_${Math.random().toString(36).substring(7)}`
  );

  await fs.writeFile(pwfilePath, `${password}\n`);

  try {
    // Run initdb
    const { stdout, stderr } = await EXEC_ASYNC(
      `initdb -D "${dataDir}" -U ${SUPERUSER_NAME} --pwfile "${pwfilePath}" --no-locale --encoding=UTF8`
    );

      const confPath = path.join(dataDir, 'postgresql.conf');
      const confContent = `port = ${port}
        listen_addresses = 'localhost'
        max_connections = 10
        shared_buffers = 16MB
        dynamic_shared_memory_type = windows
        max_wal_size = 1GB
        min_wal_size = 80MB
        log_destination = 'stderr'
        logging_collector = off
        log_connections = on
        log_disconnections = on
        `;

      await fs.writeFile(confPath, confContent);

      // Create pg_hba.conf
      const hbaPath = path.join(dataDir, 'pg_hba.conf');
      const hbaContent = `# TYPE  DATABASE        USER            ADDRESS                 METHOD
                            local   all             all                                     trust
                            host    all             all             127.0.0.1/32            md5
                            host    all             all             ::1/128                 md5
                            `;

    await fs.writeFile(hbaPath, hbaContent);


    if (stderr && !stderr.includes('Success')) {
      console.error('initdb stderr:', stderr);
    }
    if (stdout) {
      console.log('initdb stdout:', stdout);
    }
  } finally {
    // Clean up password file
    await fs.unlink(pwfilePath).catch(() => {});
  }

  console.log('Database initialized successfully');
}

export async function startPostgres(dataDir: string, port: number) {
  const dataDirWin = path.win32.normalize(dataDir);
  const logPathWin = path.win32.normalize(path.join(dataDir, "postgres.log"));

  const args = ["-D", dataDirWin, "-l", logPathWin, "-o", `-p ${port}`, "start"];

  console.log("@@Start Postgres:", PG_CTL_EXE, args);

  const child = spawn(PG_CTL_EXE, args, { shell: false, windowsHide: true });

  child.stdout.on("data", (d) => console.log("@@pg_ctl stdout:", d.toString()));
  child.stderr.on("data", (d) => console.log("@@pg_ctl stderr:", d.toString()));
  child.on("error", (err) => console.error("@@pg_ctl spawn error:", err));
}

export async function verifyConnection(
  port: number,
  password: string
): Promise<void> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    console.log(`Connection attempt ${attempt}/5...`);

    const client = new Client({
      host: 'localhost',
      port: port,
      user: SUPERUSER_NAME,
      password: password,
      database: 'postgres',
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      console.log("Connection verified successfully");
      return;
    } catch (error: any) {
      console.log(`Connection attempt ${attempt} failed:`, error.message);
      await client.end().catch(() => {}); // Clean up

      if (attempt < 5) {
        await new Promise((r) => setTimeout(r, 2000)); // Increased wait time
      }
    }
  }

  throw new Error("Could not verify connection after 5 attempts");
}

export async function stopPostgres(dataDir: string): Promise<void> {
  console.log('Stopping PostgreSQL...');

  try {
    await EXEC_ASYNC(`pg_ctl -D "${dataDir}" stop -m fast`);
    console.log('PostgreSQL stopped');
  } catch (error: any) {
    console.error('Error stopping PostgreSQL:', error.message);
  }
}