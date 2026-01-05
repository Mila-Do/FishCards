/**
 * Unified authentication service using Bearer tokens
 * Replaces the hybrid session/bearer approach with pure Bearer tokens
 */

import { createClient } from "@supabase/supabase-js";
import { supabaseClient } from "../../db/supabase.client";
import { tokenStorage } from "./token-storage";
import type { Database } from "../../db/database.types";
import type { User, AuthError } from "@supabase/supabase-js";

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
        this.notifyAuthStateChange();
      } else {
        // Invalid/expired token, clear it
        console.info("Invalid or expired token found, clearing auth state");
        await tokenStorage.removeToken();
        this.currentUser = null;
        this.notifyAuthStateChange();
      }
    } catch (error) {
      console.error("Critical error initializing auth:", error);
      this.currentUser = null;
      this.notifyAuthStateChange();
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error || !data.session || !data.user) {
        return {
          success: false,
          error: this.mapAuthError(error),
        };
      }

      // Store token data
      await tokenStorage.setTokenData({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token || "",
        expires_at: data.session.expires_at || 0,
        user: data.user,
      });

      this.currentUser = data.user;
      this.notifyAuthStateChange();

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      console.error("Login error:", error);
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

      const { data, error } = await supabaseClient.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (error || !data.user) {
        return {
          success: false,
          error: this.mapAuthError(error),
        };
      }

      // If session is available (auto-confirm enabled), store tokens
      if (data.session) {
        await tokenStorage.setTokenData({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token || "",
          expires_at: data.session.expires_at || 0,
          user: data.user,
        });

        this.currentUser = data.user;
        this.notifyAuthStateChange();
      }

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      console.error("Register error:", error);
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
      const userEmail = this.currentUser?.email;

      // Revoke current token before clearing local storage
      await this.revokeCurrentToken("manual_logout");

      await tokenStorage.removeToken();
      this.currentUser = null;
      this.notifyAuthStateChange();
      console.info("User logged out successfully:", userEmail);
    } catch (error) {
      console.error("Critical error during logout:", error);
      // Force cleanup even if logout fails
      await tokenStorage.removeToken();
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
        const errorData = await response.json().catch(() => ({}));
        console.warn("Token revocation failed:", errorData);
        // Don't throw error - logout should continue even if revocation fails
      } else {
        console.info("Token revoked successfully");
      }
    } catch (error) {
      console.warn("Error during token revocation:", error);
      // Don't throw error - logout should continue even if revocation fails
    }
  }

  /**
   * Force logout due to security incident
   */
  async forceLogout(reason = "security_incident"): Promise<void> {
    try {
      const userEmail = this.currentUser?.email;
      console.warn("Force logout initiated for user:", userEmail, "Reason:", reason);

      // Try to revoke token with security reason
      await this.revokeCurrentToken(reason);

      await tokenStorage.removeToken();
      this.currentUser = null;
      this.notifyAuthStateChange();

      console.info("Force logout completed for user:", userEmail);
    } catch (error) {
      console.error("Critical error during force logout:", error);
      // Force cleanup even if revocation fails
      await tokenStorage.removeToken();
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
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return {
          success: false,
          error: this.mapAuthError(error),
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Reset password error:", error);
      return {
        success: false,
        error: "Wystąpił błąd podczas resetowania hasła",
      };
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<AuthResult> {
    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return {
          success: false,
          error: this.mapAuthError(error),
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Update password error:", error);
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

    // Immediately call with current state
    callback({
      isAuthenticated: !!this.currentUser,
      user: this.currentUser,
      loading: false,
    });

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
      loading: false,
    };

    this.authStateListeners.forEach((callback) => {
      try {
        callback(state);
      } catch (error) {
        console.error("Error in auth state listener:", error);
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
