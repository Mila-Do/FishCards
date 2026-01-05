/**
 * Logout API endpoint
 * Handles user logout with Supabase Auth
 */

import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { mapSupabaseAuthError } from "../../../lib/auth/error-mapper";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase server instance for session management
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    // Attempt to sign out user
    const { error } = await supabase.auth.signOut();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Logout error:", error);

      // Map Supabase error to our standardized error format
      const mappedError = mapSupabaseAuthError(error);

      return new Response(JSON.stringify({ error: mappedError }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Wylogowano pomyślnie",
        redirectTo: "/", // Redirect to home page after logout
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Logout API Error:", error);

    // Handle unexpected errors
    const mappedError = mapSupabaseAuthError(error);

    return new Response(JSON.stringify({ error: mappedError }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
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
