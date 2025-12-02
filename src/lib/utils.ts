import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { DATA_TYPES } from "./types";
import { Table } from "./db/generated";
import { ColumnSchema } from "./types/table";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const glassCard =
  "bg-gray-900/60 backdrop-blur border border-gray-700/60 rounded-xl";

export function sanitizeUrlComponent(input: string): string {
  return input.replace(/[^a-zA-Z0-9]/g, '_')
}

export const EMAIL_RE = /^(?:[^\s@]+@[^\s@]+\.[^\s@]+)$/i;

export function coerceToDate(v: unknown): Date | null {
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  if (typeof v === "number") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function isValidForType(v: unknown, t: DATA_TYPES): boolean {
  switch (t) {
    case DATA_TYPES.STRING:
      return typeof v === "string" || v == null;
    case DATA_TYPES.INT:
      return (typeof v === "number" && Number.isInteger(v)) || v == null;
    case DATA_TYPES.FLOAT:
      return (typeof v === "number" && Number.isFinite(v)) || v == null;
    case DATA_TYPES.BOOL:
      return typeof v === "boolean" || v == null;
    case DATA_TYPES.DateTime:
      return v == null || coerceToDate(v) !== null;
    case DATA_TYPES.EMAIL:
      return v == null || (typeof v === "string" && EMAIL_RE.test(v));
    case DATA_TYPES.URL:
      if (v == null) return true;
      if (typeof v !== "string") return false;
      try {
        new URL(v);
        return true;
      } catch {
        return false;
      }
    default:
      return false;
  }
}

export function generateSchema(tbl: Table): ColumnSchema | undefined{
  const data = tbl.data;

  console.log("@@generateSchema - DATA: ", typeof data)

  if (JSON.parse(data) == null) return;

  const schema: Record<string, DATA_TYPES> = Object.fromEntries(
    Object.keys(data).map(key => {
      //@ts-ignore
      const vals = data[key];
      const firstVal = vals?.[0];

      // Pick type based on firstVal, fallback to DATA_TYPES.STRING (or any default)
      let type: DATA_TYPES = DATA_TYPES.STRING;
      for (let dt of Object.values(DATA_TYPES)) {
        if (isValidForType(firstVal, dt)) {
          type = dt;
          break;
        }
      }
      return [key, type];
    })
  );

  return schema;
}


export function generateProjectPassword() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let suffix = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        suffix += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return "cdb_" + suffix
}