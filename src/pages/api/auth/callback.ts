/**
 * Auth callback endpoint for email verification
 * Handles Supabase email confirmation links
 */
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const token = url.searchParams.get("token");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next") || "/dashboard";

  if (!token) {
    return redirect("/auth/login?error=missing_token");
  }

  try {
    const supabase = locals.supabase;

    // Verify the token based on type
    if (type === "signup" || type === "email") {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "email",
      });

      if (error) {
        console.error("Email verification error:", error);
        return redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
      }
    } else {
      // For other types (recovery, etc.), use exchangeCodeForSession
      const { error } = await supabase.auth.exchangeCodeForSession(token);

      if (error) {
        console.error("Token exchange error:", error);
        return redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
      }
    }

    // Verification successful - redirect to next page
    return redirect(next);
  } catch (error) {
    console.error("Callback error:", error);
    return redirect("/auth/login?error=verification_failed");
  }
};
