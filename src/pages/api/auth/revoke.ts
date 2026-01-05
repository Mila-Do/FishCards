/**
 * Token revocation API endpoint
 * Handles revoking Bearer tokens by adding them to blacklist
 */

import type { APIRoute } from "astro";
import { extractBearerToken, generateRevocationData } from "../../../lib/auth/token-utils";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check if user is authenticated
    const user = locals.user;
    const supabase = locals.supabase;

    if (!user || !supabase) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            timestamp: new Date().toISOString(),
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get token from Authorization header
    const token = extractBearerToken(request.headers.get("authorization"));

    if (!token) {
      return new Response(
        JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: "Bearer token required in Authorization header",
            timestamp: new Date().toISOString(),
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body for additional parameters
    let body: {
      reason?: string;
      revoke_all?: boolean;
    } = {};

    try {
      const contentType = request.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        body = await request.json();
      }
    } catch {
      // Default to empty body if parsing fails
    }

    const reason = body.reason || "manual_logout";
    const revokeAll = body.revoke_all || false;

    // Validate reason
    const validReasons = ["manual_logout", "security_incident", "password_change", "admin_revoke"];
    if (!validReasons.includes(reason)) {
      return new Response(
        JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: `Invalid reason. Must be one of: ${validReasons.join(", ")}`,
            timestamp: new Date().toISOString(),
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate revocation data using centralized utilities
    const revocationData = await generateRevocationData(token, reason);

    try {
      if (revokeAll) {
        // Revoke all tokens for user - would need additional logic to track active tokens
        console.info(`Revoking all tokens for user ${user.id} with reason: ${reason}`);

        // In a full implementation, you'd need to track all active tokens
        // For now, we'll just revoke the current token
      }

      // Revoke the current token using the database function
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: revokeError } = await (supabase as any).rpc("revoke_token", {
        p_token_jti: revocationData.jti,
        p_token_hash: revocationData.hash,
        p_expires_at: revocationData.expires_at.toISOString(),
        p_reason: revocationData.reason,
      });

      if (revokeError) {
        console.error("Token revocation failed:", revokeError);
        return new Response(
          JSON.stringify({
            error: {
              code: "REVOCATION_FAILED",
              message: "Failed to revoke token",
              timestamp: new Date().toISOString(),
            },
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      console.info(`Token revoked successfully for user ${user.id}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Token revoked successfully",
          revoked_at: new Date().toISOString(),
          reason,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (dbError) {
      console.error("Database error during token revocation:", dbError);
      return new Response(
        JSON.stringify({
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to revoke token due to database error",
            timestamp: new Date().toISOString(),
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Unexpected error in token revocation:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
          timestamp: new Date().toISOString(),
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Only POST method is allowed
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Only POST method is allowed for token revocation",
        timestamp: new Date().toISOString(),
      },
    }),
    {
      status: 405,
      headers: { "Content-Type": "application/json" },
    }
  );
};
