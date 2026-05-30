// src/config/prisma.ts
// Singleton do Prisma Client — evita múltiplas conexões em desenvolvimento (hot-reload)

import { PrismaClient } from '@prisma/client';

declare global {
  // Evita múltiplas instâncias no hot-reload do ts-node-dev
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prisma =
  global.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
