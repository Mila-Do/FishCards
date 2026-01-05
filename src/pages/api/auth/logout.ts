/**
 * Logout API endpoint
 * Handles user logout with Supabase Auth
 */

import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get Bearer token from request headers
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (token) {
      // For Bearer tokens, logout is handled client-side
      // Server just acknowledges the request
      console.log("Logout request received for token");
    }

    // Always return success - client handles token cleanup
    return new Response(
      JSON.stringify({
        success: true,
        message: "Wylogowano pomyślnie",
        redirectTo: "/",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
    // Even if server logout fails, return success for client cleanup
    return new Response(
      JSON.stringify({
        success: true,
        message: "Wylogowano pomyślnie",
        redirectTo: "/",
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
