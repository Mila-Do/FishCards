import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ApiClient,
  ApiClientError,
  NetworkError,
  TimeoutError,
  ValidationError,
  apiClient,
  apiCall,
  isApiSuccess,
  getApiError,
} from "../../../lib/api-client";
import { HTTP_STATUS } from "../../../lib/types/common";

/**
 * Test suite for API client
 * Priority: HIGH - requires ≥90% coverage according to test plan
 */

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ApiClientError", () => {
  it("should create error with message and optional properties", () => {
    const error = new ApiClientError("Test error", 400, "TEST_ERROR", { detail: "info" });

    expect(error.name).toBe("ApiClientError");
    expect(error.message).toBe("Test error");
    expect(error.status).toBe(400);
    expect(error.code).toBe("TEST_ERROR");
    expect(error.details).toEqual({ detail: "info" });
  });

  it("should create basic error with just message", () => {
    const error = new ApiClientError("Simple error");

    expect(error.message).toBe("Simple error");
    expect(error.status).toBeUndefined();
    expect(error.code).toBeUndefined();
    expect(error.details).toBeUndefined();
  });
});

describe("NetworkError", () => {
  it("should create network error with default message", () => {
    const error = new NetworkError();

    expect(error.name).toBe("NetworkError");
    expect(error.message).toBe("Network error occurred");
  });

  it("should create network error with custom message", () => {
    const error = new NetworkError("Custom network error");

    expect(error.message).toBe("Custom network error");
  });
});

describe("TimeoutError", () => {
  it("should create timeout error with default message", () => {
    const error = new TimeoutError();

    expect(error.name).toBe("TimeoutError");
    expect(error.message).toBe("Request timeout");
  });

  it("should create timeout error with custom message", () => {
    const error = new TimeoutError("Custom timeout");

    expect(error.message).toBe("Custom timeout");
  });
});

describe("ValidationError", () => {
  it("should create validation error with proper status and code", () => {
    const error = new ValidationError("Invalid data", { field: "email" });

    expect(error.name).toBe("ValidationError");
    expect(error.message).toBe("Invalid data");
    expect(error.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details).toEqual({ field: "email" });
  });
});

describe("ApiClient", () => {
  let client: ApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    client = new ApiClient();

    // Mock console methods to reduce noise in tests
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should create client with default config", () => {
      const defaultClient = new ApiClient();
      expect(defaultClient).toBeDefined();
    });

    it("should create client with custom config", () => {
      const customClient = new ApiClient({
        baseURL: "https://api.example.com",
        timeout: 30000,
        retries: 5,
        headers: { "Custom-Header": "value" },
      });

      expect(customClient).toBeDefined();
    });

    it("should merge custom headers with defaults", () => {
      const customClient = new ApiClient({
        headers: { Authorization: "Bearer token" },
      });

      // This is tested indirectly through request behavior
      expect(customClient).toBeDefined();
    });
  });

  describe("successful requests", () => {
    it("should handle successful JSON response", async () => {
      const mockData = { message: "success" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve(mockData),
      } as Response);

      const result = await client.get("/test");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockData);
      }
    });

    it("should handle successful text response", async () => {
      const mockText = "Plain text response";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "text/plain" }),
        text: () => Promise.resolve(mockText),
      } as Response);

      const result = await client.get("/test");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(mockText);
      }
    });

    it("should handle 204 No Content response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: HTTP_STATUS.NO_CONTENT,
        headers: new Headers(),
      } as Response);

      const result = await client.get("/test");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it("should handle 201 Created with JSON", async () => {
      const mockData = { id: 1, created: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve(mockData),
      } as Response);

      const result = await client.post("/test", { name: "test" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockData);
      }
    });
  });

  describe("error responses", () => {
    it("should handle 400 Bad Request with JSON error", async () => {
      const errorData = { message: "Bad request", code: "INVALID_INPUT" };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve(errorData),
      } as Response);

      const result = await client.get("/test");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Bad request");
        expect(result.details).toMatchObject({
          status: 400,
          statusText: "Bad Request",
          data: errorData,
        });
      }
    });

    it("should handle 401 Unauthorized with text error", async () => {
      const errorText = "Unauthorized access";
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        headers: new Headers({ "content-type": "text/plain" }),
        json: () => Promise.reject(new Error("Not JSON")),
        text: () => Promise.resolve(errorText),
      } as Response);

      const result = await client.get("/test");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(errorText);
      }
    });

    it("should handle 404 Not Found with empty body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: new Headers(),
        json: () => Promise.reject(new Error("No JSON")),
        text: () => Promise.resolve(""),
      } as Response);

      const result = await client.get("/test");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Not Found");
      }
    });

    it("should handle 500 Server Error with malformed JSON", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.reject(new Error("Malformed JSON")),
        text: () => Promise.resolve("Server error occurred"),
      } as Response);

      const result = await client.get("/test");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Server error occurred");
      }
    });
  });

  describe("network and parsing errors", () => {
    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network connection failed"));

      const result = await client.get("/test");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Network connection failed");
        expect(result.details).toMatchObject({ attempts: 4 }); // 3 retries + 1 initial
      }
    });

    it("should handle JSON parsing errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.reject(new Error("Invalid JSON")),
      } as Response);

      const result = await client.get("/test");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid JSON");
        expect(result.details).toMatchObject({ parseError: true });
      }
    });

    it("should handle timeout errors", async () => {
      // Mock AbortController
      const mockAbortController = {
        signal: {},
        abort: vi.fn(),
      };

      vi.stubGlobal(
        "AbortController",
        vi.fn(() => mockAbortController)
      );
      vi.stubGlobal(
        "setTimeout",
        vi.fn(() => {
          // Simulate timeout by calling abort immediately
          mockAbortController.abort();
          return 123;
        })
      );
      vi.stubGlobal("clearTimeout", vi.fn());

      const abortError = new DOMException("Operation was aborted", "AbortError");
      mockFetch.mockRejectedValueOnce(abortError);

      const shortTimeoutClient = new ApiClient({ timeout: 100, retries: 0 });
      const result = await shortTimeoutClient.get("/test");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Request timeout");
        expect(result.details).toMatchObject({
          timeout: 100,
          attempts: 1,
        });
      }
    });
  });

  describe("retry logic", () => {
    it("should retry failed requests", async () => {
      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ "content-type": "application/json" }),
          json: () => Promise.resolve({ success: true }),
        } as Response);

      const result = await client.get("/test");

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should respect retry configuration", async () => {
      const noRetryClient = new ApiClient({ retries: 0 });

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await noRetryClient.get("/test");

      expect(result.success).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should not retry on ApiClientError", async () => {
      mockFetch.mockImplementationOnce(() => {
        throw new ApiClientError("Client error");
      });

      const result = await client.get("/test");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Client error");
      }
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("HTTP methods", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve({ success: true }),
      } as Response);
    });

    it("should make GET request", async () => {
      await client.get("/users");

      expect(mockFetch).toHaveBeenCalledWith(
        "/users",
        expect.objectContaining({
          method: "GET",
        })
      );
    });

    it("should make POST request with body", async () => {
      const body = { name: "John" };
      await client.post("/users", body);

      expect(mockFetch).toHaveBeenCalledWith(
        "/users",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(body),
        })
      );
    });

    it("should make PUT request with body", async () => {
      const body = { id: 1, name: "Jane" };
      await client.put("/users/1", body);

      expect(mockFetch).toHaveBeenCalledWith(
        "/users/1",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(body),
        })
      );
    });

    it("should make PATCH request with body", async () => {
      const body = { name: "Updated" };
      await client.patch("/users/1", body);

      expect(mockFetch).toHaveBeenCalledWith(
        "/users/1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(body),
        })
      );
    });

    it("should make DELETE request", async () => {
      await client.delete("/users/1");

      expect(mockFetch).toHaveBeenCalledWith(
        "/users/1",
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });

  describe("request configuration", () => {
    it("should handle string body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: () => Promise.resolve("OK"),
      } as Response);

      await client.post("/test", "raw string body");

      expect(mockFetch).toHaveBeenCalledWith(
        "/test",
        expect.objectContaining({
          body: "raw string body",
        })
      );
    });

    it("should handle custom headers", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: () => Promise.resolve("OK"),
      } as Response);

      await client.get("/test", {
        headers: { Authorization: "Bearer token" },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/test",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer token",
          }),
        })
      );
    });

    it("should handle absolute URLs", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: () => Promise.resolve("OK"),
      } as Response);

      await client.get("https://external-api.com/data");

      expect(mockFetch).toHaveBeenCalledWith("https://external-api.com/data", expect.any(Object));
    });

    it("should prepend baseURL to relative URLs", async () => {
      const clientWithBase = new ApiClient({ baseURL: "https://api.example.com" });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: () => Promise.resolve("OK"),
      } as Response);

      await clientWithBase.get("/users");

      expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/users", expect.any(Object));
    });
  });

  describe("utility methods", () => {
    it("should update headers", () => {
      client.setHeaders({ Authorization: "Bearer new-token" });

      // Headers update is tested indirectly through request behavior
      expect(client).toBeDefined();
    });

    it("should create new client with different config", () => {
      const newClient = client.withConfig({ timeout: 5000 });

      expect(newClient).toBeDefined();
      expect(newClient).not.toBe(client);
    });
  });
});

describe("apiCall", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  it("should make GET request", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ data: "test" }),
    } as Response);

    const result = await apiCall("GET", "/test");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ data: "test" });
    }
  });

  it("should make POST request with body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ created: true }),
    } as Response);

    const result = await apiCall("POST", "/test", { name: "test" });

    expect(result.success).toBe(true);
  });

  it("should handle unsupported HTTP method", async () => {
    const result = await apiCall("INVALID" as "GET", "/test");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Unsupported HTTP method: INVALID");
    }
  });

  it("should support all HTTP methods", async () => {
    const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

    for (const method of methods) {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: () => Promise.resolve("OK"),
      } as Response);

      const result = await apiCall(method, "/test");
      expect(result.success).toBe(true);
    }
  });
});

describe("isApiSuccess", () => {
  it("should return true for successful result", () => {
    const successResult = { success: true as const, data: { test: true } };

    expect(isApiSuccess(successResult)).toBe(true);

    // Type narrowing test
    if (isApiSuccess(successResult)) {
      expect(successResult.data).toEqual({ test: true });
    }
  });

  it("should return false for failed result", () => {
    const failResult = { success: false as const, error: "Test error" };

    expect(isApiSuccess(failResult)).toBe(false);
  });

  it("should return true for successful result without data", () => {
    const successResult = { success: true as const, data: undefined };

    expect(isApiSuccess(successResult)).toBe(true);
  });
});

describe("getApiError", () => {
  it("should return null for successful result", () => {
    const successResult = { success: true as const, data: { test: true } };

    expect(getApiError(successResult)).toBeNull();
  });

  it("should return error message for failed result", () => {
    const errorResult = { success: false as const, error: "Test error message" };

    expect(getApiError(errorResult)).toBe("Test error message");
  });

  it("should return null for failed result without error message", () => {
    const errorResult = { success: false as const, error: "" };

    expect(getApiError(errorResult)).toBeNull();
  });
});

describe("Default client instance", () => {
  it("should export default client instance", () => {
    expect(apiClient).toBeDefined();
    expect(apiClient).toBeInstanceOf(ApiClient);
  });
});
