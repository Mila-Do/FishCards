/**
 * OpenRouter Service - Type-safe communication with OpenRouter API
 *
 * Provides chat completions with support for structured outputs (JSON Schema),
 * system messages, and model parameters with comprehensive error handling.
 */

import type {
  ChatMessage,
  JSONSchema,
  OpenRouterConfig,
  ChatCompletionRequest,
  ResponseFormat,
  OpenRouterRequestBody,
  OpenRouterResponse,
} from "../../types.js";
import { TokenBucketRateLimiter, OpenRouterRateLimiters } from "./openrouter.rate-limiter.js";
import { OpenRouterLogger } from "./openrouter.logger.js";

// ============================================================================
// Custom Error Classes
// ============================================================================

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public apiResponse?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export class ValidationError extends OpenRouterError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends OpenRouterError {
  constructor(message: string, retryAfter?: number) {
    super(message, 429);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
  retryAfter?: number;
}

export class ModelNotSupportedError extends OpenRouterError {
  constructor(message: string, model: string) {
    super(message, 400);
    this.name = "ModelNotSupportedError";
    this.model = model;
  }
  model: string;
}

// ============================================================================
// OpenRouter Service Implementation
// ============================================================================

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly defaultModel: string;
  private readonly timeout: number;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // Base delay in ms
  private readonly rateLimiter: TokenBucketRateLimiter;
  private readonly logger: OpenRouterLogger;

  constructor(
    config: OpenRouterConfig & {
      rateLimiter?: TokenBucketRateLimiter;
      logger?: OpenRouterLogger;
    }
  ) {
    // Validation
    if (!config.apiKey) {
      throw new ValidationError("API key is required");
    }

    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || "https://openrouter.ai/api/v1";
    this.defaultModel = config.defaultModel || "gpt-3.5-turbo";
    this.timeout = config.timeout || 30000; // 30 seconds

    // Initialize rate limiter and logger
    this.rateLimiter = config.rateLimiter || this.getDefaultRateLimiter();
    this.logger = config.logger || new OpenRouterLogger();

    this.logger.info("OpenRouter service initialized", {
      baseURL: this.baseURL,
      defaultModel: this.defaultModel,
      timeout: this.timeout,
    });
  }

  private getDefaultRateLimiter(): TokenBucketRateLimiter {
    const isDevelopment = import.meta.env.MODE === "development";
    return isDevelopment ? OpenRouterRateLimiters.DEVELOPMENT : OpenRouterRateLimiters.CONSERVATIVE;
  }

  // ============================================================================
  // Public API Methods
  // ============================================================================

  /**
   * Main chat completion method with type-safe structured outputs
   */
  async chatCompletion<T = unknown>(
    request: ChatCompletionRequest & {
      userId?: string;
      requestId?: string;
    }
  ): Promise<T> {
    const requestId = request.requestId || this.generateRequestId();
    const startTime = Date.now();
    const model = request.model || this.defaultModel;

    try {
      // Input validation
      if (!request.messages || request.messages.length === 0) {
        throw new ValidationError("Messages array cannot be empty");
      }

      // Validate messages structure
      for (const message of request.messages) {
        if (!message.role || !message.content) {
          throw new ValidationError("Each message must have role and content");
        }
        if (!["system", "user", "assistant"].includes(message.role)) {
          throw new ValidationError(`Invalid message role: ${message.role}`);
        }
      }

      // Validate JSON schema if provided
      if (request.responseSchema && !this.validateSchema(request.responseSchema)) {
        throw new ValidationError("Invalid JSON schema provided");
      }

      // Log request start
      this.logger.logRequestStart({
        requestId,
        model,
        operation: "chatCompletion",
        messageCount: request.messages.length,
        hasSchema: !!request.responseSchema,
        userId: request.userId,
      });

      // Rate limiting
      await this.rateLimiter.acquire(1);

      const requestBody = this.buildRequest(request);
      const response = await this.executeRequest(requestBody, requestId);
      const result = this.parseResponse<T>(response, request.responseSchema);

      // Log success
      this.logger.logRequestSuccess({
        requestId,
        model,
        operation: "chatCompletion",
        duration: Date.now() - startTime,
        tokensUsed: response.usage?.total_tokens,
        userId: request.userId,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error with appropriate context
      if (error instanceof OpenRouterError) {
        this.logger.logRequestError({
          requestId,
          model,
          operation: "chatCompletion",
          duration,
          errorType: error.name,
          statusCode: error.statusCode,
          userId: request.userId,
        });
      } else {
        this.logger.logRequestError({
          requestId,
          model,
          operation: "chatCompletion",
          duration,
          errorType: "UnknownError",
          userId: request.userId,
        });
      }

      throw error;
    }
  }

  /**
   * Create a system message
   */
  createSystemMessage(content: string): ChatMessage {
    if (!content.trim()) {
      throw new ValidationError("System message content cannot be empty");
    }
    return {
      role: "system",
      content: content.trim(),
    };
  }

  /**
   * Create a user message
   */
  createUserMessage(content: string): ChatMessage {
    if (!content.trim()) {
      throw new ValidationError("User message content cannot be empty");
    }
    return {
      role: "user",
      content: content.trim(),
    };
  }

  /**
   * Validate JSON schema structure
   */
  validateSchema(schema: JSONSchema): boolean {
    if (!schema || typeof schema !== "object") {
      return false;
    }

    // Basic schema validation - must have type
    if (!schema.type || typeof schema.type !== "string") {
      return false;
    }

    // Additional validation for object types
    if (schema.type === "object") {
      if (schema.properties && typeof schema.properties !== "object") {
        return false;
      }
      if (schema.required && !Array.isArray(schema.required)) {
        return false;
      }
    }

    // Additional validation for array types
    if (schema.type === "array") {
      if (schema.items && !this.validateSchema(schema.items)) {
        return false;
      }
    }

    return true;
  }

  // ============================================================================
  // Public Rate Limiting and Monitoring Methods
  // ============================================================================

  /**
   * Get current rate limiting status
   */
  getRateLimitStatus(): {
    availableTokens: number;
    timeUntilNextToken: number;
    canMakeRequest: boolean;
  } {
    return {
      availableTokens: this.rateLimiter.getAvailableTokens(),
      timeUntilNextToken: this.rateLimiter.getTimeUntilNextToken(),
      canMakeRequest: this.rateLimiter.canAcquire(1),
    };
  }

  /**
   * Update rate limiter configuration
   */
  updateRateLimitConfig(config: {
    capacity?: number;
    refillRate?: number;
    refillIntervalMs?: number;
    maxWaitTimeMs?: number;
  }): void {
    this.rateLimiter.updateConfig(config);
    this.logger.logConfigChange({
      property: "rateLimiter",
      newValue: config,
    });
  }

  /**
   * Reset rate limiter (useful for testing or after long periods of inactivity)
   */
  resetRateLimit(): void {
    this.rateLimiter.reset();
    this.logger.info("Rate limiter reset");
  }

  /**
   * Generate a unique request ID for tracking
   */
  private generateRequestId(): string {
    return `or_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Build OpenRouter API request body
   */
  private buildRequest(request: ChatCompletionRequest): OpenRouterRequestBody {
    const requestBody: OpenRouterRequestBody = {
      model: request.model || this.defaultModel,
      messages: request.messages,
    };

    // Add model parameters if provided
    if (request.modelParams) {
      const params = request.modelParams;
      if (params.temperature !== undefined) requestBody.temperature = params.temperature;
      if (params.max_tokens !== undefined) requestBody.max_tokens = params.max_tokens;
      if (params.top_p !== undefined) requestBody.top_p = params.top_p;
      if (params.frequency_penalty !== undefined) requestBody.frequency_penalty = params.frequency_penalty;
      if (params.presence_penalty !== undefined) requestBody.presence_penalty = params.presence_penalty;
      if (params.seed !== undefined) requestBody.seed = params.seed;
    }

    // Add response format for structured outputs
    if (request.responseSchema) {
      requestBody.response_format = this.buildResponseFormat(request.responseSchema);
    }

    return requestBody;
  }

  /**
   * Build response format for structured outputs
   */
  private buildResponseFormat(schema: JSONSchema): ResponseFormat {
    return {
      type: "json_schema",
      json_schema: {
        name: "structured_response",
        strict: true,
        schema,
      },
    };
  }

  /**
   * Execute HTTP request with retry logic and enhanced error handling
   */
  private async executeRequest(requestBody: OpenRouterRequestBody, requestId: string): Promise<OpenRouterResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Check rate limiting before each attempt
        if (!this.rateLimiter.canAcquire(1)) {
          const waitTime = this.rateLimiter.getTimeUntilNextToken();
          this.logger.logRateLimit({
            requestId,
            waitTime,
            tokensAvailable: this.rateLimiter.getAvailableTokens(),
          });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        this.logger.debug("Executing HTTP request", {
          requestId,
          attempt: attempt + 1,
          model: requestBody.model,
          timeout: this.timeout,
        });

        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
            "HTTP-Referer": process.env.SITE_URL || "http://localhost:4321",
            "X-Title": "Flashcard Generator",
            "X-Request-ID": requestId,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          await this.handleError(response.status, errorData, requestBody.model, requestId, attempt);
        }

        const result = await response.json();
        this.logger.debug("HTTP request completed successfully", {
          requestId,
          attempt: attempt + 1,
          statusCode: response.status,
        });

        return result as OpenRouterResponse;
      } catch (error) {
        lastError = error as Error;

        this.logger.debug("HTTP request failed", {
          requestId,
          attempt: attempt + 1,
          errorType: (error as Error).name,
          errorMessage: (error as Error).message,
        });

        // Don't retry on validation errors or non-retryable errors
        if (
          error instanceof ValidationError ||
          error instanceof ModelNotSupportedError ||
          (error as Error).name === "AbortError"
        ) {
          throw error;
        }

        // Handle rate limiting errors specially
        if (error instanceof RateLimitError) {
          if (error.retryAfter) {
            this.logger.logRateLimit({
              requestId,
              waitTime: error.retryAfter * 1000,
              tokensAvailable: this.rateLimiter.getAvailableTokens(),
              retryAfter: error.retryAfter,
            });

            // For server-side rate limiting, wait the specified time
            if (attempt < this.maxRetries - 1) {
              await new Promise((resolve) => setTimeout(resolve, (error.retryAfter || 60) * 1000));
              continue;
            }
          }
          throw error;
        }

        // Exponential backoff for retryable errors
        if (attempt < this.maxRetries - 1) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          this.logger.debug("Retrying request after delay", {
            requestId,
            attempt: attempt + 1,
            delay,
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new OpenRouterError(
      `Failed to complete request after ${this.maxRetries} attempts: ${lastError?.message}`,
      500,
      lastError
    );
  }

  /**
   * Parse and validate API response
   */
  private parseResponse<T>(response: OpenRouterResponse, schema?: JSONSchema): T {
    if (!response.choices || response.choices.length === 0) {
      throw new OpenRouterError("Invalid response: no choices returned");
    }

    const choice = response.choices[0];
    if (!choice.message || !choice.message.content) {
      throw new OpenRouterError("Invalid response: no content in message");
    }

    const content = choice.message.content;

    // If no schema provided, return content as-is
    if (!schema) {
      return content as T;
    }

    // Parse JSON response for structured outputs
    try {
      const parsed = JSON.parse(content);

      // Basic validation against schema could be added here
      // For now, we trust OpenRouter's structured output validation

      return parsed as T;
    } catch (error) {
      throw new OpenRouterError(`Failed to parse structured response: ${(error as Error).message}`, 500, {
        content,
        schema,
      });
    }
  }

  /**
   * Handle API errors with appropriate error types and enhanced logging
   */
  private async handleError(
    status: number,
    errorData: Record<string, unknown>,
    model: string,
    requestId?: string,
    attempt?: number
  ): Promise<never> {
    const message =
      (errorData.error as { message?: string })?.message || (errorData.message as string) || "Unknown API error";

    // Log the error with context
    if (requestId) {
      this.logger.error("OpenRouter API error", {
        requestId,
        statusCode: status,
        errorMessage: message,
        model,
        attempt: attempt !== undefined ? attempt + 1 : undefined,
      });
    }

    switch (status) {
      case 401:
        throw new OpenRouterError("Invalid API key", status, errorData);

      case 429: {
        const retryAfter = (errorData.error as { retry_after?: number })?.retry_after || 60;
        throw new RateLimitError(`Rate limit exceeded. Retry after ${retryAfter} seconds`, retryAfter);
      }

      case 400:
        if (message.toLowerCase().includes("schema") || message.toLowerCase().includes("json")) {
          throw new ValidationError(`JSON Schema error: ${message}`);
        }
        if (message.toLowerCase().includes("model") || message.toLowerCase().includes("support")) {
          throw new ModelNotSupportedError(`Model not supported: ${message}`, model);
        }
        throw new ValidationError(`Validation error: ${message}`);

      case 404:
        throw new ModelNotSupportedError(`Model not found: ${model}`, model);

      default:
        throw new OpenRouterError(`API error (${status}): ${message}`, status, errorData);
    }
  }
}
