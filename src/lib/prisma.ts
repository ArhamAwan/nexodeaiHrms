import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error'] : [], // Minimal logging for performance
  // Performance optimizations
  __internal: {
    engine: {
      connectTimeout: 5000,  // 5 seconds
      queryTimeout: 10000,   // 10 seconds
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
