// Performance monitoring utility for API routes

export function withPerformanceLogging<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  routeName: string
) {
  return async (...args: T): Promise<R> => {
    const start = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - start;
      
      // Log slow requests (>1 second)
      if (duration > 1000) {
        console.warn(`🐌 Slow API: ${routeName} took ${duration}ms`);
      } else if (duration > 500) {
        console.log(`⚠️  API: ${routeName} took ${duration}ms`);
      } else {
        console.log(`✅ API: ${routeName} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`❌ API Error: ${routeName} failed after ${duration}ms`, error);
      throw error;
    }
  };
}

// Cache utility for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export function getCached<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() - item.timestamp > item.ttl) {
    cache.delete(key);
    return null;
  }
  
  return item.data;
}

export function setCached<T>(key: string, data: T, ttlMs: number = 60000): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs
  });
}

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (now - item.timestamp > item.ttl) {
      cache.delete(key);
    }
  }
}, 30000); // Clean every 30 seconds
