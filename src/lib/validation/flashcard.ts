/**
 * Flashcard-specific validation utilities
 * Business logic validation for flashcard entities and operations
 */

import { z } from "zod";
import type { ValidationResult, FieldValidationErrors } from "../types/common";
import { validateFlashcardFront, validateFlashcardBack, TEXT_VALIDATION_LIMITS } from "./text";

// Re-export flashcard types from main types file
import type { FlashcardStatus, FlashcardSource, CreateFlashcardCommand, UpdateFlashcardCommand } from "../../types";

// ============================================================================
// Zod Schemas for API validation
// ============================================================================

const toIntOrUndefined = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  if (value.trim() === "") return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * Schema for validating flashcard ID
 */
export const flashcardIdSchema = z.preprocess(
  (value) => {
    if (typeof value === "string") {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : value;
    }
    return value;
  },
  z.number().int().min(1, "Flashcard ID must be a positive integer")
);

/**
 * Schema for creating a single flashcard
 */
export const createFlashcardSchema = z.object({
  front: z.string().min(1, "Przód fiszki nie może być pusty").max(200, "Przód fiszki może mieć maksymalnie 200 znaków"),
  back: z.string().min(1, "Tył fiszki nie może być pusty").max(500, "Tył fiszki może mieć maksymalnie 500 znaków"),
  source: z.enum(["manual", "ai", "mixed"]).optional(),
  generation_id: z.number().int().positive().nullable().optional(),
});

/**
 * Schema for creating one or more flashcards
 */
export const createFlashcardsSchema = z.union([createFlashcardSchema, z.array(createFlashcardSchema)]);

/**
 * Schema for flashcard query parameters (alias for listFlashcardsSchema)
 */
export const flashcardQuerySchema = z.object({
  page: z.preprocess(toIntOrUndefined, z.number().int().min(1).default(1)),
  limit: z.preprocess(toIntOrUndefined, z.number().int().min(1).max(100).default(20)),
  status: z.enum(["new", "learning", "review", "mastered"]).optional(),
  source: z.enum(["manual", "ai", "mixed"]).optional(),
  sort: z.enum(["created_at", "updated_at", "repetition_count"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

/**
 * Alias for flashcardQuerySchema - used for listing flashcards
 */
export const listFlashcardsSchema = flashcardQuerySchema;

/**
 * Schema for updating a flashcard
 */
export const updateFlashcardSchema = z
  .object({
    front: z
      .string()
      .min(1, "Przód fiszki nie może być pusty")
      .max(200, "Przód fiszki może mieć maksymalnie 200 znaków")
      .optional(),
    back: z
      .string()
      .min(1, "Tył fiszki nie może być pusty")
      .max(500, "Tył fiszki może mieć maksymalnie 500 znaków")
      .optional(),
    status: z.enum(["new", "learning", "review", "mastered"]).optional(),
    source: z.enum(["manual", "ai", "mixed"]).optional(),
    repetition_count: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Przynajmniej jedno pole musi zostać podane do aktualizacji",
  });

// ============================================================================
// Flashcard Data Validation
// ============================================================================

/**
 * Validates complete flashcard data for creation
 */
export function validateCreateFlashcard(data: CreateFlashcardCommand): ValidationResult & {
  fieldErrors: FieldValidationErrors;
} {
  const fieldErrors: FieldValidationErrors = {};
  const allErrors: string[] = [];

  // Validate front
  const frontValidation = validateFlashcardFront(data.front);
  if (!frontValidation.isValid) {
    fieldErrors.front = frontValidation.errors;
    allErrors.push(...frontValidation.errors);
  }

  // Validate back
  const backValidation = validateFlashcardBack(data.back);
  if (!backValidation.isValid) {
    fieldErrors.back = backValidation.errors;
    allErrors.push(...backValidation.errors);
  }

  // Validate source (optional)
  if (data.source !== undefined && !isValidFlashcardSource(data.source)) {
    fieldErrors.source = ["Nieprawidłowe źródło fiszki"];
    allErrors.push("Nieprawidłowe źródło fiszki");
  }

  // Validate generation_id if provided
  if (data.generation_id !== null && data.generation_id !== undefined) {
    if (!Number.isInteger(data.generation_id) || data.generation_id <= 0) {
      fieldErrors.generation_id = ["Nieprawidłowy identyfikator generacji"];
      allErrors.push("Nieprawidłowy identyfikator generacji");
    }
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    fieldErrors,
  };
}

/**
 * Validates flashcard data for update
 */
export function validateUpdateFlashcard(data: UpdateFlashcardCommand): ValidationResult & {
  fieldErrors: FieldValidationErrors;
} {
  const fieldErrors: FieldValidationErrors = {};
  const allErrors: string[] = [];

  // Validate front (optional in updates)
  if (data.front !== undefined && data.front !== null && typeof data.front === "string") {
    const frontValidation = validateFlashcardFront(data.front);
    if (!frontValidation.isValid) {
      fieldErrors.front = frontValidation.errors;
      allErrors.push(...frontValidation.errors);
    }
  }

  // Validate back (optional in updates)
  if (data.back !== undefined && data.back !== null && typeof data.back === "string") {
    const backValidation = validateFlashcardBack(data.back);
    if (!backValidation.isValid) {
      fieldErrors.back = backValidation.errors;
      allErrors.push(...backValidation.errors);
    }
  }

  // Validate status (optional in updates)
  if (data.status !== undefined && !isValidFlashcardStatus(data.status)) {
    fieldErrors.status = ["Nieprawidłowy status fiszki"];
    allErrors.push("Nieprawidłowy status fiszki");
  }

  // Validate source (optional in updates)
  if (data.source !== undefined && !isValidFlashcardSource(data.source)) {
    fieldErrors.source = ["Nieprawidłowe źródło fiszki"];
    allErrors.push("Nieprawidłowe źródło fiszki");
  }

  // Validate repetition_count (optional in updates)
  if (data.repetition_count !== undefined) {
    if (!Number.isInteger(data.repetition_count) || data.repetition_count < 0) {
      fieldErrors.repetition_count = ["Liczba powtórzeń musi być nieujemną liczbą całkowitą"];
      allErrors.push("Liczba powtórzeń musi być nieujemną liczbą całkowitą");
    }
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    fieldErrors,
  };
}

// ============================================================================
// Individual Field Validations
// ============================================================================

/**
 * Validates flashcard status
 */
export function isValidFlashcardStatus(status: string): status is FlashcardStatus {
  const validStatuses: FlashcardStatus[] = ["new", "learning", "review", "mastered"];
  return validStatuses.includes(status as FlashcardStatus);
}

/**
 * Validates flashcard source
 */
export function isValidFlashcardSource(source: string): source is FlashcardSource {
  const validSources: FlashcardSource[] = ["manual", "ai", "mixed"];
  return validSources.includes(source as FlashcardSource);
}

/**
 * Validates repetition count
 */
export function validateRepetitionCount(count: number): ValidationResult {
  const errors: string[] = [];

  if (!Number.isInteger(count)) {
    errors.push("Liczba powtórzeń musi być liczbą całkowitą");
  } else if (count < 0) {
    errors.push("Liczba powtórzeń nie może być ujemna");
  } else if (count > 1000) {
    errors.push("Liczba powtórzeń jest zbyt duża");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Business Logic Validations
// ============================================================================

/**
 * Validates if flashcard content is unique within a collection
 * This would typically be used with database checks
 */
export function validateFlashcardUniqueness(
  front: string,
  back: string,
  existingFlashcards: { front: string; back: string }[] = []
): ValidationResult {
  const errors: string[] = [];

  const trimmedFront = front.trim().toLowerCase();
  const trimmedBack = back.trim().toLowerCase();

  // Check for exact duplicates
  const duplicate = existingFlashcards.find(
    (card) => card.front.trim().toLowerCase() === trimmedFront && card.back.trim().toLowerCase() === trimmedBack
  );

  if (duplicate) {
    errors.push("Fiszka o takiej treści już istnieje");
  }

  // Check for very similar content (optional business rule)
  const similarFront = existingFlashcards.find((card) => {
    const similarity = calculateTextSimilarity(card.front.trim().toLowerCase(), trimmedFront);
    return similarity > 0.9; // 90% similarity threshold
  });

  if (similarFront && !duplicate) {
    errors.push("Znaleziono bardzo podobną fiszkę - sprawdź czy nie jest to duplikat");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates flashcard progression rules
 * Business logic for when a flashcard can change status
 */
export function validateStatusTransition(
  fromStatus: FlashcardStatus,
  toStatus: FlashcardStatus,
  repetitionCount: number
): ValidationResult {
  const errors: string[] = [];

  // Define valid status transitions
  const validTransitions: Record<FlashcardStatus, FlashcardStatus[]> = {
    new: ["learning"],
    learning: ["review", "new"], // Can go back to new if struggling
    review: ["mastered", "learning"], // Can go back to learning if forgotten
    mastered: ["review"], // Can only go back to review if needs refreshing
  };

  // Check if transition is allowed
  if (!validTransitions[fromStatus].includes(toStatus)) {
    errors.push(`Nie można zmienić statusu z "${fromStatus}" na "${toStatus}"`);
  }

  // Business rules for progression
  if (toStatus === "mastered" && repetitionCount < 3) {
    errors.push("Fiszka musi być powtórzona co najmniej 3 razy przed oznaczeniem jako opanowana");
  }

  if (toStatus === "review" && fromStatus === "new") {
    errors.push("Nowa fiszka musi najpierw przejść przez etap nauki");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculates text similarity (simple implementation)
 * Returns value between 0 and 1, where 1 means identical
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  if (text1 === text2) return 1;
  if (text1.length === 0 || text2.length === 0) return 0;

  // Simple Levenshtein distance based similarity
  const maxLength = Math.max(text1.length, text2.length);
  const distance = levenshteinDistance(text1, text2);
  return 1 - distance / maxLength;
}

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  // Initialize first row and column
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Formats validation errors for display
 */
export function formatValidationErrors(fieldErrors: FieldValidationErrors): string {
  const messages: string[] = [];

  Object.entries(fieldErrors).forEach(([field, errors]) => {
    const fieldName = getFieldDisplayName(field);
    errors.forEach((error) => {
      messages.push(`${fieldName}: ${error}`);
    });
  });

  return messages.join("\n");
}

/**
 * Gets user-friendly field names
 */
function getFieldDisplayName(field: string): string {
  const displayNames: Record<string, string> = {
    front: "Przód fiszki",
    back: "Tył fiszki",
    status: "Status",
    source: "Źródło",
    repetition_count: "Liczba powtórzeń",
    generation_id: "ID generacji",
  };

  return displayNames[field] || field;
}

// ============================================================================
// Export validation limits for consistency
// ============================================================================

export { TEXT_VALIDATION_LIMITS as FLASHCARD_VALIDATION_LIMITS };
