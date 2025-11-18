// ✅ OPTIMIZED: In-memory cache with Stale-While-Revalidate pattern
// Reduces API calls by caching results and serving stale data when needed

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class AnalyticsCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 10 * 60 * 1000; // 10 minutes (optimized from 5)
  private staleTTL: number = 30 * 60 * 1000; // 30 minutes for stale data

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + (ttl || this.defaultTTL),
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.timestamp) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  // ✅ NEW: Get with stale-while-revalidate pattern
  // Returns stale data if available, with flag indicating if it's stale
  getWithStale<T>(key: string): { data: T | null; isStale: boolean } {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return { data: null, isStale: false };
    }

    const now = Date.now();
    
    // Fresh data (within TTL)
    if (now <= entry.timestamp) {
      return { data: entry.data as T, isStale: false };
    }
    
    // Stale but acceptable (within stale TTL)
    if (now <= entry.timestamp + this.staleTTL) {
      return { data: entry.data as T, isStale: true };
    }

    // Too old, delete and return null
    this.cache.delete(key);
    return { data: null, isStale: false };
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      // Only delete if past stale TTL
      if (now > entry.timestamp + this.staleTTL) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Global cache instance
export const analyticsCache = new AnalyticsCache();

// Run cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => analyticsCache.cleanup(), 10 * 60 * 1000);
}

