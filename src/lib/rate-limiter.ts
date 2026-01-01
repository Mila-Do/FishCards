/**
 * Simple in-memory rate limiter for API endpoints
 * Uses sliding window algorithm to track requests per time window
 */

interface RateLimitEntry {
  requests: number[];
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private readonly defaultWindowMs = 60 * 1000; // 1 minute
  private readonly defaultMaxRequests = 30; // 30 requests per minute

  /**
   * Check if request is allowed for given identifier
   */
  isAllowed(
    identifier: string,
    maxRequests: number = this.defaultMaxRequests,
    windowMs: number = this.defaultWindowMs
  ): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    let entry = this.limits.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired window
      entry = {
        requests: [now],
        resetTime: now + windowMs
      };
      this.limits.set(identifier, entry);
      return true;
    }

    // Clean old requests outside the current window
    entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);

    if (entry.requests.length >= maxRequests) {
      return false;
    }

    // Add current request
    entry.requests.push(now);
    return true;
  }

  /**
   * Get remaining requests for identifier
   */
  getRemainingRequests(
    identifier: string,
    maxRequests: number = this.defaultMaxRequests,
    windowMs: number = this.defaultWindowMs
  ): number {
    const entry = this.limits.get(identifier);
    if (!entry) return maxRequests;

    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);

    return Math.max(0, maxRequests - entry.requests.length);
  }

  /**
   * Get time until reset for identifier (in milliseconds)
   */
  getResetTime(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry) return 0;

    const now = Date.now();
    return Math.max(0, entry.resetTime - now);
  }

  /**
   * Clean up expired entries (optional maintenance)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Get rate limit statistics
   */
  getStats() {
    return {
      activeLimits: this.limits.size,
      identifiers: Array.from(this.limits.keys())
    };
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// ============================================================================
// RATE LIMIT CONFIGURATIONS
// ============================================================================

export const RATE_LIMITS = {
  // General API endpoints - moderate limits
  GENERAL_API: {
    maxRequests: 60, // 60 requests per minute
    windowMs: 60 * 1000
  },

  // Write operations (POST, PATCH, DELETE) - stricter limits
  WRITE_OPERATIONS: {
    maxRequests: 30, // 30 requests per minute
    windowMs: 60 * 1000
  },

  // AI generation endpoints - strictest limits due to cost
  AI_GENERATION: {
    maxRequests: 10, // 10 requests per minute
    windowMs: 60 * 1000
  },

  // Batch operations - moderate limits
  BATCH_OPERATIONS: {
    maxRequests: 20, // 20 requests per minute
    windowMs: 60 * 1000
  }
} as const;

/**
 * Create rate limit identifier for user and endpoint
 */
export function createRateLimitKey(userId: string, endpoint: string, method: string): string {
  return `${userId}:${method}:${endpoint}`;
}

/**
 * Check rate limit for API request
 */
export function checkRateLimit(
  userId: string,
  endpoint: string,
  method: string,
  config = RATE_LIMITS.GENERAL_API
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = createRateLimitKey(userId, endpoint, method);
  const allowed = rateLimiter.isAllowed(key, config.maxRequests, config.windowMs);
  const remaining = rateLimiter.getRemainingRequests(key, config.maxRequests, config.windowMs);
  const resetTime = rateLimiter.getResetTime(key);

  return { allowed, remaining, resetTime };
}

/**
 * Get rate limit config based on endpoint and method
 */
export function getRateLimitConfig(endpoint: string, method: string) {
  // AI generation endpoints
  if (endpoint.includes('/generations') && method === 'POST') {
    return RATE_LIMITS.AI_GENERATION;
  }

  // Write operations
  if (['POST', 'PATCH', 'DELETE'].includes(method)) {
    // Batch operations (array payloads)
    if (endpoint.includes('/flashcards') && method === 'POST') {
      return RATE_LIMITS.BATCH_OPERATIONS;
    }
    return RATE_LIMITS.WRITE_OPERATIONS;
  }

  // Default for read operations
  return RATE_LIMITS.GENERAL_API;
}