// @ts-check
const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');
const { authLocators } = require('../locators');

/**
 * Page Object for Sign In / Authentication.
 */
class LoginPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  
  constructor(page) {
    super(page);
    this.signInLink = authLocators.signInLink(page);
    this.usernameInput = authLocators.usernameInput(page);
    this.passwordInput = authLocators.passwordInput(page);
    this.submitButton = authLocators.submitButton(page);
    this.showPasswordToggle = authLocators.showPasswordToggle(page);
  }

  /**
   * Validates that the Sign In link/button is visible on the header.
   */
  async validateSignInVisible() {
    await expect(this.signInLink).toBeVisible({ timeout: 10000 });
  }

  /**
   * Validates that the login form (#username field) is visible.
   */
  async validateLoginFormVisible() {
    await expect(this.usernameInput.first()).toBeVisible({ timeout: 30000 });
  }

  /**
   * Opens the Sign In view / Auth0 login form.
   */
  async openSignIn() {
    await this.validateSignInVisible();
    await this.signInLink.click();

    // Wait for navigation either to /welcome landing page or directly to Auth0 login
    await this.page.waitForURL(
      (url) => url.pathname.includes('/welcome') || url.hostname.includes('auth0'),
      { timeout: 25000 }
    );

    // If navigating via the /welcome landing page, click its Sign In button to reach Auth0
    if (this.page.url().includes('/welcome')) {
      await this.dismissCookieBanner();
      const welcomeSignIn = this.page.getByRole('button', { name: 'SIGN IN' }).first();
      await expect(welcomeSignIn).toBeVisible({ timeout: 25000 });
      await welcomeSignIn.click();
    }
  }

  /**
   * Enters email / username into the username field.
   * @param {string} username
   */
  async fillUsername(username) {
    const input = this.usernameInput.first();
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.click();
    await input.fill(username);
  }

  /**
   * Enters password into the password field.
   * @param {string} password
   */
  async fillPassword(password) {
    const input = this.passwordInput.first();
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.click();
    await input.fill(password);
  }

  /**
   * Clicks the primary Sign In submit button.
   */
  async clickSubmit() {
    const btn = this.submitButton.filter({ visible: true }).first();
    await expect(btn).toBeEnabled();
    await btn.click();
  }

  /**
   * Complete Sign In workflow.
   * @param {string} username
   * @param {string} password
   */
  async login(username, password) {
    await this.openSignIn();
    await this.validateLoginFormVisible();
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickSubmit();
  }

  /**
   * Validates successful sign in.
   * Validates that the login form is dismissed and redirected back from Auth0.
   */
  async validateLoginSuccess() {
    await this.page.waitForURL(
      (url) => !url.hostname.includes('auth0') && !url.pathname.includes('/welcome'),
      { timeout: 25000 }
    );
    await expect(this.usernameInput.first()).not.toBeVisible({ timeout: 10000 });
    await this.page.waitForLoadState('domcontentloaded');
  }
}

module.exports = LoginPage;
