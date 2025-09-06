// Database optimization utilities
import { prisma } from './prisma';

// Connection health check
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true, timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    };
  }
}

// Optimized query helpers
export const optimizedQueries = {
  // Get user with minimal data
  getUserBasic: (userId: string) => 
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    }),

  // Get employee stats with minimal data
  getEmployeeStats: (employeeId: string) =>
    Promise.all([
      prisma.timeLog.count({ where: { employeeId } }),
      prisma.attendance.count({ where: { employeeId } }),
      prisma.leave.count({ where: { employeeId } })
    ]),

  // Get dashboard stats optimized
  getDashboardStats: () =>
    Promise.all([
      prisma.employee.count(),
      prisma.department.count(),
      prisma.leave.count({ where: { status: "PENDING" } })
    ])
};

// Cleanup function for graceful shutdown
export async function cleanupDatabase() {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Database cleanup error:', error);
  }
}

// Performance monitoring
export function withPerformanceMonitoring<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operationName: string
) {
  return async (...args: T): Promise<R> => {
    const start = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        console.warn(`🐌 Slow DB operation: ${operationName} took ${duration}ms`);
      } else if (duration > 500) {
        console.log(`⚠️  DB operation: ${operationName} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`❌ DB Error: ${operationName} failed after ${duration}ms`, error);
      throw error;
    }
  };
}
