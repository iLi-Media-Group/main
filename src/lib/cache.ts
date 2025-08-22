// Simple in-memory cache utility to prevent unnecessary database calls
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const dataCache = new DataCache();

// Cache keys for common data
export const CACHE_KEYS = {
  PROFILE: (userId: string) => `profile:${userId}`,
  RIGHTS_HOLDER: (userId: string) => `rights_holder:${userId}`,
  TRACKS: (userId: string) => `tracks:${userId}`,
  PROPOSALS: (userId: string) => `proposals:${userId}`,
  SALES: (userId: string) => `sales:${userId}`,
} as const;

// Clean up expired cache entries every 5 minutes
setInterval(() => {
  dataCache.cleanup();
}, 5 * 60 * 1000);
