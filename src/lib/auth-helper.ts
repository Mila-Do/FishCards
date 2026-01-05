/**
 * Authentication helper for API requests
 *
 * Uses proper Supabase authentication for all environments
 */

/**
 * Get authentication token for API requests
 * Uses the new auth service for proper token management
 */
export async function getAuthToken(): Promise<string | null> {
  const { authService } = await import("./auth/auth-service");
  return await authService.getToken();
}

/**
 * Get authentication headers for API requests
 * Uses the new auth service for proper token management
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();

  if (!token) {
    return { "Content-Type": "application/json" };
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Enhanced fetch with automatic authentication headers
 * Uses the new auth service for proper token management with automatic refresh
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { authService } = await import("./auth/auth-service");
  const token = await authService.getToken();

  if (!token) {
    // Redirect to login if no token available
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
    throw new Error("Authentication required");
  }

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
