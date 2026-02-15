/**
 * Forgot Password API endpoint
 * Sends password reset email using Supabase Auth
 */

import type { APIRoute } from "astro";
import { createSupabaseClient } from "../../../db/supabase.client";
import { forgotPasswordSchema } from "../../../lib/validation/auth-schemas";
import { mapSupabaseAuthError } from "../../../lib/auth/error-mapper";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

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

    const { email } = validation.data;

    // Get environment variables from runtime or fallback to import.meta.env
    const runtimeEnv = locals.runtime?.env;
    const env = {
      PUBLIC_SUPABASE_URL: runtimeEnv?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_KEY: runtimeEnv?.PUBLIC_SUPABASE_KEY || import.meta.env.PUBLIC_SUPABASE_KEY,
    };

    // Send password reset email using regular Supabase client
    const { error } = await createSupabaseClient(env).auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/auth/reset-password`,
    });

    // Note: Always return success for security (don't reveal if email exists)
    // This follows security best practice of not disclosing user existence
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Password reset error:", error);
      // Still return success to user for security
    }

    // Success response (always returned regardless of email existence)
    return new Response(
      JSON.stringify({
        success: true,
        message: "Jeśli podany adres email istnieje w systemie, otrzymasz wiadomość z linkiem do resetowania hasła.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Forgot Password API Error:", error);

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
        message: "Only POST method is allowed for forgot password",
      },
    }),
    {
      status: 405,
      headers: { "Content-Type": "application/json" },
    }
  );
};
