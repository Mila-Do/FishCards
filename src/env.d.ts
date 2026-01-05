/// <reference types="astro/client" />

import type { SupabaseClient } from "./db/supabase.client";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      /**
       * Authenticated user id (set by middleware for /api/* routes and authenticated pages).
       * Optional because non-API routes might not require auth.
       */
      userId?: string;
      /**
       * Authenticated user info (set by middleware for authenticated pages).
       * Available for Astro pages that use session management.
       */
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly MOCK_AI_GENERATION?: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
