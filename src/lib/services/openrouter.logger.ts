/**
 * Structured Logger for OpenRouter Service
 *
 * Provides secure logging without exposing sensitive information
 * such as API keys, user data, or detailed error responses.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  userId?: string;
  model?: string;
  operation?: string;
  duration?: number;
  tokensUsed?: number;
  retryAttempt?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  service: "openrouter";
}

export class OpenRouterLogger {
  private readonly isDevelopment: boolean;
  private readonly logLevel: LogLevel;

  constructor(options: { logLevel?: LogLevel; isDevelopment?: boolean } = {}) {
    this.isDevelopment = options.isDevelopment ?? import.meta.env.MODE === "development";
    this.logLevel = options.logLevel ?? (this.isDevelopment ? "debug" : "info");
  }

  debug(message: string, context: LogContext = {}): void {
    if (this.shouldLog("debug")) {
      this.writeLog("debug", message, context);
    }
  }

  info(message: string, context: LogContext = {}): void {
    if (this.shouldLog("info")) {
      this.writeLog("info", message, context);
    }
  }

  warn(message: string, context: LogContext = {}): void {
    if (this.shouldLog("warn")) {
      this.writeLog("warn", message, context);
    }
  }

  error(message: string, context: LogContext = {}): void {
    if (this.shouldLog("error")) {
      this.writeLog("error", message, context);
    }
  }

  /**
   * Log request start with sanitized context
   */
  logRequestStart(context: {
    requestId: string;
    model: string;
    operation: string;
    messageCount: number;
    hasSchema: boolean;
    userId?: string;
  }): void {
    this.info("OpenRouter request started", {
      requestId: context.requestId,
      model: context.model,
      operation: context.operation,
      messageCount: context.messageCount,
      hasSchema: context.hasSchema,
      userId: this.sanitizeUserId(context.userId),
    });
  }

  /**
   * Log successful request completion
   */
  logRequestSuccess(context: {
    requestId: string;
    model: string;
    operation: string;
    duration: number;
    tokensUsed?: number;
    userId?: string;
  }): void {
    this.info("OpenRouter request completed", {
      requestId: context.requestId,
      model: context.model,
      operation: context.operation,
      duration: context.duration,
      tokensUsed: context.tokensUsed,
      userId: this.sanitizeUserId(context.userId),
    });
  }

  /**
   * Log request error with sanitized error information
   */
  logRequestError(context: {
    requestId: string;
    model: string;
    operation: string;
    duration: number;
    errorType: string;
    errorCode?: string;
    statusCode?: number;
    retryAttempt?: number;
    userId?: string;
  }): void {
    this.error("OpenRouter request failed", {
      requestId: context.requestId,
      model: context.model,
      operation: context.operation,
      duration: context.duration,
      errorType: context.errorType,
      errorCode: context.errorCode,
      statusCode: context.statusCode,
      retryAttempt: context.retryAttempt,
      userId: this.sanitizeUserId(context.userId),
    });
  }

  /**
   * Log rate limiting events
   */
  logRateLimit(context: { requestId: string; waitTime: number; tokensAvailable: number; retryAfter?: number }): void {
    this.warn("Rate limit encountered", {
      requestId: context.requestId,
      waitTime: context.waitTime,
      tokensAvailable: context.tokensAvailable,
      retryAfter: context.retryAfter,
    });
  }

  /**
   * Log configuration changes
   */
  logConfigChange(context: { property: string; oldValue?: unknown; newValue: unknown }): void {
    this.info("OpenRouter configuration changed", {
      property: context.property,
      // Don't log actual values for sensitive properties
      oldValue: this.isSensitiveProperty(context.property) ? "[REDACTED]" : context.oldValue,
      newValue: this.isSensitiveProperty(context.property) ? "[REDACTED]" : context.newValue,
    });
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private writeLog(level: LogLevel, message: string, context: LogContext): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitizeContext(context),
      service: "openrouter",
    };

    // In development, use console with nice formatting
    if (this.isDevelopment) {
      this.consoleLog(entry);
    } else {
      // In production, log as JSON for structured logging systems
      this.structuredLog(entry);
    }
  }

  private consoleLog(entry: LogEntry): void {
    const colorMap = {
      debug: "\x1b[36m", // Cyan
      info: "\x1b[32m", // Green
      warn: "\x1b[33m", // Yellow
      error: "\x1b[31m", // Red
    };
    const reset = "\x1b[0m";
    const color = colorMap[entry.level] || "";

    console.log(
      `${color}[${entry.timestamp}] ${entry.level.toUpperCase()} [${entry.service}]${reset} ${entry.message}`,
      entry.context
    );
  }

  private structuredLog(entry: LogEntry): void {
    // For production environments, this could be sent to logging services like:
    // - CloudWatch Logs
    // - DataDog
    // - LogDNA
    // - Elasticsearch
    console.log(JSON.stringify(entry));
  }

  private sanitizeContext(context: LogContext): LogContext {
    const sanitized: LogContext = {};

    for (const [key, value] of Object.entries(context)) {
      if (this.isSensitiveProperty(key)) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "string" && value.length > 500) {
        // Truncate long strings to prevent log bloat
        sanitized[key] = value.substring(0, 500) + "...";
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private sanitizeUserId(userId?: string): string | undefined {
    if (!userId) return undefined;

    // In development, show full user ID
    if (this.isDevelopment) {
      return userId;
    }

    // In production, show only partial user ID for privacy
    if (userId.length <= 8) {
      return "user-***";
    }

    return `${userId.substring(0, 4)}***${userId.substring(userId.length - 4)}`;
  }

  private isSensitiveProperty(property: string): boolean {
    const sensitiveProperties = [
      "apikey",
      "api_key",
      "token",
      "password",
      "secret",
      "authorization",
      "bearer",
      "content", // Message content might be sensitive
      "messages", // Array of messages
      "sourcetext",
      "source_text",
    ];

    return sensitiveProperties.some((sensitive) => property.toLowerCase().includes(sensitive));
  }
}
