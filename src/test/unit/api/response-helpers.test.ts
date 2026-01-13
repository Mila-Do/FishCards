import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { jsonResponse, errorResponse } from "../../../lib/response-helpers";

/**
 * Test suite for response helper functions
 * Priority: HIGH - requires ≥95% coverage according to test plan
 */

describe("jsonResponse", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe("basic response creation", () => {
    it("should create JSON response with correct headers and status", () => {
      const data = { message: "success", id: 123 };
      const response = jsonResponse(data, { status: 200 });

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should serialize data to JSON string", async () => {
      const data = {
        string: "test",
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        nested: { key: "value" },
      };

      const response = jsonResponse(data, { status: 201 });
      const responseText = await response.text();
      const parsedData = JSON.parse(responseText);

      expect(parsedData).toEqual(data);
      expect(response.status).toBe(201);
    });

    it("should handle null data", async () => {
      const response = jsonResponse(null, { status: 200 });
      const responseText = await response.text();

      expect(responseText).toBe("null");
      expect(response.status).toBe(200);
    });

    it("should handle undefined data", async () => {
      const response = jsonResponse(undefined, { status: 200 });
      const responseText = await response.text();

      expect(responseText).toBe(""); // JSON.stringify(undefined) returns undefined, which becomes empty string in Response
    });

    it("should handle empty object", async () => {
      const response = jsonResponse({}, { status: 200 });
      const responseText = await response.text();

      expect(JSON.parse(responseText)).toEqual({});
    });

    it("should handle empty array", async () => {
      const response = jsonResponse([], { status: 200 });
      const responseText = await response.text();

      expect(JSON.parse(responseText)).toEqual([]);
    });
  });

  describe("with logging context", () => {
    it("should log API event when context provided", () => {
      const data = { result: "success" };
      const logContext = {
        method: "GET",
        endpoint: "/api/users",
        userId: "user123",
        duration: 150,
      };

      jsonResponse(data, { status: 200 }, logContext);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/INFO GET \/api\/users 200 user:user123 150ms/));
    });

    it("should log without optional context fields", () => {
      const data = { result: "success" };
      const logContext = {
        method: "POST",
        endpoint: "/api/flashcards",
      };

      jsonResponse(data, { status: 201 }, logContext);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/INFO POST \/api\/flashcards 201/));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.not.stringMatching(/user:|ms/));
    });

    it("should not log when no context provided", () => {
      const data = { result: "success" };
      jsonResponse(data, { status: 200 });

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("should include timestamp in log", () => {
      const data = { result: "success" };
      const logContext = {
        method: "GET",
        endpoint: "/test",
      };

      jsonResponse(data, { status: 200 }, logContext);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
      );
    });
  });

  describe("different status codes", () => {
    it("should handle various success status codes", () => {
      const successCodes = [200, 201, 202];

      successCodes.forEach((status) => {
        const response = jsonResponse({ status: "ok" }, { status });
        expect(response.status).toBe(status);
      });
    });

    it("should handle error status codes", () => {
      const errorCodes = [400, 401, 403, 404, 500];

      errorCodes.forEach((status) => {
        const response = jsonResponse({ error: "test" }, { status });
        expect(response.status).toBe(status);
      });
    });
  });

  describe("edge cases", () => {
    it("should handle complex nested objects", async () => {
      const complexData = {
        users: [
          { id: 1, profile: { name: "John", settings: { theme: "dark" } } },
          { id: 2, profile: { name: "Jane", settings: { theme: "light" } } },
        ],
        metadata: {
          total: 2,
          page: 1,
          filters: { active: true, role: ["admin", "user"] },
        },
      };

      const response = jsonResponse(complexData, { status: 200 });
      const responseText = await response.text();
      const parsed = JSON.parse(responseText);

      expect(parsed).toEqual(complexData);
    });

    it("should handle string data", async () => {
      const stringData = "Simple string response";
      const response = jsonResponse(stringData, { status: 200 });
      const responseText = await response.text();

      expect(JSON.parse(responseText)).toBe(stringData);
    });

    it("should handle number data", async () => {
      const numberData = 42;
      const response = jsonResponse(numberData, { status: 200 });
      const responseText = await response.text();

      expect(JSON.parse(responseText)).toBe(numberData);
    });

    it("should handle boolean data", async () => {
      const booleanData = true;
      const response = jsonResponse(booleanData, { status: 200 });
      const responseText = await response.text();

      expect(JSON.parse(responseText)).toBe(booleanData);
    });
  });
});

describe("errorResponse", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe("basic error response creation", () => {
    it("should create error response with required fields", async () => {
      const response = errorResponse(400, "VALIDATION_ERROR", "Invalid input");

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe("application/json");

      const responseText = await response.text();
      const data = JSON.parse(responseText);

      expect(data).toEqual({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
        },
      });
    });

    it("should include details when provided", async () => {
      const details = {
        field: "email",
        constraint: "format",
        allowedFormats: ["email"],
      };

      const response = errorResponse(422, "VALIDATION_ERROR", "Email format invalid", details);
      const responseText = await response.text();
      const data = JSON.parse(responseText);

      expect(data).toEqual({
        error: {
          code: "VALIDATION_ERROR",
          message: "Email format invalid",
          details,
        },
      });
    });

    it("should not include details field when not provided", async () => {
      const response = errorResponse(404, "NOT_FOUND", "Resource not found");
      const responseText = await response.text();
      const data = JSON.parse(responseText);

      expect(data.error).toEqual({
        code: "NOT_FOUND",
        message: "Resource not found",
      });
      expect(data.error.details).toBeUndefined();
    });
  });

  describe("error logging", () => {
    it("should log error with context", () => {
      const logContext = {
        method: "POST",
        endpoint: "/api/flashcards",
        userId: "user456",
        duration: 75,
      };

      errorResponse(400, "VALIDATION_ERROR", "Invalid data", undefined, logContext);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/WARN POST \/api\/flashcards 400 user:user456 75ms error:VALIDATION_ERROR/)
      );
    });

    it("should log error without optional context fields", () => {
      const logContext = {
        method: "DELETE",
        endpoint: "/api/flashcards/123",
      };

      errorResponse(403, "UNAUTHORIZED", "Access denied", undefined, logContext);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/WARN DELETE \/api\/flashcards\/123 403/));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/error:UNAUTHORIZED/));
    });

    it("should not log when no context provided", () => {
      errorResponse(500, "INTERNAL_SERVER_ERROR", "Server error");
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("should use ERROR log level for 5xx status codes", () => {
      const logContext = {
        method: "GET",
        endpoint: "/api/test",
      };

      errorResponse(500, "INTERNAL_SERVER_ERROR", "Internal server error", undefined, logContext);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/ERROR GET \/api\/test 500/));
    });

    it("should use WARN log level for 4xx status codes", () => {
      const logContext = {
        method: "POST",
        endpoint: "/api/test",
      };

      errorResponse(400, "VALIDATION_ERROR", "Bad request", undefined, logContext);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/WARN POST \/api\/test 400/));
    });
  });

  describe("various error scenarios", () => {
    it("should handle authentication errors", async () => {
      const response = errorResponse(401, "UNAUTHORIZED", "Authentication required");

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("should handle validation errors with field details", async () => {
      const fieldErrors = {
        email: ["Invalid format", "Required field"],
        password: ["Too short", "Missing special character"],
      };

      const response = errorResponse(422, "VALIDATION_ERROR", "Multiple validation errors", { fieldErrors });

      const data = await response.json();
      expect(data.error.details.fieldErrors).toEqual(fieldErrors);
    });

    it("should handle not found errors", async () => {
      const response = errorResponse(404, "NOT_FOUND", "Flashcard not found");

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.message).toBe("Flashcard not found");
    });

    it("should handle server errors", async () => {
      const response = errorResponse(500, "DATABASE_ERROR", "Database connection failed");

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error.code).toBe("DATABASE_ERROR");
    });

    it("should handle rate limiting errors", async () => {
      const rateLimitDetails = {
        limit: 100,
        remaining: 0,
        resetTime: new Date().toISOString(),
      };

      const response = errorResponse(429, "RATE_LIMIT_EXCEEDED", "Too many requests", rateLimitDetails);

      const data = await response.json();
      expect(data.error.details).toEqual(rateLimitDetails);
    });
  });

  describe("edge cases", () => {
    it("should handle empty error message", async () => {
      const response = errorResponse(400, "VALIDATION_ERROR", "");
      const data = await response.json();

      expect(data.error.message).toBe("");
    });

    it("should handle special characters in error message", async () => {
      const message = "Error with special chars: àáâãäåæçèé & symbols !@#$%^&*()";
      const response = errorResponse(400, "VALIDATION_ERROR", message);
      const data = await response.json();

      expect(data.error.message).toBe(message);
    });

    it("should handle very long error messages", async () => {
      const longMessage = "Very long error message: " + "x".repeat(1000);
      const response = errorResponse(400, "VALIDATION_ERROR", longMessage);
      const data = await response.json();

      expect(data.error.message).toBe(longMessage);
    });

    it("should handle null details", async () => {
      const response = errorResponse(400, "VALIDATION_ERROR", "Error with null details", undefined);
      const data = await response.json();

      expect(data.error).toEqual({
        code: "VALIDATION_ERROR",
        message: "Error with null details",
      });
      expect(data.error.details).toBeUndefined();
    });

    it("should handle complex nested details", async () => {
      const complexDetails = {
        validation: {
          fields: {
            user: {
              email: { errors: ["format", "required"] },
              profile: {
                settings: {
                  preferences: { theme: "invalid value" },
                },
              },
            },
          },
        },
        context: {
          requestId: "req-123",
          timestamp: new Date().toISOString(),
        },
      };

      const response = errorResponse(400, "VALIDATION_ERROR", "Complex validation error", complexDetails);
      const data = await response.json();

      expect(data.error.details).toEqual(complexDetails);
    });
  });

  describe("error code types", () => {
    it("should handle various error code formats", async () => {
      const errorCodes = [
        "SIMPLE_ERROR",
        "error_with_underscores",
        "error-with-dashes",
        "ErrorWithCamelCase",
        "ERROR123",
        "E",
      ];

      for (const code of errorCodes) {
        const response = errorResponse(400, code as "VALIDATION_ERROR", "Test message");
        const data = await response.json();
        expect(data.error.code).toBe(code);
      }
    });
  });
});
