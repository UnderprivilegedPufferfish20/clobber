import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  DATA_TYPES,
  FileObject,
  FilterConfig,
  FilterOperator,
  FkeyType
} from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const extractBody = (def: string) => {
    const defUpper = def.toUpperCase();
    const beginIdx = defUpper.indexOf("BEGIN");
    if (beginIdx === -1) return def.trim();
    const endIdx = defUpper.lastIndexOf("END");
    if (endIdx === -1) return def.substring(beginIdx + 5).trim();
    return def.substring(beginIdx + 5, endIdx).trim();
  };

/** ---------------------------
 *  Password / strings
 *  -------------------------- */
export function generateProjectPassword() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(";
  const length = 12;

  let suffix = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    suffix += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return "cdb_" + suffix + '1234';
}

export function sanitizeDirectoryName(name: string): string {
  return name
    .split("")
    .map((c) => {
      if (/[a-zA-Z0-9\-_]/.test(c)) return c;
      if (c === " ") return "_";
      return "-";
    })
    .join("");
}

/** ---------------------------
 *  Timing
 *  -------------------------- */
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timer: NodeJS.Timeout | null = null;
  return ((...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  }) as T;
}

export function throttle<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let lastCall = 0;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall < delay) return;
    lastCall = now;
    return func(...args);
  }) as T;
}


const TEXT_LIKE = new Set<DATA_TYPES>([
  DATA_TYPES.TEXT,
  DATA_TYPES.CHARACTER,
  DATA_TYPES.CHARACTER_VARYING,
  // Keep JSON text-searchable too
  DATA_TYPES.JSON,
  DATA_TYPES.XML,
]);

const INT_LIKE = new Set<DATA_TYPES>([
  DATA_TYPES.SMALLINT,
  DATA_TYPES.INTEGER,
  DATA_TYPES.BIGINT,
  DATA_TYPES.SERIAL,
  DATA_TYPES.SMALLSERIAL,
  DATA_TYPES.BIGSERIAL,
]);

const FLOAT_LIKE = new Set<DATA_TYPES>([
  DATA_TYPES.REAL,
  DATA_TYPES.DOUBLE_PRECISION,
  DATA_TYPES.NUMERIC,
]);

const BOOL_LIKE = new Set<DATA_TYPES>([DATA_TYPES.BOOLEAN]);

const DATETIME_LIKE = new Set<DATA_TYPES>([
  DATA_TYPES.DATE,
  DATA_TYPES.TIME,
  DATA_TYPES.TIME_TZ,
  DATA_TYPES.TIMESTAMP,
  DATA_TYPES.TIMESTAMPTZ,
  DATA_TYPES.INTERVAL,
]);

/** Prefer casts that accept plain literals cleanly. */
export function getPostgresCast(dataType: DATA_TYPES): string {
  if (INT_LIKE.has(dataType)) return "::bigint"; // works for all ints/serials
  if (FLOAT_LIKE.has(dataType)) return "::numeric";
  if (BOOL_LIKE.has(dataType)) return "::boolean";
  if (DATETIME_LIKE.has(dataType)) {
    // choose a cast that matches the specific family:
    if (dataType === DATA_TYPES.DATE) return "::date";
    if (dataType === DATA_TYPES.TIME) return "::time";
    if (dataType === DATA_TYPES.TIME_TZ) return "::timetz";
    if (dataType === DATA_TYPES.INTERVAL) return "::interval";
    if (dataType === DATA_TYPES.TIMESTAMPTZ) return "::timestamptz";
    return "::timestamp";
  }
  if (dataType === DATA_TYPES.JSONB) return "::jsonb";
  if (dataType === DATA_TYPES.JSON) return "::json";
  if (dataType === DATA_TYPES.UUID) return "::uuid";
  if (dataType === DATA_TYPES.BYTEA) return "::bytea";
  if (dataType === DATA_TYPES.CIDR) return "::cidr";
  if (dataType === DATA_TYPES.INET) return "::inet";
  if (dataType === DATA_TYPES.MACADDR) return "::macaddr";
  if (dataType === DATA_TYPES.MACADDR8) return "::macaddr8";
  // everything else -> text cast for filtering
  return "::text";
}

/** Used by IN to pick an array cast. */
function getPostgresArrayCast(dataType: DATA_TYPES): string {
  if (INT_LIKE.has(dataType)) return "bigint[]";
  if (FLOAT_LIKE.has(dataType)) return "numeric[]";
  if (BOOL_LIKE.has(dataType)) return "boolean[]";
  if (DATETIME_LIKE.has(dataType)) {
    if (dataType === DATA_TYPES.DATE) return "date[]";
    if (dataType === DATA_TYPES.TIME) return "time[]";
    if (dataType === DATA_TYPES.TIME_TZ) return "timetz[]";
    if (dataType === DATA_TYPES.INTERVAL) return "interval[]";
    if (dataType === DATA_TYPES.TIMESTAMPTZ) return "timestamptz[]";
    return "timestamp[]";
  }
  if (dataType === DATA_TYPES.JSONB) return "jsonb[]";
  if (dataType === DATA_TYPES.JSON) return "json[]";
  if (dataType === DATA_TYPES.UUID) return "uuid[]";
  return "text[]";
}

/** ---------------------------
 *  Suggestions (now based on DATA_TYPES instead of old string union)
 *  -------------------------- */
export const defaultSuggestions = (dtype: typeof DATA_TYPES[keyof typeof DATA_TYPES]) => {
  if (dtype === "uuid") {
    return [
      {
        value: "uuid_generate_v4()",
        desc: "Generate a v4 UUID automatically for new rows.",
      },
    ];
  }

  if (dtype === DATA_TYPES.TIMESTAMPTZ) {
    return [
      {
        value: "now()",
        desc: "Set the value to the current timestamp on insert.",
      },
    ];
  }

  if (dtype === DATA_TYPES.BOOLEAN) {
    return [
      { value: "true", desc: "logical true value" },
      { value: "false", desc: "logical false value" },
    ];
  }

  return [];
};

/** ---------------------------
 *  Export helpers (unchanged)
 *  -------------------------- */
export function rowsToSql(
  schema: string,
  name: string,
  rows: any[],
  fields: readonly { name: string }[]
): string {
  const colStatement = fields.map((f) => `"${f.name}"`).join(", ");
  const valStatement = rows
    .map((r) => {
      return `(${Object.values(r)
        .map((v) => {
          if (typeof v === "number") return v;
          if (v === null) return "NULL";
          return `'${String(v).replace(/'/g, "''")}'`;
        })
        .join(", ")})`;
    })
    .join(", ");

  return `INSERT INTO "${schema}"."${name}" (${colStatement}) VALUES ${valStatement}`;
}

export function rowsToJson(rows: any[], fields: readonly { name: string }[]): string {
  const res: Record<string, any[]> = {};
  fields.forEach((f) => (res[f.name] = []));
  rows.forEach((row: Record<string, any>) => {
    for (const [fName, value] of Object.entries(row)) {
      res[fName].push(value);
    }
  });
  return JSON.stringify(res);
}

export function rowsToCsv(rows: any[], fields: readonly { name: string }[]): string {
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    // CSV escape: quote if contains comma/newline/quote; double quotes inside
    if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const header = fields.map((f) => esc(f.name)).join(",");
  const lines = rows.map((row) => fields.map((f) => esc(row[f.name])).join(","));
  return [header, ...lines].join("\n");
}

/** ---------------------------
 *  Utilities
 *  -------------------------- */
export const t = (...parts: (string | number)[]) => parts.join(":");

/** ---------------------------
 *  Generate a runnable SELECT for a function signature
 *  Now supports your enum spellings + common aliases.
 *  -------------------------- */

export const ALIAS_TO_ENUM: Record<string, DATA_TYPES> = {
  // ints/serials
  int2: DATA_TYPES.SMALLINT,
  smallint: DATA_TYPES.SMALLINT,
  int4: DATA_TYPES.INTEGER,
  int: DATA_TYPES.INTEGER,
  integer: DATA_TYPES.INTEGER,
  int8: DATA_TYPES.BIGINT,
  bigint: DATA_TYPES.BIGINT,
  serial2: DATA_TYPES.SMALLSERIAL,
  smallserial: DATA_TYPES.SMALLSERIAL,
  serial4: DATA_TYPES.SERIAL,
  serial: DATA_TYPES.SERIAL,
  serial8: DATA_TYPES.BIGSERIAL,
  bigserial: DATA_TYPES.BIGSERIAL,

  // floats/numeric
  float4: DATA_TYPES.REAL,
  real: DATA_TYPES.REAL,
  float8: DATA_TYPES.DOUBLE_PRECISION,
  float: DATA_TYPES.DOUBLE_PRECISION, // "float" defaults to float8 unless float(p)
  "double precision": DATA_TYPES.DOUBLE_PRECISION,
  numeric: DATA_TYPES.NUMERIC,
  decimal: DATA_TYPES.NUMERIC,

  // text-ish
  text: DATA_TYPES.TEXT,
  varchar: DATA_TYPES.CHARACTER_VARYING,
  "character varying": DATA_TYPES.CHARACTER_VARYING,
  char: DATA_TYPES.CHARACTER,
  character: DATA_TYPES.CHARACTER,

  // misc
  bool: DATA_TYPES.BOOLEAN,
  boolean: DATA_TYPES.BOOLEAN,
  json: DATA_TYPES.JSON,
  jsonb: DATA_TYPES.JSONB,
  uuid: DATA_TYPES.UUID,
  bytea: DATA_TYPES.BYTEA,
  date: DATA_TYPES.DATE,
  timestamp: DATA_TYPES.TIMESTAMP,
  timestamptz: DATA_TYPES.TIMESTAMPTZ,
  "timestamp with time zone": DATA_TYPES.TIMESTAMPTZ,
  timetz: DATA_TYPES.TIME_TZ,
  "time with time zone": DATA_TYPES.TIME_TZ,
  time: DATA_TYPES.TIME,
  interval: DATA_TYPES.INTERVAL,
  inet: DATA_TYPES.INET,
  cidr: DATA_TYPES.CIDR,
  macaddr: DATA_TYPES.MACADDR,
  macaddr8: DATA_TYPES.MACADDR8,
  xml: DATA_TYPES.XML,
  "pg_lsn": DATA_TYPES.PG_LSN,
  "pg_snapshot": DATA_TYPES.PG_SNAPSHOT,
  "txid_snapshot": DATA_TYPES.TXID_SNAPSHOT,
  tsquery: DATA_TYPES.TSQUERY,
  tsvector: DATA_TYPES.TSVECTOR,
  box: DATA_TYPES.BOX,
  circle: DATA_TYPES.CIRCLE,
  line: DATA_TYPES.LINE,
  lseg: DATA_TYPES.LSEG,
  path: DATA_TYPES.PATH,
  point: DATA_TYPES.POINT,
  polygon: DATA_TYPES.POLYGON,
};


export function castFilterValue(
  value: string,
  dataType: DATA_TYPES,
  operator: FilterOperator
): {
  isValid: boolean;
  castedValue?: any;
  error?: string;
} {
  if (operator === FilterOperator.IS) {
    const upper = value.toUpperCase();
    if (["NULL", "NOT NULL", "TRUE", "FALSE"].includes(upper)) return { isValid: true };
    return { isValid: false, error: "IS operator requires NULL, NOT NULL, TRUE, or FALSE" };
  }

  if (!value.trim()) return { isValid: false, error: "Value is required" };

  // int-ish
  if (INT_LIKE.has(dataType)) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return { isValid: false, error: "Must be a valid integer" };
    return { isValid: true, castedValue: parsed };
  }

  // float-ish
  if (FLOAT_LIKE.has(dataType)) {
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) return { isValid: false, error: "Must be a valid number" };
    return { isValid: true, castedValue: parsed };
  }

  // bool
  if (BOOL_LIKE.has(dataType)) {
    const lower = value.toLowerCase().trim();
    if (!["true", "false", "t", "f", "1", "0", "yes", "no"].includes(lower)) {
      return { isValid: false, error: "Must be true or false" };
    }
    const boolValue = ["true", "t", "1", "yes"].includes(lower);
    return { isValid: true, castedValue: boolValue };
  }

  // date/time-ish: accept values but validate basic parsability when it’s a timestamp/date
  if (DATETIME_LIKE.has(dataType)) {
    // allow interval like "1 day", time like "10:00:00" etc.
    // Only do strict JS Date parsing for date/timestamps.
    if (dataType === DATA_TYPES.DATE || dataType === DATA_TYPES.TIMESTAMP || dataType === DATA_TYPES.TIMESTAMPTZ) {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return { isValid: false, error: "Must be a valid date/time" };
    }
    return { isValid: true, castedValue: value };
  }

  // default: pass through (string/json/bytes/etc)
  return { isValid: true, castedValue: value };
}

export const glassCard = "block";


export function buildWhereClause(
  filters: FilterConfig[], // Changed parameter type
  columnTypes: Map<string, DATA_TYPES>
): {
  whereClause: string;
  whereParams: any[];
  errors: Record<string, string>;
} {
  const whereClauses: string[] = [];
  const whereParams: any[] = [];
  const errors: Record<string, string> = {};
  let paramCount = 1;

  for (const filter of filters) {
    const { column, operator: op, value: raw } = filter;
    const value = (raw ?? "").trim();
    const dataType = columnTypes.get(column) ?? DATA_TYPES.TEXT;

    if (!value && op !== FilterOperator.IS) continue;

    const col = `"${column}"`;
    const cast = getPostgresCast(dataType);

    switch (op) {
      case FilterOperator.LIKE: {
        if (!TEXT_LIKE.has(dataType) && dataType !== DATA_TYPES.JSONB) {
          errors[column] = `LIKE operator not supported for ${dataType}`;
          continue;
        }
        whereClauses.push(`${col}::text ILIKE $${paramCount}`);
        whereParams.push(`%${value}%`);
        paramCount++;
        break;
      }

      case FilterOperator.IN: {
        const items = value.split(",").map((s) => s.trim()).filter(Boolean);
        if (!items.length) break;

        const validItems: any[] = [];
        for (const item of items) {
          const validation = castFilterValue(item, dataType, FilterOperator.EQUALS);
          if (!validation.isValid) {
            errors[column] = validation.error || "Invalid value in IN list";
            break;
          }
          validItems.push(validation.castedValue ?? item);
        }
        if (errors[column]) continue;

        const arrayType = getPostgresArrayCast(dataType);
        whereClauses.push(`${col} = ANY($${paramCount}::${arrayType})`);
        whereParams.push(validItems);
        paramCount++;
        break;
      }

      case FilterOperator.IS: {
        const upper = value.toUpperCase();

        if (upper === "NULL") {
          whereClauses.push(`${col} IS NULL`);
        } else if (upper === "NOT NULL") {
          whereClauses.push(`${col} IS NOT NULL`);
        } else if (upper === "TRUE" || upper === "FALSE") {
          if (!BOOL_LIKE.has(dataType)) {
            errors[column] = "TRUE/FALSE only valid for boolean columns";
            continue;
          }
          whereClauses.push(`${col} IS ${upper}`);
        } else {
          errors[column] = "IS operator requires NULL, NOT NULL, TRUE, or FALSE";
          continue;
        }
        break;
      }

      case FilterOperator.EQUALS:
      case FilterOperator.NOT_EQUAL:
      case FilterOperator.GREATER_THAN:
      case FilterOperator.LESS_THAN:
      case FilterOperator.GREATER_THAN_OR_EQUAL_TO:
      case FilterOperator.LESS_THAN_OR_EQUAL_TO: {
        const validation = castFilterValue(value, dataType, op);
        if (!validation.isValid) {
          errors[column] = validation.error || "Invalid value";
          continue;
        }

        whereClauses.push(`${col} ${op} $${paramCount}${cast}`);
        whereParams.push(validation.castedValue ?? value);
        paramCount++;
        break;
      }

      default: {
        errors[column] = `Unknown operator: ${op}`;
        break;
      }
    }
  }

  const whereClause = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";
  return { whereClause, whereParams, errors };
}


/** ---------------------------
 *  Misc
 *  -------------------------- */
export function formatGCSFileSize(fileSize: bigint): string {
  if (isNaN(Number(fileSize))) return "0 B";

  const bytes = Number(fileSize);
  const units = ["B", "kB", "MB", "GB", "TB", "PB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function joinPosix(...parts: string[]) {
  return parts
    .filter(Boolean)
    .join("/")
    .replace(/\/{2,}/g, "/")
    .replace(/^\/+|\/+$/g, "");
}

export const childName = (o: FileObject, prefix: string) =>
  o.name.slice(prefix.length).split("/").filter(Boolean)[0] ?? o.name;

export function gridPosition(i: number) {
  const colW = 520;
  const rowH = 420;
  const cols = 3;
  return { x: (i % cols) * colW, y: Math.floor(i / cols) * rowH };
}

export function createFkeyName(table_name: string, fkey: FkeyType) {
  return `${table_name}_${fkey.cols.map(c => `${c.referencor_column}_to_${c.referencee_column}`).join("")}_fkey`
}

/** ---------------------------------------------
 *  URL encoding helpers
 *  -------------------------------------------- */
export const OP_TO_TOKEN: Record<FilterOperator, string> = {
  [FilterOperator.EQUALS]: "=",
  [FilterOperator.NOT_EQUAL]: "<>",
  [FilterOperator.GREATER_THAN]: ">",
  [FilterOperator.LESS_THAN]: "<",
  [FilterOperator.GREATER_THAN_OR_EQUAL_TO]: ">=",
  [FilterOperator.LESS_THAN_OR_EQUAL_TO]: "<=",
  [FilterOperator.LIKE]: "~~",
  [FilterOperator.IN]: "IN",
  [FilterOperator.IS]: "IS",
};

export const OP_TO_LABEL: Record<FilterOperator, string> = {
  [FilterOperator.EQUALS]: "equal to",
  [FilterOperator.NOT_EQUAL]: "not equal to",
  [FilterOperator.GREATER_THAN]: "greater than",
  [FilterOperator.LESS_THAN]: "less than",
  [FilterOperator.GREATER_THAN_OR_EQUAL_TO]: "greater than or equal to",
  [FilterOperator.LESS_THAN_OR_EQUAL_TO]: "less than or equal to",
  [FilterOperator.LIKE]: "like",
  [FilterOperator.IN]: "in",
  [FilterOperator.IS]: "is",
}

const TOKEN_TO_OP: Record<string, FilterOperator> = Object.fromEntries(
  Object.entries(OP_TO_TOKEN).map(([k, v]) => [v, k as FilterOperator])
);

export function stringifyFilters(filters: FilterConfig[]): string {
  return filters
    .map(f => `${f.column}:${f.operator}:${encodeURIComponent(f.value ?? "")}`)
    .join(",");
}

export function parseFiltersParam(filterParam: string | null): FilterConfig[] {
  if (!filterParam) return [];
  const parts = filterParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const out: FilterConfig[] = [];

  for (const part of parts) {
    const column = part.split(":")[0];
    const operator = part.split(":")[1];
    const rawValue = part.split(":")[2];

    if (!column) continue;

    const op = TOKEN_TO_OP[operator];
    if (!op) continue;

    const value = decodeURIComponent(rawValue ?? "");
    out.push({ column, operator: OP_TO_TOKEN[operator as FilterOperator] as FilterOperator, value });
  }

  return out;
}




export function toCellString(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function sizeFormatToByteNumber() {

}