import { createClient } from "@supabase/supabase-js";
// Removed session cookie imports - using Bearer tokens only

import type { SupabaseClient as SupabaseJsClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Client-side Supabase client (for API endpoints with Bearer tokens)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Project-wide Supabase client type.
 *
 * IMPORTANT: Other files should import SupabaseClient from here (not directly from
 * `@supabase/supabase-js`) to keep typing consistent across the codebase.
 */
export type SupabaseClient = SupabaseJsClient<Database>;

// All session cookie functionality has been removed
// The application now uses Bearer tokens exclusively for authentication
