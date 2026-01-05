import { defineMiddleware } from "astro:middleware";
import type { MiddlewareHandler } from "astro";
import { createClient } from "@supabase/supabase-js";

import { supabaseClient } from "../db/supabase.client.ts";
import type { Database } from "../db/database.types.ts";
import type { SupabaseClient } from "../db/supabase.client.ts";
import { checkRateLimit, getRateLimitConfig } from "../lib/rate-limiter";
import { errorResponse } from "../lib/response-helpers";
import {
  isProtectedRoute,
  isGuestOnlyRoute,
  isPublicApiRoute,
  getAuthenticatedRedirect,
  getUnauthenticatedRedirect,
} from "../lib/auth/routes-config";

/**
 * Standard error response format for authentication
 */
interface AuthErrorResponse {
  error: {
    code: string;
    message: string;
    timestamp: string;
    path: string;
  };
}

function authErrorResponse(status: number, code: string, message: string, path: string): Response {
  const errorBody: AuthErrorResponse = {
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      path,
    },
  };

  console.warn(`Auth error [${code}]:`, message, "Path:", path);

  return new Response(JSON.stringify(errorBody), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Unified Bearer token authentication for all routes
  return handleUnifiedBearerAuth(context, next);
});

/**
 * Unified Bearer token authentication for all routes (pages and API)
 */
async function handleUnifiedBearerAuth(
  context: Parameters<MiddlewareHandler>[0],
  next: Parameters<MiddlewareHandler>[1]
) {
  const pathname = context.url.pathname;
  const isApiRoute = pathname.startsWith("/api/");

  // Skip auth check for public routes
  if (isApiRoute && isPublicApiRoute(pathname)) {
    return next();
  }

  // Get Bearer token from different sources
  const token = getTokenFromRequest(context.request);

  let user = null;
  let authenticatedSupabase = null;

  if (token) {
    try {
      // Validate token with Supabase
      const { data, error } = await supabaseClient.auth.getUser(token);

      if (!error && data?.user) {
        // Check if token is revoked (blacklisted)
        const isRevoked = await checkTokenRevocation(token, supabaseClient);

        if (isRevoked) {
          console.warn("Revoked token attempted to be used:", "Path:", pathname);
          // Don't set user - treat as unauthenticated
        } else {
          user = data.user;

          // Create authenticated Supabase client for RLS
          authenticatedSupabase = createClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          });

          // Store user info in context.locals
          context.locals.user = {
            email: user.email || "",
            id: user.id,
          };
          context.locals.userId = user.id;
          context.locals.supabase = authenticatedSupabase;
        }
      } else if (error) {
        // Log invalid token attempts
        console.warn("Invalid token provided:", error.message, "Path:", pathname);
      }
    } catch (error) {
      console.error("Token validation error:", error, "Path:", pathname);
    }
  }

  // Handle route protection
  if (isProtectedRoute(pathname) && !user) {
    if (isApiRoute) {
      return authErrorResponse(401, "UNAUTHORIZED", "Authentication required", pathname);
    } else {
      // Redirect to login for page routes
      return context.redirect(getUnauthenticatedRedirect(pathname));
    }
  }

  if (isGuestOnlyRoute(pathname) && user) {
    if (isApiRoute) {
      return authErrorResponse(403, "FORBIDDEN", "Already authenticated", pathname);
    } else {
      // Redirect authenticated users away from auth pages
      return context.redirect(getAuthenticatedRedirect());
    }
  }

  // Apply rate limiting for API endpoints (only for authenticated users)
  if (isApiRoute && user) {
    const rateLimitConfig = getRateLimitConfig(pathname, context.request.method);
    const rateLimitResult = checkRateLimit(user.id, pathname, context.request.method, rateLimitConfig);

    if (!rateLimitResult.allowed) {
      return errorResponse(429, "RATE_LIMIT_EXCEEDED", "Too many requests", {
        retryAfter: Math.ceil(rateLimitResult.resetTime / 1000),
        limit: rateLimitConfig.maxRequests,
        remaining: rateLimitResult.remaining,
      });
    }
  }

  // Set default supabase client if no authenticated one
  if (!context.locals.supabase) {
    context.locals.supabase = supabaseClient;
  }

  return next();
}

/**
 * Extract Bearer token from Authorization header only
 * Enforces consistent Bearer token strategy across all routes
 */
function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Check if token is revoked (blacklisted)
 */
async function checkTokenRevocation(token: string, supabase: SupabaseClient): Promise<boolean> {
  try {
    // Generate token JTI (same logic as in revoke endpoint)
    const tokenJti = generateTokenJti(token);

    // Check if token is in blacklist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("is_token_revoked", {
      p_token_jti: tokenJti,
    });

    if (error) {
      console.error("Error checking token revocation:", error);
      // On error, allow token (fail open for availability)
      return false;
    }

    return data === true;
  } catch (error) {
    console.error("Exception checking token revocation:", error);
    // On exception, allow token (fail open for availability)
    return false;
  }
}

/**
 * Generate token JTI (must match logic in revoke endpoint)
 */
function generateTokenJti(token: string): string {
  const tokenParts = token.split(".");
  if (tokenParts.length >= 2) {
    // Use part of the token as identifier (simplified approach)
    // In production, you'd decode JWT and extract the actual 'jti' claim
    return tokenParts[1].slice(-10) + "-" + Date.now().toString();
  }

  return "token-" + Date.now().toString() + "-" + Math.random().toString(36).substr(2, 9);
}
