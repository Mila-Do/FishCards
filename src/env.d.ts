/// <reference types="astro/client" />

import type { SupabaseClient } from "./db/supabase.client";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      /**
       * Authenticated user id (set by middleware for /api/* routes).
       * Optional because non-API routes might not require auth.
       */
      userId?: string;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly MOCK_AI_GENERATION?: string;
  /**
   * Development auth token for testing API endpoints
   * Should be Bearer token or dev token like 'dev-token-user1'
   */
  readonly PUBLIC_DEV_AUTH_TOKEN?: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
