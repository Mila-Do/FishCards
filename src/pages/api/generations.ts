import type { APIRoute } from "astro";

import type { ErrorResponse } from "../../types";
import { createGenerationSchema, generationQuerySchema } from "../../lib/validation/generation";
import {
  AiApiError,
  createGeneration,
  getGenerations,
  hashSourceText,
  logGenerationError,
} from "../../lib/services/generation.service";

const DEFAULT_MODEL = "openai/gpt-4o-mini";

function jsonResponse(body: unknown, options: { status: number }) {
  return new Response(JSON.stringify(body), {
    status: options.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function errorResponse(
  status: number,
  code: ErrorResponse["error"]["code"],
  message: string,
  details?: Record<string, unknown>
) {
  const payload: ErrorResponse = { error: { code, message, details } };
  return jsonResponse(payload, { status });
}

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
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  if (!apiKey) {
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
    return jsonResponse(result, { status: 200 });
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

    if (status === 429) return errorResponse(429, "RATE_LIMIT_EXCEEDED", message, aiError?.details);
    if (status === 502) return errorResponse(502, "AI_API_ERROR", message, aiError?.details);
    return errorResponse(500, "INTERNAL_SERVER_ERROR", message, aiError?.details);
  }
};
