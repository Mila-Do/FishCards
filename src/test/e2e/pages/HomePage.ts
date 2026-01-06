import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly title: Locator;
  readonly navigation: Locator;
  readonly heroSection: Locator;
  readonly ctaButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByRole("heading", { level: 1 });
    this.navigation = page.getByRole("navigation");
    this.heroSection = page.getByTestId("hero-section");
    this.ctaButton = page.getByRole("button", { name: /get started/i });
  }

  async goto() {
    await this.page.goto("/");
  }

  async clickCTA() {
    await this.ctaButton.click();
  }

  async waitForLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  async expectToBeVisible() {
    await expect(this.title).toBeVisible();
    await expect(this.navigation).toBeVisible();
  }

  async expectTitle(expectedTitle: string) {
    await expect(this.title).toHaveText(expectedTitle);
  }

  async takeScreenshot(name: string) {
    await expect(this.page).toHaveScreenshot(`${name}.png`);
  }
}
