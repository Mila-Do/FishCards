import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";
import { checkRateLimit, getRateLimitConfig } from "../lib/rate-limiter";
import { errorResponse } from "../lib/response-helpers";

function jsonResponse(body: unknown, options: { status: number }) {
  return new Response(JSON.stringify(body), {
    status: options.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;

  // Enforce authentication for API routes. Keeps auth logic consistent across endpoints.
  if (!context.url.pathname.startsWith("/api/")) {
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
});
