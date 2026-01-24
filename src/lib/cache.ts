/**
 * Simple in-memory cache for API responses
 * Cache entries expire after a configurable TTL (Time To Live)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class InMemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Get cached data if it exists and is not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > this.defaultTTL;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Store data in cache with current timestamp
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Generate cache key from parameters
   */
  static generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${prefix}:${sortedParams}`;
  }
}

// Export singleton instance
export const apiCache = new InMemoryCache();

/**
 * Wrapper function to cache async API calls
 */
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Check cache first
  const cached = apiCache.get<T>(key);
  if (cached !== null) {
    console.log(`Cache hit for key: ${key}`);
    return cached;
  }

  // Fetch fresh data
  console.log(`Cache miss for key: ${key}`);
  const data = await fetchFn();
  
  // Store in cache
  apiCache.set(key, data);
  
  return data;
}
