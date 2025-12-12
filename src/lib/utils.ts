import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import os from 'os'
import path from "path";
import { SUPERUSER_NAME } from "./constants";

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


export function getDataDirectory(projectName: string): string {
  const safeDir = sanitizeDirectoryName(projectName);
  const home = process.env.HOME || os.tmpdir();
  return path.join(home, 'pg_data', safeDir);
}

export function getConnectionString(
  port: number,
  password: string
): string {
  return `postgresql://${SUPERUSER_NAME}:${password}@localhost:${port}/postgres`;
}

export function winCmdPath(p: string) {
  return path.win32.normalize(p).replace(/\\/g, "/");
}
