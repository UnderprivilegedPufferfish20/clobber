import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import os from 'os'
import path from "path";

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
