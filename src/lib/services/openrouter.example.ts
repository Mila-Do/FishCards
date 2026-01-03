/**
 * OpenRouter Service - Usage Examples
 *
 * This file demonstrates how to use the OpenRouterService for various scenarios
 */

import {
  OpenRouterService,
  OpenRouterError,
  ValidationError,
  RateLimitError,
  ModelNotSupportedError,
} from "./openrouter.service.js";
import { OpenRouterRateLimiters } from "./openrouter.rate-limiter.js";
import { OpenRouterLogger } from "./openrouter.logger.js";
import type { FlashcardProposal, JSONSchema } from "../../types.js";

// ============================================================================
// Example JSON Schemas
// ============================================================================

/**
 * JSON Schema for flashcard generation
 */
const flashcardSchema = {
  type: "object",
  properties: {
    flashcards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          front: { type: "string" },
          back: { type: "string" },
        },
        required: ["front", "back"],
      },
    },
  },
  required: ["flashcards"],
} satisfies JSONSchema;

/**
 * Type for flashcard generation response
 */
interface FlashcardGenerationResponse {
  flashcards: FlashcardProposal[];
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example 1: Basic flashcard generation
 */
export async function generateFlashcardsExample(sourceText: string): Promise<FlashcardProposal[]> {
  const openRouter = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
  });

  try {
    const result = await openRouter.chatCompletion<FlashcardGenerationResponse>({
      messages: [
        openRouter.createSystemMessage(`
          Jesteś ekspertem od tworzenia fiszek edukacyjnych. 
          Twoim zadaniem jest wygenerowanie wysokiej jakości fiszek na podstawie dostarczonego tekstu.
          
          Zasady tworzenia fiszek:
          - Pytania powinny być konkretne i precyzyjne
          - Odpowiedzi powinny być zwięzłe ale kompletne
          - Unikaj duplikowania informacji
          - Skup się na kluczowych konceptach
        `),
        openRouter.createUserMessage(`Wygeneruj fiszki z poniższego tekstu:\n\n${sourceText}`),
      ],
      responseSchema: flashcardSchema,
      model: "gpt-4",
      modelParams: {
        temperature: 0.7,
        max_tokens: 2000,
      },
    });

    return result.flashcards;
  } catch (error) {
    console.error("Failed to generate flashcards:", error);
    throw error;
  }
}

/**
 * Example 2: Simple text completion without structured output
 */
export async function simpleTextCompletion(prompt: string): Promise<string> {
  const openRouter = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
    defaultModel: "gpt-3.5-turbo",
  });

  try {
    const result = await openRouter.chatCompletion<string>({
      messages: [openRouter.createUserMessage(prompt)],
      modelParams: {
        temperature: 0.8,
        max_tokens: 500,
      },
    });

    return result;
  } catch (error) {
    console.error("Failed to complete text:", error);
    throw error;
  }
}

/**
 * Example 3: Custom model and parameters
 */
export async function generateWithCustomModel(
  systemPrompt: string,
  userPrompt: string,
  model = "claude-3-haiku"
): Promise<string> {
  const openRouter = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
    timeout: 45000, // 45 seconds for longer requests
  });

  try {
    const result = await openRouter.chatCompletion<string>({
      messages: [openRouter.createSystemMessage(systemPrompt), openRouter.createUserMessage(userPrompt)],
      model,
      modelParams: {
        temperature: 0.5,
        max_tokens: 1000,
        top_p: 0.9,
      },
    });

    return result;
  } catch (error) {
    console.error("Failed to generate with custom model:", error);
    throw error;
  }
}

/**
 * Example 4: Error handling showcase
 */
export async function handleErrorsExample(prompt: string): Promise<string | null> {
  const openRouter = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
  });

  try {
    return await openRouter.chatCompletion<string>({
      messages: [openRouter.createUserMessage(prompt)],
    });
  } catch (error) {
    // Handle different error types
    if (error instanceof ValidationError) {
      console.error("Validation error:", error.message);
      return null;
    }

    if (error instanceof RateLimitError) {
      console.error(`Rate limited. Retry after ${error.retryAfter} seconds`);
      return null;
    }

    if (error instanceof ModelNotSupportedError) {
      console.error(`Model not supported: ${error.model}`);
      return null;
    }

    if (error instanceof OpenRouterError) {
      console.error(`OpenRouter API error (${error.statusCode}):`, error.message);
      return null;
    }

    // Unknown error
    console.error("Unknown error:", error);
    return null;
  }
}

/**
 * Example 5: Advanced configuration with rate limiting and logging
 */
export async function advancedServiceExample(): Promise<FlashcardProposal[]> {
  const customLogger = new OpenRouterLogger({
    logLevel: "debug",
    isDevelopment: true,
  });

  const openRouter = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
    rateLimiter: OpenRouterRateLimiters.AGGRESSIVE,
    logger: customLogger,
  });

  try {
    // Check rate limit status before making request
    const status = openRouter.getRateLimitStatus();
    console.log("Rate limit status:", status);

    if (!status.canMakeRequest) {
      console.log(`Waiting ${status.timeUntilNextToken}ms for next token...`);
    }

    const result = await openRouter.chatCompletion<FlashcardGenerationResponse>({
      messages: [
        openRouter.createSystemMessage("Create educational flashcards from the given text."),
        openRouter.createUserMessage(
          "JavaScript closures are functions that have access to variables in their outer scope even after the outer function has returned."
        ),
      ],
      responseSchema: flashcardSchema,
      model: "gpt-4",
      userId: "user123", // For logging purposes
      requestId: "custom-req-001", // Optional custom request ID
    });

    return result.flashcards;
  } catch (error) {
    console.error("Advanced example failed:", error);
    throw error;
  }
}

/**
 * Example 6: Rate limit monitoring and management
 */
export async function rateLimitMonitoringExample(): Promise<void> {
  const openRouter = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
    rateLimiter: OpenRouterRateLimiters.CONSERVATIVE,
  });

  // Monitor rate limit status
  console.log("Initial rate limit status:", openRouter.getRateLimitStatus());

  // Update rate limiting configuration
  openRouter.updateRateLimitConfig({
    capacity: 15,
    refillRate: 2,
    refillIntervalMs: 1000,
  });

  // Make multiple requests to demonstrate rate limiting
  const requests = Array.from({ length: 5 }, (_, i) =>
    openRouter.chatCompletion({
      messages: [openRouter.createUserMessage(`Test request ${i + 1}`)],
      requestId: `test-${i + 1}`,
    })
  );

  try {
    const results = await Promise.allSettled(requests);
    console.log(
      "Request results:",
      results.map((r) => r.status)
    );
  } catch (error) {
    console.error("Batch request failed:", error);
  }

  // Reset rate limiter for clean state
  openRouter.resetRateLimit();
  console.log("Rate limit reset:", openRouter.getRateLimitStatus());
}
