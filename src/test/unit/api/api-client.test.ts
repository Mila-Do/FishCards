/**
 * Unit tests for API client functionality
 * Tests handleResponse(), utility functions, error classes, and retry logic
 * Coverage target: 85%+ for src/lib/api-client.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  ApiClient,
  isApiSuccess,
  getApiError,
  apiCall,
  apiClient,
  ApiClientError,
  NetworkError,
  TimeoutError,
  ValidationError,
} from "@/lib/api-client";
import { HTTP_STATUS } from "@/lib/types/common";

// ============================================================================
// Mock Utilities
// ============================================================================

/**
 * Create mock Response object for testing handleResponse()
 */
const createMockResponse = (
  status: number,
  body?: unknown,
  contentType = "application/json",
  statusText?: string
): Response => {
  const headers = new Headers();
  if (contentType) {
    headers.set("content-type", contentType);
  }

  let responseBody: string | undefined;
  if (body !== undefined) {
    responseBody = typeof body === "string" ? body : JSON.stringify(body);
  }

  // Create a minimal Response-like object
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: statusText || "",
    headers,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(responseBody || ""),
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: vi.fn(),
    blob: vi.fn(),
    formData: vi.fn(),
  } as unknown as Response;
};

/**
 * Create successful JSON response
 */
const createJsonResponse = (status: number, data: unknown): Response => {
  return createMockResponse(status, data, "application/json");
};

/**
 * Create error JSON response
 */
const createErrorResponse = (status: number, error: string, details?: Record<string, unknown>): Response => {
  const body = details ? { message: error, ...details } : { message: error };
  return createMockResponse(status, body, "application/json");
};

/**
 * Create text response
 */
const createTextResponse = (status: number, text: string): Response => {
  return createMockResponse(status, text, "text/plain");
};

/**
 * Create empty response (No Content)
 */
const createEmptyResponse = (status = 204): Response => {
  return createMockResponse(status, undefined, "");
};

// ============================================================================
// Test Suite Structure
// ============================================================================

describe("ApiClient", () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient();
    vi.clearAllMocks();
  });

  // ============================================================================
  // handleResponse() - 25 test cases (PRIORYTET KRYTYCZNY)
  // ============================================================================

  describe("handleResponse()", () => {
    describe("Successful responses (2xx)", () => {
      it("should handle 200 JSON response", async () => {
        // TC-API-001: 200 + JSON data → {success: true, data: parsed}
        const mockResponse = createJsonResponse(200, { data: "test", id: 123 });
        const result = await client["handleResponse"](mockResponse);

        expect(result.success).toBe(true);
        expect(result).toEqual({
          success: true,
          data: { data: "test", id: 123 },
        });
        if (result.success) {
          expect(result.data).toEqual({ data: "test", id: 123 });
        }
      });

      it("should handle 201 JSON response", async () => {
        // TC-API-002: 201 + JSON data → {success: true, data: parsed}
        const mockResponse = createJsonResponse(201, { message: "Created", id: 456 });
        const result = await client["handleResponse"](mockResponse);

        expect(result.success).toBe(true);
        expect(result).toEqual({
          success: true,
          data: { message: "Created", id: 456 },
        });
        if (result.success) {
          expect(result.data).toEqual({ message: "Created", id: 456 });
        }
      });

      it("should handle 204 No Content response", async () => {
        // TC-API-003: 204 No Content → {success: true, data: null}
        const mockResponse = createEmptyResponse(204);
        const result = await client["handleResponse"](mockResponse);

        expect(result.success).toBe(true);
        expect(result).toEqual({
          success: true,
          data: null,
        });
        if (result.success) {
          expect(result.data).toBeNull();
        }
      });

      it("should handle 200 text/plain response", async () => {
        // TC-API-004: 200 + text/plain → {success: true, data: string}
        const mockResponse = createTextResponse(200, "Plain text response");
        const result = await client["handleResponse"](mockResponse);

        expect(result.success).toBe(true);
        expect(result).toEqual({
          success: true,
          data: "Plain text response",
        });
        if (result.success) {
          expect(result.data).toBe("Plain text response");
        }
      });
    });

    describe("Error responses (4xx/5xx)", () => {
      it("should handle 400 JSON error response", async () => {
        // TC-API-005: 400 + JSON error → {success: false, error: message}
        const mockResponse = createErrorResponse(400, "Bad Request", { code: "VALIDATION_ERROR" });
        const result = await client["handleResponse"](mockResponse);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Bad Request");
          expect(result.details).toEqual({
            status: 400,
            statusText: "",
            data: { message: "Bad Request", code: "VALIDATION_ERROR" },
          });
        }
      });

      it("should handle 401 JSON error response", async () => {
        // TC-API-006: 401 + JSON error → {success: false, error: message}
        const mockResponse = createErrorResponse(401, "Unauthorized", { code: "AUTH_REQUIRED" });
        const result = await client["handleResponse"](mockResponse);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Unauthorized");
          expect(result.details).toEqual({
            status: 401,
            statusText: "",
            data: { message: "Unauthorized", code: "AUTH_REQUIRED" },
          });
        }
      });

      it("should handle 404 empty body error response", async () => {
        // TC-API-007: 404 + empty body → {success: false, error: statusText}
        const mockResponse = createMockResponse(404, undefined, "", "Not Found");
        mockResponse.json = vi.fn().mockRejectedValue(new Error("Invalid JSON"));
        mockResponse.text = vi.fn().mockResolvedValue(""); // Empty body
        const result = await client["handleResponse"](mockResponse);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Not Found");
          expect(result.details).toEqual({
            status: 404,
            statusText: "Not Found",
            data: "",
          });
        }
      });

      it("should handle 500 malformed JSON error response", async () => {
        // TC-API-008: 500 + malformed JSON → {success: false, error: text fallback}
        const mockResponse = createMockResponse(500, "Internal Server Error", "text/plain", "Internal Server Error");
        mockResponse.json = vi.fn().mockRejectedValue(new Error("Invalid JSON"));
        mockResponse.text = vi.fn().mockResolvedValue("Internal Server Error");
        const result = await client["handleResponse"](mockResponse);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Internal Server Error");
          expect(result.details).toEqual({
            status: 500,
            statusText: "Internal Server Error",
            data: "Internal Server Error",
          });
        }
      });
    });

    describe("Edge cases", () => {
      it("should handle Response.json() throwing error", async () => {
        // TC-API-009: Response.json() throws → {success: false, details: {parseError: true}}
        const mockResponse = createJsonResponse(200, { data: "test" });
        mockResponse.json = vi.fn().mockRejectedValue(new Error("Invalid JSON"));
        mockResponse.text = vi.fn().mockResolvedValue("some text");

        const result = await client["handleResponse"](mockResponse);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Invalid JSON");
          expect(result.details).toEqual({ parseError: true });
        }
      });

      it("should handle invalid content-type fallback", async () => {
        // TC-API-010: Invalid content-type → fallback do tekstu
        const mockResponse = createMockResponse(200, "plain text response", "text/html");
        const result = await client["handleResponse"](mockResponse);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe("plain text response");
        }
      });

      it("should handle network timeout scenario", async () => {
        // TC-API-011: Network timeout → NetworkError z odpowiednim message
        // This is more relevant for the makeRequest method, but we can simulate it here
        const mockResponse = createMockResponse(200, { data: "test" });
        mockResponse.json = vi.fn().mockRejectedValue(new Error("Network timeout"));
        mockResponse.text = vi.fn().mockResolvedValue("Network timeout");

        const result = await client["handleResponse"](mockResponse);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Network timeout");
          expect(result.details).toEqual({ parseError: true });
        }
      });

      it("should handle malformed JSON in error response", async () => {
        // TC-API-012: Malformed JSON in error response → parsing error handling
        const mockResponse = createMockResponse(400, undefined, "", "Bad Request");
        mockResponse.json = vi.fn().mockRejectedValue(new Error("Invalid JSON"));
        mockResponse.text = vi.fn().mockResolvedValue("Bad Request");

        const result = await client["handleResponse"](mockResponse);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Bad Request");
          expect(result.details).toEqual({
            status: 400,
            statusText: "Bad Request",
            data: "Bad Request",
          });
        }
      });
    });
  });

  // ============================================================================
  // Utility Functions - 14 test cases (PRIORYTET WYSOKI)
  // ============================================================================

  describe("isApiSuccess()", () => {
    it("should return true for successful API result", () => {
      // TC-API-013: {success: true, data: "test"} → true (type narrowing)
      const result: { success: true; data: string } = { success: true, data: "test" };

      expect(isApiSuccess(result)).toBe(true);
    });

    it("should return false for failed API result", () => {
      // TC-API-014: {success: false, error: "fail"} → false
      const result: { success: false; error: string } = { success: false, error: "fail" };

      expect(isApiSuccess(result)).toBe(false);
    });

    it("should return true for success result without data", () => {
      // TC-API-015: {success: true} (bez data) → true
      const result: { success: true; data: undefined } = { success: true, data: undefined };

      expect(isApiSuccess(result)).toBe(true);
    });

    it("should handle edge case inputs gracefully", () => {
      // TC-API-016: malformed objects → false
      expect(isApiSuccess({} as unknown as Parameters<typeof isApiSuccess>[0])).toBe(false);
      expect(isApiSuccess({ success: undefined } as unknown as Parameters<typeof isApiSuccess>[0])).toBe(false);
      expect(isApiSuccess({ success: null } as unknown as Parameters<typeof isApiSuccess>[0])).toBe(false);
      expect(isApiSuccess({ success: "invalid" } as unknown as Parameters<typeof isApiSuccess>[0])).toBe(false);
    });
  });

  describe("getApiError()", () => {
    it("should return null for successful API result", () => {
      // TC-API-017: {success: true, data: "test"} → null
      const result: { success: true; data: string } = { success: true, data: "test" };

      expect(getApiError(result)).toBeNull();
    });

    it("should return error message for failed API result", () => {
      // TC-API-018: {success: false, error: "message"} → "message"
      const result: { success: false; error: string } = { success: false, error: "Test error message" };

      expect(getApiError(result)).toBe("Test error message");
    });

    it("should return null for failed result without error", () => {
      // TC-API-019: {success: false} (bez error) → null
      const result = { success: false } as unknown as Parameters<typeof getApiError>[0];

      expect(getApiError(result)).toBeNull();
    });

    it("should return null for malformed objects", () => {
      // TC-API-020: malformed objects → null
      expect(getApiError({} as unknown as Parameters<typeof getApiError>[0])).toBeNull();
      expect(getApiError({ success: "invalid" } as unknown as Parameters<typeof getApiError>[0])).toBeNull();
    });
  });

  // ============================================================================
  // apiCall() - 12 test cases (PRIORYTET WYSOKI)
  // ============================================================================

  describe("apiCall()", () => {
    beforeEach(() => {
      // Mock the apiClient methods
      vi.spyOn(apiClient, "get").mockResolvedValue({ success: true, data: "get_response" });
      vi.spyOn(apiClient, "post").mockResolvedValue({ success: true, data: "post_response" });
      vi.spyOn(apiClient, "put").mockResolvedValue({ success: true, data: "put_response" });
      vi.spyOn(apiClient, "patch").mockResolvedValue({ success: true, data: "patch_response" });
      vi.spyOn(apiClient, "delete").mockResolvedValue({ success: true, data: "delete_response" });
    });

    it("should call GET method correctly", async () => {
      // TC-API-021: GET method → calls apiClient.get()
      const result = await apiCall("GET", "/test");

      expect(apiClient.get).toHaveBeenCalledWith("/test", undefined);
      expect(result).toEqual({ success: true, data: "get_response" });
    });

    it("should call POST method correctly", async () => {
      // TC-API-022: POST method → calls apiClient.post()
      const body = { test: "data" };
      const result = await apiCall("POST", "/test", body);

      expect(apiClient.post).toHaveBeenCalledWith("/test", body, undefined);
      expect(result).toEqual({ success: true, data: "post_response" });
    });

    it("should call PUT method correctly", async () => {
      // TC-API-023: PUT method → calls apiClient.put()
      const body = { updated: true };
      const result = await apiCall("PUT", "/test", body);

      expect(apiClient.put).toHaveBeenCalledWith("/test", body, undefined);
      expect(result).toEqual({ success: true, data: "put_response" });
    });

    it("should call PATCH method correctly", async () => {
      // TC-API-024: PATCH method → calls apiClient.patch()
      const body = { partial: "update" };
      const result = await apiCall("PATCH", "/test", body);

      expect(apiClient.patch).toHaveBeenCalledWith("/test", body, undefined);
      expect(result).toEqual({ success: true, data: "patch_response" });
    });

    it("should call DELETE method correctly", async () => {
      // TC-API-025: DELETE method → calls apiClient.delete()
      const result = await apiCall("DELETE", "/test");

      expect(apiClient.delete).toHaveBeenCalledWith("/test", undefined);
      expect(result).toEqual({ success: true, data: "delete_response" });
    });

    it("should handle invalid HTTP method", async () => {
      // TC-API-026: Invalid method → {success: false, error: "Unsupported method"}
      const result = await apiCall("INVALID" as unknown as Parameters<typeof apiCall>[0], "/test");

      expect(result).toEqual({
        success: false,
        error: "Unsupported HTTP method: INVALID",
      });
      // Ensure no apiClient methods were called
      expect(apiClient.get).not.toHaveBeenCalled();
      expect(apiClient.post).not.toHaveBeenCalled();
      expect(apiClient.put).not.toHaveBeenCalled();
      expect(apiClient.patch).not.toHaveBeenCalled();
      expect(apiClient.delete).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Error Classes - 8 test cases (PRIORYTET WYSOKI)
  // ============================================================================

  describe("Error Classes", () => {
    it("should create ApiClientError with message, status, code", () => {
      // TC-API-027: should create ApiClientError with message, status, code
      const message = "Test error message";
      const status = 400;
      const code = "TEST_ERROR";
      const details = { field: "email", value: "invalid" };

      const error = new ApiClientError(message, status, code, details);

      expect(error).toBeInstanceOf(ApiClientError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(message);
      expect(error.name).toBe("ApiClientError");
      expect(error.status).toBe(status);
      expect(error.code).toBe(code);
      expect(error.details).toBe(details);
    });

    it("should create NetworkError extending ApiClientError", () => {
      // TC-API-028: should create NetworkError extending ApiClientError
      const error = new NetworkError();

      expect(error).toBeInstanceOf(NetworkError);
      expect(error).toBeInstanceOf(ApiClientError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("NetworkError");
      expect(error.message).toBe("Network error occurred");

      // Should inherit ApiClientError properties
      expect(error.status).toBeUndefined();
      expect(error.code).toBeUndefined();
      expect(error.details).toBeUndefined();
    });

    it("should create TimeoutError extending ApiClientError", () => {
      // TC-API-029: should create TimeoutError extending ApiClientError
      const error = new TimeoutError();

      expect(error).toBeInstanceOf(TimeoutError);
      expect(error).toBeInstanceOf(ApiClientError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("TimeoutError");
      expect(error.message).toBe("Request timeout");

      // Should inherit ApiClientError properties
      expect(error.status).toBeUndefined();
      expect(error.code).toBeUndefined();
      expect(error.details).toBeUndefined();
    });

    it("should create ValidationError with details", () => {
      // TC-API-030: should create ValidationError with details
      const message = "Validation failed";
      const validationDetails = {
        field: "email",
        rule: "email",
        value: "invalid-email",
        message: "Invalid email format",
      };

      const error = new ValidationError(message, validationDetails);

      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(ApiClientError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("ValidationError");
      expect(error.message).toBe(message);
      expect(error.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.details).toBe(validationDetails);
    });
  });

  // ============================================================================
  // makeRequest() Retry Logic - 15 test cases (PRIORYTET ŚREDNI)
  // ============================================================================

  describe("makeRequest() - retry logic", () => {
    let mockFetch: ReturnType<typeof vi.fn>;
    let mockSleep: ReturnType<typeof vi.fn>;
    let client: ApiClient;

    beforeEach(() => {
      client = new ApiClient({ retries: 2, retryDelay: 10 }); // Short delay for tests
      mockFetch = vi.fn();
      mockSleep = vi.fn().mockResolvedValue(undefined);

      // Mock fetch globally
      (globalThis as unknown as { fetch: typeof mockFetch }).fetch = mockFetch;
      // Mock sleep method
      vi.spyOn(client as unknown as { sleep: typeof mockSleep }, "sleep").mockImplementation(mockSleep);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should succeed on first attempt without retry", async () => {
      // TC-API-031: should succeed on first attempt without retry
      const mockResponse = createJsonResponse(200, { data: "success" });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await (client as unknown as { makeRequest: (url: string) => Promise<unknown> }).makeRequest(
        "/test"
      );

      expect(result).toEqual({ success: true, data: { data: "success" } });
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockSleep).not.toHaveBeenCalled();
    });

    it("should succeed after 1 retry attempt", async () => {
      // TC-API-032: should succeed after 1 retry attempt
      // First attempt fails with network error, second succeeds
      const networkError = new Error("Network error");
      const mockResponse = createJsonResponse(200, { data: "success" });

      mockFetch
        .mockRejectedValueOnce(networkError) // First attempt fails
        .mockResolvedValueOnce(mockResponse); // Second attempt succeeds

      const result = await (client as unknown as { makeRequest: (url: string) => Promise<unknown> }).makeRequest(
        "/test"
      );

      expect(result).toEqual({ success: true, data: { data: "success" } });
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockSleep).toHaveBeenCalledTimes(1);
      expect(mockSleep).toHaveBeenCalledWith(10); // retryDelay * (attempt + 1) = 10 * 1
    });

    it("should succeed after 2 retry attempts", async () => {
      // TC-API-033: should succeed after 2 retry attempts
      // First two attempts fail, third succeeds
      const networkError = new Error("Network error");
      const mockResponse = createJsonResponse(200, { data: "success" });

      mockFetch
        .mockRejectedValueOnce(networkError) // First attempt fails
        .mockRejectedValueOnce(networkError) // Second attempt fails
        .mockResolvedValueOnce(mockResponse); // Third attempt succeeds

      const result = await (client as unknown as { makeRequest: (url: string) => Promise<unknown> }).makeRequest(
        "/test"
      );

      expect(result).toEqual({ success: true, data: { data: "success" } });
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockSleep).toHaveBeenCalledTimes(2);
      expect(mockSleep).toHaveBeenNthCalledWith(1, 10); // retryDelay * 1 = 10
      expect(mockSleep).toHaveBeenNthCalledWith(2, 20); // retryDelay * 2 = 20
    });

    it("should fail after maximum retries exceeded", async () => {
      // TC-API-034: should fail after maximum retries exceeded
      // Client configured with 2 retries = 3 total attempts (0, 1, 2)
      const networkError = new Error("Network error");

      // All 3 attempts fail
      mockFetch
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError);

      const result = (await (client as unknown as { makeRequest: (url: string) => Promise<unknown> }).makeRequest(
        "/test"
      )) as { success: boolean; error?: string; details?: unknown };

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
      expect(result.details).toEqual({ attempts: 3 });
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockSleep).toHaveBeenCalledTimes(2);
    });

    it("should retry after timeout on first attempt", async () => {
      // TC-API-035: should retry after timeout on first attempt
      const abortError = new Error("Request timeout");
      abortError.name = "AbortError";
      const mockResponse = createJsonResponse(200, { data: "success" });

      mockFetch
        .mockRejectedValueOnce(abortError) // First attempt times out
        .mockResolvedValueOnce(mockResponse); // Second attempt succeeds

      const result = await (client as unknown as { makeRequest: (url: string) => Promise<unknown> }).makeRequest(
        "/test"
      );

      expect(result).toEqual({ success: true, data: { data: "success" } });
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockSleep).toHaveBeenCalledTimes(1);
      expect(mockSleep).toHaveBeenCalledWith(10);
    });

    it("should retry network errors with backoff", async () => {
      // TC-API-036: should retry network errors with backoff
      // Test that retry delay increases with each attempt
      const networkError = new Error("Connection failed");
      const mockResponse = createJsonResponse(200, { data: "success" });

      mockFetch
        .mockRejectedValueOnce(networkError) // First attempt fails
        .mockRejectedValueOnce(networkError) // Second attempt fails
        .mockResolvedValueOnce(mockResponse); // Third attempt succeeds

      const result = await (client as unknown as { makeRequest: (url: string) => Promise<unknown> }).makeRequest(
        "/test"
      );

      expect(result).toEqual({ success: true, data: { data: "success" } });
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockSleep).toHaveBeenCalledTimes(2);
      // Verify exponential backoff: delay * (attempt + 1)
      expect(mockSleep).toHaveBeenNthCalledWith(1, 10); // retryDelay * 1 = 10
      expect(mockSleep).toHaveBeenNthCalledWith(2, 20); // retryDelay * 2 = 20
    });
  });

  // ============================================================================
  // HTTP Methods - 7 test cases (FAZA 5)
  // ============================================================================

  describe("HTTP Methods", () => {
    let mockMakeRequest: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockMakeRequest = vi.fn();
      vi.spyOn(client as unknown as { makeRequest: typeof mockMakeRequest }, "makeRequest").mockImplementation(
        mockMakeRequest
      );
    });

    describe("GET method", () => {
      it("should call makeRequest with GET method", async () => {
        const expectedResult = { success: true, data: "get_response" };
        mockMakeRequest.mockResolvedValue(expectedResult);

        const result = await client.get("/test");

        expect(mockMakeRequest).toHaveBeenCalledWith("/test", { method: "GET" });
        expect(result).toEqual(expectedResult);
      });

      it("should pass config to makeRequest", async () => {
        const config = { timeout: 5000, headers: { "X-Test": "value" } };
        mockMakeRequest.mockResolvedValue({ success: true, data: null });

        await client.get("/test", config);

        expect(mockMakeRequest).toHaveBeenCalledWith("/test", {
          method: "GET",
          timeout: 5000,
          headers: { "X-Test": "value" },
        });
      });
    });

    describe("POST method", () => {
      it("should call makeRequest with POST method and body", async () => {
        const body = { name: "test", value: 123 };
        const expectedResult = { success: true, data: { id: 1 } };
        mockMakeRequest.mockResolvedValue(expectedResult);

        const result = await client.post("/test", body);

        expect(mockMakeRequest).toHaveBeenCalledWith("/test", {
          method: "POST",
          body: body,
        });
        expect(result).toEqual(expectedResult);
      });

      it("should handle undefined body", async () => {
        mockMakeRequest.mockResolvedValue({ success: true, data: null });

        await client.post("/test");

        expect(mockMakeRequest).toHaveBeenCalledWith("/test", {
          method: "POST",
          body: undefined,
        });
      });
    });

    describe("PUT method", () => {
      it("should call makeRequest with PUT method and body", async () => {
        const body = { id: 1, name: "updated" };
        mockMakeRequest.mockResolvedValue({ success: true, data: body });

        const result = await client.put("/test", body);

        expect(mockMakeRequest).toHaveBeenCalledWith("/test", {
          method: "PUT",
          body: body,
        });
        expect(result).toEqual({ success: true, data: body });
      });
    });

    describe("PATCH method", () => {
      it("should call makeRequest with PATCH method and body", async () => {
        const body = { name: "patched" };
        mockMakeRequest.mockResolvedValue({ success: true, data: { id: 1, name: "patched" } });

        const result = await client.patch("/test", body);

        expect(mockMakeRequest).toHaveBeenCalledWith("/test", {
          method: "PATCH",
          body: body,
        });
        expect(result.success).toBe(true);
      });
    });

    describe("DELETE method", () => {
      it("should call makeRequest with DELETE method", async () => {
        mockMakeRequest.mockResolvedValue({ success: true, data: null });

        const result = await client.delete("/test");

        expect(mockMakeRequest).toHaveBeenCalledWith("/test", { method: "DELETE" });
        expect(result).toEqual({ success: true, data: null });
      });

      it("should pass config to makeRequest", async () => {
        const config = { timeout: 3000 };
        mockMakeRequest.mockResolvedValue({ success: true, data: null });

        await client.delete("/test", config);

        expect(mockMakeRequest).toHaveBeenCalledWith("/test", {
          method: "DELETE",
          timeout: 3000,
        });
      });
    });
  });

  // ============================================================================
  // Utility Methods - 2 test cases (FAZA 5)
  // ============================================================================

  describe("Utility Methods", () => {
    describe("setHeaders", () => {
      it("should update default headers", () => {
        const initialHeaders = {
          ...(client as unknown as { config: { headers: Record<string, string> } }).config.headers,
        };
        const newHeaders = { Authorization: "Bearer token", "X-API-Key": "key123" };

        client.setHeaders(newHeaders);

        expect((client as unknown as { config: { headers: Record<string, string> } }).config.headers).toEqual({
          ...initialHeaders,
          ...newHeaders,
        });
      });

      it("should merge headers correctly", () => {
        client.setHeaders({ "Content-Type": "text/plain", "X-Custom": "value1" });
        client.setHeaders({ "X-Custom": "value2", Accept: "application/json" });

        expect(
          (client as unknown as { config: { headers: Record<string, string> } }).config.headers["Content-Type"]
        ).toBe("text/plain");
        expect((client as unknown as { config: { headers: Record<string, string> } }).config.headers["X-Custom"]).toBe(
          "value2"
        ); // Overwritten
        expect((client as unknown as { config: { headers: Record<string, string> } }).config.headers.Accept).toBe(
          "application/json"
        );
      });
    });

    describe("withConfig", () => {
      it("should create new instance with merged config", () => {
        const newConfig = {
          baseURL: "https://api.example.com",
          timeout: 10000,
          retries: 5,
        };

        const newClient = client.withConfig(newConfig);

        expect(newClient).toBeInstanceOf(ApiClient);
        expect(newClient).not.toBe(client); // Different instance
        expect(
          (newClient as unknown as { config: { baseURL: string; timeout: number; retries: number } }).config.baseURL
        ).toBe(newConfig.baseURL);
        expect(
          (newClient as unknown as { config: { baseURL: string; timeout: number; retries: number } }).config.timeout
        ).toBe(newConfig.timeout);
        expect(
          (newClient as unknown as { config: { baseURL: string; timeout: number; retries: number } }).config.retries
        ).toBe(newConfig.retries);
        // Original client unchanged
        expect(
          (client as unknown as { config: { baseURL: string; timeout: number; retries: number } }).config.baseURL
        ).toBe("");
        expect(
          (client as unknown as { config: { baseURL: string; timeout: number; retries: number } }).config.timeout
        ).toBe(60000);
      });

      it("should preserve original config for unchanged properties", () => {
        const newClient = client.withConfig({ timeout: 30000 });

        expect((newClient as unknown as { config: { retries: number; timeout: number } }).config.retries).toBe(3); // Original value
        expect((newClient as unknown as { config: { retries: number; timeout: number } }).config.timeout).toBe(30000); // New value
      });
    });
  });
});
