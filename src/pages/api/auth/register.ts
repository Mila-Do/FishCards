/**
 * Registration API endpoint
 * Handles user registration with Supabase Auth (without email verification)
 */

import type { APIRoute } from "astro";
import { registerSchema } from "../../../lib/validation/auth-schemas";
import { mapSupabaseAuthError } from "../../../lib/auth/error-mapper";
import { createSupabaseClient } from "../../../db/supabase.client";

export const POST: APIRoute = async ({ request, locals }) => {
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

    // Get environment variables from runtime or fallback to import.meta.env
    const runtimeEnv = locals.runtime?.env;
    const env = {
      PUBLIC_SUPABASE_URL: runtimeEnv?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_KEY: runtimeEnv?.PUBLIC_SUPABASE_KEY || import.meta.env.PUBLIC_SUPABASE_KEY,
    };

    // Get origin from request for email redirect
    const origin = new URL(request.url).origin;

    // Use regular Supabase client for authentication
    // Session management is handled by the frontend auth service
    const { data, error } = await createSupabaseClient(env).auth.signUp({
      email,
      password,
      options: {
        // Email confirmation redirect - redirects to dashboard after verification
        emailRedirectTo: `${origin}/dashboard`,
      },
    });

    if (error || !data.user) {
      const mappedError = mapSupabaseAuthError(error);
      return new Response(JSON.stringify({ error: mappedError }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return user data and tokens if session is available (auto-confirm enabled)
    const response = {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      redirectTo: "/dashboard",
      // Include session data if available
      ...(data.session && {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      }),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Registration API Error:", error);

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
