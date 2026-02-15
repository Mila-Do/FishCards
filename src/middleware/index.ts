import { defineMiddleware } from "astro:middleware";
import type { MiddlewareHandler } from "astro";
import { createSupabaseClient } from "../db/supabase.client.ts";
import type { SupabaseClient } from "../db/supabase.client.ts";
import { checkRateLimit, getRateLimitConfig } from "../lib/rate-limiter";
import { errorResponse } from "../lib/response-helpers";
import {
  isProtectedRoute,
  isGuestOnlyRoute,
  isPublicApiRoute,
  isClientProtectedRoute,
  getAuthenticatedRedirect,
  getUnauthenticatedRedirect,
} from "../lib/auth/routes-config";
import { extractBearerToken, generateTokenJti } from "../lib/auth/token-utils";

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
  const pathname = context.url.pathname;
  // Skip middleware for static assets
  if (
    pathname.startsWith("/_astro/") ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/images/") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".gif") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".webp")
  ) {
    return next();
  }

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

  // Get runtime env from Cloudflare or fallback to import.meta.env
  const runtimeEnv = context.locals.runtime?.env;
  const env = {
    SUPABASE_URL: runtimeEnv?.SUPABASE_URL || import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL || "",
    SUPABASE_KEY: runtimeEnv?.SUPABASE_KEY || import.meta.env.SUPABASE_KEY || import.meta.env.PUBLIC_SUPABASE_KEY || "",
    ENV_NAME: runtimeEnv?.ENV_NAME || import.meta.env.ENV_NAME || import.meta.env.PUBLIC_ENV_NAME || "local",
  };

  // Skip auth check for public routes
  if (isApiRoute && isPublicApiRoute(pathname)) {
    return next();
  }

  // Always check for Bearer token from Authorization header
  const token = extractBearerToken(context.request.headers.get("authorization"));

  // Log authentication attempts for debugging
  if (env.ENV_NAME === "local" || import.meta.env.DEV) {
    console.log(`🔍 [${pathname}] Auth check:`, {
      hasAuthHeader: !!context.request.headers.get("authorization"),
      hasToken: !!token,
      isApiRoute,
      isClientProtected: isClientProtectedRoute(pathname),
      env: env.ENV_NAME,
    });
  }

  let user = null;
  let authenticatedSupabase = null;

  // Check auth for ALL routes (but handle differently based on route type)
  if (token) {
    try {
      // Create anonymous client for token validation
      const anonymousSupabase = createSupabaseClient(env);

      // Validate token with Supabase
      const { data, error } = await anonymousSupabase.auth.getUser(token);

      if (!error && data?.user) {
        // Check if token is revoked (blacklisted)
        const isRevoked = await checkTokenRevocation(token, anonymousSupabase);

        if (isRevoked) {
          console.warn("🚫 Revoked token attempted to be used:", "Path:", pathname);
          // Don't set user - treat as unauthenticated
        } else {
          user = data.user;

          // Create authenticated Supabase client for RLS
          authenticatedSupabase = createSupabaseClient(env, token);

          // ALWAYS store user info in context.locals (for Layout.astro)
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

  // Handle route protection based on route type

  // 1. Guest-only routes: authenticated users should be redirected
  if (isGuestOnlyRoute(pathname) && user) {
    if (isApiRoute) {
      return authErrorResponse(403, "FORBIDDEN", "Already authenticated", pathname);
    } else {
      // Redirect authenticated users away from auth pages
      return context.redirect(getAuthenticatedRedirect());
    }
  }

  // 2. Server-protected routes: unauthenticated users should be redirected
  if (isProtectedRoute(pathname) && !user) {
    if (isApiRoute) {
      return authErrorResponse(401, "UNAUTHORIZED", "Authentication required", pathname);
    } else {
      // Redirect to login for page routes
      return context.redirect(getUnauthenticatedRedirect(pathname));
    }
  }

  // 3. Client-protected routes: allow page load with user info (AuthGuard handles auth)
  if (isClientProtectedRoute(pathname)) {
    // Continue to page load - AuthGuard will handle authentication
    // Layout.astro will have access to user info if available
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
    context.locals.supabase = createSupabaseClient(env);
  }

  return next();
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
