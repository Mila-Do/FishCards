/**
 * Response helper utilities for API endpoints
 *
 * Provides standardized response formatting and error handling across all API endpoints.
 */

import type { ErrorResponse, ErrorCode } from "../types";

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

/**
 * Log API request/response for monitoring
 */
function logApiEvent(
  method: string,
  endpoint: string,
  status: number,
  userId?: string,
  duration?: number,
  error?: string
) {
  const timestamp = new Date().toISOString();
  const logLevel = status >= 500 ? "ERROR" : status >= 400 ? "WARN" : "INFO";

  console.log(
    `[${timestamp}] ${logLevel} ${method} ${endpoint} ${status} ${userId ? `user:${userId}` : ""} ${duration ? `${duration}ms` : ""} ${error ? `error:${error}` : ""}`
  );
}

// ============================================================================
// RESPONSE HELPERS WITH LOGGING
// ============================================================================

/**
 * Creates a standardized JSON response with proper headers
 */
export function jsonResponse(
  body: unknown,
  options: { status: number },
  logContext?: { method: string; endpoint: string; userId?: string; duration?: number }
) {
  // Log successful response
  if (logContext) {
    logApiEvent(logContext.method, logContext.endpoint, options.status, logContext.userId, logContext.duration);
  }

  return new Response(JSON.stringify(body), {
    status: options.status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Creates a standardized error response
 */
export function errorResponse(
  status: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
  logContext?: { method: string; endpoint: string; userId?: string; duration?: number }
): Response {
  // Log error response
  if (logContext) {
    logApiEvent(logContext.method, logContext.endpoint, status, logContext.userId, logContext.duration, code);
  }

  const payload: ErrorResponse = {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  return jsonResponse(payload, { status });
}
