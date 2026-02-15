/**
 * Enhanced Generation Service using OpenRouter Service
 *
 * This service replaces the direct fetch-based approach with the new
 * type-safe OpenRouterService for improved error handling, rate limiting,
 * and structured logging.
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type {
  FlashcardProposal,
  GenerationDTO,
  GenerationProposalsResponse,
  PaginatedGenerationErrorLogsResponse,
  PaginatedGenerationsResponse,
  JSONSchema,
} from "../../types";
import { flashcardProposalsSchema } from "../validation/generation";
import {
  OpenRouterService,
  OpenRouterError,
  ValidationError as OpenRouterValidationError,
  RateLimitError,
  ModelNotSupportedError,
} from "./openrouter.service.js";
import { OpenRouterLogger } from "./openrouter.logger.js";

// Re-export OpenRouter errors for consistent API usage
export {
  OpenRouterError as AiApiError, // Simple alias for API compatibility
  RateLimitError,
  ModelNotSupportedError,
  OpenRouterValidationError as ValidationError,
};

// ============================================================================
// Service Configuration
// ============================================================================

const FLASHCARD_GENERATION_SCHEMA: JSONSchema = {
  type: "object",
  properties: {
    flashcards: {
      type: "array",
      description: "Array of generated flashcards with front and back content",
      items: {
        type: "object",
        properties: {
          front: {
            type: "string",
            description: "The question or prompt side of the flashcard",
          },
          back: {
            type: "string",
            description: "The answer or explanation side of the flashcard",
          },
        },
        required: ["front", "back"],
        additionalProperties: false,
      },
    },
  },
  required: ["flashcards"],
  additionalProperties: false,
};

interface FlashcardGenerationResponse {
  flashcards: {
    front: string;
    back: string;
  }[];
}

// ============================================================================
// Utility Functions
// ============================================================================

export async function hashSourceText(sourceText: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(sourceText);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Normalize AI response to FlashcardProposal format
 */
function normalizeProposals(response: FlashcardGenerationResponse): FlashcardProposal[] {
  const proposals = response.flashcards
    .map((card) => {
      const front = card.front?.trim();
      const back = card.back?.trim();
      if (!front || !back) return null;
      return { front, back, source: "ai" as const };
    })
    .filter(Boolean) as FlashcardProposal[];

  return flashcardProposalsSchema.parse(proposals);
}

/**
 * Mock function that splits text into chunks and creates simple flashcards.
 * Used for testing when MOCK_AI_GENERATION is enabled.
 */
function generateMockFlashcards(sourceText: string): FlashcardProposal[] {
  const CHUNK_SIZE = 300; // ~300 characters per chunk
  const MIN_CHUNK_SIZE = 100; // Minimum chunk size to avoid too small fragments

  const chunks: string[] = [];
  let currentIndex = 0;

  // Split text into chunks, trying to break at sentence boundaries when possible
  while (currentIndex < sourceText.length) {
    const remaining = sourceText.length - currentIndex;

    if (remaining <= MIN_CHUNK_SIZE) {
      // Last chunk - take everything
      chunks.push(sourceText.slice(currentIndex).trim());
      break;
    }

    const chunkEnd = Math.min(currentIndex + CHUNK_SIZE, sourceText.length);
    let chunk = sourceText.slice(currentIndex, chunkEnd);

    // Try to break at sentence boundary (., !, ?)
    if (chunkEnd < sourceText.length) {
      const lastPeriod = chunk.lastIndexOf(".");
      const lastExclamation = chunk.lastIndexOf("!");
      const lastQuestion = chunk.lastIndexOf("?");
      const lastBreak = Math.max(lastPeriod, lastExclamation, lastQuestion);

      if (lastBreak > MIN_CHUNK_SIZE) {
        chunk = sourceText.slice(currentIndex, currentIndex + lastBreak + 1);
        currentIndex += lastBreak + 1;
      } else {
        // No good break point, use space
        const lastSpace = chunk.lastIndexOf(" ");
        if (lastSpace > MIN_CHUNK_SIZE) {
          chunk = sourceText.slice(currentIndex, currentIndex + lastSpace);
          currentIndex += lastSpace + 1;
        } else {
          currentIndex = chunkEnd;
        }
      }
    } else {
      currentIndex = chunkEnd;
    }

    if (chunk.trim().length >= MIN_CHUNK_SIZE) {
      chunks.push(chunk.trim());
    }
  }

  // Create flashcards from chunks
  const proposals: FlashcardProposal[] = chunks.map((chunk, index) => {
    // Take first ~100 chars for front (question), rest for back (answer)
    const frontLength = Math.min(100, Math.floor(chunk.length * 0.3));
    const front = chunk.slice(0, frontLength).trim();
    const back = chunk.slice(frontLength).trim();

    return {
      front: front || `Fragment ${index + 1}`,
      back: back || chunk,
      source: "ai" as const,
    };
  });

  // Ensure we have at least 1 and at most 50 flashcards
  if (proposals.length === 0) {
    proposals.push({
      front: "Tekst źródłowy",
      back: sourceText.slice(0, 500),
      source: "ai" as const,
    });
  }

  return flashcardProposalsSchema.parse(proposals.slice(0, 50));
}

// ============================================================================
// Enhanced Generation Service
// ============================================================================

/**
 * Generate flashcards from text using OpenRouter Service
 */
export async function generateFlashcardsFromText(options: {
  sourceText: string;
  model: string;
  apiKey: string;
  timeoutMs?: number;
  userId?: string;
  requestId?: string;
}): Promise<{
  proposals: FlashcardProposal[];
  generationDurationMs: number;
  rawModelResponse: unknown;
}> {
  const { sourceText, model, apiKey, userId, requestId } = options;
  const timeoutMs = options.timeoutMs ?? 30_000;

  // Check if mock mode is enabled (apiKey === "mock")
  const mockMode = apiKey === "mock";

  if (mockMode) {
    const startedAt = performance.now();
    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));
    const generationDurationMs = Math.max(0, Math.round(performance.now() - startedAt));

    const proposals = generateMockFlashcards(sourceText);
    return {
      proposals,
      generationDurationMs,
      rawModelResponse: { mock: true, model, chunkCount: proposals.length },
    };
  }

  // Initialize OpenRouter service
  const openRouterService = new OpenRouterService({
    apiKey,
    timeout: timeoutMs,
    logger: new OpenRouterLogger(),
  });

  const startedAt = performance.now();

  try {
    const result = await openRouterService.chatCompletion<FlashcardGenerationResponse>({
      messages: [
        openRouterService.createSystemMessage(
          "Jesteś ekspertem od tworzenia fiszek edukacyjnych. " +
            "Twoim zadaniem jest wygenerowanie wysokiej jakości fiszek na podstawie dostarczonego tekstu. " +
            "Zasady tworzenia fiszek: " +
            "- Pytania powinny być konkretne i precyzyjne " +
            "- Odpowiedzi powinny być zwięzłe ale kompletne " +
            "- Unikaj duplikowania informacji " +
            "- Skup się na kluczowych konceptach " +
            "- Wygeneruj około 5-15 fiszek w zależności od długości tekstu"
        ),
        openRouterService.createUserMessage(`Wygeneruj fiszki z poniższego tekstu:\n\n${sourceText}`),
      ],
      responseSchema: FLASHCARD_GENERATION_SCHEMA,
      model,
      modelParams: {
        temperature: 0.2, // Lower temperature for more consistent output
        max_tokens: 2000,
      },
      userId,
      requestId,
    });

    const generationDurationMs = Math.max(0, Math.round(performance.now() - startedAt));
    const proposals = normalizeProposals(result);

    return {
      proposals,
      generationDurationMs,
      rawModelResponse: result,
    };
  } catch (error) {
    const generationDurationMs = Math.max(0, Math.round(performance.now() - startedAt));

    // Enrich OpenRouter errors with generation context
    if (error instanceof RateLimitError) {
      // Add generation context to existing error
      error.apiResponse = { ...(error.apiResponse || {}), generationDurationMs };
      throw error;
    }

    if (error instanceof ModelNotSupportedError) {
      error.apiResponse = { ...(error.apiResponse || {}), generationDurationMs };
      throw error;
    }

    if (error instanceof OpenRouterValidationError) {
      throw error;
    }

    if (error instanceof OpenRouterError) {
      error.apiResponse = { ...(error.apiResponse || {}), generationDurationMs };
      throw error;
    }

    // Unknown error - wrap in OpenRouterError
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new OpenRouterError(message, 502, { generationDurationMs });
  }
}

// ============================================================================
// Database Operations (unchanged from original)
// ============================================================================

export async function createGenerationRecord(options: {
  supabase: SupabaseClient;
  userId: string;
  model: string;
  generatedCount: number;
  sourceTextHash: string;
  sourceTextLength: number;
  generationDurationMs: number;
}): Promise<GenerationDTO> {
  const { supabase, userId, model, generatedCount, sourceTextHash, sourceTextLength, generationDurationMs } = options;

  const { data, error } = await supabase
    .from("generations")
    .insert({
      user_id: userId,
      model,
      generated_count: generatedCount,
      accepted_unedited_count: 0,
      accepted_edited_count: 0,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
      generation_duration_ms: generationDurationMs,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create generation record");
  }

  return data;
}

export async function logGenerationError(options: {
  supabase: SupabaseClient;
  userId: string;
  model: string;
  sourceTextHash: string;
  sourceTextLength: number;
  errorCode: string;
  errorMessage: string;
}): Promise<void> {
  const { supabase, userId, model, sourceTextHash, sourceTextLength, errorCode, errorMessage } = options;

  // Best-effort logging only.
  await supabase.from("generation_error_logs").insert({
    user_id: userId,
    model,
    source_text_hash: sourceTextHash,
    source_text_length: sourceTextLength,
    error_code: errorCode,
    error_message: errorMessage,
  });
}

export async function getGenerations(options: {
  supabase: SupabaseClient;
  userId: string;
  page: number;
  limit: number;
  sort: "created_at" | "updated_at";
  order: "asc" | "desc";
}): Promise<PaginatedGenerationsResponse> {
  const { supabase, userId, page, limit, sort, order } = options;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("generations")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order(sort, { ascending: order === "asc" })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const total = count ?? 0;
  const total_pages = Math.max(1, Math.ceil(total / limit));

  return {
    data: data ?? [],
    pagination: {
      page,
      limit,
      total,
      total_pages,
    },
  };
}

export async function getGenerationById(options: {
  supabase: SupabaseClient;
  userId: string;
  generationId: number;
}): Promise<GenerationDTO | null> {
  const { supabase, userId, generationId } = options;

  const { data, error } = await supabase
    .from("generations")
    .select("*")
    .eq("id", generationId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    throw new Error(error.message);
  }

  return data;
}

export async function getGenerationErrorLogs(options: {
  supabase: SupabaseClient;
  userId: string;
  page: number;
  limit: number;
}): Promise<PaginatedGenerationErrorLogsResponse> {
  const { supabase, userId, page, limit } = options;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("generation_error_logs")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const total = count ?? 0;
  const total_pages = Math.max(1, Math.ceil(total / limit));

  return {
    data: data ?? [],
    pagination: {
      page,
      limit,
      total,
      total_pages,
    },
  };
}

/**
 * Enhanced createGeneration function using OpenRouterService
 */
export async function createGeneration(options: {
  supabase: SupabaseClient;
  userId: string;
  sourceText: string;
  model: string;
  apiKey: string;
  requestId?: string;
}): Promise<GenerationProposalsResponse> {
  const { supabase, userId, sourceText, model, apiKey, requestId } = options;

  const sourceTextHash = await hashSourceText(sourceText);
  const sourceTextLength = sourceText.length;

  const { proposals, generationDurationMs } = await generateFlashcardsFromText({
    sourceText,
    model,
    apiKey,
    userId,
    requestId,
  });

  const generation = await createGenerationRecord({
    supabase,
    userId,
    model,
    generatedCount: proposals.length,
    sourceTextHash,
    sourceTextLength,
    generationDurationMs,
  });

  return {
    generation_id: generation.id,
    flashcards_proposals: proposals,
    metadata: {
      generated_count: proposals.length,
      source_text_length: sourceTextLength,
      generation_duration_ms: generationDurationMs,
    },
  };
}
