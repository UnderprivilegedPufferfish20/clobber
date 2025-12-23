import "server-only";
import pg from "pg";
import { Connector, IpAddressTypes } from "@google-cloud/cloud-sql-connector";

const g = globalThis as unknown as {
  __connector?: Connector;
  __pools?: Map<string, pg.Pool>;
};

function connector() {
  if (!g.__connector) g.__connector = new Connector();
  return g.__connector;
}

function pools() {
  if (!g.__pools) g.__pools = new Map();
  return g.__pools;
}

export type TenantPoolOpts = {
  connectionName: string;
  user: string;
  password: string;
  database: string;
};

export async function getTenantPool(opts: TenantPoolOpts) {
  const key = `${opts.connectionName}:${opts.database}:${opts.user}`;
  const existing = pools().get(key);
  if (existing) return existing;

  const ipTypeEnv = (process.env.CLOUD_SQL_IP_TYPE || "PUBLIC").toUpperCase();
  const ipType =
    ipTypeEnv === "PRIVATE"
      ? IpAddressTypes.PRIVATE
      : ipTypeEnv === "PSC"
        ? IpAddressTypes.PSC
        : IpAddressTypes.PUBLIC;

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
  return pool;
}
