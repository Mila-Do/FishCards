import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

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

  const { data, error } = await context.locals.supabase.auth.getUser(token);
  if (error || !data?.user) {
    return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } }, { status: 401 });
  }

  context.locals.userId = data.user.id;
  return next();
});
