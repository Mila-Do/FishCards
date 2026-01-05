/**
 * Authenticated API client that automatically handles Bearer tokens
 * Extends the base ApiClient with authentication capabilities
 */

import { ApiClient } from "../api-client";
import { authService } from "./auth-service";
import type { ApiResult } from "../types/common";

/**
 * API client that automatically adds Bearer tokens to requests
 * Includes proactive token refresh and request queueing
 */
export class AuthenticatedApiClient extends ApiClient {
  private refreshPromise: Promise<string | null> | null = null;
  private requestQueue: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve: (value: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reject: (error: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request: () => Promise<any>;
  }[] = [];
  private refreshTimer: number | null = null;
  private tabSyncChannel: BroadcastChannel | null = null;

  constructor() {
    super();
    this.initializeTabSync();
    this.startProactiveRefresh();
  }
  /**
   * Initialize cross-tab synchronization
   */
  private initializeTabSync(): void {
    if (typeof window !== "undefined" && window.BroadcastChannel) {
      this.tabSyncChannel = new BroadcastChannel("auth-sync");

      this.tabSyncChannel.addEventListener("message", (event) => {
        if (event.data.type === "token-refreshed") {
          console.info("Token refreshed in another tab");
        } else if (event.data.type === "logout") {
          console.info("Logout detected from another tab");
          // Force logout without calling logout API (already done in other tab)
          authService.logout();
        }
      });

      // Cleanup on page unload
      window.addEventListener("beforeunload", () => {
        this.cleanup();
      });
    }
  }

  /**
   * Start proactive token refresh timer
   */
  private startProactiveRefresh(): void {
    if (typeof window === "undefined") return;

    // Check token every minute
    this.refreshTimer = window.setInterval(async () => {
      try {
        const isAuthenticated = await authService.isAuthenticated();
        if (isAuthenticated) {
          await this.checkAndRefreshToken();
        } else {
          this.stopProactiveRefresh();
        }
      } catch (error) {
        console.error("Error in proactive refresh:", error);
      }
    }, 60000); // 1 minute
  }

  /**
   * Stop proactive token refresh
   */
  private stopProactiveRefresh(): void {
    if (this.refreshTimer) {
      window.clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Check token expiry and refresh if needed (5 minutes before expiry)
   */
  private async checkAndRefreshToken(): Promise<void> {
    try {
      // Get current token data to check expiry
      const tokenData = await this.getStoredTokenData();
      if (!tokenData) return;

      const now = Math.floor(Date.now() / 1000);
      const timeToExpiry = tokenData.expires_at - now;
      const refreshThreshold = 5 * 60; // 5 minutes

      if (timeToExpiry <= refreshThreshold && timeToExpiry > 0) {
        console.info("Token expires soon, proactively refreshing");

        const newToken = await authService.getToken();
        if (newToken) {
          // Notify other tabs
          this.notifyTabsTokenRefreshed();
        }
      }
    } catch (error) {
      console.error("Error checking token expiry:", error);
    }
  }

  /**
   * Get stored token data for expiry checking
   */
  private async getStoredTokenData(): Promise<{ expires_at: number } | null> {
    if (typeof window === "undefined") return null;

    try {
      const expiresAt = sessionStorage.getItem("supabase_expires_at");
      return expiresAt ? { expires_at: parseInt(expiresAt, 10) } : null;
    } catch {
      return null;
    }
  }

  /**
   * Notify other tabs that token was refreshed
   */
  private notifyTabsTokenRefreshed(): void {
    if (this.tabSyncChannel) {
      this.tabSyncChannel.postMessage({ type: "token-refreshed" });
    }
  }

  /**
   * Notify other tabs about logout
   */
  private notifyTabsLogout(): void {
    if (this.tabSyncChannel) {
      this.tabSyncChannel.postMessage({ type: "logout" });
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.stopProactiveRefresh();
    if (this.tabSyncChannel) {
      this.tabSyncChannel.close();
      this.tabSyncChannel = null;
    }
  }

  /**
   * Check if error indicates authentication failure
   */
  private isAuthError(error: string): boolean {
    const authErrorPatterns = [
      "Authentication required",
      "Invalid login credentials",
      "Token expired",
      "Unauthorized",
      "UNAUTHORIZED",
    ];

    return authErrorPatterns.some((pattern) => error.toLowerCase().includes(pattern.toLowerCase()));
  }

  /**
   * Get current authentication headers
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await authService.getToken();

    if (!token) {
      return {
        "Content-Type": "application/json",
      };
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Make authenticated request with automatic token handling and retry logic
   */
  private async makeAuthenticatedRequest<T>(
    method: string,
    url: string,
    body?: unknown,
    additionalHeaders?: Record<string, string>
  ): Promise<ApiResult<T>> {
    // If refresh is in progress, queue this request
    if (this.refreshPromise) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push({
          resolve,
          reject,
          request: () => this.makeAuthenticatedRequest<T>(method, url, body, additionalHeaders),
        });
      });
    }

    const authHeaders = await this.getAuthHeaders();

    const result = await this.makeRequest<T>(url, {
      method,
      body,
      headers: {
        ...authHeaders,
        ...additionalHeaders,
      },
    });

    // Handle 401 errors with automatic token refresh and retry
    if (!result.success && this.isAuthError(result.error)) {
      console.warn("Received authentication error, attempting token refresh for:", url);

      return this.handleTokenRefreshAndRetry<T>(method, url, body, additionalHeaders);
    }

    return result;
  }

  /**
   * Handle token refresh with request queueing
   */
  private async handleTokenRefreshAndRetry<T>(
    method: string,
    url: string,
    body?: unknown,
    additionalHeaders?: Record<string, string>
  ): Promise<ApiResult<T>> {
    // If refresh is already in progress, wait for it
    if (this.refreshPromise) {
      try {
        await this.refreshPromise;

        // Retry with fresh token
        const newAuthHeaders = await this.getAuthHeaders();
        return this.makeRequest<T>(url, {
          method,
          body,
          headers: {
            ...newAuthHeaders,
            ...additionalHeaders,
          },
        });
      } catch (error) {
        console.error("Error waiting for token refresh:", error);
        return {
          success: false,
          error: "Authentication error occurred",
        };
      }
    }

    // Start token refresh
    this.refreshPromise = authService.getToken();

    try {
      const newToken = await this.refreshPromise;

      if (newToken) {
        console.info("Token refreshed, retrying request:", url);
        this.notifyTabsTokenRefreshed();

        // Process queued requests
        this.processRequestQueue();

        // Retry the original request
        const newAuthHeaders = await this.getAuthHeaders();
        return this.makeRequest<T>(url, {
          method,
          body,
          headers: {
            ...newAuthHeaders,
            ...additionalHeaders,
          },
        });
      } else {
        console.warn("Token refresh failed, user needs to re-authenticate");
        this.clearRequestQueue("Authentication expired");
        return {
          success: false,
          error: "Authentication expired. Please log in again.",
        };
      }
    } catch (error) {
      console.error("Error during token refresh retry:", error);
      this.clearRequestQueue("Authentication error");
      return {
        success: false,
        error: "Authentication error occurred",
      };
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Process queued requests after token refresh
   */
  private async processRequestQueue(): Promise<void> {
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const item of queue) {
      try {
        const result = await item.request();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }
  }

  /**
   * Clear request queue with error
   */
  private clearRequestQueue(errorMessage: string): void {
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    queue.forEach((item) => {
      item.resolve({
        success: false,
        error: errorMessage,
      });
    });
  }

  // Override HTTP methods to use authenticated requests
  async get<T>(url: string, additionalHeaders?: Record<string, string>): Promise<ApiResult<T>> {
    return this.makeAuthenticatedRequest<T>("GET", url, undefined, additionalHeaders);
  }

  async post<T>(url: string, body?: unknown, additionalHeaders?: Record<string, string>): Promise<ApiResult<T>> {
    return this.makeAuthenticatedRequest<T>("POST", url, body, additionalHeaders);
  }

  async put<T>(url: string, body?: unknown, additionalHeaders?: Record<string, string>): Promise<ApiResult<T>> {
    return this.makeAuthenticatedRequest<T>("PUT", url, body, additionalHeaders);
  }

  async patch<T>(url: string, body?: unknown, additionalHeaders?: Record<string, string>): Promise<ApiResult<T>> {
    return this.makeAuthenticatedRequest<T>("PATCH", url, body, additionalHeaders);
  }

  async delete<T>(url: string, additionalHeaders?: Record<string, string>): Promise<ApiResult<T>> {
    return this.makeAuthenticatedRequest<T>("DELETE", url, undefined, additionalHeaders);
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return await authService.isAuthenticated();
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return authService.getCurrentUser();
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    this.notifyTabsLogout();
    this.cleanup();
    await authService.logout();
  }
}

// Export singleton instance
export const authenticatedApiClient = new AuthenticatedApiClient();

/**
 * Convenience function for making authenticated API calls
 */
export async function authenticatedApiCall<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  body?: unknown,
  additionalHeaders?: Record<string, string>
): Promise<ApiResult<T>> {
  switch (method) {
    case "GET":
      return authenticatedApiClient.get<T>(url, additionalHeaders);
    case "POST":
      return authenticatedApiClient.post<T>(url, body, additionalHeaders);
    case "PUT":
      return authenticatedApiClient.put<T>(url, body, additionalHeaders);
    case "PATCH":
      return authenticatedApiClient.patch<T>(url, body, additionalHeaders);
    case "DELETE":
      return authenticatedApiClient.delete<T>(url, additionalHeaders);
    default:
      return {
        success: false,
        error: `Unsupported HTTP method: ${method}`,
      };
  }
}
