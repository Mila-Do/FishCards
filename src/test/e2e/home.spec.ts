import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

// Home page tests should run without authentication
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Home Page", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    // Initialize Page Object
    homePage = new HomePage(page);

    // Setup: Navigate to home page
    await homePage.goto();
    await homePage.waitForLoad();
  });

  test("should display home page correctly", async ({ page }) => {
    // Verify page elements are visible
    await homePage.expectToBeVisible();

    // Check page title
    await expect(page).toHaveTitle(/FishCards/);

    // Check main heading content
    await homePage.expectMainHeading();
  });

  test("should have working auth buttons", async ({ page }) => {
    // Verify auth buttons are present
    await expect(homePage.authButtons).toBeVisible();

    // Test auth button links
    await expect(page.getByRole("link", { name: /zaloguj się/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /zarejestruj się/i })).toBeVisible();
  });

  test("should handle responsive design", async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await homePage.expectToBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await homePage.expectToBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await homePage.expectToBeVisible();
  });

  test("should have accessible elements", async ({ page }) => {
    // Check for proper heading structure - main heading is h2
    await expect(homePage.mainHeading).toBeVisible();
    await expect(homePage.mainHeading).toHaveRole("heading");

    // Check for proper button accessibility
    await expect(homePage.ctaRegister).toHaveAttribute("href", "/auth/register");
    await expect(homePage.ctaDemo).toHaveAttribute("href", "/demo");

    // Check for SVG icons in feature cards (they have proper structure)
    const featureIcons = page.locator("svg");
    await expect(featureIcons.first()).toBeVisible();
  });

  test("should load without console errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await homePage.goto();
    await homePage.waitForLoad();

    // Assert no console errors
    expect(consoleErrors).toEqual([]);
  });

  test("should pass visual regression test", async ({ page }) => {
    // Take full page screenshot for visual comparison
    await expect(page).toHaveScreenshot("home-page-full.png", {
      fullPage: true,
      threshold: 0.2, // Allow small differences
    });
  });

  test.describe("CTA Functionality", () => {
    test("should navigate to registration when CTA clicked", async ({ page }) => {
      // Test register CTA navigation
      await homePage.ctaRegister.click();
      await page.waitForLoadState();

      // Should navigate to registration page
      expect(page.url()).toContain("/auth/register");
    });

    test("should navigate to demo when demo button clicked", async ({ page }) => {
      // First go back to home page
      await homePage.goto();
      await homePage.waitForLoad();

      // Test demo CTA navigation
      await homePage.ctaDemo.click();
      await page.waitForLoadState();

      // Should navigate to demo page
      expect(page.url()).toContain("/demo");
    });
  });
});
