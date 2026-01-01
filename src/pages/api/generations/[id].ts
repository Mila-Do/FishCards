import type { APIRoute } from "astro";

import { generationIdSchema } from "../../../lib/validation/generation";
import { getGenerationById } from "../../../lib/services/generation.service";
import { jsonResponse, errorResponse } from "../../../lib/response-helpers";

/**
 * GET /api/generations/:id
 *
 * Retrieve a single generation session by ID.
 *
 * The generation must belong to the authenticated user.
 * Returns 404 if the generation is not found or does not belong to the user.
 */
export const GET: APIRoute = async (context) => {
  const userId = context.locals.userId;
  if (!userId) return errorResponse(401, "UNAUTHORIZED", "Unauthorized");

  const idParam = context.params.id;
  if (!idParam) {
    return errorResponse(400, "VALIDATION_ERROR", "Generation ID is required");
  }

  const parsed = generationIdSchema.safeParse(idParam);
  if (!parsed.success) {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid generation ID", { issues: parsed.error.issues });
  }

  try {
    const generation = await getGenerationById({
      supabase: context.locals.supabase,
      userId,
      generationId: parsed.data,
    });

    if (!generation) {
      return errorResponse(404, "NOT_FOUND", "Generation not found");
    }

    return jsonResponse(generation, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(500, "DATABASE_ERROR", "Failed to fetch generation", { message });
  }
};
