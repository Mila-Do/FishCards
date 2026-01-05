/**
 * Token validation API endpoint
 * Validates Bearer tokens securely on the server side
 */

import type { APIRoute } from "astro";
import { createSupabaseClient } from "../../../db/supabase.client";

export const GET: APIRoute = async ({ request }) => {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "MISSING_TOKEN",
            message: "Token autoryzacji jest wymagany",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Validate token with Supabase
    const { data, error } = await createSupabaseClient().auth.getUser(token);

    if (error || !data.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Token jest nieprawidłowy lub wygasł",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return success with user data
    return new Response(
      JSON.stringify({
        success: true,
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
    console.error("Token validation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Wystąpił błąd podczas walidacji tokenu",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Only GET method is allowed
export const POST: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Only GET method is allowed for token validation",
      },
    }),
    {
      status: 405,
      headers: { "Content-Type": "application/json" },
    }
  );
};
