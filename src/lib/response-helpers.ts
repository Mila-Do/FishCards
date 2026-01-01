/**
 * Response helper utilities for API endpoints
 *
 * Provides standardized response formatting and error handling across all API endpoints.
 */

import type { ErrorResponse, ErrorCode } from "../types";

/**
 * Creates a standardized JSON response with proper headers
 */
export function jsonResponse(body: unknown, options: { status: number }) {
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
  details?: Record<string, unknown>
): Response {
  const payload: ErrorResponse = {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  return jsonResponse(payload, { status });
}
