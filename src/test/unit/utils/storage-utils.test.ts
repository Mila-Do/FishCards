import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { storage } from "../../../lib/utils";

/**
 * Test suite for localStorage wrapper utilities
 * Priority: MEDIUM - requires ≥70% coverage according to test plan
 */

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

describe("storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage globally
    Object.defineProperty(global, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("get", () => {
    describe("successful retrieval", () => {
      it("should return parsed JSON data when item exists", () => {
        const testData = { name: "John", age: 30, active: true };
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));

        const result = storage.get("user", null);

        expect(mockLocalStorage.getItem).toHaveBeenCalledWith("user");
        expect(result).toEqual(testData);
      });

      it("should return string data", () => {
        mockLocalStorage.getItem.mockReturnValue('"Hello World"');

        const result = storage.get("greeting", "");

        expect(result).toBe("Hello World");
      });

      it("should return number data", () => {
        mockLocalStorage.getItem.mockReturnValue("42");

        const result = storage.get("answer", 0);

        expect(result).toBe(42);
      });

      it("should return boolean data", () => {
        mockLocalStorage.getItem.mockReturnValue("true");

        const result = storage.get("isActive", false);

        expect(result).toBe(true);
      });

      it("should return array data", () => {
        const testArray = [1, 2, 3, "test", { nested: true }];
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testArray));

        const result = storage.get("items", []);

        expect(result).toEqual(testArray);
      });

      it("should return null when explicitly stored", () => {
        mockLocalStorage.getItem.mockReturnValue("null");

        const result = storage.get("nullValue", "default");

        expect(result).toBeNull();
      });
    });

    describe("default value handling", () => {
      it("should return default value when item doesn't exist", () => {
        mockLocalStorage.getItem.mockReturnValue(null);

        const defaultValue = { default: true };
        const result = storage.get("nonexistent", defaultValue);

        expect(result).toEqual(defaultValue);
      });

      it("should return default value when item is null", () => {
        mockLocalStorage.getItem.mockReturnValue(null);

        const result = storage.get("nullItem", "fallback");

        expect(result).toBe("fallback");
      });

      it("should handle different types of default values", () => {
        mockLocalStorage.getItem.mockReturnValue(null);

        expect(storage.get("test1", "string")).toBe("string");
        expect(storage.get("test2", 123)).toBe(123);
        expect(storage.get("test3", true)).toBe(true);
        expect(storage.get("test4", [])).toEqual([]);
        expect(storage.get("test5", {})).toEqual({});
        expect(storage.get("test6", null)).toBeNull();
      });

      it("should handle undefined as default value", () => {
        mockLocalStorage.getItem.mockReturnValue(null);

        const result = storage.get("test", undefined);

        expect(result).toBeUndefined();
      });
    });

    describe("error handling", () => {
      it("should return default value when JSON parsing fails", () => {
        mockLocalStorage.getItem.mockReturnValue("invalid json {");

        const defaultValue = { error: "fallback" };
        const result = storage.get("corrupted", defaultValue);

        expect(result).toEqual(defaultValue);
      });

      it("should return default value when localStorage.getItem throws", () => {
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error("Storage access denied");
        });

        const defaultValue = "safe fallback";
        const result = storage.get("blocked", defaultValue);

        expect(result).toBe(defaultValue);
      });

      it("should handle partial JSON parsing errors", () => {
        const testCases = [
          "undefined",
          "{invalid: json}",
          "[1,2,3,]", // Trailing comma
          '{"incomplete": ',
          "{'single': 'quotes'}",
        ];

        testCases.forEach((invalidJson) => {
          mockLocalStorage.getItem.mockReturnValue(invalidJson);

          const result = storage.get("invalid", "default");
          expect(result).toBe("default");
        });
      });

      it("should handle empty string from localStorage", () => {
        mockLocalStorage.getItem.mockReturnValue("");

        const result = storage.get("empty", "default");

        expect(result).toBe("default");
      });
    });

    describe("edge cases", () => {
      it("should handle complex nested objects", () => {
        const complexData = {
          user: {
            profile: {
              settings: {
                theme: "dark",
                notifications: {
                  email: true,
                  push: false,
                },
              },
            },
          },
          metadata: {
            version: "1.0.0",
            features: ["feature1", "feature2"],
          },
        };

        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(complexData));

        const result = storage.get("complex", {});

        expect(result).toEqual(complexData);
      });

      it("should handle special characters in data", () => {
        const specialData = {
          text: "Hello 🌟 World! àáâãäåæçèé",
          symbols: "!@#$%^&*()_+-=[]{}|;':\",./<>?",
          unicode: "测试 データ тест",
        };

        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(specialData));

        const result = storage.get("special", {});

        expect(result).toEqual(specialData);
      });

      it("should handle very large data", () => {
        const largeArray = Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          data: `item-${i}`.repeat(100),
        }));

        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(largeArray));

        const result = storage.get("large", []);

        expect(result).toHaveLength(1000);
        expect(result[0]).toEqual({ id: 0, data: "item-0".repeat(100) });
      });
    });
  });

  describe("set", () => {
    describe("successful storage", () => {
      it("should store object data as JSON", () => {
        const testData = { name: "Jane", age: 25 };

        storage.set("user", testData);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith("user", JSON.stringify(testData));
      });

      it("should store primitive values", () => {
        const testCases = [
          { key: "string", value: "test", expected: '"test"' },
          { key: "number", value: 42, expected: "42" },
          { key: "boolean", value: true, expected: "true" },
          { key: "null", value: null, expected: "null" },
        ];

        testCases.forEach(({ key, value, expected }) => {
          storage.set(key, value);
          expect(mockLocalStorage.setItem).toHaveBeenCalledWith(key, expected);
        });
      });

      it("should store array data", () => {
        const testArray = [1, "two", { three: 3 }, null, true];

        storage.set("array", testArray);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith("array", JSON.stringify(testArray));
      });

      it("should store undefined as JSON", () => {
        storage.set("undefined", undefined);

        // JSON.stringify(undefined) returns undefined, so setItem is called with undefined
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith("undefined", undefined);
      });
    });

    describe("error handling", () => {
      it("should fail silently when localStorage.setItem throws quota error", () => {
        mockLocalStorage.setItem.mockImplementation(() => {
          const error = new Error("QuotaExceededError");
          error.name = "QuotaExceededError";
          throw error;
        });

        expect(() => storage.set("test", { large: "data" })).not.toThrow();
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith("test", '{"large":"data"}');
      });

      it("should fail silently when localStorage.setItem throws other errors", () => {
        mockLocalStorage.setItem.mockImplementation(() => {
          throw new Error("Storage access denied");
        });

        expect(() => storage.set("blocked", "data")).not.toThrow();
      });

      it("should handle JSON.stringify errors gracefully", () => {
        // Create circular reference
        const circular: { name: string; self?: unknown } = { name: "test" };
        circular.self = circular;

        expect(() => storage.set("circular", circular)).not.toThrow();
      });

      it("should handle storing functions (which JSON.stringify ignores)", () => {
        const objectWithFunction = {
          name: "test",
          method: () => "hello",
          arrow: () => "world",
        };

        storage.set("functions", objectWithFunction);

        // Functions should be ignored by JSON.stringify
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith("functions", '{"name":"test"}');
      });
    });

    describe("data types and serialization", () => {
      it("should properly serialize Date objects", () => {
        const date = new Date("2024-06-15T12:00:00Z");

        storage.set("date", date);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith("date", JSON.stringify(date));
      });

      it("should handle nested objects with various types", () => {
        const complexObject = {
          string: "text",
          number: 123,
          boolean: true,
          null: null,
          array: [1, 2, 3],
          nested: {
            deep: {
              value: "nested",
            },
          },
          date: new Date("2024-01-01"),
        };

        storage.set("complex", complexObject);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith("complex", JSON.stringify(complexObject));
      });

      it("should handle empty values", () => {
        const testCases = [
          { key: "emptyString", value: "" },
          { key: "emptyArray", value: [] },
          { key: "emptyObject", value: {} },
          { key: "zero", value: 0 },
          { key: "false", value: false },
        ];

        testCases.forEach(({ key, value }) => {
          storage.set(key, value);
          expect(mockLocalStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(value));
        });
      });
    });
  });

  describe("remove", () => {
    describe("successful removal", () => {
      it("should call localStorage.removeItem with correct key", () => {
        storage.remove("testKey");

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("testKey");
      });

      it("should handle removing non-existent keys", () => {
        storage.remove("nonExistent");

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("nonExistent");
      });

      it("should handle special character keys", () => {
        const specialKeys = [
          "key with spaces",
          "key-with-dashes",
          "key_with_underscores",
          "key.with.dots",
          "key@with#symbols",
        ];

        specialKeys.forEach((key) => {
          storage.remove(key);
          expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(key);
        });
      });
    });

    describe("error handling", () => {
      it("should fail silently when localStorage.removeItem throws", () => {
        mockLocalStorage.removeItem.mockImplementation(() => {
          throw new Error("Remove access denied");
        });

        expect(() => storage.remove("blocked")).not.toThrow();
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("blocked");
      });

      it("should handle undefined or null keys gracefully", () => {
        expect(() => storage.remove(undefined as unknown as string)).not.toThrow();
        expect(() => storage.remove(null as unknown as string)).not.toThrow();
      });
    });
  });

  describe("clear", () => {
    describe("successful clearing", () => {
      it("should call localStorage.clear", () => {
        storage.clear();

        expect(mockLocalStorage.clear).toHaveBeenCalled();
      });
    });

    describe("error handling", () => {
      it("should fail silently when localStorage.clear throws", () => {
        mockLocalStorage.clear.mockImplementation(() => {
          throw new Error("Clear access denied");
        });

        expect(() => storage.clear()).not.toThrow();
        expect(mockLocalStorage.clear).toHaveBeenCalled();
      });
    });
  });

  describe("integration scenarios", () => {
    it("should handle full CRUD operations", () => {
      const userData = { id: 1, name: "John", preferences: { theme: "dark" } };

      // Create
      storage.set("user", userData);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("user", JSON.stringify(userData));

      // Read
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(userData));
      const retrieved = storage.get("user", {});
      expect(retrieved).toEqual(userData);

      // Update
      const updatedUser = { ...userData, name: "Jane" };
      storage.set("user", updatedUser);
      expect(mockLocalStorage.setItem).toHaveBeenLastCalledWith("user", JSON.stringify(updatedUser));

      // Delete
      storage.remove("user");
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("user");
    });

    it("should handle session-like data management", () => {
      const sessionData = {
        token: "abc123",
        user: { id: 1, email: "user@example.com" },
        expiresAt: new Date("2024-12-31T23:59:59Z"),
        permissions: ["read", "write"],
      };

      // Store session
      storage.set("session", sessionData);

      // Retrieve session - Date objects become strings after JSON serialization
      const expectedSessionAfterSerialization = {
        token: "abc123",
        user: { id: 1, email: "user@example.com" },
        expiresAt: "2024-12-31T23:59:59.000Z", // Date becomes ISO string
        permissions: ["read", "write"],
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionData));
      const session = storage.get("session", null);
      expect(session).toEqual(expectedSessionAfterSerialization);

      // Clear session
      storage.remove("session");

      // Verify removal
      mockLocalStorage.getItem.mockReturnValue(null);
      const clearedSession = storage.get("session", null);
      expect(clearedSession).toBeNull();
    });

    it("should handle multiple concurrent operations", () => {
      const operations = [
        { key: "key1", value: "value1" },
        { key: "key2", value: { nested: "object" } },
        { key: "key3", value: [1, 2, 3] },
        { key: "key4", value: true },
        { key: "key5", value: null },
      ];

      // Store all
      operations.forEach(({ key, value }) => {
        storage.set(key, value);
      });

      // Verify all storage calls
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(5);

      // Remove all
      operations.forEach(({ key }) => {
        storage.remove(key);
      });

      // Verify all removal calls
      expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(5);
    });
  });

  describe("browser environment simulation", () => {
    it("should handle localStorage being unavailable", () => {
      // Simulate environment without localStorage
      Object.defineProperty(global, "localStorage", {
        value: undefined,
        writable: true,
      });

      // Operations should still not throw
      expect(() => storage.set("test", "value")).not.toThrow();
      expect(() => storage.get("test", "default")).not.toThrow();
      expect(() => storage.remove("test")).not.toThrow();
      expect(() => storage.clear()).not.toThrow();
    });

    it("should handle private/incognito mode restrictions", () => {
      // Simulate incognito mode where setItem throws
      Object.defineProperty(global, "localStorage", {
        value: {
          getItem: vi.fn().mockReturnValue(null),
          setItem: vi.fn().mockImplementation(() => {
            throw new DOMException("QuotaExceededError");
          }),
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        writable: true,
      });

      expect(() => storage.set("test", "value")).not.toThrow();
      expect(storage.get("test", "default")).toBe("default");
    });
  });
});
