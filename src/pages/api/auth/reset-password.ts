/**
 * Reset Password API endpoint
 * Handles password reset using token from email
 */

import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { resetPasswordSchema } from "../../../lib/validation/auth-schemas";
import { mapSupabaseAuthError } from "../../../lib/auth/error-mapper";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

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

    const { password } = validation.data;

    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    // Update user password
    const { data, error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error || !data.user) {
      const mappedError = mapSupabaseAuthError(error);

      return new Response(JSON.stringify({ error: mappedError }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Success response - user should be automatically logged in
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        message: "Hasło zostało pomyślnie zmienione",
        redirectTo: "/generator", // Redirect to main app
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Reset Password API Error:", error);

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
        message: "Only POST method is allowed for password reset",
      },
    }),
    {
      status: 405,
      headers: { "Content-Type": "application/json" },
    }
  );
};
