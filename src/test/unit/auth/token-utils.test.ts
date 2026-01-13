import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateTokenJti,
  hashToken,
  isValidBearerToken,
  extractBearerToken,
  generateRevocationData,
} from "../../../lib/auth/token-utils";

/**
 * Test suite for token utility functions
 * Priority: CRITICAL - requires ≥95% coverage according to test plan
 */

describe("generateTokenJti", () => {
  describe("when valid JWT token provided", () => {
    it("should generate consistent JTI from JWT signature", () => {
      const jwtToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

      const jti1 = generateTokenJti(jwtToken);
      const jti2 = generateTokenJti(jwtToken);

      expect(jti1).toBe(jti2); // Should be deterministic
      expect(jti1).toMatch(/^jti_[a-zA-Z0-9_-]{16}_[a-f0-9]{8}$/);
      expect(jti1).toContain("POk6yJV_adQssw5c"); // Last 16 chars of signature
    });

    it("should handle different JWT tokens with different JTIs", () => {
      const token1 =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
      const token2 =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ODc2NTQzMjEwIn0.8btfMqD5nuwFGcc-CE2U3NqeCRW1VfS0HMRJcFUIEDo";

      const jti1 = generateTokenJti(token1);
      const jti2 = generateTokenJti(token2);

      expect(jti1).not.toBe(jti2);
      expect(jti1).toMatch(/^jti_/);
      expect(jti2).toMatch(/^jti_/);
    });

    it("should extract signature part correctly", () => {
      const token = "header.payload.signature123";
      const jti = generateTokenJti(token);

      expect(jti).toContain("signature123".slice(-16));
    });
  });

  describe("when invalid or non-JWT token provided", () => {
    it("should handle token with less than 3 parts", () => {
      const invalidToken = "invalid.token";
      const jti = generateTokenJti(invalidToken);

      expect(jti).toMatch(/^token_[a-f0-9]{8}$/);
    });

    it("should handle empty token", () => {
      const jti = generateTokenJti("");

      expect(jti).toMatch(/^fallback_[a-f0-9]{8}$/);
    });

    it("should handle single part token", () => {
      const token = "singlepart";
      const jti = generateTokenJti(token);

      expect(jti).toMatch(/^token_[a-f0-9]{8}$/);
    });
  });

  describe("error handling", () => {
    it("should handle token processing errors gracefully", () => {
      // Create a scenario that might cause an error
      const problematicToken = null as unknown as string;

      expect(() => generateTokenJti(problematicToken)).not.toThrow();
    });

    it("should return fallback JTI for null/undefined", () => {
      // Test with undefined
      const jti = generateTokenJti(undefined as unknown as string);

      expect(jti).toMatch(/^fallback_[a-f0-9]{8}$/);
      expect(jti).toBe("fallback_00000000");
    });
  });
});

describe("hashToken", () => {
  describe("when crypto.subtle is available", () => {
    beforeEach(() => {
      // Mock crypto.subtle using vi.stubGlobal
      vi.stubGlobal("crypto", {
        subtle: {
          digest: vi.fn(),
        },
      } as unknown as Crypto);

      vi.stubGlobal(
        "TextEncoder",
        vi.fn().mockImplementation(function () {
          return {
            encode: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4])),
          };
        })
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it("should use crypto.subtle when available", async () => {
      const mockHashBuffer = new ArrayBuffer(32);
      const mockUint8Array = new Uint8Array(mockHashBuffer);
      mockUint8Array.fill(170); // 0xAA

      // Access the mocked digest function
      const mockDigest = (global as unknown as { crypto: { subtle: { digest: ReturnType<typeof vi.fn> } } }).crypto
        .subtle.digest;
      mockDigest.mockResolvedValue(mockHashBuffer);

      const token = "test-token";
      const hash = await hashToken(token);

      expect(mockDigest).toHaveBeenCalledWith("SHA-256", expect.any(Uint8Array));
      expect(hash).toBe("a".repeat(64)); // 32 bytes * 2 hex chars
    });

    it("should fallback on crypto.subtle error", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      (crypto.subtle.digest as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Crypto error"));

      const token = "test-token";
      const hash = await hashToken(token);

      expect(consoleWarnSpy).toHaveBeenCalledWith("Crypto.subtle failed, using fallback hash:", expect.any(Error));
      expect(hash).toMatch(/^[a-f0-9]{8}$/);

      consoleWarnSpy.mockRestore();
    });
  });

  describe("when crypto.subtle is not available", () => {
    beforeEach(() => {
      vi.stubGlobal("crypto", undefined as unknown as Crypto);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("should use fallback hash function", async () => {
      const token = "test-token";
      const hash = await hashToken(token);

      expect(hash).toMatch(/^[a-f0-9]{8}$/);
      expect(hash).toBe("2621dcfe"); // Expected hash for "test-token"
    });

    it("should produce consistent fallback hashes", async () => {
      const token = "consistent-token";
      const hash1 = await hashToken(token);
      const hash2 = await hashToken(token);

      expect(hash1).toBe(hash2);
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", async () => {
      const hash = await hashToken("");

      expect(hash).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"); // SHA-256 of empty string
    });

    it("should handle very long tokens", async () => {
      const longToken = "a".repeat(10000);
      const hash = await hashToken(longToken);

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should handle special characters", async () => {
      const specialToken = "token!@#$%^&*()_+{}|:<>?[]\\;',./";
      const hash = await hashToken(specialToken);

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});

describe("isValidBearerToken", () => {
  describe("valid JWT tokens", () => {
    const validTokens = [
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
      "a.b.c", // Minimal valid format
      "header.payload.signature",
    ];

    validTokens.forEach((token) => {
      it(`should accept valid JWT format: ${token.length > 50 ? token.substring(0, 50) + "..." : token}`, () => {
        expect(isValidBearerToken(token)).toBe(true);
      });
    });
  });

  describe("invalid tokens", () => {
    const invalidTokens = [
      null,
      undefined,
      "",
      "invalid-token", // Only 1 part
      "header.payload", // Only 2 parts
      "a.b.c.d", // Too many parts
      "a..c", // Empty middle part
      ".b.c", // Empty first part
      "a.b.", // Empty last part
      123 as unknown as string, // Not a string
      {} as unknown as string, // Not a string
    ];

    invalidTokens.forEach((token) => {
      it(`should reject invalid token: ${String(token)}`, () => {
        expect(isValidBearerToken(token as string)).toBe(false);
      });
    });
  });

  describe("edge cases", () => {
    it("should reject token with empty parts", () => {
      expect(isValidBearerToken("..")).toBe(false);
      expect(isValidBearerToken("a..")).toBe(false);
      expect(isValidBearerToken(".b.")).toBe(false);
      expect(isValidBearerToken("..c")).toBe(false);
    });

    it("should handle tokens with special characters in parts", () => {
      const tokenWithSpecialChars = "a!@#$%^&*().b!@#$%^&*().c!@#$%^&*()";
      expect(isValidBearerToken(tokenWithSpecialChars)).toBe(true);
    });
  });
});

describe("extractBearerToken", () => {
  describe("valid Authorization headers", () => {
    it("should extract token from standard Bearer header", () => {
      const token = extractBearerToken(
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature"
      );
      expect(token).toBe("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature");
    });

    it("should extract token from Bearer header with extra spaces", () => {
      const token = extractBearerToken("Bearer    token123");
      expect(token).toBe("token123");
    });

    it("should handle case-insensitive Bearer prefix", () => {
      const testCases = ["Bearer token123", "bearer token123", "BEARER token123", "BeArEr token123"];

      testCases.forEach((header) => {
        const token = extractBearerToken(header);
        expect(token).toBe("token123");
      });
    });

    it("should extract tokens with special characters", () => {
      const token = extractBearerToken("Bearer token-with_special.chars123");
      expect(token).toBe("token-with_special.chars123");
    });
  });

  describe("invalid Authorization headers", () => {
    const invalidHeaders = [
      null,
      undefined,
      "",
      "InvalidPrefix token123",
      "Basic dXNlcjpwYXNzd29yZA==", // Basic auth
      "Bearer", // No token
      "Bearer ", // Just space after Bearer
      "token123", // No Bearer prefix
      "Bearer  ", // Only spaces after Bearer
    ];

    invalidHeaders.forEach((header) => {
      it(`should return null for invalid header: "${String(header)}"`, () => {
        expect(extractBearerToken(header as string | null)).toBeNull();
      });
    });
  });

  describe("edge cases", () => {
    it("should handle very long tokens", () => {
      const longToken = "a".repeat(1000);
      const header = `Bearer ${longToken}`;
      const extracted = extractBearerToken(header);
      expect(extracted).toBe(longToken);
    });

    it("should extract first token if multiple spaces", () => {
      const token = extractBearerToken("Bearer token1 token2 token3");
      expect(token).toBe("token1 token2 token3");
    });
  });
});

describe("generateRevocationData", () => {
  beforeEach(() => {
    // Mock Date.now to get consistent timestamps
    vi.spyOn(Date, "now").mockReturnValue(new Date("2024-01-01T00:00:00Z").getTime());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should generate revocation data with default reason", async () => {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature123";

    const revocationData = await generateRevocationData(token);

    expect(revocationData).toEqual({
      jti: expect.stringMatching(/^jti_signature123_[a-f0-9]{8}$/),
      hash: expect.stringMatching(/^[a-f0-9]+$/),
      expires_at: new Date("2024-01-02T00:00:00Z"), // 24 hours later
      reason: "manual_logout",
    });
  });

  it("should generate revocation data with custom reason", async () => {
    const token = "test.token.signature";
    const reason = "security_incident";

    const revocationData = await generateRevocationData(token, reason);

    expect(revocationData.reason).toBe(reason);
    expect(revocationData.jti).toMatch(/^jti_signature_[a-f0-9]{8}$/);
  });

  it("should set expiration 24 hours from now", async () => {
    const token = "a.b.c";

    const revocationData = await generateRevocationData(token);

    const expectedExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(revocationData.expires_at).toEqual(expectedExpiry);
  });

  it("should generate consistent JTI for same token", async () => {
    const token = "consistent.token.signature";

    const revocation1 = await generateRevocationData(token);
    const revocation2 = await generateRevocationData(token);

    expect(revocation1.jti).toBe(revocation2.jti);
    expect(revocation1.hash).toBe(revocation2.hash);
  });

  it("should generate different data for different tokens", async () => {
    const token1 = "token1.payload.signature1";
    const token2 = "token2.payload.signature2";

    const revocation1 = await generateRevocationData(token1);
    const revocation2 = await generateRevocationData(token2);

    expect(revocation1.jti).not.toBe(revocation2.jti);
    expect(revocation1.hash).not.toBe(revocation2.hash);
  });

  describe("various token formats", () => {
    it("should handle non-JWT tokens", async () => {
      const token = "simple-token";

      const revocationData = await generateRevocationData(token);

      expect(revocationData.jti).toMatch(/^token_[a-f0-9]{8}$/);
      expect(revocationData.hash).toMatch(/^[a-f0-9]+$/);
    });

    it("should handle empty token", async () => {
      const revocationData = await generateRevocationData("");

      expect(revocationData.jti).toMatch(/^fallback_[a-f0-9]{8}$/);
      expect(revocationData.hash).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    });
  });
});
