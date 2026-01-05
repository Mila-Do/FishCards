/**
 * Secure token storage system for Bearer tokens
 * Handles token persistence, refresh, and validation
 */

import { supabaseClient } from "../../db/supabase.client";
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

      // Also sign out from Supabase
      await supabaseClient.auth.signOut();
    } catch {
      // Silently handle removal errors
    }
  }

  /**
   * Refresh the access token using refresh token with retry logic
   */
  async refreshToken(): Promise<string | null> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await supabaseClient.auth.refreshSession();

        if (error) {
          console.warn(`Token refresh failed (attempt ${attempt}/${maxRetries}):`, error.message);

          // If it's an auth error (invalid refresh token), don't retry
          if (error.message.includes("refresh_token") || error.message.includes("invalid")) {
            console.error("Invalid refresh token, clearing auth data");
            await this.removeToken();
            return null;
          }

          lastError = new Error(error.message);

          // Wait before retry (exponential backoff)
          if (attempt < maxRetries) {
            await this.sleep(Math.pow(2, attempt - 1) * 1000);
            continue;
          }
        }

        if (!data.session) {
          console.error("No session returned from refresh");
          await this.removeToken();
          return null;
        }

        // Store new token data
        await this.setTokenData({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token || "",
          expires_at: data.session.expires_at || 0,
          user: data.session.user,
        });

        console.info("Token refreshed successfully");
        return data.session.access_token;
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
   */
  async isTokenValid(): Promise<boolean> {
    const token = await this.getToken();
    if (!token) {
      return false;
    }

    try {
      // Validate token with Supabase
      const { data, error } = await supabaseClient.auth.getUser(token);
      return !error && !!data.user;
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
