/**
 * Unified API client with error handling, retry logic, and type safety
 * Abstracts fetch calls and provides consistent error handling across the app
 */

import type { ApiResult, ApiError } from "./types/common";
import { HTTP_STATUS } from "./types/common";

// ============================================================================
// Types
// ============================================================================

interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

interface RequestConfig extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeout?: number;
  retries?: number;
}

// ============================================================================
// Error Classes
// ============================================================================

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export class NetworkError extends ApiClientError {
  constructor(message = "Network error occurred") {
    super(message);
    this.name = "NetworkError";
  }
}

export class TimeoutError extends ApiClientError {
  constructor(message = "Request timeout") {
    super(message);
    this.name = "TimeoutError";
  }
}

export class ValidationError extends ApiClientError {
  constructor(message: string, details?: unknown) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

// ============================================================================
// API Client Class
// ============================================================================

export class ApiClient {
  private config: Required<ApiClientConfig>;

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseURL: config.baseURL || "",
      timeout: config.timeout || 60000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
    };
  }

  /**
   * Makes HTTP request with retry logic and proper error handling
   */
  protected async makeRequest<T>(url: string, config: RequestConfig = {}): Promise<ApiResult<T>> {
    const { timeout = this.config.timeout, retries = this.config.retries, body, ...fetchConfig } = config;

    const fullUrl = url.startsWith("http") ? url : `${this.config.baseURL}${url}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // Prepare fetch options
        const fetchOptions: RequestInit = {
          ...fetchConfig,
          headers: {
            ...this.config.headers,
            ...fetchConfig.headers,
          },
          signal: controller.signal,
        };

        // Add body if provided
        if (body !== undefined) {
          fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
        }

        // Make the request
        const response = await fetch(fullUrl, fetchOptions);
        clearTimeout(timeoutId);

        // Handle response
        return await this.handleResponse<T>(response);
      } catch (error) {
        // Handle different error types
        if (error instanceof ApiClientError) {
          return { success: false, error: error.message, details: error.details };
        }

        if (error instanceof DOMException && error.name === "AbortError") {
          if (attempt === retries) {
            return {
              success: false,
              error: "Request timeout",
              details: { timeout, attempts: attempt + 1 },
            };
          }
        } else if (attempt === retries) {
          // Network or other error on final attempt
          const message = error instanceof Error ? error.message : "Unknown error occurred";
          return {
            success: false,
            error: message,
            details: { attempts: attempt + 1 },
          };
        }

        // Wait before retry
        if (attempt < retries) {
          await this.sleep(this.config.retryDelay * (attempt + 1));
        }
      }
    }

    // This should never be reached, but TypeScript requires it
    return {
      success: false,
      error: "Unexpected error: maximum retries exceeded",
    };
  }

  /**
   * Handles response parsing and error detection
   */
  private async handleResponse<T>(response: Response): Promise<ApiResult<T>> {
    try {
      // Handle successful responses
      if (response.ok) {
        // Handle empty responses (204 No Content)
        if (response.status === HTTP_STATUS.NO_CONTENT) {
          return { success: true, data: null as T };
        }

        // Try to parse JSON
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const data = await response.json();
          return { success: true, data };
        }

        // Return response text for non-JSON responses
        const text = await response.text();
        return { success: true, data: text as T };
      }

      // Handle error responses
      let errorData: ApiError | string;

      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }

      const errorMessage =
        typeof errorData === "object" ? errorData.message || "An error occurred" : errorData || response.statusText;

      return {
        success: false,
        error: errorMessage,
        details: {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to parse response";
      return {
        success: false,
        error: message,
        details: { parseError: true },
      };
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================================================
  // HTTP Methods
  // ============================================================================

  async get<T>(url: string, config?: Omit<RequestConfig, "method" | "body">): Promise<ApiResult<T>> {
    return this.makeRequest<T>(url, { ...config, method: "GET" });
  }

  async post<T>(url: string, body?: unknown, config?: Omit<RequestConfig, "method">): Promise<ApiResult<T>> {
    return this.makeRequest<T>(url, { ...config, method: "POST", body });
  }

  async put<T>(url: string, body?: unknown, config?: Omit<RequestConfig, "method">): Promise<ApiResult<T>> {
    return this.makeRequest<T>(url, { ...config, method: "PUT", body });
  }

  async patch<T>(url: string, body?: unknown, config?: Omit<RequestConfig, "method">): Promise<ApiResult<T>> {
    return this.makeRequest<T>(url, { ...config, method: "PATCH", body });
  }

  async delete<T>(url: string, config?: Omit<RequestConfig, "method" | "body">): Promise<ApiResult<T>> {
    return this.makeRequest<T>(url, { ...config, method: "DELETE" });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Updates default headers
   */
  setHeaders(headers: Record<string, string>): void {
    this.config.headers = { ...this.config.headers, ...headers };
  }

  /**
   * Creates a new instance with different config
   */
  withConfig(config: Partial<ApiClientConfig>): ApiClient {
    return new ApiClient({ ...this.config, ...config });
  }
}

// ============================================================================
// Default Client Instance
// ============================================================================

/**
 * Default API client instance
 */
export const apiClient = new ApiClient();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Type-safe API call wrapper
 */
export async function apiCall<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  body?: unknown,
  config?: RequestConfig
): Promise<ApiResult<T>> {
  switch (method) {
    case "GET":
      return apiClient.get<T>(url, config);
    case "POST":
      return apiClient.post<T>(url, body, config);
    case "PUT":
      return apiClient.put<T>(url, body, config);
    case "PATCH":
      return apiClient.patch<T>(url, body, config);
    case "DELETE":
      return apiClient.delete<T>(url, config);
    default:
      return {
        success: false,
        error: `Unsupported HTTP method: ${method}`,
      };
  }
}

/**
 * Utility function to check if API result is successful
 */
export function isApiSuccess<T>(result: ApiResult<T>): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Utility function to extract error from API result
 */
export function getApiError<T>(result: ApiResult<T>): string | null {
  return result.success ? null : result.error;
}
