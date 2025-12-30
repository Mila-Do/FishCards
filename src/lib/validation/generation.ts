import { z } from "zod";

import type { GenerationSortField, SortOrder } from "../../types";

const toIntOrUndefined = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  if (value.trim() === "") return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const createGenerationSchema = z.object({
  source_text: z
    .string()
    .min(1000, "source_text must be at least 1000 characters")
    .max(10000, "source_text must be at most 10000 characters"),
});

export const generationQuerySchema = z.object({
  page: z.preprocess(toIntOrUndefined, z.number().int().min(1).default(1)),
  limit: z.preprocess(toIntOrUndefined, z.number().int().min(1).max(100).default(20)),
  sort: z.enum(["created_at", "updated_at"] satisfies [GenerationSortField, GenerationSortField]).default("created_at"),
  order: z.enum(["asc", "desc"] satisfies [SortOrder, SortOrder]).default("desc"),
});

export const flashcardProposalSchema = z.object({
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(500),
  source: z.literal("ai"),
});

export const flashcardProposalsSchema = z.array(flashcardProposalSchema).min(1).max(50);

export const generationIdSchema = z.preprocess(
  (value) => {
    if (typeof value === "string") {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : value;
    }
    return value;
  },
  z.number().int().min(1, "Generation ID must be a positive integer")
);

export const generationErrorLogQuerySchema = z.object({
  page: z.preprocess(toIntOrUndefined, z.number().int().min(1).default(1)),
  limit: z.preprocess(toIntOrUndefined, z.number().int().min(1).max(100).default(20)),
});
