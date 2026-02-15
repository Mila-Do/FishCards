/// <reference types="astro/client" />

import type { SupabaseClient } from "./db/supabase.client";

/**
 * Cloudflare Workers Runtime Environment Variables
 * These are available at runtime via context.locals.runtime.env
 */
interface CloudflareEnv {
  // Public variables (also available in import.meta.env with PUBLIC_ prefix)
  ENV_NAME: string;
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  MOCK_AI_GENERATION: string;
  // Runtime-only secrets (NOT in import.meta.env)
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPENROUTER_API_KEY: string;
}

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
      /**
       * Cloudflare Workers runtime environment
       * Available in SSR context via Astro adapter
       */
      runtime: {
        env: CloudflareEnv;
        cf: CfProperties;
        ctx: ExecutionContext;
      };
    }
  }
}

/**
 * Import.meta.env variables (build-time + PUBLIC_ prefixed runtime vars)
 * Note: In Cloudflare Workers, prefer using context.locals.runtime.env for runtime variables
 */
interface ImportMetaEnv {
  // Build-time constants
  readonly MODE: "development" | "production" | "test";
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
  // Public runtime variables (prefixed with PUBLIC_ for client-side access)
  readonly PUBLIC_ENV_NAME?: string;
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_KEY?: string;
  readonly PUBLIC_MOCK_AI_GENERATION?: string;

  // Legacy support (for local dev with .env files)
  readonly ENV_NAME?: string;
  readonly SUPABASE_URL?: string;
  readonly SUPABASE_KEY?: string;
  readonly MOCK_AI_GENERATION?: string;
  readonly OPENROUTER_API_KEY?: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;

  // E2E Testing variables (used in test environment)
  readonly E2E_USERNAME_ID?: string;
  readonly E2E_USERNAME?: string;
  readonly E2E_PASSWORD?: string;
  // Mailtrap (E2E email testing)
  readonly MAILTRAP_HOST?: string;
  readonly MAILTRAP_PORT?: string;
  readonly MAILTRAP_USERNAME?: string;
  readonly MAILTRAP_PASSWORD?: string;
  readonly MAILTRAP_API_TOKEN?: string;
  readonly MAILTRAP_INBOX_ID?: string;
  readonly MAILTRAP_ACCOUNT_ID?: string;

  // Development
  readonly DEV_AUTH_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
