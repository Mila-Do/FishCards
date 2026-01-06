import { describe, it, expect } from "vitest";
import { truncateText, capitalizeWords, generateSlug } from "../../../lib/utils";

/**
 * Test suite for text manipulation utilities
 * Priority: HIGH - requires ≥80% coverage according to test plan
 */

describe("truncateText", () => {
  describe("when text is shorter than maxLength", () => {
    it("should return text unchanged", () => {
      expect(truncateText("short", 10)).toBe("short");
      expect(truncateText("Hello", 20)).toBe("Hello");
      expect(truncateText("test", 4)).toBe("test"); // Exactly at limit
    });

    it("should handle single character", () => {
      expect(truncateText("A", 5)).toBe("A");
    });

    it("should handle empty string", () => {
      expect(truncateText("", 5)).toBe("");
    });
  });

  describe("when text exceeds maxLength", () => {
    it("should truncate and add ellipsis", () => {
      expect(truncateText("very long text", 8)).toBe("very lon...");
      expect(truncateText("This is a very long sentence", 10)).toBe("This is a ...");
    });

    it("should trim whitespace before adding ellipsis", () => {
      expect(truncateText("text with   ", 8)).toBe("text wit...");
      expect(truncateText("word   boundary", 10)).toBe("word   bou...");
    });

    it("should handle text exactly maxLength + 1", () => {
      expect(truncateText("12345", 4)).toBe("1234...");
    });

    it("should handle very short maxLength", () => {
      expect(truncateText("Hello World", 1)).toBe("H...");
      expect(truncateText("test", 2)).toBe("te...");
    });

    it("should handle zero maxLength", () => {
      expect(truncateText("text", 0)).toBe("...");
    });
  });

  describe("edge cases", () => {
    it("should handle Unicode characters", () => {
      expect(truncateText("Kraków żółć", 6)).toBe("Kraków...");
      expect(truncateText("🌟✨💫", 2)).toBe("🌟✨...");
    });

    it("should handle newlines and tabs", () => {
      expect(truncateText("line1\nline2\tline3", 10)).toBe("line1\nline...");
    });

    it("should handle special characters", () => {
      expect(truncateText("!@#$%^&*()", 5)).toBe("!@#$%...");
    });

    it("should handle negative maxLength", () => {
      expect(truncateText("text", -1)).toBe("...");
    });

    it("should handle very large text", () => {
      const largeText = "a".repeat(10000);
      const result = truncateText(largeText, 100);
      expect(result).toBe("a".repeat(100) + "...");
      expect(result.length).toBe(103);
    });
  });
});

describe("capitalizeWords", () => {
  describe("basic word capitalization", () => {
    it("should capitalize first letter of each word", () => {
      expect(capitalizeWords("hello world")).toBe("Hello World");
      expect(capitalizeWords("this is a test")).toBe("This Is A Test");
    });

    it("should handle single word", () => {
      expect(capitalizeWords("hello")).toBe("Hello");
      expect(capitalizeWords("test")).toBe("Test");
    });

    it("should handle already capitalized text", () => {
      expect(capitalizeWords("Hello World")).toBe("Hello World");
      expect(capitalizeWords("HELLO WORLD")).toBe("Hello World");
    });

    it("should handle mixed case input", () => {
      expect(capitalizeWords("hELLo WoRLD")).toBe("Hello World");
      expect(capitalizeWords("tEST cASE")).toBe("Test Case");
    });

    it("should handle empty string", () => {
      expect(capitalizeWords("")).toBe("");
    });

    it("should handle single character", () => {
      expect(capitalizeWords("a")).toBe("A");
      expect(capitalizeWords("z")).toBe("Z");
    });
  });

  describe("special cases", () => {
    it("should handle multiple spaces between words", () => {
      expect(capitalizeWords("hello  world")).toBe("Hello  World");
      expect(capitalizeWords("test   case   here")).toBe("Test   Case   Here");
    });

    it("should handle leading and trailing spaces", () => {
      expect(capitalizeWords(" hello world ")).toBe(" Hello World ");
      expect(capitalizeWords("  test  ")).toBe("  Test  ");
    });

    it("should handle words with apostrophes", () => {
      expect(capitalizeWords("don't stop")).toBe("Don't Stop");
      expect(capitalizeWords("it's working")).toBe("It's Working");
    });

    it("should handle words with hyphens", () => {
      expect(capitalizeWords("well-known fact")).toBe("Well-known Fact");
      expect(capitalizeWords("state-of-the-art")).toBe("State-of-the-art");
    });

    it("should handle numbers", () => {
      expect(capitalizeWords("test 123 case")).toBe("Test 123 Case");
      expect(capitalizeWords("version 2.0 release")).toBe("Version 2.0 Release");
    });

    it("should handle special characters", () => {
      expect(capitalizeWords("hello@world.com")).toBe("Hello@world.com");
      expect(capitalizeWords("test & case")).toBe("Test & Case");
    });
  });

  describe("Unicode and international text", () => {
    it("should handle Polish characters", () => {
      expect(capitalizeWords("kraków żółć")).toBe("Kraków Żółć");
      expect(capitalizeWords("łódź gdańsk")).toBe("Łódź Gdańsk");
    });

    it("should handle accented characters", () => {
      expect(capitalizeWords("café résumé")).toBe("Café Résumé");
      expect(capitalizeWords("naïve façade")).toBe("Naïve Façade");
    });

    it("should handle emoji", () => {
      expect(capitalizeWords("hello 🌟 world")).toBe("Hello 🌟 World");
    });
  });

  describe("edge cases", () => {
    it("should handle only whitespace", () => {
      expect(capitalizeWords("   ")).toBe("   ");
      expect(capitalizeWords("\t\n")).toBe("\t\n");
    });

    it("should handle newlines", () => {
      expect(capitalizeWords("hello\nworld")).toBe("Hello\nworld");
    });

    it("should handle tabs", () => {
      expect(capitalizeWords("hello\tworld")).toBe("Hello\tworld");
    });
  });
});

describe("generateSlug", () => {
  describe("basic slug generation", () => {
    it("should convert to lowercase and replace spaces", () => {
      expect(generateSlug("Hello World")).toBe("hello-world");
      expect(generateSlug("This Is A Test")).toBe("this-is-a-test");
    });

    it("should handle single word", () => {
      expect(generateSlug("Hello")).toBe("hello");
      expect(generateSlug("TEST")).toBe("test");
    });

    it("should handle already lowercase text", () => {
      expect(generateSlug("hello world")).toBe("hello-world");
    });

    it("should handle empty string", () => {
      expect(generateSlug("")).toBe("");
    });
  });

  describe("special character handling", () => {
    it("should remove non-alphanumeric characters", () => {
      expect(generateSlug("Hello, World!")).toBe("hello-world");
      expect(generateSlug("Test@#$%Case")).toBe("testcase");
      expect(generateSlug("Special*&^Chars")).toBe("specialchars");
    });

    it("should preserve allowed characters (letters, numbers, spaces, underscores, hyphens)", () => {
      expect(generateSlug("test_case-123")).toBe("test-case-123");
      expect(generateSlug("version_2-beta")).toBe("version-2-beta");
    });

    it("should handle punctuation", () => {
      expect(generateSlug("Dr. John Smith, Ph.D.")).toBe("dr-john-smith-phd");
      expect(generateSlug("Question: How are you?")).toBe("question-how-are-you");
    });

    it("should handle parentheses and brackets", () => {
      expect(generateSlug("Test (case) [example]")).toBe("test-case-example");
      expect(generateSlug("Function() {return;}")).toBe("function-return");
    });
  });

  describe("whitespace and separator handling", () => {
    it("should replace multiple spaces with single dash", () => {
      expect(generateSlug("hello    world")).toBe("hello-world");
      expect(generateSlug("test   case   here")).toBe("test-case-here");
    });

    it("should replace underscores with dashes", () => {
      expect(generateSlug("test_case_example")).toBe("test-case-example");
      expect(generateSlug("snake_case_text")).toBe("snake-case-text");
    });

    it("should consolidate multiple separators", () => {
      expect(generateSlug("test--case")).toBe("test-case");
      expect(generateSlug("hello___world")).toBe("hello-world");
      expect(generateSlug("test_-_case")).toBe("test-case");
    });

    it("should remove leading and trailing separators", () => {
      expect(generateSlug("-hello-world-")).toBe("hello-world");
      expect(generateSlug("___test___")).toBe("test");
      expect(generateSlug("--example--")).toBe("example");
    });

    it("should handle only separators", () => {
      expect(generateSlug("---")).toBe("");
      expect(generateSlug("___")).toBe("");
      expect(generateSlug("- _ -")).toBe("");
    });
  });

  describe("Polish and international characters", () => {
    it("should handle Polish diacritics", () => {
      expect(generateSlug("Kraków, Żółć!")).toBe("krakow-zolc");
      expect(generateSlug("Łódź & Gdańsk")).toBe("lodz-gdansk");
    });

    it("should handle other accented characters", () => {
      expect(generateSlug("Café & Résumé")).toBe("cafe-resume");
      expect(generateSlug("Naïve façade")).toBe("naive-facade");
    });

    it("should remove emoji and symbols", () => {
      expect(generateSlug("Hello 🌟 World ✨")).toBe("hello-world");
      expect(generateSlug("Test ★ Case ♦")).toBe("test-case");
    });

    it("should handle mixed international text", () => {
      expect(generateSlug("Ångström Ñoño Žižek")).toBe("angstrom-nono-zizek");
    });
  });

  describe("real-world examples", () => {
    it("should handle article titles", () => {
      expect(generateSlug("How to Learn JavaScript Effectively")).toBe("how-to-learn-javascript-effectively");
      expect(generateSlug("10 Best Practices for React Development")).toBe("10-best-practices-for-react-development");
    });

    it("should handle product names", () => {
      expect(generateSlug("MacBook Pro 16-inch (2023)")).toBe("macbook-pro-16-inch-2023");
      expect(generateSlug("iPhone 15 Pro Max - 256GB")).toBe("iphone-15-pro-max-256gb");
    });

    it("should handle file names", () => {
      expect(generateSlug("My Document v2.1.pdf")).toBe("my-document-v21pdf");
      expect(generateSlug("Project_Final_Report.docx")).toBe("project-final-reportdocx");
    });

    it("should handle URLs and domains", () => {
      expect(generateSlug("https://example.com/path")).toBe("httpsexamplecompath");
      expect(generateSlug("user@domain.com")).toBe("userdomaincom");
    });
  });

  describe("edge cases", () => {
    it("should handle very long text", () => {
      const longText = "This is a very long text that should be converted to a slug properly " + "word ".repeat(100);
      const result = generateSlug(longText);

      expect(result).toMatch(/^[a-z0-9-]+$/);
      expect(result).not.toMatch(/^-|-$/); // No leading/trailing dashes
      expect(result).not.toMatch(/--/); // No double dashes
    });

    it("should handle only whitespace", () => {
      expect(generateSlug("   ")).toBe("");
      expect(generateSlug("\t\n\r")).toBe("");
    });

    it("should handle numbers only", () => {
      expect(generateSlug("123 456 789")).toBe("123-456-789");
      expect(generateSlug("2023")).toBe("2023");
    });

    it("should handle mixed case with numbers", () => {
      expect(generateSlug("Version 2.0 BETA")).toBe("version-20-beta");
      expect(generateSlug("HTML5 & CSS3")).toBe("html5-css3");
    });
  });
});
