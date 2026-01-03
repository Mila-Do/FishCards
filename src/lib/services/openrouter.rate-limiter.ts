/**
 * Token Bucket Rate Limiter for OpenRouter API
 *
 * Implements client-side rate limiting to prevent exceeding API limits
 * and provide smooth request distribution over time.
 */

export interface RateLimiterConfig {
  /** Maximum number of tokens in the bucket */
  capacity: number;
  /** Number of tokens added per refill interval */
  refillRate: number;
  /** Refill interval in milliseconds */
  refillIntervalMs: number;
  /** Maximum time to wait for a token in milliseconds */
  maxWaitTimeMs?: number;
}

export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefillTime: number;
  private readonly config: Required<RateLimiterConfig>;

  constructor(config: RateLimiterConfig) {
    this.config = {
      ...config,
      maxWaitTimeMs: config.maxWaitTimeMs || 30000, // 30 seconds default
    };

    this.tokens = this.config.capacity;
    this.lastRefillTime = Date.now();
  }

  /**
   * Attempt to acquire a token from the bucket
   * @param tokensRequired Number of tokens required (default: 1)
   * @returns Promise that resolves when token is acquired or rejects on timeout
   */
  async acquire(tokensRequired = 1): Promise<void> {
    const startTime = Date.now();

    while (true) {
      this.refillTokens();

      if (this.tokens >= tokensRequired) {
        this.tokens -= tokensRequired;
        return;
      }

      // Check timeout
      if (Date.now() - startTime > this.config.maxWaitTimeMs) {
        throw new Error(
          `Rate limiter timeout: Could not acquire ${tokensRequired} tokens within ${this.config.maxWaitTimeMs}ms`
        );
      }

      // Wait for next refill cycle
      const timeUntilNextRefill = this.config.refillIntervalMs - (Date.now() - this.lastRefillTime);
      const waitTime = Math.max(100, Math.min(timeUntilNextRefill, 1000)); // Wait 100ms to 1s

      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Check if tokens are available without acquiring them
   */
  canAcquire(tokensRequired = 1): boolean {
    this.refillTokens();
    return this.tokens >= tokensRequired;
  }

  /**
   * Get current number of available tokens
   */
  getAvailableTokens(): number {
    this.refillTokens();
    return Math.floor(this.tokens);
  }

  /**
   * Get time until next token is available (in milliseconds)
   */
  getTimeUntilNextToken(): number {
    this.refillTokens();

    if (this.tokens >= 1) {
      return 0;
    }

    const timeSinceLastRefill = Date.now() - this.lastRefillTime;
    return Math.max(0, this.config.refillIntervalMs - timeSinceLastRefill);
  }

  /**
   * Reset the rate limiter (useful for testing)
   */
  reset(): void {
    this.tokens = this.config.capacity;
    this.lastRefillTime = Date.now();
  }

  /**
   * Update rate limiter configuration
   */
  updateConfig(newConfig: Partial<RateLimiterConfig>): void {
    Object.assign(this.config, newConfig);

    // Ensure tokens don't exceed new capacity
    if (newConfig.capacity !== undefined) {
      this.tokens = Math.min(this.tokens, newConfig.capacity);
    }
  }

  private refillTokens(): void {
    const now = Date.now();
    const timeSinceLastRefill = now - this.lastRefillTime;

    if (timeSinceLastRefill >= this.config.refillIntervalMs) {
      const refillCycles = Math.floor(timeSinceLastRefill / this.config.refillIntervalMs);
      const tokensToAdd = refillCycles * this.config.refillRate;

      this.tokens = Math.min(this.config.capacity, this.tokens + tokensToAdd);
      this.lastRefillTime += refillCycles * this.config.refillIntervalMs;
    }
  }
}

/**
 * Pre-configured rate limiters for different OpenRouter usage patterns
 */
export const OpenRouterRateLimiters = {
  /** Conservative rate limiter for production use */
  CONSERVATIVE: new TokenBucketRateLimiter({
    capacity: 10, // 10 requests buffer
    refillRate: 1, // 1 request per interval
    refillIntervalMs: 1000, // Every 1 second
    maxWaitTimeMs: 30000, // Wait up to 30 seconds
  }),

  /** Aggressive rate limiter for high-throughput scenarios */
  AGGRESSIVE: new TokenBucketRateLimiter({
    capacity: 20, // 20 requests buffer
    refillRate: 5, // 5 requests per interval
    refillIntervalMs: 1000, // Every 1 second
    maxWaitTimeMs: 15000, // Wait up to 15 seconds
  }),

  /** Development rate limiter (more permissive) */
  DEVELOPMENT: new TokenBucketRateLimiter({
    capacity: 50, // 50 requests buffer
    refillRate: 10, // 10 requests per interval
    refillIntervalMs: 1000, // Every 1 second
    maxWaitTimeMs: 10000, // Wait up to 10 seconds
  }),
} as const;
