import type { APIRoute } from "astro";

import type { ErrorResponse } from "../../types";
import { generationErrorLogQuerySchema } from "../../lib/validation/generation";
import { getGenerationErrorLogs } from "../../lib/services/generation.service";

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

/**
 * GET /api/generation-error-logs
 *
 * Retrieve generation error logs for the authenticated user.
 *
 * Returns paginated list of error logs sorted by creation date (newest first).
 * Only error logs belonging to the authenticated user are returned.
 */
export const GET: APIRoute = async (context) => {
  const userId = context.locals.userId;
  if (!userId) return errorResponse(401, "UNAUTHORIZED", "Unauthorized");

  const parsed = generationErrorLogQuerySchema.safeParse({
    page: context.url.searchParams.get("page") ?? undefined,
    limit: context.url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid query parameters", { issues: parsed.error.issues });
  }

  try {
    const result = await getGenerationErrorLogs({
      supabase: context.locals.supabase,
      userId,
      page: parsed.data.page,
      limit: parsed.data.limit,
    });
    return jsonResponse(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(500, "DATABASE_ERROR", "Failed to fetch generation error logs", { message });
  }
};
