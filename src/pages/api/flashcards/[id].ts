import type { APIRoute } from "astro";

import { updateFlashcardSchema } from "../../../lib/validation/flashcard";
import { getFlashcardById, updateFlashcard, deleteFlashcard } from "../../../lib/services/flashcard.service";
import { jsonResponse, errorResponse } from "../../../lib/response-helpers";

/**
 * GET /api/flashcards/:id
 *
 * Retrieve a single flashcard by ID.
 * Only returns flashcard belonging to the authenticated user.
 */
export const GET: APIRoute = async (context) => {
  const startTime = performance.now();
  const userId = context.locals.userId;
  const flashcardId = parseInt(context.params.id as string, 10);
  const endpoint = `/api/flashcards/${flashcardId}`;
  const method = "GET";

  if (!userId) {
    return errorResponse(401, "UNAUTHORIZED", "Unauthorized", undefined, { method, endpoint, userId });
  }

  if (isNaN(flashcardId)) {
    const duration = performance.now() - startTime;
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Invalid flashcard ID",
      { flashcardId: context.params.id },
      { method, endpoint, userId, duration }
    );
  }

  try {
    const flashcard = await getFlashcardById({
      supabase: context.locals.supabase,
      userId,
      flashcardId,
    });

    if (!flashcard) {
      const duration = performance.now() - startTime;
      return errorResponse(
        404,
        "NOT_FOUND",
        "Flashcard not found or access denied",
        { flashcardId },
        { method, endpoint, userId, duration }
      );
    }

    const duration = performance.now() - startTime;
    return jsonResponse(flashcard, { status: 200 }, { method, endpoint, userId, duration });
  } catch (err) {
    const duration = performance.now() - startTime;
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(
      500,
      "DATABASE_ERROR",
      "Failed to fetch flashcard",
      { message, flashcardId },
      { method, endpoint, userId, duration }
    );
  }
};

/**
 * PATCH /api/flashcards/:id
 *
 * Update an existing flashcard.
 * Only allows updating flashcards belonging to the authenticated user.
 */
export const PATCH: APIRoute = async (context) => {
  const startTime = performance.now();
  const userId = context.locals.userId;
  const flashcardId = parseInt(context.params.id as string, 10);
  const endpoint = `/api/flashcards/${flashcardId}`;
  const method = "PATCH";

  if (!userId) {
    return errorResponse(401, "UNAUTHORIZED", "Unauthorized", undefined, { method, endpoint, userId });
  }

  if (isNaN(flashcardId)) {
    const duration = performance.now() - startTime;
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Invalid flashcard ID",
      { flashcardId: context.params.id },
      { method, endpoint, userId, duration }
    );
  }

  let body: unknown = null;
  try {
    body = await context.request.json();
  } catch {
    const duration = performance.now() - startTime;
    return errorResponse(400, "VALIDATION_ERROR", "Invalid JSON body", undefined, {
      method,
      endpoint,
      userId,
      duration,
    });
  }

  const parsed = updateFlashcardSchema.safeParse(body);
  if (!parsed.success) {
    const duration = performance.now() - startTime;
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Invalid request body",
      { issues: parsed.error.issues },
      { method, endpoint, userId, duration }
    );
  }

  try {
    const updatedFlashcard = await updateFlashcard({
      supabase: context.locals.supabase,
      userId,
      flashcardId,
      updates: parsed.data,
    });

    if (!updatedFlashcard) {
      const duration = performance.now() - startTime;
      return errorResponse(
        404,
        "NOT_FOUND",
        "Flashcard not found or access denied",
        { flashcardId },
        { method, endpoint, userId, duration }
      );
    }

    const duration = performance.now() - startTime;
    return jsonResponse(updatedFlashcard, { status: 200 }, { method, endpoint, userId, duration });
  } catch (err) {
    const duration = performance.now() - startTime;
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(
      500,
      "DATABASE_ERROR",
      "Failed to update flashcard",
      { message, flashcardId },
      { method, endpoint, userId, duration }
    );
  }
};

/**
 * DELETE /api/flashcards/:id
 *
 * Delete a flashcard.
 * Only allows deleting flashcards belonging to the authenticated user.
 */
export const DELETE: APIRoute = async (context) => {
  const startTime = performance.now();
  const userId = context.locals.userId;
  const flashcardId = parseInt(context.params.id as string, 10);
  const endpoint = `/api/flashcards/${flashcardId}`;
  const method = "DELETE";

  if (!userId) {
    return errorResponse(401, "UNAUTHORIZED", "Unauthorized", undefined, { method, endpoint, userId });
  }

  if (isNaN(flashcardId)) {
    const duration = performance.now() - startTime;
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Invalid flashcard ID",
      { flashcardId: context.params.id },
      { method, endpoint, userId, duration }
    );
  }

  try {
    const deleted = await deleteFlashcard({
      supabase: context.locals.supabase,
      userId,
      flashcardId,
    });

    if (!deleted) {
      const duration = performance.now() - startTime;
      return errorResponse(
        404,
        "NOT_FOUND",
        "Flashcard not found or access denied",
        { flashcardId },
        { method, endpoint, userId, duration }
      );
    }

    const duration = performance.now() - startTime;
    return jsonResponse(
      { message: "Flashcard deleted successfully", id: flashcardId },
      { status: 200 },
      { method, endpoint, userId, duration }
    );
  } catch (err) {
    const duration = performance.now() - startTime;
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(
      500,
      "DATABASE_ERROR",
      "Failed to delete flashcard",
      { message, flashcardId },
      { method, endpoint, userId, duration }
    );
  }
};
