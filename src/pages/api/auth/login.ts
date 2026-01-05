/**
 * Login API endpoint
 * Handles user authentication with Supabase Auth
 */

import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { loginSchema } from "../../../lib/validation/auth-schemas";
import { mapSupabaseAuthError } from "../../../lib/auth/error-mapper";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Nieprawidłowe dane wejściowe",
            details: validation.error.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password } = validation.data;

    // Create Supabase server instance for session management
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    // Attempt to sign in user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      // Map Supabase error to our standardized error format
      const mappedError = mapSupabaseAuthError(error);

      return new Response(JSON.stringify({ error: mappedError }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        redirectTo: "/generator", // Default redirect after login
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Login API Error:", error);

    // Handle JSON parsing errors and other unexpected errors
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
        message: "Only POST method is allowed for login",
      },
    }),
    {
      status: 405,
      headers: { "Content-Type": "application/json" },
    }
  );
};
