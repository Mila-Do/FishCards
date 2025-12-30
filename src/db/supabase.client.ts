import { createClient } from "@supabase/supabase-js";

import type { SupabaseClient as SupabaseJsClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Project-wide Supabase client type.
 *
 * IMPORTANT: Other files should import SupabaseClient from here (not directly from
 * `@supabase/supabase-js`) to keep typing consistent across the codebase.
 */
export type SupabaseClient = SupabaseJsClient<Database>;
