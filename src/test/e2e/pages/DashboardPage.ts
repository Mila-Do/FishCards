import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly header: Locator;
  readonly userAvatar: Locator;
  readonly userEmail: Locator;
  readonly logoutButton: Locator;
  readonly navigation: Locator;
  readonly generatorLink: Locator;
  readonly flashcardsLink: Locator;
  readonly learningLink: Locator;
  readonly statsOverview: Locator;
  readonly quickActions: Locator;

  constructor(page: Page) {
    this.page = page;
    // Header and navigation - using actual selectors from Layout.astro
    this.header = page.getByRole("banner"); // Semantic header - more specific than locator("header")
    this.navigation = page.getByRole("navigation"); // <nav role="navigation">
    this.userAvatar = page.locator('[data-testid="user-avatar"]');
    this.userEmail = page.locator('[data-testid="user-email"]');
    this.logoutButton = page.getByRole("button", { name: /wyloguj|logout/i });

    // Navigation links
    this.generatorLink = page.getByRole("link", { name: /generator/i });
    this.flashcardsLink = page.getByRole("link", { name: /moje fiszki|flashcards/i });
    this.learningLink = page.getByRole("link", { name: /sesja nauki|learning/i });

    // Dashboard content
    this.statsOverview = page.locator('[data-testid="stats-overview"]');
    this.quickActions = page.locator('[data-testid="quick-actions"]');
  }

  async goto() {
    await this.page.goto("/dashboard");
  }

  async waitForLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  async expectToBeVisible() {
    // Check for dashboard-specific content instead of header
    const dashboardTitle = this.page.getByRole("heading", { name: /dashboard/i });
    await expect(dashboardTitle).toBeVisible();

    // Header should be visible
    await expect(this.header).toBeVisible();
  }

  async expectUserAuthenticated(email?: string) {
    // Simple check - if we're on dashboard, user should be authenticated
    const dashboardTitle = this.page.getByRole("heading", { name: /dashboard/i });
    await expect(dashboardTitle).toBeVisible();

    // Check if logout button is visible (confirms user is logged in)
    const logoutVisible = await this.logoutButton.isVisible().catch(() => false);
    expect(logoutVisible).toBeTruthy();

    // Optional: check email in user menu if it exists
    if (email) {
      const userEmailVisible = await this.userEmail.isVisible().catch(() => false);
      if (userEmailVisible) {
        await expect(this.userEmail).toContainText(email);
      }
    }
  }

  async logout() {
    await this.logoutButton.click();
    // Should redirect to home page after logout
    await this.page.waitForURL("/");
  }

  async navigateToGenerator() {
    await this.generatorLink.click();
    await this.page.waitForURL("/generator");
  }

  async navigateToFlashcards() {
    await this.flashcardsLink.click();
    await this.page.waitForURL("/flashcards");
  }

  async navigateToLearning() {
    await this.learningLink.click();
    await this.page.waitForURL("/learning");
  }

  async expectStatsVisible() {
    await expect(this.statsOverview).toBeVisible();
  }

  async expectQuickActionsVisible() {
    await expect(this.quickActions).toBeVisible();
  }
}
