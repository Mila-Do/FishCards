import type { APIRoute } from "astro";

import type { DeleteFlashcardResponse } from "../../../types";
import { flashcardIdSchema, updateFlashcardSchema } from "../../../lib/validation/flashcard";
import { deleteFlashcard, getFlashcardById, updateFlashcard } from "../../../lib/services/flashcard.service";
import { jsonResponse, errorResponse } from "../../../lib/response-helpers";

/**
 * GET /api/flashcards/:id
 *
 * Retrieve a single flashcard by ID.
 * The flashcard must belong to the authenticated user.
 * Returns 404 if the flashcard is not found or does not belong to the user.
 */
export const GET: APIRoute = async (context) => {
  const userId = context.locals.userId;
  if (!userId) return errorResponse(401, "UNAUTHORIZED", "Unauthorized");

  const idParam = context.params.id;
  if (!idParam) {
    return errorResponse(400, "VALIDATION_ERROR", "Flashcard ID is required");
  }

  const parsed = flashcardIdSchema.safeParse(idParam);
  if (!parsed.success) {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid flashcard ID", { issues: parsed.error.issues });
  }

  try {
    const flashcard = await getFlashcardById({
      supabase: context.locals.supabase,
      userId,
      flashcardId: parsed.data,
    });

    if (!flashcard) {
      return errorResponse(404, "NOT_FOUND", "Flashcard not found");
    }

    return jsonResponse(flashcard, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(500, "DATABASE_ERROR", "Failed to fetch flashcard", { message });
  }
};

/**
 * PATCH /api/flashcards/:id
 *
 * Update an existing flashcard.
 * All fields are optional - only provided fields will be updated.
 * The flashcard must belong to the authenticated user.
 * Returns 404 if the flashcard is not found or does not belong to the user.
 */
export const PATCH: APIRoute = async (context) => {
  const userId = context.locals.userId;
  if (!userId) return errorResponse(401, "UNAUTHORIZED", "Unauthorized");

  const idParam = context.params.id;
  if (!idParam) {
    return errorResponse(400, "VALIDATION_ERROR", "Flashcard ID is required");
  }

  const idParsed = flashcardIdSchema.safeParse(idParam);
  if (!idParsed.success) {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid flashcard ID", { issues: idParsed.error.issues });
  }

  let body: unknown = null;
  try {
    body = await context.request.json();
  } catch {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid JSON body");
  }

  const bodyParsed = updateFlashcardSchema.safeParse(body);
  if (!bodyParsed.success) {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid request body", { issues: bodyParsed.error.issues });
  }

  try {
    const flashcard = await updateFlashcard({
      supabase: context.locals.supabase,
      userId,
      flashcardId: idParsed.data,
      updates: bodyParsed.data,
    });

    if (!flashcard) {
      return errorResponse(404, "NOT_FOUND", "Flashcard not found");
    }

    return jsonResponse(flashcard, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(500, "DATABASE_ERROR", "Failed to update flashcard", { message });
  }
};

/**
 * DELETE /api/flashcards/:id
 *
 * Delete a flashcard by ID.
 * The flashcard must belong to the authenticated user.
 * Returns 404 if the flashcard is not found or does not belong to the user.
 */
export const DELETE: APIRoute = async (context) => {
  const userId = context.locals.userId;
  if (!userId) return errorResponse(401, "UNAUTHORIZED", "Unauthorized");

  const idParam = context.params.id;
  if (!idParam) {
    return errorResponse(400, "VALIDATION_ERROR", "Flashcard ID is required");
  }

  const parsed = flashcardIdSchema.safeParse(idParam);
  if (!parsed.success) {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid flashcard ID", { issues: parsed.error.issues });
  }

  try {
    const success = await deleteFlashcard({
      supabase: context.locals.supabase,
      userId,
      flashcardId: parsed.data,
    });

    if (!success) {
      return errorResponse(404, "NOT_FOUND", "Flashcard not found");
    }

    const response: DeleteFlashcardResponse = {
      message: "Flashcard deleted successfully",
      id: parsed.data,
    };

    return jsonResponse(response, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(500, "DATABASE_ERROR", "Failed to delete flashcard", { message });
  }
};
