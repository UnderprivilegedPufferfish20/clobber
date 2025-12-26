import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { DATA_TYPE_TYPE, DATA_TYPES, FilterOperator, FUNCTION_RETURN_TYPE_TYPE, FUNCTION_RETURN_TYPES, QueryFilters } from "./types";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const glassCard =
  "bg-gray-900/60 backdrop-blur border border-gray-700/60 rounded-xl";


export function generateProjectPassword() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 16; // choose whatever length you want

  let suffix = '';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    suffix += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return "cdb_" + suffix;
}


export function sanitizeDirectoryName(name: string): string {
  return name
    .split('')
    .map(c => {
      if (/[a-zA-Z0-9\-_]/.test(c)) return c;
      if (c === ' ') return '_';
      return '-';
    })
    .join('');
}



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
    const now = new Date().getTime();
    if (now - lastCall < delay) return;
    lastCall = now;
    return func(...args);
  }) as T;
}


export function mapPostgresType(pgType: string): DATA_TYPES {
  const type = pgType.toLowerCase();
  
  if (type.includes('char') || type.includes('text')) return DATA_TYPES.STRING;
  if (type.includes('int') || type === 'smallint' || type === 'bigint') return DATA_TYPES.INT;
  if (type.includes('numeric') || type.includes('decimal') || type.includes('float') || type.includes('double') || type === 'real') return DATA_TYPES.FLOAT;
  if (type.includes('bool')) return DATA_TYPES.BOOL;
  if (type.includes('timestamp') || type.includes('date') || type.includes('time')) return DATA_TYPES.DateTime;
  if (type.includes('bytea')) return DATA_TYPES.BYTES;
  if (type.includes('json')) return DATA_TYPES.JSON;
  
  return DATA_TYPES.STRING; // default fallback
}

export function getPostgresType(type: DATA_TYPE_TYPE | FUNCTION_RETURN_TYPE_TYPE | string): string {
  switch (type) {
    case 'string':
      return 'TEXT'; // 'VARCHAR' is also valid, but 'TEXT' is preferred in Postgres for arbitrary lengths.
    case 'integer':
      return 'INTEGER';
    case 'float':
      return 'DOUBLE PRECISION'; // Mapping 'float' to standard 8-byte floating point.
    case 'boolean':
      return 'BOOLEAN';
    case 'datetime':
      return 'TIMESTAMP'; // Use 'TIMESTAMPTZ' if you need time zone awareness.
    case 'bytes':
      return 'BYTEA'; // Standard Postgres type for binary data (byte array).
    case 'JSON':
      return 'JSONB'; // 'JSONB' is generally preferred over 'JSON' for efficiency and indexing.
    default:
      return type
  }
}

// Get the PostgreSQL cast syntax for a given data type
export function getPostgresCast(dataType: DATA_TYPES): string {
  switch (dataType) {
    case DATA_TYPES.INT:
      return '::integer';
    case DATA_TYPES.FLOAT:
      return '::numeric';
    case DATA_TYPES.BOOL:
      return '::boolean';
    case DATA_TYPES.DateTime:
      return '::timestamp';
    case DATA_TYPES.JSON:
      return '::jsonb';
    case DATA_TYPES.STRING:
    case DATA_TYPES.BYTES:
    default:
      return '::text';
  }
}


export const t = (...parts: (string | number)[]) => parts.join(":");


export function callPostgresFunction(
  name: string,
  argstring: string
): string {
  if (!argstring.trim()) {
    return `SELECT ${name}();`;
  }

  const args = argstring.split(",").map(a => a.trim());
  const sqlArgs: string[] = [];

  for (const arg of args) {
    const [, ...typeParts] = arg.split(/\s+/);
    const dtype = typeParts.join(" ").toUpperCase();

    let sqlLiteral: string;

    switch (dtype) {
      case "TEXT":
        sqlLiteral = `'a'`;
        break;

      case "INTEGER":
        sqlLiteral = `2`;
        break;

      case "DOUBLE PRECISION":
        sqlLiteral = `3.2`;
        break;

      case "BOOLEAN":
        sqlLiteral = `FALSE`;
        break;

      case "TIMESTAMP":
        sqlLiteral = `'2025-01-01 10:00:00'::timestamp`;
        break;

      case "BYTEA":
        sqlLiteral = `'\\x01020304ff'::bytea`;
        break;

      case "JSONB":
        sqlLiteral = `'{"g":"a"}'::jsonb`;
        break;

      default:
        throw new Error(`Unsupported PostgreSQL type: ${dtype}`);
    }

    sqlArgs.push(sqlLiteral);
  }

  return `SELECT ${name}(${sqlArgs.join(", ")});`;
}


// Validate and cast a filter value based on data type
export function castFilterValue(value: string, dataType: DATA_TYPES, operator: FilterOperator): { 
  isValid: boolean; 
  castedValue?: any; 
  error?: string;
} {
  // IS operator doesn't need value validation
  if (operator === FilterOperator.IS) {
    const upper = value.toUpperCase();
    if (['NULL', 'NOT NULL', 'TRUE', 'FALSE'].includes(upper)) {
      return { isValid: true };
    }
    return { isValid: false, error: 'IS operator requires NULL, NOT NULL, TRUE, or FALSE' };
  }

  // Empty values are invalid for other operators
  if (!value.trim()) {
    return { isValid: false, error: 'Value is required' };
  }

  switch (dataType) {
    case DATA_TYPES.INT: {
      const parsed = parseInt(value, 10);
      if (isNaN(parsed)) {
        return { isValid: false, error: 'Must be a valid integer' };
      }
      return { isValid: true, castedValue: parsed };
    }

    case DATA_TYPES.FLOAT: {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) {
        return { isValid: false, error: 'Must be a valid number' };
      }
      return { isValid: true, castedValue: parsed };
    }

    case DATA_TYPES.BOOL: {
      const lower = value.toLowerCase().trim();
      if (!['true', 'false', 't', 'f', '1', '0', 'yes', 'no'].includes(lower)) {
        return { isValid: false, error: 'Must be true or false' };
      }
      const boolValue = ['true', 't', '1', 'yes'].includes(lower);
      return { isValid: true, castedValue: boolValue };
    }

    case DATA_TYPES.DateTime: {
      // Basic date validation - you might want more robust validation
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return { isValid: false, error: 'Must be a valid date' };
      }
      return { isValid: true, castedValue: value };
    }

    case DATA_TYPES.STRING:
    case DATA_TYPES.JSON:
    case DATA_TYPES.BYTES:
    default:
      return { isValid: true, castedValue: value };
  }
}



export function buildWhereClause(
  filters: QueryFilters,
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

  for (const [column, [op, raw]] of Object.entries(filters)) {
    const value = (raw ?? "").trim();
    const dataType = columnTypes.get(column) || DATA_TYPES.STRING;

    // Skip empty values except for IS operator
    if (!value && op !== FilterOperator.IS) continue;

    const col = `"${column}"`;
    const cast = getPostgresCast(dataType);

    switch (op) {
      case FilterOperator.LIKE: {
        // LIKE only makes sense for text types
        if (dataType !== DATA_TYPES.STRING && dataType !== DATA_TYPES.JSON) {
          errors[column] = `LIKE operator not supported for ${dataType} type`;
          continue;
        }
        whereClauses.push(`${col}::text ILIKE $${paramCount}`);
        whereParams.push(`%${value}%`);
        paramCount++;
        break;
      }

      case FilterOperator.IN: {
        const items = value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        if (!items.length) break;

        // Validate each item
        const validItems: any[] = [];
        for (const item of items) {
          const validation = castFilterValue(item, dataType, FilterOperator.EQUALS);
          if (!validation.isValid) {
            errors[column] = validation.error || 'Invalid value in IN list';
            break;
          }
          validItems.push(validation.castedValue ?? item);
        }

        if (errors[column]) continue;

        // Use appropriate array type
        let arrayType = 'text[]';
        if (dataType === DATA_TYPES.INT) arrayType = 'integer[]';
        else if (dataType === DATA_TYPES.FLOAT) arrayType = 'numeric[]';
        else if (dataType === DATA_TYPES.BOOL) arrayType = 'boolean[]';

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
          if (dataType !== DATA_TYPES.BOOL) {
            errors[column] = 'TRUE/FALSE only valid for boolean columns';
            continue;
          }
          whereClauses.push(`${col} IS ${upper}`);
        } else {
          errors[column] = 'IS operator requires NULL, NOT NULL, TRUE, or FALSE';
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
          errors[column] = validation.error || 'Invalid value';
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

  const whereClause = whereClauses.length > 0 
    ? `WHERE ${whereClauses.join(" AND ")}` 
    : "";

  return { whereClause, whereParams, errors };
}