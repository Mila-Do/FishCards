/**
 * Secure token storage system for Bearer tokens
 * Handles token persistence, refresh, and validation
 */

import type { User } from "@supabase/supabase-js";

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

export interface TokenStorage {
  getToken(): Promise<string | null>;
  setTokenData(tokenData: TokenData): Promise<void>;
  removeToken(): Promise<void>;
  refreshToken(): Promise<string | null>;
  isTokenValid(): Promise<boolean>;
  getUser(): Promise<User | null>;
}

/**
 * Secure token storage using sessionStorage only for Bearer tokens
 * Provides consistent client-side token management
 */
class SecureTokenStorage implements TokenStorage {
  private readonly TOKEN_KEY = "supabase_auth_token";
  private readonly REFRESH_KEY = "supabase_refresh_token";
  private readonly USER_KEY = "supabase_user";
  private readonly EXPIRES_KEY = "supabase_expires_at";

  /**
   * Get current access token, refresh if needed
   */
  async getToken(): Promise<string | null> {
    try {
      // Get stored token first for consistency
      const storedToken = this.getStoredToken();
      if (!storedToken) {
        return null;
      }

      // Check if token is expired
      if (this.isTokenExpired(storedToken.expires_at)) {
        // Try to refresh
        return await this.refreshToken();
      }

      return storedToken.access_token;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  }

  /**
   * Store token data securely
   */
  async setTokenData(tokenData: TokenData): Promise<void> {
    if (typeof window === "undefined") {
      // Server-side: tokens should be handled by Supabase SSR
      return;
    }

    try {
      // Store in sessionStorage (more secure than localStorage for tokens)
      sessionStorage.setItem(this.TOKEN_KEY, tokenData.access_token);
      sessionStorage.setItem(this.REFRESH_KEY, tokenData.refresh_token);
      sessionStorage.setItem(this.EXPIRES_KEY, tokenData.expires_at.toString());
      sessionStorage.setItem(this.USER_KEY, JSON.stringify(tokenData.user));
    } catch {
      // Silently handle storage errors
    }
  }

  /**
   * Remove all stored token data
   */
  async removeToken(): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    try {
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.REFRESH_KEY);
      sessionStorage.removeItem(this.EXPIRES_KEY);
      sessionStorage.removeItem(this.USER_KEY);

      // Signout będzie obsługiwane przez API endpoint
    } catch {
      // Silently handle removal errors
    }
  }

  /**
   * Refresh the access token using refresh token with retry logic
   * Uses secure API endpoint instead of direct Supabase client
   */
  async refreshToken(): Promise<string | null> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      console.error("No refresh token available");
      await this.removeToken();
      return null;
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh_token: refreshToken,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          const errorMessage = result.error?.message || "Token refresh failed";
          console.warn(`Token refresh failed (attempt ${attempt}/${maxRetries}):`, errorMessage);

          // If it's an auth error (invalid refresh token), don't retry
          if (errorMessage.includes("refresh_token") || errorMessage.includes("invalid")) {
            console.error("Invalid refresh token, clearing auth data");
            await this.removeToken();
            return null;
          }

          lastError = new Error(errorMessage);

          // Wait before retry (exponential backoff)
          if (attempt < maxRetries) {
            await this.sleep(Math.pow(2, attempt - 1) * 1000);
            continue;
          }
        } else {
          // Store new token data
          await this.setTokenData({
            access_token: result.access_token,
            refresh_token: result.refresh_token,
            expires_at: result.expires_at,
            user: result.user,
          });

          console.info("Token refreshed successfully");
          return result.access_token;
        }
      } catch (error) {
        lastError = error as Error;
        console.error(`Token refresh network error (attempt ${attempt}/${maxRetries}):`, error);

        if (attempt < maxRetries) {
          await this.sleep(Math.pow(2, attempt - 1) * 1000);
          continue;
        }
      }
    }

    // All retries failed
    console.error("Token refresh failed after all retries:", lastError?.message);
    await this.removeToken();
    return null;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if current token is valid
   * Uses secure API endpoint for validation
   */
  async isTokenValid(): Promise<boolean> {
    const token = await this.getToken();
    if (!token) {
      return false;
    }

    try {
      // Validate token through API endpoint
      const response = await fetch("/api/auth/validate", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      return response.ok && result.success && !!result.user;
    } catch {
      return false;
    }
  }

  /**
   * Get current user from stored data
   */
  async getUser(): Promise<User | null> {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const storedUser = sessionStorage.getItem(this.USER_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Error getting stored user:", error);
      return null;
    }
  }

  /**
   * Get stored token data from storage
   */
  private getStoredToken(): TokenData | null {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const token = sessionStorage.getItem(this.TOKEN_KEY);
      const refreshToken = sessionStorage.getItem(this.REFRESH_KEY);
      const expiresAt = sessionStorage.getItem(this.EXPIRES_KEY);
      const user = sessionStorage.getItem(this.USER_KEY);

      if (!token || !refreshToken || !expiresAt || !user) {
        return null;
      }

      return {
        access_token: token,
        refresh_token: refreshToken,
        expires_at: parseInt(expiresAt, 10),
        user: JSON.parse(user),
      };
    } catch {
      return null;
    }
  }

  /**
   * Get stored refresh token
   */
  private getStoredRefreshToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      return sessionStorage.getItem(this.REFRESH_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Check if token is expired (with 5 minute buffer)
   */
  private isTokenExpired(expiresAt: number): boolean {
    const now = Math.floor(Date.now() / 1000);
    const buffer = 5 * 60; // 5 minutes buffer
    return now >= expiresAt - buffer;
  }
}

// Export singleton instance
export const tokenStorage = new SecureTokenStorage();
