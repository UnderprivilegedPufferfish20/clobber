import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const glassCard =
  "bg-gray-900/60 backdrop-blur border border-gray-700/60 rounded-xl";

  export function sanitizeUrlComponent(input: string): string {
    return input.replace(/[^a-zA-Z0-9]/g, '_')
  }