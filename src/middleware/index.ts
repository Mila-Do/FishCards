import { defineMiddleware } from "astro:middleware";
import type { MiddlewareHandler } from "astro";

import { supabaseClient, createSupabaseServerInstance } from "../db/supabase.client.ts";
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
  // Set supabase client for API routes (existing logic)
  context.locals.supabase = supabaseClient;

  // Handle Astro pages (non-API routes) with session management
  if (!context.url.pathname.startsWith("/api/")) {
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

  // Development tokens for testing (only in dev mode)
  const DEV_TOKENS = {
    "dev-token-user1": "81ae3963-b7c1-495e-bef5-4be876d4390a", // user01@gmail.com
    "dev-token-user2": "fc161727-fbda-42f5-bd8b-8a0d219e363b", // user02@gmail.com
  } as const;

  // Check if it's a development token
  if (token in DEV_TOKENS) {
    // Only allow dev tokens in development environment
    if (import.meta.env.DEV) {
      context.locals.userId = DEV_TOKENS[token as keyof typeof DEV_TOKENS];
      return next();
    } else {
      return jsonResponse(
        { error: { code: "UNAUTHORIZED", message: "Development tokens not allowed in production" } },
        { status: 401 }
      );
    }
  }

  // Regular Supabase authentication
  const { data, error } = await context.locals.supabase.auth.getUser(token);
  if (error || !data?.user) {
    return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } }, { status: 401 });
  }

  context.locals.userId = data.user.id;

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
