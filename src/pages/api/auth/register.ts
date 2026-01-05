/**
 * Register API endpoint
 * Handles user registration with Supabase Auth
 * Implements auto-confirmation as per US-001 requirements
 */

import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { registerSchema } from "../../../lib/validation/auth-schemas";
import { mapSupabaseAuthError } from "../../../lib/auth/error-mapper";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

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

    // Attempt to register user
    // Note: Supabase should be configured for auto-confirmation (US-001 requirement)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Auto-confirm email for immediate activation (US-001)
        emailRedirectTo: undefined, // No email confirmation needed
      },
    });

    if (error) {
      // Map Supabase error to our standardized error format
      const mappedError = mapSupabaseAuthError(error);

      return new Response(JSON.stringify({ error: mappedError }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "REGISTRATION_FAILED",
            message: "Nie udało się utworzyć konta",
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if user needs email confirmation (shouldn't happen with auto-confirm)
    if (!data.session) {
      return new Response(
        JSON.stringify({
          success: true,
          requiresConfirmation: true,
          user: {
            id: data.user.id,
            email: data.user.email,
          },
          message: "Konto utworzone - sprawdź email w celu aktywacji",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success response with immediate login (US-001 requirement)
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        session: !!data.session,
        redirectTo: "/generator", // Redirect to main app after registration
        message: "Konto zostało pomyślnie utworzone i aktywowane",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Register API Error:", error);

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
        message: "Only POST method is allowed for registration",
      },
    }),
    {
      status: 405,
      headers: { "Content-Type": "application/json" },
    }
  );
};
