// src/lib/prisma.ts

import { PrismaClient } from './generated';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
import 'dotenv/config'; 

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // This uses your original postgresql:// URL
});

const adapter = new PrismaPg(pool);

// Do not use the withAccelerate() extension here
export const prisma = new PrismaClient({
  adapter, 
});

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };


if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
