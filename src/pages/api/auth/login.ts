/**
 * Login API endpoint
 * Handles user authentication with Supabase Auth
 */

import type { APIRoute } from "astro";
import { loginSchema } from "../../../lib/validation/auth-schemas";
import { mapSupabaseAuthError } from "../../../lib/auth/error-mapper";
import { createSupabaseClient } from "../../../db/supabase.client";

export const POST: APIRoute = async ({ request }) => {
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

    // Use regular Supabase client for authentication
    // Session management is handled by the frontend auth service
    const { data, error } = await createSupabaseClient().auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      const mappedError = mapSupabaseAuthError(error);
      return new Response(JSON.stringify({ error: mappedError }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return user data and access token for Bearer token auth
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        redirectTo: "/generator",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Login API Error:", error);
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
