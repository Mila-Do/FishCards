import type { APIRoute } from "astro";
import { performance } from "node:perf_hooks";

import type { ErrorResponse } from "../../types";
import { createGenerationSchema, generationQuerySchema } from "../../lib/validation/generation";
import {
  AiApiError,
  createGeneration,
  getGenerations,
  hashSourceText,
  logGenerationError,
} from "../../lib/services/generation.service";
import { jsonResponse, errorResponse } from "../../lib/response-helpers";

const DEFAULT_MODEL = "openai/gpt-4o-mini";

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
    const aiError = err instanceof AiApiError ? err : null;
    const status = aiError?.status ?? 500;
    const code = (aiError?.code ?? "INTERNAL_SERVER_ERROR") as ErrorResponse["error"]["code"];
    const message = aiError?.message ?? (err instanceof Error ? err.message : "Unknown error");

    await logGenerationError({
      supabase: context.locals.supabase,
      userId,
      model: DEFAULT_MODEL,
      sourceTextHash,
      sourceTextLength,
      errorCode: code,
      errorMessage: message,
    });

    const duration = Math.round(performance.now() - startTime);
    if (status === 429)
      return errorResponse(429, "RATE_LIMIT_EXCEEDED", message, aiError?.details, {
        method: "POST",
        endpoint: "/api/generations",
        userId,
        duration,
      });
    if (status === 502)
      return errorResponse(502, "AI_API_ERROR", message, aiError?.details, {
        method: "POST",
        endpoint: "/api/generations",
        userId,
        duration,
      });
    return errorResponse(500, "INTERNAL_SERVER_ERROR", message, aiError?.details, {
      method: "POST",
      endpoint: "/api/generations",
      userId,
      duration,
    });
  }
};
