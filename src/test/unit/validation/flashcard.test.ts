import { describe, it, expect } from "vitest";
import {
  validateCreateFlashcard,
  validateUpdateFlashcard,
  validateStatusTransition,
  validateFlashcardUniqueness,
  validateRepetitionCount,
  isValidFlashcardStatus,
  isValidFlashcardSource,
} from "../../../lib/validation/flashcard";
import type { CreateFlashcardCommand, UpdateFlashcardCommand, FlashcardStatus, FlashcardSource } from "../../../types";

/**
 * Test suite for flashcard validation functions
 * Priority: CRITICAL - requires ≥95% coverage according to test plan
 */

describe("validateCreateFlashcard", () => {
  describe("when valid data provided", () => {
    it("should return valid result for correct flashcard with minimal data", () => {
      const input: CreateFlashcardCommand = {
        front: "What is the capital of Poland?",
        back: "Warsaw",
      };

      const result = validateCreateFlashcard(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.fieldErrors).toEqual({});
    });

    it("should return valid result for flashcard with all optional fields", () => {
      const input: CreateFlashcardCommand = {
        front: "What is React?",
        back: "A JavaScript library for building user interfaces",
        source: "manual" as FlashcardSource,
        generation_id: 123,
      };

      const result = validateCreateFlashcard(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.fieldErrors).toEqual({});
    });

    it("should handle null generation_id correctly", () => {
      const input: CreateFlashcardCommand = {
        front: "Valid question?",
        back: "Valid answer.",
        source: "ai" as FlashcardSource,
        generation_id: null,
      };

      const result = validateCreateFlashcard(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.fieldErrors).toEqual({});
    });

    it("should handle undefined optional fields", () => {
      const input: CreateFlashcardCommand = {
        front: "Question without optional fields",
        back: "Answer without optional fields",
        source: undefined,
        generation_id: undefined,
      };

      const result = validateCreateFlashcard(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.fieldErrors).toEqual({});
    });
  });

  describe("boundary conditions", () => {
    it("should accept front text at maximum length (200 characters)", () => {
      const input: CreateFlashcardCommand = {
        front: "A".repeat(200), // Exactly 200 characters
        back: "Answer",
      };

      const result = validateCreateFlashcard(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should accept back text at maximum length (500 characters)", () => {
      const input: CreateFlashcardCommand = {
        front: "Question",
        back: "B".repeat(500), // Exactly 500 characters
      };

      const result = validateCreateFlashcard(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should accept minimum text length (1 character)", () => {
      const input: CreateFlashcardCommand = {
        front: "A",
        back: "B",
      };

      const result = validateCreateFlashcard(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should accept generation_id at minimum valid value (1)", () => {
      const input: CreateFlashcardCommand = {
        front: "Question",
        back: "Answer",
        generation_id: 1,
      };

      const result = validateCreateFlashcard(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe("when invalid data provided", () => {
    it("should return field-specific errors for empty front", () => {
      const input: CreateFlashcardCommand = {
        front: "",
        back: "Valid answer",
      };

      const result = validateCreateFlashcard(input);

      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.front).toContain("To pole jest wymagane");
      expect(result.errors).toContain("To pole jest wymagane");
    });

    it("should return field-specific errors for empty back", () => {
      const input: CreateFlashcardCommand = {
        front: "Valid question",
        back: "",
      };

      const result = validateCreateFlashcard(input);

      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.back).toContain("To pole jest wymagane");
      expect(result.errors).toContain("To pole jest wymagane");
    });

    it("should return errors for both empty front and back", () => {
      const input: CreateFlashcardCommand = {
        front: "",
        back: "",
      };

      const result = validateCreateFlashcard(input);

      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.front).toContain("To pole jest wymagane");
      expect(result.fieldErrors.back).toContain("To pole jest wymagane");
      expect(result.errors).toHaveLength(2);
    });

    it("should reject front text exceeding maximum length (201 characters)", () => {
      const input: CreateFlashcardCommand = {
        front: "A".repeat(201), // 201 characters - too long
        back: "Answer",
      };

      const result = validateCreateFlashcard(input);

      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.front).toContain("Maksimum 200 znaków");
      expect(result.errors).toContain("Maksimum 200 znaków");
    });

    it("should reject back text exceeding maximum length (501 characters)", () => {
      const input: CreateFlashcardCommand = {
        front: "Question",
        back: "B".repeat(501), // 501 characters - too long
      };

      const result = validateCreateFlashcard(input);

      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.back).toContain("Maksimum 500 znaków");
      expect(result.errors).toContain("Maksimum 500 znaków");
    });

    it("should reject invalid source values", () => {
      const input = {
        front: "Question",
        back: "Answer",
        source: "invalid_source" as FlashcardSource, // Invalid source
      };

      const result = validateCreateFlashcard(input);

      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.source).toContain("Nieprawidłowe źródło fiszki");
      expect(result.errors).toContain("Nieprawidłowe źródło fiszki");
    });

    it("should reject invalid generation_id values", () => {
      const testCases = [
        { generation_id: 0, description: "zero" },
        { generation_id: -1, description: "negative" },
        { generation_id: 1.5, description: "decimal" },
      ];

      testCases.forEach(({ generation_id, description }) => {
        const input = {
          front: "Question",
          back: "Answer",
          generation_id,
        };

        const result = validateCreateFlashcard(input);

        expect(result.isValid, `Failed for ${description} generation_id: ${generation_id}`).toBe(false);
        expect(result.fieldErrors.generation_id, `Missing error for ${description} generation_id`).toContain(
          "Nieprawidłowy identyfikator generacji"
        );
      });
    });

    it("should accumulate multiple validation errors", () => {
      const input = {
        front: "A".repeat(201), // Too long
        back: "", // Empty
        source: "invalid" as FlashcardSource, // Invalid source
        generation_id: -5, // Invalid generation_id
      };

      const result = validateCreateFlashcard(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.fieldErrors.front).toBeDefined();
      expect(result.fieldErrors.back).toBeDefined();
      expect(result.fieldErrors.source).toBeDefined();
      expect(result.fieldErrors.generation_id).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("should handle whitespace-only text correctly", () => {
      const input: CreateFlashcardCommand = {
        front: "   ",
        back: "\t\n",
      };

      const result = validateCreateFlashcard(input);

      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.front).toContain("To pole jest wymagane");
      expect(result.fieldErrors.back).toContain("To pole jest wymagane");
    });

    it("should handle Polish characters and diacritics", () => {
      const input: CreateFlashcardCommand = {
        front: "Jaką stolicą jest Kraków?",
        back: "Kraków nie jest stolicą, ale był nią w przeszłości",
      };

      const result = validateCreateFlashcard(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should handle special characters and symbols", () => {
      const input: CreateFlashcardCommand = {
        front: "What is 2 + 2 = ?",
        back: "4 (mathematical equation: 2+2=4)",
      };

      const result = validateCreateFlashcard(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should handle HTML-like content", () => {
      const input: CreateFlashcardCommand = {
        front: "What does <div> tag do?",
        back: "It creates a block-level container in HTML",
      };

      const result = validateCreateFlashcard(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should handle emojis and Unicode characters", () => {
      const input: CreateFlashcardCommand = {
        front: "What does 😊 represent?",
        back: "A smiling face emoji (Unicode: U+1F60A)",
      };

      const result = validateCreateFlashcard(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should handle newlines and tabs in text", () => {
      const input: CreateFlashcardCommand = {
        front: "Multi-line\nquestion\twith tabs",
        back: "Multi-line\nanswer\twith formatting",
      };

      const result = validateCreateFlashcard(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe("all valid source values", () => {
    it("should accept 'manual' source", () => {
      const input: CreateFlashcardCommand = {
        front: "Question",
        back: "Answer",
        source: "manual",
      };

      const result = validateCreateFlashcard(input);
      expect(result.isValid).toBe(true);
    });

    it("should accept 'ai' source", () => {
      const input: CreateFlashcardCommand = {
        front: "Question",
        back: "Answer",
        source: "ai",
      };

      const result = validateCreateFlashcard(input);
      expect(result.isValid).toBe(true);
    });

    it("should accept 'mixed' source", () => {
      const input: CreateFlashcardCommand = {
        front: "Question",
        back: "Answer",
        source: "mixed",
      };

      const result = validateCreateFlashcard(input);
      expect(result.isValid).toBe(true);
    });
  });
});

describe("isValidFlashcardStatus", () => {
  it("should validate correct status values", () => {
    const validStatuses: FlashcardStatus[] = ["new", "learning", "review", "mastered"];

    validStatuses.forEach((status) => {
      expect(isValidFlashcardStatus(status), `${status} should be valid`).toBe(true);
    });
  });

  it("should reject invalid status values", () => {
    const invalidStatuses = ["invalid", "unknown", "", "NEW", "Learning"];

    invalidStatuses.forEach((status) => {
      expect(isValidFlashcardStatus(status), `${status} should be invalid`).toBe(false);
    });
  });
});

describe("isValidFlashcardSource", () => {
  it("should validate correct source values", () => {
    const validSources: FlashcardSource[] = ["manual", "ai", "mixed"];

    validSources.forEach((source) => {
      expect(isValidFlashcardSource(source), `${source} should be valid`).toBe(true);
    });
  });

  it("should reject invalid source values", () => {
    const invalidSources = ["invalid", "auto", "", "MANUAL", "Ai"];

    invalidSources.forEach((source) => {
      expect(isValidFlashcardSource(source), `${source} should be invalid`).toBe(false);
    });
  });
});

describe("validateRepetitionCount", () => {
  it("should accept valid repetition counts", () => {
    const validCounts = [0, 1, 5, 100, 999, 1000];

    validCounts.forEach((count) => {
      const result = validateRepetitionCount(count);
      expect(result.isValid, `Count ${count} should be valid`).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  it("should reject negative repetition counts", () => {
    const negativeCounts = [-1, -5, -100];

    negativeCounts.forEach((count) => {
      const result = validateRepetitionCount(count);
      expect(result.isValid, `Count ${count} should be invalid`).toBe(false);
      expect(result.errors).toContain("Liczba powtórzeń nie może być ujemna");
    });
  });

  it("should reject non-integer repetition counts", () => {
    const nonIntegers = [1.5, 2.7, 0.1, Math.PI];

    nonIntegers.forEach((count) => {
      const result = validateRepetitionCount(count);
      expect(result.isValid, `Count ${count} should be invalid`).toBe(false);
      expect(result.errors).toContain("Liczba powtórzeń musi być liczbą całkowitą");
    });
  });

  it("should reject excessively large repetition counts", () => {
    const largeCounts = [1001, 5000, 10000];

    largeCounts.forEach((count) => {
      const result = validateRepetitionCount(count);
      expect(result.isValid, `Count ${count} should be invalid`).toBe(false);
      expect(result.errors).toContain("Liczba powtórzeń jest zbyt duża");
    });
  });

  it("should handle boundary values correctly", () => {
    // Exactly at boundaries
    expect(validateRepetitionCount(0).isValid).toBe(true); // Min valid
    expect(validateRepetitionCount(1000).isValid).toBe(true); // Max valid
    expect(validateRepetitionCount(1001).isValid).toBe(false); // Just over max
  });
});

describe("validateStatusTransition", () => {
  describe("valid status transitions", () => {
    it("should allow new → learning transition", () => {
      const result = validateStatusTransition("new", "learning", 0);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should allow learning → review transition", () => {
      const result = validateStatusTransition("learning", "review", 1);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should allow learning → new transition (when struggling)", () => {
      const result = validateStatusTransition("learning", "new", 1);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should allow review → mastered transition with sufficient repetitions", () => {
      const result = validateStatusTransition("review", "mastered", 3);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should allow review → learning transition (when forgotten)", () => {
      const result = validateStatusTransition("review", "learning", 5);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should allow mastered → review transition (when refreshing)", () => {
      const result = validateStatusTransition("mastered", "review", 10);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe("invalid status transitions", () => {
    it("should reject new → review transition (must go through learning)", () => {
      const result = validateStatusTransition("new", "review", 0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Nowa fiszka musi najpierw przejść przez etap nauki");
    });

    it("should reject new → mastered transition", () => {
      const result = validateStatusTransition("new", "mastered", 0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`Nie można zmienić statusu z "new" na "mastered"`);
    });

    it("should reject learning → mastered without sufficient repetitions", () => {
      const testCases = [0, 1, 2];

      testCases.forEach((repetitionCount) => {
        const result = validateStatusTransition("learning", "mastered", repetitionCount);
        expect(result.isValid, `Should reject mastered with ${repetitionCount} repetitions`).toBe(false);
        expect(result.errors).toContain(
          "Fiszka musi być powtórzona co najmniej 3 razy przed oznaczeniem jako opanowana"
        );
      });
    });

    it("should reject review → mastered without sufficient repetitions", () => {
      const result = validateStatusTransition("review", "mastered", 2);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Fiszka musi być powtórzona co najmniej 3 razy przed oznaczeniem jako opanowana");
    });

    it("should reject invalid status transitions", () => {
      const invalidTransitions = [
        { from: "learning" as FlashcardStatus, to: "mastered" as FlashcardStatus, reps: 0 },
        { from: "mastered" as FlashcardStatus, to: "new" as FlashcardStatus, reps: 5 },
        { from: "mastered" as FlashcardStatus, to: "learning" as FlashcardStatus, reps: 10 },
      ];

      invalidTransitions.forEach(({ from, to, reps }) => {
        const result = validateStatusTransition(from, to, reps);
        expect(result.isValid, `${from} → ${to} should be invalid`).toBe(false);
        expect(result.errors.length, `Should have errors for ${from} → ${to}`).toBeGreaterThan(0);
      });
    });
  });

  describe("business rule validation", () => {
    it("should require minimum 3 repetitions for mastered status", () => {
      // Valid cases with enough repetitions
      [3, 4, 10, 100].forEach((reps) => {
        const result = validateStatusTransition("review", "mastered", reps);
        expect(result.isValid, `Should allow mastered with ${reps} reps`).toBe(true);
      });
    });

    it("should accumulate multiple errors for complex invalid transitions", () => {
      const result = validateStatusTransition("new", "review", 0);
      expect(result.isValid).toBe(false);
      // Should have error about invalid transition path
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe("validateFlashcardUniqueness", () => {
  describe("exact duplicate detection", () => {
    it("should detect exact duplicates (case insensitive)", () => {
      const existingFlashcards = [
        { front: "What is React?", back: "A JavaScript library" },
        { front: "What is Vue?", back: "A progressive framework" },
      ];

      const result = validateFlashcardUniqueness("What is React?", "A JavaScript library", existingFlashcards);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Fiszka o takiej treści już istnieje");
    });

    it("should detect duplicates with different casing", () => {
      const existingFlashcards = [{ front: "what is react?", back: "a javascript library" }];

      const result = validateFlashcardUniqueness("What Is React?", "A JavaScript Library", existingFlashcards);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Fiszka o takiej treści już istnieje");
    });

    it("should detect duplicates with extra whitespace", () => {
      const existingFlashcards = [{ front: "  What is React?  ", back: "  A JavaScript library  " }];

      const result = validateFlashcardUniqueness("What is React?", "A JavaScript library", existingFlashcards);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Fiszka o takiej treści już istnieje");
    });

    it("should allow unique content", () => {
      const existingFlashcards = [
        { front: "What is React?", back: "A JavaScript library" },
        { front: "What is Vue?", back: "A progressive framework" },
      ];

      const result = validateFlashcardUniqueness(
        "What is Angular?",
        "A TypeScript-based framework",
        existingFlashcards
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should handle empty existing flashcards array", () => {
      const result = validateFlashcardUniqueness("What is React?", "A JavaScript library", []);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe("similarity detection", () => {
    it("should detect very similar content (>90% similarity)", () => {
      const existingFlashcards = [{ front: "What is React?", back: "JavaScript library" }];

      // Very similar front (just added one character)
      const result = validateFlashcardUniqueness(
        "What is React??", // Very similar to "What is React?"
        "Different answer",
        existingFlashcards
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Znaleziono bardzo podobną fiszkę - sprawdź czy nie jest to duplikat");
    });

    it("should allow moderately similar content (<90% similarity)", () => {
      const existingFlashcards = [{ front: "What is React?", back: "JavaScript library" }];

      const result = validateFlashcardUniqueness(
        "What is Angular?", // Similar but different enough
        "TypeScript framework",
        existingFlashcards
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should prioritize exact duplicate over similarity warning", () => {
      const existingFlashcards = [
        { front: "What is React?", back: "JavaScript library" },
        { front: "What is React??", back: "Different answer" }, // Similar
      ];

      // Test exact duplicate - should not show similarity warning
      const result = validateFlashcardUniqueness("What is React?", "JavaScript library", existingFlashcards);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(["Fiszka o takiej treści już istnieje"]);
      expect(result.errors).not.toContain("Znaleziono bardzo podobną fiszkę");
    });
  });

  describe("edge cases", () => {
    it("should handle empty strings", () => {
      const existingFlashcards = [{ front: "Question", back: "Answer" }];

      const result = validateFlashcardUniqueness("", "", existingFlashcards);

      expect(result.isValid).toBe(true); // Empty strings are different from existing
      expect(result.errors).toEqual([]);
    });

    it("should handle special characters and Unicode", () => {
      const existingFlashcards = [{ front: "Co to jest Kraków?", back: "Miasto w Polsce" }];

      const result = validateFlashcardUniqueness("Co to jest Gdańsk?", "Miasto nad Bałtykiem", existingFlashcards);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should handle undefined or missing parameters gracefully", () => {
      // Should not crash with undefined existingFlashcards
      const result = validateFlashcardUniqueness("Question", "Answer");

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});

describe("validateUpdateFlashcard", () => {
  describe("valid update data", () => {
    it("should accept partial updates with valid front only", () => {
      const input: UpdateFlashcardCommand = {
        front: "Updated question?",
      };

      const result = validateUpdateFlashcard(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.fieldErrors).toEqual({});
    });

    it("should accept partial updates with valid back only", () => {
      const input: UpdateFlashcardCommand = {
        back: "Updated answer",
      };

      const result = validateUpdateFlashcard(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.fieldErrors).toEqual({});
    });

    it("should accept status updates", () => {
      const input: UpdateFlashcardCommand = {
        status: "learning",
      };

      const result = validateUpdateFlashcard(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should accept source updates", () => {
      const input: UpdateFlashcardCommand = {
        source: "mixed",
      };

      const result = validateUpdateFlashcard(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should accept repetition_count updates", () => {
      const input: UpdateFlashcardCommand = {
        repetition_count: 5,
      };

      const result = validateUpdateFlashcard(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should accept multiple field updates", () => {
      const input: UpdateFlashcardCommand = {
        front: "New question",
        back: "New answer",
        status: "review",
        repetition_count: 3,
      };

      const result = validateUpdateFlashcard(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe("invalid update data", () => {
    it("should reject invalid front text", () => {
      const input: UpdateFlashcardCommand = {
        front: "", // Empty front
      };

      const result = validateUpdateFlashcard(input);

      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.front).toContain("To pole jest wymagane");
    });

    it("should reject front text exceeding maximum length", () => {
      const input: UpdateFlashcardCommand = {
        front: "A".repeat(201), // Too long
      };

      const result = validateUpdateFlashcard(input);

      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.front).toContain("Maksimum 200 znaków");
    });

    it("should reject invalid back text", () => {
      const input: UpdateFlashcardCommand = {
        back: "", // Empty back
      };

      const result = validateUpdateFlashcard(input);

      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.back).toContain("To pole jest wymagane");
    });

    it("should reject back text exceeding maximum length", () => {
      const input: UpdateFlashcardCommand = {
        back: "B".repeat(501), // Too long
      };

      const result = validateUpdateFlashcard(input);

      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.back).toContain("Maksimum 500 znaków");
    });

    it("should reject invalid status", () => {
      const input = {
        status: "invalid_status" as FlashcardStatus,
      };

      const result = validateUpdateFlashcard(input);

      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.status).toContain("Nieprawidłowy status fiszki");
    });

    it("should reject invalid source", () => {
      const input = {
        source: "invalid_source" as FlashcardSource,
      };

      const result = validateUpdateFlashcard(input);

      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.source).toContain("Nieprawidłowe źródło fiszki");
    });

    it("should reject invalid repetition_count", () => {
      const invalidCounts = [-1, 1.5];

      invalidCounts.forEach((repetition_count) => {
        const input: UpdateFlashcardCommand = {
          repetition_count,
        };

        const result = validateUpdateFlashcard(input);

        expect(result.isValid, `repetition_count ${repetition_count} should be invalid`).toBe(false);
        expect(result.fieldErrors.repetition_count).toContain("Liczba powtórzeń musi być nieujemną liczbą całkowitą");
      });
    });

    it("should accumulate multiple field errors", () => {
      const input = {
        front: "", // Invalid
        back: "B".repeat(501), // Invalid
        status: "bad_status" as FlashcardStatus, // Invalid
        repetition_count: -5, // Invalid
      };

      const result = validateUpdateFlashcard(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.fieldErrors.front).toBeDefined();
      expect(result.fieldErrors.back).toBeDefined();
      expect(result.fieldErrors.status).toBeDefined();
      expect(result.fieldErrors.repetition_count).toBeDefined();
    });
  });

  describe("handling of undefined/null values", () => {
    it("should skip validation for undefined fields", () => {
      const input: UpdateFlashcardCommand = {
        front: undefined,
        back: undefined,
        status: undefined,
      };

      const result = validateUpdateFlashcard(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should validate null strings as empty", () => {
      const input = {
        front: null as unknown as string,
        back: null as unknown as string,
      };

      const result = validateUpdateFlashcard(input);

      // null values should be skipped (treated as undefined)
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should handle mixed null/undefined/valid values", () => {
      const input = {
        front: "Valid question",
        back: null as unknown as string, // Should be skipped
        status: undefined, // Should be skipped
        repetition_count: 3, // Should be validated
      };

      const result = validateUpdateFlashcard(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});
