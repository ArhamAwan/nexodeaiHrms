// Simple in-memory cache for API responses
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

export function setCachedData<T>(key: string, data: T, ttl: number = 60000): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

export async function deduplicatedFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const key = `${url}-${JSON.stringify(options)}`;
  
  // Return cached data if available
  const cached = getCachedData<T>(key);
  if (cached) return cached;
  
  // Return pending request if exists
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }
  
  // Make new request
  const promise = fetch(url, options).then(async (res) => {
    if (!res.ok) {
      let errorText = 'Unknown error';
      try {
        errorText = await res.text();
      } catch (e) {
        // Ignore text parsing errors
      }
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      let text = 'Non-JSON response';
      try {
        text = await res.text();
      } catch (e) {
        // Ignore text parsing errors
      }
      throw new Error(`Expected JSON response, got: ${text}`);
    }
    
    let data;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error(`Failed to parse JSON response: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
    
    setCachedData(key, data, 10000); // 10 second cache for better responsiveness
    pendingRequests.delete(key);
    return data;
  }).catch((error) => {
    pendingRequests.delete(key);
    throw error;
  });
  
  pendingRequests.set(key, promise);
  return promise;
}
