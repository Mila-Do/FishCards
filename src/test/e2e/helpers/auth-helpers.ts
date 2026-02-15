/**
 * Authentication helpers for E2E tests
 * Provides reusable functions for login/logout flows
 */

import type { Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";

/**
 * Default test user credentials
 */
export const TEST_USER = {
  email: process.env.E2E_USERNAME || "testuser01@gmail.com",
  password: process.env.E2E_PASSWORD || "testUser01",
};

/**
 * Login as test user
 * Performs full login flow and waits for successful authentication
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);

  // Navigate to login page
  await loginPage.goto();
  await loginPage.waitForLoad();
  await loginPage.expectToBeVisible();

  // Perform login
  await loginPage.login(TEST_USER.email, TEST_USER.password);

  // Wait for redirect to dashboard (indicates successful login)
  await page.waitForURL("**/dashboard", { timeout: 30000 });

  // Verify we're authenticated
  const dashboardPage = new DashboardPage(page);
  await dashboardPage.waitForLoad();
}

/**
 * Login with custom credentials
 */
export async function loginWithCredentials(page: Page, email: string, password: string): Promise<void> {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.waitForLoad();
  await loginPage.expectToBeVisible();

  await loginPage.login(email, password);

  // Wait for redirect (successful login goes to dashboard)
  await page.waitForURL("**/dashboard", { timeout: 30000 });

  const dashboardPage = new DashboardPage(page);
  await dashboardPage.waitForLoad();
}

/**
 * Logout current user
 */
export async function logout(page: Page): Promise<void> {
  const dashboardPage = new DashboardPage(page);

  // Must be on a page with logout button
  if (!page.url().includes("/dashboard") && !page.url().includes("/generator") && !page.url().includes("/flashcards")) {
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();
  }

  await dashboardPage.logout();

  // Should redirect to home page
  await page.waitForURL("/");
}
