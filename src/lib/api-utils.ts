import { NextResponse } from 'next/server';

// Utility function to create optimized API responses
export function createOptimizedResponse(data: any, options: {
  cacheMaxAge?: number;
  staleWhileRevalidate?: number;
  compress?: boolean;
} = {}) {
  const {
    cacheMaxAge = 60, // 1 minute default
    staleWhileRevalidate = 120, // 2 minutes default
    compress = true
  } = options;

  const response = NextResponse.json(data);
  
  // Set cache headers
  response.headers.set(
    'Cache-Control', 
    `public, s-maxage=${cacheMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  );
  
  // Note: Compression is handled by the server/CDN, not manually set here
  
  // Set performance headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  
  return response;
}

// Database query optimization helpers
export const selectEmployeeBasic = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  designation: true,
  joinedAt: true,
  user: { 
    select: { 
      id: true, 
      email: true, 
      role: true,
      status: true
    } 
  }, 
  department: { 
    select: { 
      id: true,
      name: true 
    } 
  }
};

export const selectLeaveBasic = {
  id: true,
  type: true,
  fromDate: true,
  toDate: true,
  status: true,
  createdAt: true,
  updatedAt: true
};

export const selectNotificationBasic = {
  id: true,
  message: true,
  read: true,
  createdAt: true
};

export const selectHolidayBasic = {
  id: true,
  name: true,
  date: true,
  createdAt: true
};
