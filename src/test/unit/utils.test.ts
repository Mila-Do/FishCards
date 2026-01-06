import { describe, it, expect, vi } from "vitest";

// Example utility function to test
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function calculateTotal(items: { price: number; quantity: number }[]): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

describe("Utility functions", () => {
  describe("formatDate", () => {
    it("should format date correctly", () => {
      // Arrange
      const testDate = new Date("2024-01-15T10:30:00Z");

      // Act
      const result = formatDate(testDate);

      // Assert
      expect(result).toBe("2024-01-15");
    });

    it("should handle different date formats", () => {
      const testDate = new Date("2024-01-15T00:00:00.000Z"); // UTC date
      const result = formatDate(testDate);

      expect(result).toMatchInlineSnapshot('"2024-01-15"');
    });
  });

  describe("calculateTotal", () => {
    it("should calculate total for multiple items", () => {
      // Arrange
      const items = [
        { price: 10, quantity: 2 },
        { price: 5, quantity: 3 },
      ];

      // Act
      const total = calculateTotal(items);

      // Assert
      expect(total).toBe(35);
    });

    it("should return 0 for empty array", () => {
      expect(calculateTotal([])).toBe(0);
    });

    it("should handle zero quantities", () => {
      const items = [{ price: 10, quantity: 0 }];
      expect(calculateTotal(items)).toBe(0);
    });
  });

  describe("Mocking example", () => {
    it("should demonstrate vi.fn() usage", () => {
      // Arrange
      const mockCallback = vi.fn();
      const testArray = [1, 2, 3];

      // Act
      testArray.forEach(mockCallback);

      // Assert
      expect(mockCallback).toHaveBeenCalledTimes(3);
      expect(mockCallback).toHaveBeenCalledWith(1, 0, testArray);
      expect(mockCallback).toHaveBeenLastCalledWith(3, 2, testArray);
    });
  });
});
