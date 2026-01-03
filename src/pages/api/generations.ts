import type { APIRoute } from "astro";
import { performance } from "node:perf_hooks";

import type { ErrorResponse } from "../../types";
import { createGenerationSchema, generationQuerySchema } from "../../lib/validation/generation";
import {
  AiApiError,
  RateLimitError,
  ModelNotSupportedError,
  ValidationError,
  createGeneration,
  getGenerations,
  hashSourceText,
  logGenerationError,
} from "../../lib/services/generation.service";
import { jsonResponse, errorResponse } from "../../lib/response-helpers";

const DEFAULT_MODEL = "openai/gpt-4o";

export const GET: APIRoute = async (context) => {
  const userId = context.locals.userId;
  if (!userId) return errorResponse(401, "UNAUTHORIZED", "Unauthorized");

  const parsed = generationQuerySchema.safeParse({
    page: context.url.searchParams.get("page") ?? undefined,
    limit: context.url.searchParams.get("limit") ?? undefined,
    sort: context.url.searchParams.get("sort") ?? undefined,
    order: context.url.searchParams.get("order") ?? undefined,
  });

  if (!parsed.success) {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid query parameters", { issues: parsed.error.issues });
  }

  try {
    const result = await getGenerations({
      supabase: context.locals.supabase,
      userId,
      page: parsed.data.page,
      limit: parsed.data.limit,
      sort: parsed.data.sort,
      order: parsed.data.order,
    });
    return jsonResponse(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(500, "DATABASE_ERROR", "Failed to fetch generations", { message });
  }
};

export const POST: APIRoute = async (context) => {
  const startTime = performance.now();
  const userId = context.locals.userId;

  if (!userId) return errorResponse(401, "UNAUTHORIZED", "Unauthorized");

  let body: unknown = null;
  try {
    body = await context.request.json();
  } catch {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid JSON body");
  }

  const parsed = createGenerationSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid request body", { issues: parsed.error.issues });
  }

  const sourceText = parsed.data.source_text;
  const sourceTextHash = hashSourceText(sourceText);
  const sourceTextLength = sourceText.length;

  // Check if mock mode is enabled
  // Environment variables are always strings, so we check for "true" string
  const mockMode = import.meta.env.MOCK_AI_GENERATION === "true";
  const apiKey = mockMode ? "mock" : import.meta.env.OPENROUTER_API_KEY;

  if (!mockMode && !apiKey) {
    return errorResponse(500, "INTERNAL_SERVER_ERROR", "Server misconfiguration: missing OPENROUTER_API_KEY");
  }

  try {
    const result = await createGeneration({
      supabase: context.locals.supabase,
      userId,
      sourceText,
      model: DEFAULT_MODEL,
      apiKey,
    });

    const duration = Math.round(performance.now() - startTime);
    return jsonResponse(
      result,
      { status: 200 },
      {
        method: "POST",
        endpoint: "/api/generations",
        userId,
        duration,
      }
    );
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    let status = 500;
    let code: ErrorResponse["error"]["code"] = "INTERNAL_SERVER_ERROR";
    const message = err instanceof Error ? err.message : "Unknown error";
    let details: Record<string, unknown> | undefined;

    // Handle specific OpenRouter error types
    if (err instanceof RateLimitError) {
      status = 429;
      code = "RATE_LIMIT_EXCEEDED";
      details = { retryAfter: err.retryAfter, ...(err.apiResponse || {}) };
    } else if (err instanceof ModelNotSupportedError) {
      status = 400;
      code = "AI_API_ERROR";
      details = { model: err.model, ...(err.apiResponse || {}) };
    } else if (err instanceof ValidationError) {
      status = 400;
      code = "VALIDATION_ERROR";
      details = err.apiResponse ? (err.apiResponse as Record<string, unknown>) : undefined;
    } else if (err instanceof AiApiError) {
      status = err.statusCode || 502;
      code = "AI_API_ERROR";
      details = err.apiResponse ? (err.apiResponse as Record<string, unknown>) : undefined;
    }

    // Log the error
    await logGenerationError({
      supabase: context.locals.supabase,
      userId,
      model: DEFAULT_MODEL,
      sourceTextHash,
      sourceTextLength,
      errorCode: code as string, // logGenerationError expects string, not ErrorCode
      errorMessage: message,
    });

    return errorResponse(status, code, message, details, {
      method: "POST",
      endpoint: "/api/generations",
      userId,
      duration,
    });
  }
};
