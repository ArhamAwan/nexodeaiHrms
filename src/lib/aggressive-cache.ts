// Aggressive caching system for API responses
import { NextRequest } from 'next/server';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  etag: string;
}

const cache = new Map<string, CacheEntry>();
const CACHE_CLEANUP_INTERVAL = 30000; // 30 seconds

// Clean up expired cache entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key);
    }
  }
}, CACHE_CLEANUP_INTERVAL);

export function getCachedResponse(key: string): { data: any; etag: string } | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }
  
  return { data: entry.data, etag: entry.etag };
}

export function setCachedResponse(key: string, data: any, ttl: number = 60000): string {
  const etag = `"${Date.now()}-${Math.random().toString(36).substr(2, 9)}"`;
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
    etag
  });
  return etag;
}

export function generateCacheKey(req: NextRequest, userId?: string): string {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const searchParams = url.searchParams.toString();
  const userKey = userId ? `-user:${userId}` : '';
  return `${pathname}${searchParams ? `?${searchParams}` : ''}${userKey}`;
}

// Predefined cache TTLs for different endpoints
export const CACHE_TTLS = {
  '/api/dashboard/stats': 30000,      // 30 seconds
  '/api/analytics': 120000,           // 2 minutes
  '/api/holidays': 300000,            // 5 minutes
  '/api/employees': 60000,            // 1 minute
  '/api/notifications': 15000,        // 15 seconds
  '/api/leaves': 30000,               // 30 seconds
  '/api/time': 5000,                  // 5 seconds
  '/api/auth/me': 60000,              // 1 minute
} as const;

export function getCacheTTL(pathname: string): number {
  return CACHE_TTLS[pathname as keyof typeof CACHE_TTLS] || 30000; // Default 30 seconds
}
