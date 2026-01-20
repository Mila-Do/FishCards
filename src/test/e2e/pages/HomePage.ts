import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly header: Locator;
  readonly logo: Locator;
  readonly authButtons: Locator;
  readonly heroSection: Locator;
  readonly mainHeading: Locator;
  readonly ctaButtons: Locator;
  readonly ctaRegister: Locator;
  readonly ctaDemo: Locator;
  readonly featuresGrid: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId("landing-header");
    this.logo = page.getByTestId("logo");
    this.authButtons = page.getByTestId("auth-buttons");
    this.heroSection = page.getByTestId("hero-section");
    this.mainHeading = page.getByTestId("main-heading");
    this.ctaButtons = page.getByTestId("cta-buttons");
    this.ctaRegister = page.getByTestId("cta-register");
    this.ctaDemo = page.getByTestId("cta-demo");
    this.featuresGrid = page.getByTestId("features-grid");
  }

  async goto() {
    await this.page.goto("/");
  }

  async clickRegisterCTA() {
    await this.ctaRegister.click();
  }

  async clickDemoCTA() {
    await this.ctaDemo.click();
  }

  async waitForLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  async expectToBeVisible() {
    await expect(this.header).toBeVisible();
    await expect(this.logo).toBeVisible();
    await expect(this.heroSection).toBeVisible();
    await expect(this.mainHeading).toBeVisible();
    await expect(this.ctaButtons).toBeVisible();
    await expect(this.featuresGrid).toBeVisible();
  }

  async expectMainHeading() {
    await expect(this.mainHeading).toContainText("Twórz fiszki");
    await expect(this.mainHeading).toContainText("błyskawicznie");
  }

  async takeScreenshot(name: string) {
    await expect(this.page).toHaveScreenshot(`${name}.png`);
  }
}
