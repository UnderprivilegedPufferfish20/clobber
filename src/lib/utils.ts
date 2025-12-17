import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


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
