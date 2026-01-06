import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

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
  });

  test("should have working navigation", async ({ page }) => {
    // Verify navigation is present
    const navigation = homePage.navigation;
    await expect(navigation).toBeVisible();

    // Test navigation items (adjust selectors based on your actual nav)
    const navItems = page.getByRole("navigation").getByRole("link");
    await expect(navItems.first()).toBeVisible();
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
    // Check for proper heading structure
    const headings = page.getByRole("heading");
    await expect(headings.first()).toBeVisible();

    // Check for alt text on images (if any)
    const images = page.getByRole("img");
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const image = images.nth(i);
      await expect(image).toHaveAttribute("alt");
    }
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
    });
  });

  test.describe("API Integration", () => {
    test("should handle API responses correctly", async ({ page }) => {
      // Mock API response
      await page.route("/api/test", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Test successful",
            data: { id: 1, name: "Test" },
          }),
        });
      });

      // Trigger API call (adjust based on your actual implementation)
      await page.goto("/");

      // Verify API interaction
      const response = await page.waitForResponse("/api/test");
      expect(response.status()).toBe(200);
    });
  });
});
