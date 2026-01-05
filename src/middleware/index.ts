import { defineMiddleware } from "astro:middleware";
import type { MiddlewareHandler } from "astro";
import { createClient } from "@supabase/supabase-js";

import { supabaseClient, createSupabaseServerInstance } from "../db/supabase.client.ts";
import type { Database } from "../db/database.types.ts";
import { checkRateLimit, getRateLimitConfig } from "../lib/rate-limiter";
import { errorResponse } from "../lib/response-helpers";
import {
  isProtectedRoute,
  isGuestOnlyRoute,
  isPublicApiRoute,
  getAuthenticatedRedirect,
  getUnauthenticatedRedirect,
} from "../lib/auth/routes-config";

function jsonResponse(body: unknown, options: { status: number }) {
  return new Response(JSON.stringify(body), {
    status: options.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Handle Astro pages (non-API routes) with session management
  if (!context.url.pathname.startsWith("/api/")) {
    // Set supabase client for page routes
    context.locals.supabase = supabaseClient;
    return handlePageRequest(context, next);
  }

  // Handle API routes with Bearer token auth (existing logic)
  return handleApiRequest(context, next);
});

/**
 * Handles authentication for Astro pages using session cookies
 */
async function handlePageRequest(context: Parameters<MiddlewareHandler>[0], next: Parameters<MiddlewareHandler>[1]) {
  const pathname = context.url.pathname;

  // Create server-side Supabase instance for session management
  const supabase = createSupabaseServerInstance({
    headers: context.request.headers,
    cookies: context.cookies,
  });

  // Get user session from cookies
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Store user info in context.locals for use in Astro pages
  if (user && !error && user.email) {
    context.locals.user = {
      email: user.email,
      id: user.id,
    };
    context.locals.userId = user.id;
  }

  // Apply route protection logic
  if (isProtectedRoute(pathname) && !user) {
    // Redirect unauthenticated users to login
    return context.redirect(getUnauthenticatedRedirect(pathname));
  }

  if (isGuestOnlyRoute(pathname) && user) {
    // Redirect authenticated users away from auth pages
    return context.redirect(getAuthenticatedRedirect());
  }

  return next();
}

/**
 * Handles authentication for API routes using Bearer tokens (existing logic)
 */
async function handleApiRequest(context: Parameters<MiddlewareHandler>[0], next: Parameters<MiddlewareHandler>[1]) {
  // Skip auth check for public API routes
  if (isPublicApiRoute(context.url.pathname)) {
    return next();
  }

  const authHeader = context.request.headers.get("authorization");

  if (!authHeader) {
    return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Missing Authorization header" } }, { status: 401 });
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1];

  if (!token) {
    return jsonResponse(
      { error: { code: "UNAUTHORIZED", message: "Invalid Authorization header format" } },
      { status: 401 }
    );
  }

  // All tokens must be valid Supabase JWT tokens

  // Regular Supabase authentication
  const { data, error } = await supabaseClient.auth.getUser(token);
  if (error || !data?.user) {
    return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } }, { status: 401 });
  }

  context.locals.userId = data.user.id;

  // Create authenticated Supabase client for RLS
  // This client has the user context needed for Row Level Security
  const authenticatedSupabase = createClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
  context.locals.supabase = authenticatedSupabase;

  // Apply rate limiting for API endpoints
  const rateLimitConfig = getRateLimitConfig(context.url.pathname, context.request.method);
  const rateLimitResult = checkRateLimit(data.user.id, context.url.pathname, context.request.method, rateLimitConfig);

  if (!rateLimitResult.allowed) {
    return errorResponse(429, "RATE_LIMIT_EXCEEDED", "Too many requests", {
      retryAfter: Math.ceil(rateLimitResult.resetTime / 1000),
      limit: rateLimitConfig.maxRequests,
      remaining: rateLimitResult.remaining,
    });
  }

  return next();
}
