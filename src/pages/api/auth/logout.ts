/**
 * Logout API endpoint
 * Handles user logout with Supabase Auth
 */

import type { APIRoute } from "astro";
import { extractBearerToken, generateRevocationData } from "../../../lib/auth/token-utils";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check if user is authenticated
    const user = locals.user;
    const supabase = locals.supabase;

    // Get Bearer token from request headers
    const token = extractBearerToken(request.headers.get("authorization"));

    let tokenRevoked = false;
    let revokeError: string | null = null;

    // Try to revoke token if available
    if (token && user && supabase) {
      try {
        // Generate revocation data for logout
        const revocationData = await generateRevocationData(token, "manual_logout");

        // Revoke the token using the database function
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).rpc("revoke_token", {
          p_token_jti: revocationData.jti,
          p_token_hash: revocationData.hash,
          p_expires_at: revocationData.expires_at.toISOString(),
          p_reason: revocationData.reason,
        });

        if (error) {
          console.error("Token revocation failed during logout:", error);
          revokeError = error.message;
        } else {
          tokenRevoked = true;
          console.info(`Token revoked during logout for user ${user.id}`);
        }
      } catch (error) {
        console.error("Error during token revocation in logout:", error);
        revokeError = error instanceof Error ? error.message : "Unknown error";
      }
    }

    // Always return success even if revocation fails
    // Client should clean up local state regardless
    return new Response(
      JSON.stringify({
        success: true,
        message: "Wylogowano pomyślnie",
        redirectTo: "/",
        tokenRevoked,
        ...(revokeError && { revokeError }),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in logout:", error);
    // Even if server logout fails, return success for client cleanup
    return new Response(
      JSON.stringify({
        success: true,
        message: "Wylogowano pomyślnie",
        redirectTo: "/",
        tokenRevoked: false,
        revokeError: "Server error occurred",
      }),
      {
        status: 200,
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
        message: "Only POST method is allowed for logout",
      },
    }),
    {
      status: 405,
      headers: { "Content-Type": "application/json" },
    }
  );
};
