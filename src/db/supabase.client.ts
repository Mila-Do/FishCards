import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient as SupabaseJsClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types.ts";

/**
 * Environment variables needed for Supabase client
 */
interface SupabaseEnv {
  PUBLIC_SUPABASE_URL?: string;
  PUBLIC_SUPABASE_KEY?: string;
}

/**
 * Factory function to create Supabase client with optional auth token.
 * Używana TYLKO po stronie serwera (middleware, API endpoints).
 *
 * @param env - Environment variables (from context.locals.runtime.env or import.meta.env)
 * @param authToken - Optional Bearer token for authenticated requests
 * @returns Configured Supabase client
 */
export function createSupabaseClient(env?: SupabaseEnv, authToken?: string) {
  // Sprawdzenie czy jesteśmy po stronie serwera
  if (typeof window !== "undefined") {
    throw new Error("Klient Supabase nie może być tworzony po stronie przeglądarki. Użyj API endpoints.");
  }

  const supabaseUrl = env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env?.PUBLIC_SUPABASE_KEY || import.meta.env.PUBLIC_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Wymagane zmienne środowiskowe PUBLIC_SUPABASE_URL i PUBLIC_SUPABASE_KEY nie są ustawione.");
  }

  const config = authToken
    ? {
        global: {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      }
    : {};

  return createClient<Database>(supabaseUrl, supabaseAnonKey, config);
}

/**
 * Project-wide Supabase client type.
 *
 * IMPORTANT: Other files should import SupabaseClient from here (not directly from
 * `@supabase/supabase-js`) to keep typing consistent across the codebase.
 */
export type SupabaseClient = SupabaseJsClient<Database>;

// All session cookie functionality has been removed
// The application now uses Bearer tokens exclusively for authentication
