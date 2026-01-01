/**
 * Simple in-memory cache for frequently accessed static data
 * Reduces database queries for immutable reference data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get cached data if it exists and hasn't expired
   */
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

  /**
   * Set data in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Delete specific cache entry
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
   * Get cache statistics
   */
  getStats() {
    return {
      entries: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
export const cache = new SimpleCache();

// ============================================================================
// CACHE KEYS AND HELPERS
// ============================================================================

export const CACHE_KEYS = {
  FLASHCARD_STATS: 'flashcard_stats',
  GENERATION_STATS: 'generation_stats',
  USER_PREFERENCES: (userId: string) => `user_prefs_${userId}`,
} as const;

/**
 * Cache flashcard statistics for a user
 */
export function cacheFlashcardStats(userId: string, stats: { total: number; byStatus: Record<string, number>; bySource: Record<string, number> }) {
  cache.set(`${CACHE_KEYS.FLASHCARD_STATS}_${userId}`, stats, 10 * 60 * 1000); // 10 minutes
}

/**
 * Get cached flashcard statistics for a user
 */
export function getCachedFlashcardStats(userId: string) {
  return cache.get(`${CACHE_KEYS.FLASHCARD_STATS}_${userId}`);
}

/**
 * Cache generation statistics for a user
 */
export function cacheGenerationStats(userId: string, stats: { total: number; avgDuration: number; successRate: number }) {
  cache.set(`${CACHE_KEYS.GENERATION_STATS}_${userId}`, stats, 15 * 60 * 1000); // 15 minutes
}

/**
 * Get cached generation statistics for a user
 */
export function getCachedGenerationStats(userId: string) {
  return cache.get(`${CACHE_KEYS.GENERATION_STATS}_${userId}`);
}

/**
 * Invalidate all user caches (useful after data changes)
 */
export function invalidateUserCache(userId: string) {
  cache.delete(`${CACHE_KEYS.FLASHCARD_STATS}_${userId}`);
  cache.delete(`${CACHE_KEYS.GENERATION_STATS}_${userId}`);
  cache.delete(CACHE_KEYS.USER_PREFERENCES(userId));
}