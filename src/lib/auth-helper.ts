/**
 * Authentication helper for API requests
 *
 * Uses proper Supabase authentication for all environments
 */

/**
 * Get authentication token for API requests
 *
 * NOTE: This function is deprecated and should not be used.
 * Use Supabase auth system directly instead.
 */
export function getAuthToken(): string | null {
  // This function should only be used with proper authentication
  // In production, tokens should come from Supabase auth system
  throw new Error("Development auth helper removed for security. Use proper Supabase authentication.");
}

/**
 * Get authentication headers for API requests
 *
 * NOTE: This function is deprecated. Use proper Supabase client authentication.
 */
export function getAuthHeaders(): Record<string, string> {
  throw new Error(
    "Development auth helper removed for security. Use proper Supabase authentication with session tokens."
  );
}

/**
 * Enhanced fetch with automatic authentication headers
 *
 * NOTE: This function is deprecated. Use Supabase client with proper session management.
 */
export async function authenticatedFetch(): Promise<Response> {
  throw new Error("Development auth helper removed for security. Use Supabase client for authenticated requests.");
}
