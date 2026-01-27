/**
 * Authentication flow tests for AUTHENTICATED users
 * Each test logs in independently before running
 */

import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";
import { DashboardPage } from "./pages/DashboardPage";
import { loginAsTestUser, logout } from "./helpers/auth-helpers";

test.describe("Authentication Flow - Authenticated", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test (simulates user authentication)
    await loginAsTestUser(page);
  });

  test("should access dashboard when authenticated", async ({ page }) => {
    // Already logged in from beforeEach, now on dashboard
    const dashboardPage = new DashboardPage(page);

    // Should be logged in and see dashboard
    await dashboardPage.expectToBeVisible();
    await dashboardPage.expectUserAuthenticated();
  });

  test("should navigate between authenticated pages", async ({ page }) => {
    // Already logged in from beforeEach, on dashboard
    const dashboardPage = new DashboardPage(page);

    // Test 1: Click on Generator link (like real user)
    await dashboardPage.generatorLink.click();
    await page.waitForURL("/generator");
    await expect(page).toHaveURL("/generator");

    // Test 2: Click on Flashcards link from generator navigation
    await dashboardPage.flashcardsLink.click();
    await page.waitForURL("/flashcards");
    await expect(page).toHaveURL("/flashcards");

    // Test 3: Go back to dashboard by clicking logo (like real user)
    const logoLink = page.getByRole("link", { name: /FishCards/i });
    await logoLink.click();
    await page.waitForURL("/dashboard");

    // Verify we're back on dashboard and still authenticated
    await dashboardPage.expectToBeVisible();
    await dashboardPage.expectUserAuthenticated();
  });

  test("should logout successfully", async ({ page }) => {
    // Already logged in from beforeEach
    const homePage = new HomePage(page);

    // Logout using helper
    await logout(page);

    // Should be redirected to home page
    await expect(page).toHaveURL("/");
    await homePage.expectToBeVisible();
  });
});
