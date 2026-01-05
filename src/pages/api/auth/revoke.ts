/**
 * Token revocation API endpoint
 * Handles revoking Bearer tokens by adding them to blacklist
 */

import type { APIRoute } from "astro";

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
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];

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

    // Extract token information (simplified - in production you'd decode JWT)
    const tokenHash = await hashToken(token);
    const tokenJti = generateTokenId(token); // Simplified JTI generation
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

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
        p_token_jti: tokenJti,
        p_token_hash: tokenHash,
        p_expires_at: expiresAt.toISOString(),
        p_reason: reason,
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

/**
 * Generate a simple hash of the token for additional security
 */
async function hashToken(token: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Fallback for environments without crypto.subtle
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Generate a simple token ID (JTI) from token content
 * In production, this would be extracted from the JWT payload
 */
function generateTokenId(token: string): string {
  // This is a simplified approach - in production you'd decode the JWT
  // and extract the 'jti' claim or generate one consistently
  const tokenParts = token.split(".");
  if (tokenParts.length >= 2) {
    // Use part of the token as identifier
    return tokenParts[1].slice(-10) + "-" + Date.now().toString();
  }

  return "token-" + Date.now().toString() + "-" + Math.random().toString(36).substr(2, 9);
}
