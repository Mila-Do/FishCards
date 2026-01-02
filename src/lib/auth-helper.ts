/**
 * Authentication helper for API requests
 *
 * For development: uses dev tokens from environment
 * For production: should use proper authentication flow
 */

/**
 * Get authentication token for API requests
 *
 * DEVELOPMENT ONLY: Returns dev token for testing
 * In production, this should integrate with proper auth system
 */
export function getAuthToken(): string | null {
  // Try to get token from environment first
  const envToken = import.meta.env.PUBLIC_DEV_AUTH_TOKEN;

  if (envToken) {
    return envToken;
  }

  // Fallback to default dev token for user1
  return "dev-token-user1";
}

/**
 * Get authentication headers for API requests
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();

  if (!token) {
    throw new Error("No authentication token available");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Enhanced fetch with automatic authentication headers
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = getAuthHeaders();

  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });
}
