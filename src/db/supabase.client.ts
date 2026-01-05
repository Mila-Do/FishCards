import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient as SupabaseJsClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types.ts";

/**
 * Factory function to create Supabase client with optional auth token.
 * Używana TYLKO po stronie serwera (middleware, API endpoints).
 *
 * @param authToken - Optional Bearer token for authenticated requests
 * @returns Configured Supabase client
 */
export function createSupabaseClient(authToken?: string) {
  // Sprawdzenie czy jesteśmy po stronie serwera
  if (typeof window !== "undefined") {
    throw new Error("Klient Supabase nie może być tworzony po stronie przeglądarki. Użyj API endpoints.");
  }

  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Wymagane zmienne środowiskowe SUPABASE_URL i SUPABASE_KEY nie są ustawione.");
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
