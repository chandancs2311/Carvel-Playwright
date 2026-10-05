// @ts-check
const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');
const { authLocators } = require('../locators');

/**
 * Page Object for Carvel Fudgie Fanatics - Create Account / Sign Up.
 */
class SignUpPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.signInLink = authLocators.signInLink(page);
    this.signUpLink = authLocators.signUpLink(page);
    this.auth0SignUpTab = authLocators.auth0SignUpTab(page);
    this.usernameInput = authLocators.usernameInput(page);
    this.passwordInput = authLocators.passwordInput(page);
    this.continueButton = authLocators.continueButton(page);
    this.alreadyRegisteredError = authLocators.alreadyRegisteredError(page);
    this.invalidEmailError = authLocators.invalidEmailError(page);
  }

  /**
   * Navigates to the Carvel Create Account / Sign Up page.
   */
  async openSignUp() {
    await this.navigate('/');
    await this.dismissCookieBanner();

    // Check if directly on /welcome landing page
    if (this.page.url().includes('/welcome')) {
      const createAccountBtn = this.page.getByRole('button', { name: /create an account|join now/i }).first();
      if (await createAccountBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await createAccountBtn.click();
      } else {
        const welcomeSignIn = this.page.getByRole('button', { name: 'SIGN IN' }).first();
        await expect(welcomeSignIn).toBeVisible({ timeout: 15000 });
        await welcomeSignIn.click();
      }
    } else {
      // On Carvel root /: Click header "Join Now" / "Sign Up" or "Sign In"
      const headerSignUp = this.page.getByRole('button', { name: /join now|create account|sign up/i }).first();
      if (await headerSignUp.isVisible({ timeout: 3000 }).catch(() => false)) {
        await headerSignUp.click();
      } else {
        await expect(this.signInLink).toBeVisible({ timeout: 15000 });
        await this.signInLink.click();
      }

      // Wait for navigation either to /welcome landing page or Auth0
      await this.page.waitForURL(
        (url) => url.pathname.includes('/welcome') || url.hostname.includes('auth0'),
        { timeout: 25000 }
      );

      // If routed to /welcome, click "Create an Account" or "Sign In"
      if (this.page.url().includes('/welcome')) {
        await this.dismissCookieBanner();
        const welcomeCreateBtn = this.page.getByRole('button', { name: /create an account|join now/i }).first();
        if (await welcomeCreateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await welcomeCreateBtn.click();
        } else {
          const welcomeSignIn = this.page.getByRole('button', { name: 'SIGN IN' }).first();
          await expect(welcomeSignIn).toBeVisible({ timeout: 15000 });
          await welcomeSignIn.click();
        }
      }
    }

    // Wait until the browser reaches the Auth0 authentication / registration page
    await this.page.waitForURL(
      (url) => url.hostname.includes('auth0'),
      { timeout: 30000 }
    );

    // If currently on Auth0 login tab, switch to the "Sign Up" tab
    if (await this.auth0SignUpTab.first().isVisible({ timeout: 4000 }).catch(() => false)) {
      await this.auth0SignUpTab.first().click();
    }

    // Ensure email / username input field is visible
    await expect(this.usernameInput.first()).toBeVisible({ timeout: 20000 });
  }

  /**
   * Enters email address into the input field.
   * @param {string} email
   */
  async fillEmail(email) {
    const input = this.usernameInput.first();
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.click();
    await input.fill(email);
  }

  /**
   * Enters password into the input field.
   * @param {string} password
   */
  async fillPassword(password) {
    const input = this.passwordInput.first();
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.click();
    await input.fill(password);
  }

  /**
   * Clicks Continue / Sign Up submit button.
   */
  async clickContinue() {
    const btn = this.continueButton.filter({ visible: true }).first();
    await expect(btn).toBeEnabled({ timeout: 10000 });
    await btn.click();
  }

  /**
   * Validates that duplicate registration is rejected with "This email is already registered".
   */
  async validateAlreadyRegisteredError() {
    const errorEl = this.alreadyRegisteredError.first();
    await expect(errorEl).toBeVisible({ timeout: 15000 });
    
    // Validate text content contains expected error wording
    const text = await errorEl.innerText().catch(() => '');
    expect(text.toLowerCase()).toMatch(/already registered|already in use|already exists/);

    // Validate we are still on the registration page and not logged in / redirected
    expect(this.page.url()).toMatch(/auth0|signup|register|welcome/);
  }

  /**
   * Validates that an email containing invalid characters (e.g. emoji) is rejected.
   */
  async validateInvalidEmailRejected() {
    const input = this.usernameInput.first();

    // Trigger blur / change event by moving focus or attempting to submit
    await input.blur().catch(() => {});

    // Try clicking continue or checking validation
    if (await this.continueButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.continueButton.first().click().catch(() => {});
    }

    // Check for inline error message or red border / aria-invalid attribute or HTML5 validity
    const hasInlineError = await this.invalidEmailError.first().isVisible({ timeout: 4000 }).catch(() => false);
    const isAriaInvalid = (await input.getAttribute('aria-invalid').catch(() => null)) === 'true';
    const isHtml5Invalid = await input.evaluate((/** @type {HTMLInputElement} */ el) => {
      return el.checkValidity ? !el.checkValidity() : false;
    }).catch(() => false);
    const hasRedBorder = await input.evaluate((/** @type {HTMLElement} */ el) => {
      const style = window.getComputedStyle(el);
      const borderColor = style.borderColor || '';
      return borderColor.includes('rgb(2') || borderColor.includes('red');
    }).catch(() => false);

    expect(
      hasInlineError || isAriaInvalid || isHtml5Invalid || hasRedBorder,
      'Email field should indicate invalid format via error message, HTML5 validity, aria-invalid, or red border'
    ).toBeTruthy();
  
    // Verify submission is blocked and user remains on Create Account page
    expect(this.page.url()).toMatch(/auth0|signup|register|welcome/);
  }
}

module.exports = SignUpPage;
