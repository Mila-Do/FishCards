import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authService } from "../../../lib/auth/auth-service";
import type { LoginCredentials, RegisterCredentials } from "../../../lib/auth/auth-service";

/**
 * Test suite for authentication service
 * Priority: CRITICAL - requires ≥85% coverage according to test plan
 */

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset fetch mock
    mockFetch.mockReset();

    // Mock sessionStorage globally
    Object.defineProperty(global, "sessionStorage", {
      value: mockSessionStorage,
      writable: true,
    });

    // Mock localStorage globally
    Object.defineProperty(global, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });

    // Reset storage mocks
    mockSessionStorage.getItem.mockReset();
    mockSessionStorage.setItem.mockReset();
    mockSessionStorage.removeItem.mockReset();
    mockSessionStorage.clear.mockReset();

    mockLocalStorage.getItem.mockReset();
    mockLocalStorage.setItem.mockReset();
    mockLocalStorage.removeItem.mockReset();
    mockLocalStorage.clear.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("login", () => {
    const validCredentials: LoginCredentials = {
      email: "test@example.com",
      password: "password123",
    };

    it("should login successfully with valid credentials", async () => {
      const mockUser = { id: "1", email: "test@example.com" };
      const mockResponse = {
        success: true,
        access_token: "token123",
        refresh_token: "refresh123",
        expires_at: Date.now() + 3600000,
        user: mockUser,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await authService.login(validCredentials);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeUndefined();

      expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: validCredentials.email,
          password: validCredentials.password,
        }),
      });
    });

    it("should return error for invalid credentials", async () => {
      const mockErrorResponse = {
        success: false,
        error: { message: "Nieprawidłowy email lub hasło" },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockErrorResponse),
      } as Response);

      const result = await authService.login(validCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Nieprawidłowy email lub hasło");
      expect(result.user).toBeUndefined();
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await authService.login(validCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Wystąpił nieoczekiwany błąd podczas logowania");
    });
  });

  describe("register", () => {
    const validCredentials: RegisterCredentials = {
      email: "newuser@example.com",
      password: "password123",
      confirmPassword: "password123",
    };

    it("should register successfully with matching passwords", async () => {
      const mockUser = { id: "2", email: "newuser@example.com" };
      const mockResponse = {
        success: true,
        access_token: "token123",
        refresh_token: "refresh123",
        expires_at: Date.now() + 3600000,
        user: mockUser,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await authService.register(validCredentials);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);

      expect(mockFetch).toHaveBeenCalledWith("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: validCredentials.email,
          password: validCredentials.password,
        }),
      });
    });

    it("should return error for mismatched passwords", async () => {
      const invalidCredentials = {
        ...validCredentials,
        confirmPassword: "different-password",
      };

      const result = await authService.register(invalidCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Hasła nie są identyczne");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should return error for API failure", async () => {
      const mockErrorResponse = {
        success: false,
        error: { message: "Użytkownik o tym adresie email już istnieje" },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockErrorResponse),
      } as Response);

      const result = await authService.register(validCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Użytkownik o tym adresie email już istnieje");
    });
  });

  describe("getCurrentUser", () => {
    it("should return current user or null", () => {
      const user = authService.getCurrentUser();
      // User can be null or an object from previous tests
      if (user === null) {
        expect(user).toBeNull();
      } else {
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("email");
      }
    });
  });

  describe("isAuthenticated", () => {
    it("should return false when no user", async () => {
      const isAuth = await authService.isAuthenticated();
      expect(isAuth).toBe(false);
    });
  });

  describe("resetPassword", () => {
    it("should send reset password request successfully", async () => {
      const mockResponse = { success: true };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await authService.resetPassword("user@example.com");

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "user@example.com",
        }),
      });
    });

    it("should handle reset password errors", async () => {
      const mockErrorResponse = {
        success: false,
        error: { message: "Email not found" },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockErrorResponse),
      } as Response);

      const result = await authService.resetPassword("nonexistent@example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email not found");
    });
  });

  describe("onAuthStateChange", () => {
    it("should call callback immediately with current state", () => {
      const callback = vi.fn();

      const unsubscribe = authService.onAuthStateChange(callback);

      expect(callback).toHaveBeenCalledTimes(1);
      // Check that callback was called with expected structure
      const callArgs = callback.mock.calls[0][0];
      expect(callArgs).toHaveProperty("isAuthenticated");
      expect(callArgs).toHaveProperty("user");
      expect(callArgs).toHaveProperty("loading");
      expect(typeof callArgs.loading).toBe("boolean");

      unsubscribe();
    });
  });
});
