import { describe, it, expect } from "vitest";
import { groupBy, uniqueBy, chunk } from "../../../lib/utils";

/**
 * Test suite for array utility functions
 * Priority: MEDIUM - requires ≥80% coverage according to test plan
 */

describe("groupBy", () => {
  describe("basic grouping functionality", () => {
    it("should group objects by string key", () => {
      const data = [
        { type: "A", value: 1 },
        { type: "B", value: 2 },
        { type: "A", value: 3 },
        { type: "C", value: 4 },
        { type: "B", value: 5 },
      ];

      const result = groupBy(data, "type");

      expect(result).toEqual({
        A: [
          { type: "A", value: 1 },
          { type: "A", value: 3 },
        ],
        B: [
          { type: "B", value: 2 },
          { type: "B", value: 5 },
        ],
        C: [{ type: "C", value: 4 }],
      });
    });

    it("should group objects by number key", () => {
      const data = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
        { id: 1, name: "Charlie" },
        { id: 3, name: "David" },
      ];

      const result = groupBy(data, "id");

      expect(result).toEqual({
        "1": [
          { id: 1, name: "Alice" },
          { id: 1, name: "Charlie" },
        ],
        "2": [{ id: 2, name: "Bob" }],
        "3": [{ id: 3, name: "David" }],
      });
    });

    it("should group objects by boolean key", () => {
      const data = [
        { active: true, name: "John" },
        { active: false, name: "Jane" },
        { active: true, name: "Bob" },
        { active: false, name: "Alice" },
      ];

      const result = groupBy(data, "active");

      expect(result).toEqual({
        true: [
          { active: true, name: "John" },
          { active: true, name: "Bob" },
        ],
        false: [
          { active: false, name: "Jane" },
          { active: false, name: "Alice" },
        ],
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty array", () => {
      const result = groupBy([], "type");
      expect(result).toEqual({});
    });

    it("should handle array with single item", () => {
      const data = [{ category: "test", value: 42 }];
      const result = groupBy(data, "category");

      expect(result).toEqual({
        test: [{ category: "test", value: 42 }],
      });
    });

    it("should handle missing keys", () => {
      const data = [
        { name: "Alice", age: 25 },
        { name: "Bob" }, // Missing age
        { name: "Charlie", age: 30 },
      ];

      const result = groupBy(data, "age" as keyof (typeof data)[0]);

      expect(result).toEqual({
        "25": [{ name: "Alice", age: 25 }],
        undefined: [{ name: "Bob" }],
        "30": [{ name: "Charlie", age: 30 }],
      });
    });

    it("should handle null and undefined values", () => {
      const data = [
        { status: "active", name: "John" },
        { status: null, name: "Jane" },
        { status: undefined, name: "Bob" },
        { status: "inactive", name: "Alice" },
      ];

      const result = groupBy(data, "status");

      expect(result).toEqual({
        active: [{ status: "active", name: "John" }],
        null: [{ status: null, name: "Jane" }],
        undefined: [{ status: undefined, name: "Bob" }],
        inactive: [{ status: "inactive", name: "Alice" }],
      });
    });

    it("should handle objects with numeric string keys", () => {
      const data = [
        { level: "1", name: "Beginner" },
        { level: "2", name: "Intermediate" },
        { level: "1", name: "Novice" },
      ];

      const result = groupBy(data, "level");

      expect(result).toEqual({
        "1": [
          { level: "1", name: "Beginner" },
          { level: "1", name: "Novice" },
        ],
        "2": [{ level: "2", name: "Intermediate" }],
      });
    });
  });

  describe("complex data types", () => {
    interface FlashCard {
      id: number;
      status: "new" | "learning" | "review" | "mastered";
      source: "manual" | "ai" | "mixed";
      repetitionCount: number;
    }

    it("should group flashcards by status", () => {
      const flashcards: FlashCard[] = [
        { id: 1, status: "new", source: "manual", repetitionCount: 0 },
        { id: 2, status: "learning", source: "ai", repetitionCount: 1 },
        { id: 3, status: "new", source: "mixed", repetitionCount: 0 },
        { id: 4, status: "review", source: "manual", repetitionCount: 3 },
        { id: 5, status: "learning", source: "ai", repetitionCount: 2 },
      ];

      const result = groupBy(flashcards, "status");

      expect(result.new).toHaveLength(2);
      expect(result.learning).toHaveLength(2);
      expect(result.review).toHaveLength(1);
      expect(result.mastered).toBeUndefined();
    });

    it("should group by nested object properties", () => {
      const data = [
        { user: { role: "admin" }, action: "create" },
        { user: { role: "user" }, action: "read" },
        { user: { role: "admin" }, action: "delete" },
        { user: { role: "moderator" }, action: "update" },
      ];

      // Note: groupBy doesn't support nested properties directly,
      // but we can test with a key that exists
      type DataType = (typeof data)[0];
      const result = groupBy(data, "action" as keyof DataType);

      expect(Object.keys(result)).toEqual(["create", "read", "delete", "update"]);
    });
  });

  describe("large datasets", () => {
    it("should handle large arrays efficiently", () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        category: `cat${i % 100}`, // 100 different categories
        value: i,
      }));

      const result = groupBy(largeData, "category");

      expect(Object.keys(result)).toHaveLength(100);
      expect(result.cat0).toHaveLength(100); // Each category should have 100 items
      expect(result.cat99[0].value).toBe(99);
      expect(result.cat99[99].value).toBe(9999);
    });

    it("should maintain insertion order within groups", () => {
      const data = [
        { type: "A", order: 1 },
        { type: "B", order: 2 },
        { type: "A", order: 3 },
        { type: "B", order: 4 },
        { type: "A", order: 5 },
      ];

      const result = groupBy(data, "type");

      expect(result.A.map((item) => item.order)).toEqual([1, 3, 5]);
      expect(result.B.map((item) => item.order)).toEqual([2, 4]);
    });
  });
});

describe("uniqueBy", () => {
  describe("basic uniqueness functionality", () => {
    it("should remove duplicates by string key", () => {
      const data = [
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
        { id: "1", name: "Charlie" }, // Duplicate id
        { id: "3", name: "David" },
      ];

      const result = uniqueBy(data, "id");

      expect(result).toEqual([
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
        { id: "3", name: "David" },
      ]);
      expect(result).toHaveLength(3);
    });

    it("should remove duplicates by number key", () => {
      const data = [
        { priority: 1, task: "Task A" },
        { priority: 2, task: "Task B" },
        { priority: 1, task: "Task C" }, // Duplicate priority
        { priority: 3, task: "Task D" },
        { priority: 2, task: "Task E" }, // Duplicate priority
      ];

      const result = uniqueBy(data, "priority");

      expect(result).toEqual([
        { priority: 1, task: "Task A" },
        { priority: 2, task: "Task B" },
        { priority: 3, task: "Task D" },
      ]);
    });

    it("should keep first occurrence of duplicates", () => {
      const data = [
        { email: "alice@test.com", role: "admin" },
        { email: "bob@test.com", role: "user" },
        { email: "alice@test.com", role: "moderator" }, // Should be filtered out
      ];

      const result = uniqueBy(data, "email");

      expect(result[0]).toEqual({ email: "alice@test.com", role: "admin" });
      expect(result).toHaveLength(2);
    });
  });

  describe("edge cases", () => {
    it("should handle empty array", () => {
      const result = uniqueBy([], "id");
      expect(result).toEqual([]);
    });

    it("should handle array with single item", () => {
      const data = [{ id: 1, value: "test" }];
      const result = uniqueBy(data, "id");

      expect(result).toEqual([{ id: 1, value: "test" }]);
    });

    it("should handle array with no duplicates", () => {
      const data = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
        { id: 3, name: "Charlie" },
      ];

      const result = uniqueBy(data, "id");

      expect(result).toEqual(data);
      expect(result).toHaveLength(3);
    });

    it("should handle all duplicates", () => {
      const data = [
        { status: "active", count: 1 },
        { status: "active", count: 2 },
        { status: "active", count: 3 },
      ];

      const result = uniqueBy(data, "status");

      expect(result).toEqual([{ status: "active", count: 1 }]);
      expect(result).toHaveLength(1);
    });

    it("should handle null and undefined values in key", () => {
      const data = [
        { id: null, name: "Alice" },
        { id: 1, name: "Bob" },
        { id: null, name: "Charlie" }, // Duplicate null
        { id: undefined, name: "David" },
        { id: undefined, name: "Eve" }, // Duplicate undefined
        { id: 1, name: "Frank" }, // Duplicate 1
      ];

      const result = uniqueBy(data, "id");

      expect(result).toEqual([
        { id: null, name: "Alice" },
        { id: 1, name: "Bob" },
        { id: undefined, name: "David" },
      ]);
      expect(result).toHaveLength(3);
    });
  });

  describe("different data types", () => {
    it("should handle boolean keys", () => {
      const data = [
        { active: true, name: "John" },
        { active: false, name: "Jane" },
        { active: true, name: "Bob" }, // Duplicate true
        { active: false, name: "Alice" }, // Duplicate false
      ];

      const result = uniqueBy(data, "active");

      expect(result).toEqual([
        { active: true, name: "John" },
        { active: false, name: "Jane" },
      ]);
    });

    it("should handle date keys", () => {
      const date1 = new Date("2024-01-01");
      const date2 = new Date("2024-01-02");
      const date3 = new Date("2024-01-01"); // Same as date1 but different object

      const data = [
        { date: date1, event: "Event 1" },
        { date: date2, event: "Event 2" },
        { date: date3, event: "Event 3" }, // Different object, same value
      ];

      const result = uniqueBy(data, "date");

      // Since date objects are compared by reference, not value
      expect(result).toHaveLength(3);
    });

    it("should handle object keys (by reference)", () => {
      const obj1 = { nested: true };
      const obj2 = { nested: false };

      const data = [
        { config: obj1, name: "Config A" },
        { config: obj2, name: "Config B" },
        { config: obj1, name: "Config C" }, // Same reference
      ];

      const result = uniqueBy(data, "config");

      expect(result).toEqual([
        { config: obj1, name: "Config A" },
        { config: obj2, name: "Config B" },
      ]);
    });
  });

  describe("real-world scenarios", () => {
    interface User {
      id: number;
      email: string;
      name: string;
      lastLogin: string;
    }

    it("should deduplicate users by email", () => {
      const users: User[] = [
        { id: 1, email: "alice@example.com", name: "Alice Smith", lastLogin: "2024-01-01" },
        { id: 2, email: "bob@example.com", name: "Bob Jones", lastLogin: "2024-01-02" },
        { id: 3, email: "alice@example.com", name: "Alice Johnson", lastLogin: "2024-01-03" }, // Duplicate email
        { id: 4, email: "charlie@example.com", name: "Charlie Brown", lastLogin: "2024-01-04" },
      ];

      const result = uniqueBy(users, "email");

      expect(result).toHaveLength(3);
      expect(result.map((u) => u.email)).toEqual(["alice@example.com", "bob@example.com", "charlie@example.com"]);
      // Should keep first Alice (Smith, not Johnson)
      expect(result[0].name).toBe("Alice Smith");
    });

    it("should handle large datasets", () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i % 1000, // 1000 unique IDs, repeated 10 times each
        value: `value-${i}`,
      }));

      const result = uniqueBy(largeData, "id");

      expect(result).toHaveLength(1000);
      expect(result[0].value).toBe("value-0"); // First occurrence
      expect(result[999].value).toBe("value-999");
    });
  });
});

describe("chunk", () => {
  describe("basic chunking functionality", () => {
    it("should split array into chunks of specified size", () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = chunk(data, 3);

      expect(result).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]);
    });

    it("should handle array that doesn't divide evenly", () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8];
      const result = chunk(data, 3);

      expect(result).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8],
      ]);
    });

    it("should handle chunk size larger than array", () => {
      const data = [1, 2, 3];
      const result = chunk(data, 5);

      expect(result).toEqual([[1, 2, 3]]);
    });

    it("should handle chunk size equal to array length", () => {
      const data = [1, 2, 3, 4];
      const result = chunk(data, 4);

      expect(result).toEqual([[1, 2, 3, 4]]);
    });

    it("should handle chunk size of 1", () => {
      const data = [1, 2, 3, 4];
      const result = chunk(data, 1);

      expect(result).toEqual([[1], [2], [3], [4]]);
    });
  });

  describe("edge cases", () => {
    it("should handle empty array", () => {
      const result = chunk([], 3);
      expect(result).toEqual([]);
    });

    it("should handle chunk size of 0", () => {
      const data = [1, 2, 3];
      const result = chunk(data, 0);

      expect(result).toEqual([]);
    });

    it("should handle negative chunk size", () => {
      const data = [1, 2, 3];
      const result = chunk(data, -1);

      expect(result).toEqual([]);
    });

    it("should handle single item array", () => {
      const data = [42];
      const result = chunk(data, 1);

      expect(result).toEqual([[42]]);
    });

    it("should handle single item with larger chunk size", () => {
      const data = [42];
      const result = chunk(data, 5);

      expect(result).toEqual([[42]]);
    });
  });

  describe("different data types", () => {
    it("should chunk array of strings", () => {
      const data = ["a", "b", "c", "d", "e"];
      const result = chunk(data, 2);

      expect(result).toEqual([["a", "b"], ["c", "d"], ["e"]]);
    });

    it("should chunk array of objects", () => {
      const data = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
        { id: 3, name: "Charlie" },
        { id: 4, name: "David" },
        { id: 5, name: "Eve" },
      ];

      const result = chunk(data, 2);

      expect(result).toEqual([
        [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ],
        [
          { id: 3, name: "Charlie" },
          { id: 4, name: "David" },
        ],
        [{ id: 5, name: "Eve" }],
      ]);
    });

    it("should chunk mixed data types", () => {
      const data = [1, "two", { three: 3 }, [4], null, undefined];
      const result = chunk(data, 3);

      expect(result).toEqual([
        [1, "two", { three: 3 }],
        [[4], null, undefined],
      ]);
    });
  });

  describe("real-world scenarios", () => {
    it("should chunk flashcards for pagination", () => {
      interface FlashCard {
        id: number;
        front: string;
        back: string;
      }

      const flashcards: FlashCard[] = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        front: `Question ${i + 1}`,
        back: `Answer ${i + 1}`,
      }));

      const pageSize = 10;
      const pages = chunk(flashcards, pageSize);

      expect(pages).toHaveLength(3);
      expect(pages[0]).toHaveLength(10);
      expect(pages[1]).toHaveLength(10);
      expect(pages[2]).toHaveLength(5);

      expect(pages[0][0].id).toBe(1);
      expect(pages[1][0].id).toBe(11);
      expect(pages[2][0].id).toBe(21);
    });

    it("should chunk for batch processing", () => {
      const items = Array.from({ length: 1000 }, (_, i) => i + 1);
      const batchSize = 100;
      const batches = chunk(items, batchSize);

      expect(batches).toHaveLength(10);
      expect(batches.every((batch) => batch.length === batchSize)).toBe(true);

      // Verify no items are lost
      const allItems = batches.flat();
      expect(allItems).toHaveLength(1000);
      expect(allItems[0]).toBe(1);
      expect(allItems[999]).toBe(1000);
    });

    it("should handle large arrays efficiently", () => {
      const largeArray = Array.from({ length: 100000 }, (_, i) => i);
      const chunkSize = 1000;

      const start = Date.now();
      const result = chunk(largeArray, chunkSize);
      const duration = Date.now() - start;

      expect(result).toHaveLength(100);
      expect(result[0]).toHaveLength(chunkSize);
      expect(result[99]).toHaveLength(chunkSize);

      // Performance check - should complete quickly
      expect(duration).toBeLessThan(100); // Less than 100ms
    });
  });

  describe("immutability", () => {
    it("should not modify original array", () => {
      const original = [1, 2, 3, 4, 5, 6];
      const originalCopy = [...original];

      chunk(original, 2);

      expect(original).toEqual(originalCopy);
    });

    it("should create new arrays for chunks", () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
      const result = chunk(data, 2);

      // Modify original array
      data[0].id = 999;

      // Chunks should reference same objects (shallow copy behavior)
      expect(result[0][0].id).toBe(999);

      // But chunks themselves are new arrays
      expect(result[0]).not.toBe(data);
    });
  });
});
