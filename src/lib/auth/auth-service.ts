/**
 * Unified authentication service using Bearer tokens
 * Replaces the hybrid session/bearer approach with pure Bearer tokens
 */

import { tokenStorage } from "./token-storage";
import { createClient } from "@supabase/supabase-js";
import type { User, AuthError } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

/**
 * Unified authentication service
 * Handles all auth operations using Bearer tokens
 */
class AuthService {
  private currentUser: User | null = null;
  private authStateListeners: ((state: AuthState) => void)[] = [];
  private isInitializing = true;

  constructor() {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state
   */
  private async initializeAuth(): Promise<void> {
    try {
      const user = await tokenStorage.getUser();
      const isValid = await tokenStorage.isTokenValid();

      if (user && isValid) {
        this.currentUser = user;
        console.info("Auth initialized successfully for user:", user.email);
      } else {
        // Invalid/expired token, clear it
        console.info("Invalid or expired token found, clearing auth state");
        await tokenStorage.removeToken();
        this.currentUser = null;
      }
    } catch {
      // Critical error initializing auth
      this.currentUser = null;
    } finally {
      // Always mark initialization as complete
      this.isInitializing = false;
      this.notifyAuthStateChange();
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Use API endpoint instead of direct supabaseClient (avoids env var issues in browser)
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: this.mapAuthError(result.error),
        };
      }

      // Store token data from API response
      await tokenStorage.setTokenData({
        access_token: result.access_token,
        refresh_token: result.refresh_token || "",
        expires_at: result.expires_at || 0,
        user: result.user,
      });

      this.currentUser = result.user;
      this.notifyAuthStateChange();

      return {
        success: true,
        user: result.user,
      };
    } catch {
      // Login error occurred
      return {
        success: false,
        error: "Wystąpił nieoczekiwany błąd podczas logowania",
      };
    }
  }

  /**
   * Register new user
   */
  async register(credentials: RegisterCredentials): Promise<AuthResult> {
    try {
      if (credentials.password !== credentials.confirmPassword) {
        return {
          success: false,
          error: "Hasła nie są identyczne",
        };
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          confirmPassword: credentials.confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: this.mapAuthError(result.error),
        };
      }

      // If session is available (auto-confirm enabled), store tokens
      if (result.access_token) {
        await tokenStorage.setTokenData({
          access_token: result.access_token,
          refresh_token: result.refresh_token || "",
          expires_at: result.expires_at || 0,
          user: result.user,
        });

        this.currentUser = result.user;
        this.notifyAuthStateChange();
      }

      return {
        success: true,
        user: result.user,
      };
    } catch {
      // Register error occurred
      return {
        success: false,
        error: "Wystąpił nieoczekiwany błąd podczas rejestracji",
      };
    }
  }

  /**
   * Logout user with proper error handling and token revocation
   */
  async logout(): Promise<void> {
    try {
      // Revoke current token before clearing local storage
      await this.revokeCurrentToken("manual_logout");

      // Clean up local storage (ignore errors)
      try {
        await tokenStorage.removeToken();
      } catch {
        // Ignore storage errors during logout
      }

      this.currentUser = null;
      this.notifyAuthStateChange();
      // User logged out successfully
    } catch {
      // Critical error during logout
      // Force cleanup even if logout fails
      try {
        await tokenStorage.removeToken();
      } catch {
        // Ignore storage errors during cleanup
      }

      this.currentUser = null;
      this.notifyAuthStateChange();
    }
  }

  /**
   * Revoke current token
   */
  async revokeCurrentToken(reason = "manual_logout"): Promise<void> {
    try {
      const token = await this.getToken();
      if (!token) {
        console.warn("No token to revoke");
        return;
      }

      const response = await fetch("/api/auth/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        await response.json().catch(() => ({}));
        // Token revocation failed
        // Don't throw error - logout should continue even if revocation fails
      } else {
        console.info("Token revoked successfully");
      }
    } catch {
      // Error during token revocation
      // Don't throw error - logout should continue even if revocation fails
    }
  }

  /**
   * Force logout due to security incident
   */
  async forceLogout(reason = "security_incident"): Promise<void> {
    try {
      // Force logout initiated for security reasons

      // Try to revoke token with security reason
      await this.revokeCurrentToken(reason);

      // Clean up local storage (ignore errors)
      try {
        await tokenStorage.removeToken();
      } catch {
        // Ignore storage errors during force logout
      }

      this.currentUser = null;
      this.notifyAuthStateChange();

      // Force logout completed
    } catch {
      // Critical error during force logout
      // Force cleanup even if revocation fails
      try {
        await tokenStorage.removeToken();
      } catch {
        // Ignore storage errors during cleanup
      }

      this.currentUser = null;
      this.notifyAuthStateChange();
    }
  }

  /**
   * Get current authentication token
   */
  async getToken(): Promise<string | null> {
    return await tokenStorage.getToken();
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.currentUser) {
      return false;
    }
    return await tokenStorage.isTokenValid();
  }

  /**
   * Get authenticated Supabase client with current token
   */
  async getAuthenticatedClient(): Promise<ReturnType<typeof createClient<Database>> | null> {
    try {
      const token = await this.getToken();

      if (!token) {
        return null;
      }

      return createClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });
    } catch {
      // Error getting token or creating client
      return null;
    }
  }

  /**
   * Reset password using secure API endpoint
   */
  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: this.mapAuthError(result.error) || "Wystąpił błąd podczas resetowania hasła",
        };
      }

      return { success: true };
    } catch {
      // Reset password error occurred
      return {
        success: false,
        error: "Wystąpił błąd podczas resetowania hasła",
      };
    }
  }

  /**
   * Update password using secure API endpoint
   */
  async updatePassword(newPassword: string): Promise<AuthResult> {
    try {
      const token = await tokenStorage.getToken();
      if (!token) {
        return {
          success: false,
          error: "Nie jesteś zalogowany",
        };
      }

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: this.mapAuthError(result.error) || "Wystąpił błąd podczas aktualizacji hasła",
        };
      }

      return { success: true };
    } catch {
      // Update password error occurred
      return {
        success: false,
        error: "Wystąpił błąd podczas aktualizacji hasła",
      };
    }
  }

  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChange(callback: (state: AuthState) => void): () => void {
    this.authStateListeners.push(callback);

    // Immediately call with current state (handle errors gracefully)
    try {
      callback({
        isAuthenticated: !!this.currentUser,
        user: this.currentUser,
        loading: this.isInitializing,
      });
    } catch {
      // Error in immediate callback - remove the faulty listener
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    }

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of auth state change
   */
  private notifyAuthStateChange(): void {
    const state: AuthState = {
      isAuthenticated: !!this.currentUser,
      user: this.currentUser,
      loading: this.isInitializing,
    };

    this.authStateListeners.forEach((callback) => {
      try {
        callback(state);
      } catch {
        // Error in auth state listener
      }
    });
  }

  /**
   * Map Supabase auth errors to user-friendly messages
   */
  private mapAuthError(error: AuthError | null): string {
    if (!error) {
      return "Wystąpił nieznany błąd";
    }

    switch (error.message) {
      case "Invalid login credentials":
        return "Nieprawidłowy email lub hasło";
      case "Email not confirmed":
        return "Email nie został potwierdzony";
      case "User already registered":
        return "Użytkownik o tym adresie email już istnieje";
      case "Password should be at least 6 characters":
        return "Hasło musi mieć co najmniej 6 znaków";
      case "Unable to validate email address: invalid format":
        return "Nieprawidłowy format adresu email";
      case "Password reset request expired":
        return "Link do resetowania hasła wygasł";
      default:
        return error.message || "Wystąpił błąd podczas uwierzytelniania";
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
