/**
 * Token refresh API endpoint
 * Handles secure token refresh using refresh tokens
 */

import type { APIRoute } from "astro";
import { createSupabaseClient } from "../../../db/supabase.client";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "MISSING_REFRESH_TOKEN",
            message: "Refresh token jest wymagany",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Refresh session with Supabase
    const { data, error } = await createSupabaseClient().auth.refreshSession({
      refresh_token: refresh_token,
    });

    if (error || !data.session || !data.user) {
      console.warn("Token refresh failed:", error?.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "REFRESH_FAILED",
            message: "Nie udało się odświeżyć tokenu. Zaloguj się ponownie.",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return new token data
    return new Response(
      JSON.stringify({
        success: true,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Token refresh API error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "REFRESH_ERROR",
          message: "Wystąpił błąd podczas odświeżania tokenu",
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
        message: "Only POST method is allowed for token refresh",
      },
    }),
    {
      status: 405,
      headers: { "Content-Type": "application/json" },
    }
  );
};
