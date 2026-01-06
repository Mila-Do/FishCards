import { describe, it, expect } from "vitest";
import {
  validateText,
  validateSourceText,
  validateFlashcardFront,
  validateFlashcardBack,
  validateEmail,
  validateUrl,
  validatePassword,
  validateUsername,
  validateFields,
  createDebouncedValidator,
  TEXT_VALIDATION_LIMITS,
} from "../../../lib/validation/text";
import type { TextConstraints } from "../../../lib/types/common";

/**
 * Test suite for text validation functions
 * Priority: CRITICAL - requires ≥90% coverage according to test plan
 */

describe("validateText", () => {
  describe("when valid data provided", () => {
    it("should return valid result for text without constraints", () => {
      const result = validateText("Any text", {});

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.characterCount).toBe(8);
      expect(result.isEmpty).toBe(false);
    });

    it("should return valid result for text meeting min/max constraints", () => {
      const constraints: TextConstraints = { minLength: 5, maxLength: 15, required: true };
      const result = validateText("Valid text", constraints);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.hasMinLength).toBe(true);
      expect(result.hasMaxLength).toBe(true);
    });

    it("should handle text at exact boundaries", () => {
      const constraints: TextConstraints = { minLength: 10, maxLength: 10, required: true };
      const result = validateText("Exactly10!", constraints); // 10 characters

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.characterCount).toBe(10);
    });

    it("should accept valid text matching pattern", () => {
      const constraints: TextConstraints = { pattern: /^\d+$/, required: true };
      const result = validateText("12345", constraints);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should handle empty optional text", () => {
      const constraints: TextConstraints = { minLength: 5, required: false };
      const result = validateText("", constraints);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.isEmpty).toBe(true);
    });
  });

  describe("when invalid data provided", () => {
    it("should return error for empty required text", () => {
      const constraints: TextConstraints = { required: true };
      const result = validateText("   ", constraints); // Only whitespace

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("To pole jest wymagane");
      expect(result.isEmpty).toBe(true);
    });

    it("should return error for text below minimum length", () => {
      const constraints: TextConstraints = { minLength: 10, required: true };
      const result = validateText("Short", constraints);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Minimum 10 znaków");
      expect(result.hasMinLength).toBe(false);
    });

    it("should return error for text above maximum length", () => {
      const constraints: TextConstraints = { maxLength: 5 };
      const result = validateText("Too long text", constraints);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Maksimum 5 znaków");
      expect(result.hasMaxLength).toBe(false);
    });

    it("should return error for text not matching pattern", () => {
      const constraints: TextConstraints = { pattern: /^\d+$/ };
      const result = validateText("abc123", constraints);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Format tekstu jest nieprawidłowy");
    });

    it("should accumulate multiple validation errors", () => {
      const constraints: TextConstraints = {
        minLength: 10,
        maxLength: 5, // Impossible constraint
        required: true,
        pattern: /^\d+$/,
      };
      const result = validateText("abc", constraints);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain("Minimum 10 znaków");
      expect(result.errors).toContain("Format tekstu jest nieprawidłowy");
    });
  });

  describe("edge cases", () => {
    it("should handle empty constraints object", () => {
      const result = validateText("Any text");

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should handle Unicode and special characters", () => {
      const text = "Kraków, Żółć! 🌟 @#$%";
      const result = validateText(text, { maxLength: 50 });

      expect(result.isValid).toBe(true);
      expect(result.characterCount).toBe(text.length);
    });

    it("should not validate pattern for empty non-required text", () => {
      const constraints: TextConstraints = { pattern: /^\d+$/, required: false };
      const result = validateText("", constraints);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});

describe("validateSourceText", () => {
  describe("valid source text", () => {
    it("should accept text at minimum boundary (1000 characters)", () => {
      const text = "A".repeat(1000);
      const result = validateSourceText(text);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.characterCount).toBe(1000);
    });

    it("should accept text at maximum boundary (10000 characters)", () => {
      const text = "B".repeat(10000);
      const result = validateSourceText(text);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.characterCount).toBe(10000);
    });

    it("should accept text in valid range (5000 characters)", () => {
      const text = "C".repeat(5000);
      const result = validateSourceText(text);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe("invalid source text", () => {
    it("should reject text below minimum (999 characters)", () => {
      const text = "A".repeat(999);
      const result = validateSourceText(text);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Minimum 1000 znaków");
    });

    it("should reject text above maximum (10001 characters)", () => {
      const text = "B".repeat(10001);
      const result = validateSourceText(text);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Maksimum 10000 znaków");
    });

    it("should reject empty text", () => {
      const result = validateSourceText("");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("To pole jest wymagane");
    });

    it("should reject whitespace-only text", () => {
      const result = validateSourceText("   \t\n   ");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("To pole jest wymagane");
    });
  });

  describe("special characters handling", () => {
    it("should handle Unicode characters correctly", () => {
      const text = "Ąćęłńóśźż".repeat(200); // 1800 chars with Polish diacritics
      const result = validateSourceText(text);

      expect(result.isValid).toBe(true);
      expect(result.characterCount).toBe(1800);
    });

    it("should handle emoji and special symbols", () => {
      const text = "Text with emojis 🌟✨ and symbols @#$%^&*()".repeat(50); // ~2000 chars
      const result = validateSourceText(text);

      expect(result.isValid).toBe(true);
    });
  });
});

describe("validateFlashcardFront", () => {
  it("should accept valid front text (under 200 chars)", () => {
    const text = "What is the capital of Poland?";
    const result = validateFlashcardFront(text);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should accept text at maximum length (200 characters)", () => {
    const text = "A".repeat(200);
    const result = validateFlashcardFront(text);

    expect(result.isValid).toBe(true);
  });

  it("should reject text exceeding maximum length (201 characters)", () => {
    const text = "A".repeat(201);
    const result = validateFlashcardFront(text);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Maksimum 200 znaków");
  });

  it("should reject empty front text", () => {
    const result = validateFlashcardFront("");

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("To pole jest wymagane");
  });
});

describe("validateFlashcardBack", () => {
  it("should accept valid back text (under 500 chars)", () => {
    const text = "Warsaw is the capital and largest city of Poland.";
    const result = validateFlashcardBack(text);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should accept text at maximum length (500 characters)", () => {
    const text = "B".repeat(500);
    const result = validateFlashcardBack(text);

    expect(result.isValid).toBe(true);
  });

  it("should reject text exceeding maximum length (501 characters)", () => {
    const text = "B".repeat(501);
    const result = validateFlashcardBack(text);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Maksimum 500 znaków");
  });

  it("should reject empty back text", () => {
    const result = validateFlashcardBack("");

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("To pole jest wymagane");
  });
});

describe("validateEmail", () => {
  describe("valid email addresses", () => {
    const validEmails = ["user@example.com", "test.user+tag@example.co.uk", "user123@sub.domain.org", "a@b.co"];

    validEmails.forEach((email) => {
      it(`should accept valid email: ${email}`, () => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });
  });

  describe("invalid email addresses", () => {
    const invalidEmails = ["invalid-email", "@example.com", "user@", "user@.com", "user..user@example.com", "", "   "];

    invalidEmails.forEach((email) => {
      it(`should reject invalid email: "${email}"`, () => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        if (email.trim() === "") {
          expect(result.errors).toContain("To pole jest wymagane");
        } else {
          expect(result.errors).toContain("Format tekstu jest nieprawidłowy");
        }
      });
    });
  });
});

describe("validateUrl", () => {
  describe("valid URLs", () => {
    const validUrls = [
      "https://example.com",
      "http://localhost:3000",
      "https://sub.domain.co.uk/path?query=value",
      "ftp://files.example.com",
    ];

    validUrls.forEach((url) => {
      it(`should accept valid URL: ${url}`, () => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });
  });

  describe("invalid URLs", () => {
    const invalidUrls = ["not-a-url", "http://", "://example.com", "", "   "];

    invalidUrls.forEach((url) => {
      it(`should reject invalid URL: "${url}"`, () => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(false);
        if (url.trim() === "") {
          expect(result.errors).toContain("URL jest wymagany");
        } else {
          expect(result.errors).toContain("Nieprawidłowy format URL");
        }
      });
    });
  });
});

describe("validatePassword", () => {
  describe("strong passwords", () => {
    const strongPasswords = [
      { password: "StrongPass123!", expected: "strong" },
      { password: "MySecure!Password2024", expected: "strong" },
      { password: "ComplexP@ssw0rd123", expected: "strong" },
    ];

    strongPasswords.forEach(({ password, expected }) => {
      it(`should classify "${password}" as ${expected}`, () => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.strength).toBe(expected);
        expect(result.errors).toEqual([]);
      });
    });
  });

  describe("medium passwords", () => {
    const mediumPasswords = [
      { password: "Password123", expected: "medium" },
      { password: "mypass!123", expected: "medium" },
    ];

    mediumPasswords.forEach(({ password, expected }) => {
      it(`should classify "${password}" as ${expected}`, () => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.strength).toBe(expected);
      });
    });
  });

  describe("weak passwords", () => {
    const weakPasswords = [
      { password: "password", expected: "weak" },
      { password: "12345678", expected: "weak" },
      { password: "Pass123", expected: "weak" },
    ];

    weakPasswords.forEach(({ password, expected }) => {
      it(`should classify "${password}" as ${expected} and invalid`, () => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.strength).toBe(expected);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe("password validation errors", () => {
    it("should require non-empty password", () => {
      const result = validatePassword("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Hasło jest wymagane");
    });

    it("should require minimum 8 characters", () => {
      const result = validatePassword("short");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Hasło musi mieć co najmniej 8 znaków");
    });

    it("should require uppercase and lowercase letters", () => {
      const result = validatePassword("nouppercase123!");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Hasło musi zawierać małe i wielkie litery");
    });

    it("should require at least one digit", () => {
      const result = validatePassword("NoNumbers!");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Hasło musi zawierać co najmniej jedną cyfrę");
    });
  });
});

describe("validateUsername", () => {
  describe("valid usernames", () => {
    const validUsernames = ["user123", "test_user", "admin-panel", "a1b", "USERNAME"];

    validUsernames.forEach((username) => {
      it(`should accept valid username: ${username}`, () => {
        const result = validateUsername(username);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });
  });

  describe("invalid usernames", () => {
    it("should reject username too short", () => {
      const result = validateUsername("ab");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Minimum 3 znaków");
    });

    it("should reject username too long", () => {
      const result = validateUsername("a".repeat(21));
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Maksimum 20 znaków");
    });

    it("should reject username with invalid characters", () => {
      const result = validateUsername("user@name");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Format tekstu jest nieprawidłowy");
    });

    it("should reject empty username", () => {
      const result = validateUsername("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("To pole jest wymagane");
    });
  });
});

describe("validateFields", () => {
  it("should validate multiple fields successfully", () => {
    const fields = {
      email: { value: "test@example.com", validator: validateEmail },
      username: { value: "testuser", validator: validateUsername },
    };

    const result = validateFields(fields);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.fieldResults.email.isValid).toBe(true);
    expect(result.fieldResults.username.isValid).toBe(true);
  });

  it("should collect errors from multiple invalid fields", () => {
    const fields = {
      email: { value: "invalid-email", validator: validateEmail },
      username: { value: "ab", validator: validateUsername },
    };

    const result = validateFields(fields);

    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeDefined();
    expect(result.errors.username).toBeDefined();
    expect(result.fieldResults.email.isValid).toBe(false);
    expect(result.fieldResults.username.isValid).toBe(false);
  });

  it("should handle mixed valid and invalid fields", () => {
    const fields = {
      email: { value: "valid@example.com", validator: validateEmail },
      username: { value: "ab", validator: validateUsername },
    };

    const result = validateFields(fields);

    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeUndefined();
    expect(result.errors.username).toBeDefined();
  });
});

describe("createDebouncedValidator", () => {
  it("should create a function that returns the same type", () => {
    const debouncedEmailValidator = createDebouncedValidator(
      (...args: unknown[]) => validateEmail(args[0] as string),
      100
    );
    expect(typeof debouncedEmailValidator).toBe("function");
  });

  // Note: Full debouncing behavior testing would require async testing and mocking timers
  // This is a basic structure test to ensure the function is created correctly
});

describe("TEXT_VALIDATION_LIMITS", () => {
  it("should export all expected validation limits", () => {
    expect(TEXT_VALIDATION_LIMITS.SOURCE_TEXT_MIN).toBe(1000);
    expect(TEXT_VALIDATION_LIMITS.SOURCE_TEXT_MAX).toBe(10000);
    expect(TEXT_VALIDATION_LIMITS.FLASHCARD_FRONT_MAX).toBe(200);
    expect(TEXT_VALIDATION_LIMITS.FLASHCARD_BACK_MAX).toBe(500);
    expect(TEXT_VALIDATION_LIMITS.USERNAME_MIN).toBe(3);
    expect(TEXT_VALIDATION_LIMITS.USERNAME_MAX).toBe(20);
    expect(TEXT_VALIDATION_LIMITS.PASSWORD_MIN).toBe(8);
    expect(TEXT_VALIDATION_LIMITS.PASSWORD_MAX).toBe(128);
  });
});
