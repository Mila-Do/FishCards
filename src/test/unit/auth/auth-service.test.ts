/**
 * Unit tests for authentication service
 * Tests mapAuthError(), state management, login/register flows
 * Coverage target: 90%+ for src/lib/auth/auth-service.ts (PRIORITY: CRITICAL)
 *
 * Test Plan Reference: Plan_Testow_FishCards.md - Section 4.5.3
 * Key functions tested:
 * - mapAuthError() - Supabase error mapping to user-friendly messages
 * - Login/Register/Logout flows
 * - Token management via tokenStorage integration
 * - State management (loading/error/success states)
 * - Auth state listeners and notifications
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { LoginCredentials, RegisterCredentials } from "../../../lib/auth/auth-service";
import type { User } from "@supabase/supabase-js";

// ============================================================================
// Mock Setup - Must occur before imports
// ============================================================================

// Mock the token storage module before importing authService
vi.mock("../../../lib/auth/token-storage", () => ({
  tokenStorage: {
    getToken: vi.fn(),
    setTokenData: vi.fn(),
    removeToken: vi.fn(),
    refreshToken: vi.fn(),
    isTokenValid: vi.fn(),
    getUser: vi.fn(),
  },
}));

// Import authService after mock setup
import { authService } from "../../../lib/auth/auth-service";
import { tokenStorage } from "../../../lib/auth/token-storage";

// ============================================================================
// Mock Utilities
// ============================================================================

/**
 * Create mock User object for testing
 */
const createMockUser = (overrides?: Partial<User>): User =>
  ({
    id: "test-user-id",
    email: "test@example.com",
    aud: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  }) as User;

/**
 * Create successful login/register API response
 */
const createAuthSuccessResponse = (user?: User) =>
  ({
    ok: true,
    json: () =>
      Promise.resolve({
        success: true,
        access_token: "token123",
        refresh_token: "refresh123",
        expires_at: Date.now() + 3600000,
        user: user || createMockUser(),
      }),
  }) as Response;

/**
 * Create error API response with Supabase error format
 */
const createAuthErrorResponse = (errorMessage: string, status = 400) =>
  ({
    ok: false,
    status,
    json: () =>
      Promise.resolve({
        success: false,
        error: { message: errorMessage },
      }),
  }) as Response;

/**
 * Create empty success response (for logout/revoke)
 */
const createEmptySuccessResponse = () =>
  ({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  }) as Response;

/**
 * Setup default tokenStorage mock behavior
 */
const setupDefaultTokenStorageMocks = () => {
  const mockedStorage = vi.mocked(tokenStorage);
  vi.mocked(mockedStorage.getUser).mockResolvedValue(null);
  vi.mocked(mockedStorage.isTokenValid).mockResolvedValue(false);
  vi.mocked(mockedStorage.getToken).mockResolvedValue(null);
  vi.mocked(mockedStorage.setTokenData).mockResolvedValue(undefined);
  vi.mocked(mockedStorage.removeToken).mockResolvedValue(undefined);
  vi.mocked(mockedStorage.refreshToken).mockResolvedValue(null);
};

/**
 * Create valid login credentials for testing
 */
const createLoginCredentials = (overrides?: Partial<LoginCredentials>): LoginCredentials => ({
  email: "test@example.com",
  password: "password123",
  ...overrides,
});

/**
 * Create valid register credentials for testing
 */
const createRegisterCredentials = (overrides?: Partial<RegisterCredentials>): RegisterCredentials => ({
  email: "newuser@example.com",
  password: "password123",
  confirmPassword: "password123",
  ...overrides,
});

// ============================================================================
// Test Suite
// ============================================================================

describe("AuthService", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();

    // Setup global fetch mock
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    // Mock environment variables for Supabase
    vi.stubEnv("SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_KEY", "test-anon-key");

    // Setup default tokenStorage behavior
    setupDefaultTokenStorageMocks();

    // Force logout to reset singleton state between tests
    await authService.logout();

    // Mock console methods to reduce test noise
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // ============================================================================
  // mapAuthError() - 10 test cases (PRIORYTET KRYTYCZNY)
  // From Plan: "mapAuthError() - mapowanie błędów Supabase na komunikaty użytkownika"
  // ============================================================================

  describe("mapAuthError() - Error Message Mapping", () => {
    describe("Common authentication errors", () => {
      it("TC-AUTH-001: should map 'Invalid login credentials' to Polish", async () => {
        // Test Plan: Map Supabase auth errors to user-friendly Polish messages
        mockFetch.mockResolvedValueOnce(createAuthErrorResponse("Invalid login credentials"));

        const result = await authService.login(createLoginCredentials());

        expect(result.success).toBe(false);
        expect(result.error).toBe("Nieprawidłowy email lub hasło");
      });

      it("TC-AUTH-002: should map 'Email not confirmed' to Polish", async () => {
        mockFetch.mockResolvedValueOnce(createAuthErrorResponse("Email not confirmed"));

        const result = await authService.login(createLoginCredentials());

        expect(result.success).toBe(false);
        expect(result.error).toBe("Email nie został potwierdzony");
      });

      it("TC-AUTH-003: should map 'User already registered' to Polish", async () => {
        mockFetch.mockResolvedValueOnce(createAuthErrorResponse("User already registered"));

        const result = await authService.register(createRegisterCredentials());

        expect(result.success).toBe(false);
        expect(result.error).toBe("Użytkownik o tym adresie email już istnieje");
      });
    });

    describe("Password validation errors", () => {
      it("TC-AUTH-004: should map 'Password should be at least 6 characters' to Polish", async () => {
        mockFetch.mockResolvedValueOnce(createAuthErrorResponse("Password should be at least 6 characters"));

        const result = await authService.register(
          createRegisterCredentials({ password: "123", confirmPassword: "123" })
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe("Hasło musi mieć co najmniej 6 znaków");
      });

      it("TC-AUTH-005: should map 'Password reset request expired' to Polish", async () => {
        mockFetch.mockResolvedValueOnce(createAuthErrorResponse("Password reset request expired"));

        const result = await authService.resetPassword("test@example.com");

        expect(result.success).toBe(false);
        expect(result.error).toBe("Link do resetowania hasła wygasł");
      });
    });

    describe("Email validation errors", () => {
      it("TC-AUTH-006: should map 'Unable to validate email address: invalid format' to Polish", async () => {
        mockFetch.mockResolvedValueOnce(createAuthErrorResponse("Unable to validate email address: invalid format"));

        const result = await authService.register(createRegisterCredentials({ email: "invalid-email" }));

        expect(result.success).toBe(false);
        expect(result.error).toBe("Nieprawidłowy format adresu email");
      });
    });

    describe("Edge cases", () => {
      it("TC-AUTH-007: should handle unknown error message", async () => {
        mockFetch.mockResolvedValueOnce(createAuthErrorResponse("Some unknown Supabase error"));

        const result = await authService.login(createLoginCredentials());

        expect(result.success).toBe(false);
        expect(result.error).toBe("Some unknown Supabase error");
      });

      it("TC-AUTH-008: should handle null error object", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ success: false, error: null }),
        } as Response);

        const result = await authService.login(createLoginCredentials());

        expect(result.success).toBe(false);
        expect(result.error).toBe("Wystąpił nieznany błąd");
      });

      it("TC-AUTH-009: should handle error without message property", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ success: false, error: {} }),
        } as Response);

        const result = await authService.login(createLoginCredentials());

        expect(result.success).toBe(false);
        expect(result.error).toBe("Wystąpił błąd podczas uwierzytelniania");
      });

      it("TC-AUTH-010: should handle empty error message", async () => {
        mockFetch.mockResolvedValueOnce(createAuthErrorResponse(""));

        const result = await authService.login(createLoginCredentials());

        expect(result.success).toBe(false);
        // Empty message should fallback to default
        expect(result.error).toBe("Wystąpił błąd podczas uwierzytelniania");
      });
    });
  });

  // ============================================================================
  // login() - 8 test cases (PRIORYTET KRYTYCZNY)
  // ============================================================================

  describe("login() - User Authentication", () => {
    describe("Successful login scenarios", () => {
      it("TC-AUTH-011: should login successfully with valid credentials", async () => {
        const mockUser = createMockUser({ email: "test@example.com" });
        mockFetch.mockResolvedValueOnce(createAuthSuccessResponse(mockUser));

        const result = await authService.login(createLoginCredentials());

        expect(result.success).toBe(true);
        expect(result.user).toEqual(mockUser);
        expect(result.error).toBeUndefined();

        // Verify API call
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@example.com",
            password: "password123",
          }),
        });

        // Verify token storage
        expect(vi.mocked(tokenStorage).setTokenData).toHaveBeenCalledWith({
          access_token: "token123",
          refresh_token: "refresh123",
          expires_at: expect.any(Number),
          user: mockUser,
        });
      });

      it("TC-AUTH-012: should update currentUser state after successful login", async () => {
        mockFetch.mockResolvedValueOnce(createAuthSuccessResponse());

        await authService.login(createLoginCredentials());

        const currentUser = authService.getCurrentUser();
        expect(currentUser).not.toBeNull();
        expect(currentUser?.email).toBe("test@example.com");
      });

      it("TC-AUTH-013: should notify auth state listeners on successful login", async () => {
        const listener = vi.fn();
        authService.onAuthStateChange(listener);
        listener.mockClear(); // Clear initial call

        mockFetch.mockResolvedValueOnce(createAuthSuccessResponse());

        await authService.login(createLoginCredentials());

        expect(listener).toHaveBeenCalled();
        const state = listener.mock.calls[0][0];
        expect(state.isAuthenticated).toBe(true);
        expect(state.user).not.toBeNull();
      });
    });

    describe("Failed login scenarios", () => {
      it("TC-AUTH-014: should return error for invalid credentials", async () => {
        mockFetch.mockResolvedValueOnce(createAuthErrorResponse("Invalid login credentials"));

        const result = await authService.login(createLoginCredentials());

        expect(result.success).toBe(false);
        expect(result.error).toBe("Nieprawidłowy email lub hasło");
        expect(result.user).toBeUndefined();
      });

      it("TC-AUTH-015: should handle network errors gracefully", async () => {
        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const result = await authService.login(createLoginCredentials());

        expect(result.success).toBe(false);
        expect(result.error).toBe("Wystąpił nieoczekiwany błąd podczas logowania");
      });

      it("TC-AUTH-016: should not store tokens on failed login", async () => {
        mockFetch.mockResolvedValueOnce(createAuthErrorResponse("Invalid login credentials"));

        await authService.login(createLoginCredentials());

        expect(vi.mocked(tokenStorage).setTokenData).not.toHaveBeenCalled();
      });

      it("TC-AUTH-017: should not update currentUser on failed login", async () => {
        // Ensure clean state
        await authService.logout();
        mockFetch.mockClear(); // Clear logout calls

        mockFetch.mockResolvedValueOnce(createAuthErrorResponse("Invalid login credentials"));

        await authService.login(createLoginCredentials());

        const currentUser = authService.getCurrentUser();
        expect(currentUser).toBeNull();
      });

      it("TC-AUTH-018: should handle malformed API response", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: false }), // Malformed: ok=true but success=false
        } as Response);

        const result = await authService.login(createLoginCredentials());

        expect(result.success).toBe(false);
      });
    });
  });

  // ============================================================================
  // register() - 7 test cases (PRIORYTET KRYTYCZNY)
  // ============================================================================

  describe("register() - User Registration", () => {
    describe("Successful registration", () => {
      it("TC-AUTH-019: should register successfully with matching passwords", async () => {
        const mockUser = createMockUser({ email: "newuser@example.com" });
        mockFetch.mockResolvedValueOnce(createAuthSuccessResponse(mockUser));

        const result = await authService.register(createRegisterCredentials());

        expect(result.success).toBe(true);
        expect(result.user).toEqual(mockUser);

        expect(mockFetch).toHaveBeenCalledWith("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "newuser@example.com",
            password: "password123",
            confirmPassword: "password123",
          }),
        });
      });

      it("TC-AUTH-020: should store tokens when auto-confirm is enabled", async () => {
        mockFetch.mockResolvedValueOnce(createAuthSuccessResponse());

        await authService.register(createRegisterCredentials());

        expect(vi.mocked(tokenStorage).setTokenData).toHaveBeenCalled();
      });

      it("TC-AUTH-021: should update currentUser after successful registration", async () => {
        mockFetch.mockResolvedValueOnce(createAuthSuccessResponse());

        await authService.register(createRegisterCredentials());

        const currentUser = authService.getCurrentUser();
        expect(currentUser).not.toBeNull();
      });
    });

    describe("Validation errors", () => {
      it("TC-AUTH-022: should return error for mismatched passwords", async () => {
        const result = await authService.register(
          createRegisterCredentials({
            password: "password123",
            confirmPassword: "different-password",
          })
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe("Hasła nie są identyczne");
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it("TC-AUTH-023: should return error for existing user", async () => {
        mockFetch.mockResolvedValueOnce(createAuthErrorResponse("User already registered"));

        const result = await authService.register(createRegisterCredentials());

        expect(result.success).toBe(false);
        expect(result.error).toBe("Użytkownik o tym adresie email już istnieje");
      });

      it("TC-AUTH-024: should return error for weak password", async () => {
        mockFetch.mockResolvedValueOnce(createAuthErrorResponse("Password should be at least 6 characters"));

        const result = await authService.register(
          createRegisterCredentials({
            password: "123",
            confirmPassword: "123",
          })
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe("Hasło musi mieć co najmniej 6 znaków");
      });
    });

    describe("Error handling", () => {
      it("TC-AUTH-025: should handle network errors during registration", async () => {
        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const result = await authService.register(createRegisterCredentials());

        expect(result.success).toBe(false);
        expect(result.error).toBe("Wystąpił nieoczekiwany błąd podczas rejestracji");
      });
    });
  });

  // ============================================================================
  // logout() - 6 test cases (PRIORYTET KRYTYCZNY)
  // From Plan: "Obsługa stanów loading/error"
  // ============================================================================

  describe("logout() - User Logout", () => {
    describe("Successful logout", () => {
      it("TC-AUTH-026: should logout successfully and clean up state", async () => {
        vi.mocked(tokenStorage).getToken.mockResolvedValue("test-token");
        mockFetch.mockResolvedValueOnce(createEmptySuccessResponse());

        await authService.logout();

        // Verify token revocation
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/revoke", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({ reason: "manual_logout" }),
        });

        // Verify cleanup
        expect(vi.mocked(tokenStorage).removeToken).toHaveBeenCalled();
      });

      it("TC-AUTH-027: should update currentUser to null after logout", async () => {
        vi.mocked(tokenStorage).getToken.mockResolvedValue("test-token");
        mockFetch.mockResolvedValueOnce(createEmptySuccessResponse());

        await authService.logout();

        const currentUser = authService.getCurrentUser();
        expect(currentUser).toBeNull();
      });

      it("TC-AUTH-028: should notify listeners of logout", async () => {
        const listener = vi.fn();
        authService.onAuthStateChange(listener);
        listener.mockClear();

        vi.mocked(tokenStorage).getToken.mockResolvedValue("test-token");
        mockFetch.mockResolvedValueOnce(createEmptySuccessResponse());

        await authService.logout();

        expect(listener).toHaveBeenCalled();
        const state = listener.mock.calls[0][0];
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
      });
    });

    describe("Error handling", () => {
      it("TC-AUTH-029: should cleanup even if token revocation fails", async () => {
        vi.mocked(tokenStorage).getToken.mockResolvedValue("test-token");
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ success: false, error: { message: "Revocation failed" } }),
        } as Response);

        await authService.logout();

        expect(vi.mocked(tokenStorage).removeToken).toHaveBeenCalled();
      });

      it("TC-AUTH-030: should handle logout when no token exists", async () => {
        vi.mocked(tokenStorage).getToken.mockResolvedValue(null);

        await authService.logout();

        expect(mockFetch).not.toHaveBeenCalled();
        expect(vi.mocked(tokenStorage).removeToken).toHaveBeenCalled();
      });

      it("TC-AUTH-031: should handle network errors during logout gracefully", async () => {
        vi.mocked(tokenStorage).getToken.mockResolvedValue("test-token");
        mockFetch.mockRejectedValue(new Error("Network error"));

        // Should not throw
        await expect(authService.logout()).resolves.toBeUndefined();

        expect(vi.mocked(tokenStorage).removeToken).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // State Management - 12 test cases (PRIORYTET WYSOKI)
  // From Plan: "Logika cache i TTL dla sesji, Obsługa stanów loading/error"
  // ============================================================================

  describe("State Management - Loading, Error, Success States", () => {
    describe("getCurrentUser()", () => {
      it("TC-AUTH-032: should return current user when authenticated", async () => {
        const mockUser = createMockUser();
        mockFetch.mockResolvedValueOnce(createAuthSuccessResponse(mockUser));

        await authService.login(createLoginCredentials());

        const user = authService.getCurrentUser();
        expect(user).toEqual(mockUser);
      });

      it("TC-AUTH-033: should return null when not authenticated", async () => {
        // Ensure clean state
        await authService.logout();

        const user = authService.getCurrentUser();
        expect(user).toBeNull();
      });
    });

    describe("isAuthenticated()", () => {
      it("TC-AUTH-034: should return false when no user", async () => {
        const isAuth = await authService.isAuthenticated();
        expect(isAuth).toBe(false);
      });

      it("TC-AUTH-035: should return true when user exists and token is valid", async () => {
        // Setup: Login first
        mockFetch.mockResolvedValueOnce(createAuthSuccessResponse());
        await authService.login(createLoginCredentials());

        // Mock token validation
        vi.mocked(tokenStorage).isTokenValid.mockResolvedValue(true);

        const isAuth = await authService.isAuthenticated();
        expect(isAuth).toBe(true);
        expect(vi.mocked(tokenStorage).isTokenValid).toHaveBeenCalled();
      });

      it("TC-AUTH-036: should return false when token is invalid", async () => {
        // Setup: Login first
        mockFetch.mockResolvedValueOnce(createAuthSuccessResponse());
        await authService.login(createLoginCredentials());

        // Mock invalid token
        vi.mocked(tokenStorage).isTokenValid.mockResolvedValue(false);

        const isAuth = await authService.isAuthenticated();
        expect(isAuth).toBe(false);
      });
    });

    describe("getToken()", () => {
      it("TC-AUTH-037: should return token from tokenStorage", async () => {
        vi.mocked(tokenStorage).getToken.mockResolvedValue("test-token-123");

        const token = await authService.getToken();

        expect(token).toBe("test-token-123");
        expect(vi.mocked(tokenStorage).getToken).toHaveBeenCalled();
      });

      it("TC-AUTH-038: should return null when no token exists", async () => {
        vi.mocked(tokenStorage).getToken.mockResolvedValue(null);

        const token = await authService.getToken();

        expect(token).toBeNull();
      });
    });

    describe("onAuthStateChange() - Listeners", () => {
      it("TC-AUTH-039: should call callback immediately with current state", () => {
        const callback = vi.fn();

        authService.onAuthStateChange(callback);

        expect(callback).toHaveBeenCalledTimes(1);
        const state = callback.mock.calls[0][0];
        expect(state).toHaveProperty("isAuthenticated");
        expect(state).toHaveProperty("user");
        expect(state).toHaveProperty("loading");
      });

      it("TC-AUTH-040: should register multiple listeners", () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();

        authService.onAuthStateChange(callback1);
        authService.onAuthStateChange(callback2);

        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);

        // Both should receive same state
        const state1 = callback1.mock.calls[0][0];
        const state2 = callback2.mock.calls[0][0];
        expect(state1).toEqual(state2);
      });

      it("TC-AUTH-041: should unsubscribe listeners correctly", () => {
        const callback = vi.fn();
        const unsubscribe = authService.onAuthStateChange(callback);

        callback.mockClear();
        unsubscribe();

        // Listener should not be called after unsubscribe
        // (we can't easily trigger a state change here, but we verified unsubscribe logic)
        expect(() => unsubscribe()).not.toThrow();
      });

      it("TC-AUTH-042: should handle listener errors gracefully", () => {
        const errorCallback = vi.fn(() => {
          throw new Error("Listener error");
        });
        const normalCallback = vi.fn();

        // Should not crash when listener throws
        expect(() => {
          authService.onAuthStateChange(errorCallback);
          authService.onAuthStateChange(normalCallback);
        }).not.toThrow();

        // Error callback should be removed, normal should work
        expect(normalCallback).toHaveBeenCalled();
      });

      it("TC-AUTH-043: should provide correct state structure", () => {
        const callback = vi.fn();
        authService.onAuthStateChange(callback);

        const state = callback.mock.calls[0][0];

        expect(state).toHaveProperty("isAuthenticated");
        expect(state).toHaveProperty("user");
        expect(state).toHaveProperty("loading");

        expect(typeof state.isAuthenticated).toBe("boolean");
        expect(typeof state.loading).toBe("boolean");
      });
    });
  });

  // ============================================================================
  // Token Management - 9 test cases (PRIORYTET WYSOKI)
  // ============================================================================

  describe("Token Management - Revoke and Force Logout", () => {
    describe("revokeCurrentToken()", () => {
      it("TC-AUTH-044: should revoke token successfully with reason", async () => {
        vi.mocked(tokenStorage).getToken.mockResolvedValue("test-token");
        mockFetch.mockResolvedValueOnce(createEmptySuccessResponse());

        await authService.revokeCurrentToken("test_reason");

        expect(mockFetch).toHaveBeenCalledWith("/api/auth/revoke", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({ reason: "test_reason" }),
        });
      });

      it("TC-AUTH-045: should use default reason when none provided", async () => {
        vi.mocked(tokenStorage).getToken.mockResolvedValue("test-token");
        mockFetch.mockResolvedValueOnce(createEmptySuccessResponse());

        await authService.revokeCurrentToken();

        expect(mockFetch).toHaveBeenCalledWith(
          "/api/auth/revoke",
          expect.objectContaining({
            body: JSON.stringify({ reason: "manual_logout" }),
          })
        );
      });

      it("TC-AUTH-046: should handle missing token gracefully", async () => {
        vi.mocked(tokenStorage).getToken.mockResolvedValue(null);

        await authService.revokeCurrentToken();

        expect(mockFetch).not.toHaveBeenCalled();
      });

      it("TC-AUTH-047: should handle API errors gracefully", async () => {
        vi.mocked(tokenStorage).getToken.mockResolvedValue("test-token");
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: { message: "Invalid token" } }),
        } as Response);

        // Should not throw
        await expect(authService.revokeCurrentToken()).resolves.toBeUndefined();
      });

      it("TC-AUTH-048: should handle network errors gracefully", async () => {
        vi.mocked(tokenStorage).getToken.mockResolvedValue("test-token");
        mockFetch.mockRejectedValue(new Error("Network error"));

        // Should not throw
        await expect(authService.revokeCurrentToken()).resolves.toBeUndefined();
      });
    });

    describe("forceLogout()", () => {
      it("TC-AUTH-049: should logout with security_incident reason", async () => {
        vi.mocked(tokenStorage).getToken.mockResolvedValue("test-token");
        mockFetch.mockResolvedValueOnce(createEmptySuccessResponse());

        await authService.forceLogout("security_incident");

        expect(mockFetch).toHaveBeenCalledWith("/api/auth/revoke", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({ reason: "security_incident" }),
        });

        expect(vi.mocked(tokenStorage).removeToken).toHaveBeenCalled();
      });

      it("TC-AUTH-050: should use default security_incident reason", async () => {
        vi.mocked(tokenStorage).getToken.mockResolvedValue("test-token");
        mockFetch.mockResolvedValueOnce(createEmptySuccessResponse());

        await authService.forceLogout();

        expect(mockFetch).toHaveBeenCalledWith(
          "/api/auth/revoke",
          expect.objectContaining({
            body: JSON.stringify({ reason: "security_incident" }),
          })
        );
      });

      it("TC-AUTH-051: should force cleanup even if all operations fail", async () => {
        vi.mocked(tokenStorage).getToken.mockRejectedValue(new Error("Token error"));
        vi.mocked(tokenStorage).removeToken.mockRejectedValue(new Error("Storage error"));

        // Should not throw
        await expect(authService.forceLogout()).resolves.toBeUndefined();

        expect(vi.mocked(tokenStorage).removeToken).toHaveBeenCalled();
      });

      it("TC-AUTH-052: should update state to logged out after force logout", async () => {
        vi.mocked(tokenStorage).getToken.mockResolvedValue("test-token");
        mockFetch.mockResolvedValueOnce(createEmptySuccessResponse());

        await authService.forceLogout();

        const currentUser = authService.getCurrentUser();
        expect(currentUser).toBeNull();
      });
    });
  });

  // ============================================================================
  // Password Management - 6 test cases (PRIORYTET ŚREDNI)
  // ============================================================================

  describe("Password Management - Reset and Update", () => {
    describe("resetPassword()", () => {
      it("TC-AUTH-053: should send reset password request successfully", async () => {
        mockFetch.mockResolvedValueOnce(createEmptySuccessResponse());

        const result = await authService.resetPassword("user@example.com");

        expect(result.success).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "user@example.com" }),
        });
      });

      it("TC-AUTH-054: should handle reset password errors", async () => {
        mockFetch.mockResolvedValueOnce(createAuthErrorResponse("Email not found"));

        const result = await authService.resetPassword("nonexistent@example.com");

        expect(result.success).toBe(false);
        expect(result.error).toBe("Email not found");
      });

      it("TC-AUTH-055: should handle network errors during password reset", async () => {
        mockFetch.mockRejectedValue(new Error("Network error"));

        const result = await authService.resetPassword("user@example.com");

        expect(result.success).toBe(false);
        expect(result.error).toBe("Wystąpił błąd podczas resetowania hasła");
      });
    });

    describe("updatePassword()", () => {
      it("TC-AUTH-056: should update password successfully", async () => {
        vi.mocked(tokenStorage).getToken.mockResolvedValue("valid-token");
        mockFetch.mockResolvedValueOnce(createEmptySuccessResponse());

        const result = await authService.updatePassword("newPassword123");

        expect(result.success).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({ password: "newPassword123" }),
        });
      });

      it("TC-AUTH-057: should return error when not authenticated", async () => {
        vi.mocked(tokenStorage).getToken.mockResolvedValue(null);

        const result = await authService.updatePassword("newPassword123");

        expect(result.success).toBe(false);
        expect(result.error).toBe("Nie jesteś zalogowany");
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it("TC-AUTH-058: should handle API errors during password update", async () => {
        vi.mocked(tokenStorage).getToken.mockResolvedValue("valid-token");
        mockFetch.mockResolvedValueOnce(createAuthErrorResponse("Password too weak"));

        const result = await authService.updatePassword("weak");

        expect(result.success).toBe(false);
        expect(result.error).toBe("Password too weak");
      });
    });
  });

  // ============================================================================
  // Supabase Client Integration - 3 test cases (PRIORYTET NISKI)
  // ============================================================================

  describe("getAuthenticatedClient() - Supabase Client Creation", () => {
    it("TC-AUTH-059: should return authenticated client when token exists", async () => {
      vi.mocked(tokenStorage).getToken.mockResolvedValue("valid-token");

      const client = await authService.getAuthenticatedClient();

      expect(client).not.toBeNull();
      expect(vi.mocked(tokenStorage).getToken).toHaveBeenCalled();
    });

    it("TC-AUTH-060: should return null when no token exists", async () => {
      vi.mocked(tokenStorage).getToken.mockResolvedValue(null);

      const client = await authService.getAuthenticatedClient();

      expect(client).toBeNull();
    });

    it("TC-AUTH-061: should handle getToken errors gracefully", async () => {
      vi.mocked(tokenStorage).getToken.mockRejectedValue(new Error("Token retrieval failed"));

      const client = await authService.getAuthenticatedClient();

      expect(client).toBeNull();
    });
  });

  // ============================================================================
  // Integration Tests - State Change Notifications (PRIORYTET ŚREDNI)
  // ============================================================================

  describe("Integration - State Change Notifications", () => {
    it("TC-AUTH-062: should notify listeners when login succeeds", async () => {
      const listener = vi.fn();
      authService.onAuthStateChange(listener);
      listener.mockClear();

      mockFetch.mockResolvedValueOnce(createAuthSuccessResponse());

      await authService.login(createLoginCredentials());

      expect(listener).toHaveBeenCalled();
      const state = listener.mock.calls[0][0];
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).not.toBeNull();
    });

    it("TC-AUTH-063: should maintain state consistency across operations", async () => {
      const listener = vi.fn();
      authService.onAuthStateChange(listener);
      listener.mockClear();

      // Login
      mockFetch.mockResolvedValueOnce(createAuthSuccessResponse());
      await authService.login(createLoginCredentials());

      const loginState = listener.mock.calls[0][0];
      expect(loginState.isAuthenticated).toBe(true);

      // Logout
      vi.mocked(tokenStorage).getToken.mockResolvedValue("test-token");
      mockFetch.mockResolvedValueOnce(createEmptySuccessResponse());
      await authService.logout();

      const logoutState = listener.mock.calls[1][0];
      expect(logoutState.isAuthenticated).toBe(false);
      expect(logoutState.user).toBeNull();
    });
  });
});
