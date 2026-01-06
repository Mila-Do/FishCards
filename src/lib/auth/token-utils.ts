/**
 * Token utilities for Bearer token authentication
 * Centralized functions for token hashing, JTI generation, and validation
 */

/**
 * Generate a deterministic token JTI (JWT ID) from token content
 * This creates a consistent identifier that can be used across middleware and API endpoints
 */
export function generateTokenJti(token: string): string {
  try {
    // Handle null/undefined tokens
    if (!token) {
      return `fallback_${hashString("")}`;
    }

    // For JWT tokens, we use a combination of the signature part and a hash
    const tokenParts = token.split(".");
    if (tokenParts.length >= 3) {
      // Use the signature part (last part) as it's unique for each token
      const signature = tokenParts[2];

      // Create a deterministic identifier from the signature
      // This ensures the same token always gets the same JTI
      return `jti_${signature.slice(-16)}_${hashString(signature)}`;
    }

    // Fallback for non-JWT tokens - use hash of entire token
    return `token_${hashString(token)}`;
  } catch (error) {
    console.error("Error generating token JTI:", error);
    // Fallback to simple hash
    return `fallback_${hashString(token)}`;
  }
}

/**
 * Generate a simple hash of the token for additional security
 * Uses Web Crypto API when available, falls back to simple hash function
 */
export async function hashToken(token: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(token);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (error) {
      console.warn("Crypto.subtle failed, using fallback hash:", error);
    }
  }

  // Fallback for environments without crypto.subtle
  return hashString(token);
}

/**
 * Simple hash function for environments without crypto.subtle
 * Creates a reasonably distributed hash for token identification
 */
function hashString(str: string): string {
  let hash = 0;
  if (!str || str.length === 0) return "00000000";

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Return positive hex string
  return Math.abs(hash).toString(16).padStart(8, "0");
}

/**
 * Validate Bearer token format
 */
export function isValidBearerToken(token: string): boolean {
  if (!token || typeof token !== "string") {
    return false;
  }

  // Basic JWT format validation (3 parts separated by dots)
  const parts = token.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1].trim() : null;
  return token && token.length > 0 ? token : null;
}

/**
 * Generate revocation data for token blacklisting
 */
export async function generateRevocationData(token: string, reason = "manual_logout") {
  const tokenJti = generateTokenJti(token);
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  return {
    jti: tokenJti,
    hash: tokenHash,
    expires_at: expiresAt,
    reason,
  };
}
