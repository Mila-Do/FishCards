import type { APIRoute } from "astro";

import { createFlashcardsSchema, flashcardQuerySchema } from "../../lib/validation/flashcard";
import { createFlashcards, getFlashcards } from "../../lib/services/flashcard.service";
import { jsonResponse, errorResponse } from "../../lib/response-helpers";

/**
 * GET /api/flashcards
 *
 * Retrieve paginated list of flashcards with optional filtering and sorting.
 * Only returns flashcards belonging to the authenticated user.
 */
export const GET: APIRoute = async (context) => {
  const startTime = performance.now();
  const userId = context.locals.userId;
  const endpoint = "/api/flashcards";
  const method = "GET";

  if (!userId) {
    return errorResponse(401, "UNAUTHORIZED", "Unauthorized", undefined, { method, endpoint, userId });
  }

  const parsed = flashcardQuerySchema.safeParse({
    page: context.url.searchParams.get("page") ?? undefined,
    limit: context.url.searchParams.get("limit") ?? undefined,
    status: context.url.searchParams.get("status") ?? undefined,
    source: context.url.searchParams.get("source") ?? undefined,
    sort: context.url.searchParams.get("sort") ?? undefined,
    order: context.url.searchParams.get("order") ?? undefined,
  });

  if (!parsed.success) {
    const duration = performance.now() - startTime;
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Invalid query parameters",
      { issues: parsed.error.issues },
      { method, endpoint, userId, duration }
    );
  }

  try {
    const result = await getFlashcards({
      supabase: context.locals.supabase,
      userId,
      page: parsed.data.page,
      limit: parsed.data.limit,
      status: parsed.data.status,
      source: parsed.data.source,
      sort: parsed.data.sort,
      order: parsed.data.order,
    });

    const duration = performance.now() - startTime;
    return jsonResponse(result, { status: 200 }, { method, endpoint, userId, duration });
  } catch (err) {
    const duration = performance.now() - startTime;
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(
      500,
      "DATABASE_ERROR",
      "Failed to fetch flashcards",
      { message },
      { method, endpoint, userId, duration }
    );
  }
};

/**
 * POST /api/flashcards
 *
 * Create one or more flashcards.
 * Accepts either a single flashcard object or an array of flashcard objects.
 * Returns the created flashcard(s).
 */
export const POST: APIRoute = async (context) => {
  const userId = context.locals.userId;
  if (!userId) return errorResponse(401, "UNAUTHORIZED", "Unauthorized");

  let body: unknown = null;
  try {
    body = await context.request.json();
  } catch {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid JSON body");
  }

  const parsed = createFlashcardsSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid request body", { issues: parsed.error.issues });
  }

  // Normalize to array
  const flashcards = Array.isArray(parsed.data) ? parsed.data : [parsed.data];

  try {
    const result = await createFlashcards({
      supabase: context.locals.supabase,
      userId,
      flashcards,
    });

    // Return single object if single flashcard was created, array otherwise
    const responseData = Array.isArray(parsed.data) ? result : result[0];
    return jsonResponse(responseData, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(500, "DATABASE_ERROR", "Failed to create flashcards", { message });
  }
};
