import { z } from "zod";

const toIntOrUndefined = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  if (value.trim() === "") return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * Schema for validating query parameters in GET /api/flashcards
 */
export const flashcardQuerySchema = z.object({
  page: z.preprocess(toIntOrUndefined, z.number().int().min(1).default(1)),
  limit: z.preprocess(toIntOrUndefined, z.number().int().min(1).max(100).default(20)),
  status: z.enum(["new", "learning", "review", "mastered"]).optional(),
  source: z.enum(["manual", "ai", "mixed"]).optional(),
  sort: z.enum(["created_at", "updated_at", "repetition_count"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Schema for validating a single flashcard creation request
 */
export const createFlashcardSchema = z.object({
  front: z.string().min(1, "front cannot be empty").max(200, "front must be at most 200 characters"),
  back: z.string().min(1, "back cannot be empty").max(500, "back must be at most 500 characters"),
  source: z.enum(["manual", "ai", "mixed"]).default("manual"),
  generation_id: z.number().int().min(1).nullable().optional(),
});

/**
 * Schema for validating flashcard creation request (single or array)
 */
export const createFlashcardsSchema = z.union([createFlashcardSchema, z.array(createFlashcardSchema).min(1).max(50)]);

/**
 * Schema for validating flashcard update request
 */
export const updateFlashcardSchema = z.object({
  front: z.string().min(1, "front cannot be empty").max(200, "front must be at most 200 characters").optional(),
  back: z.string().min(1, "back cannot be empty").max(500, "back must be at most 500 characters").optional(),
  status: z.enum(["new", "learning", "review", "mastered"]).optional(),
  source: z.enum(["manual", "ai", "mixed"]).optional(),
  repetition_count: z.number().int().min(0, "repetition_count must be non-negative").optional(),
});

/**
 * Schema for validating flashcard ID from URL path parameter
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
