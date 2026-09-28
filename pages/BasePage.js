// @ts-check
const { expect } = require('@playwright/test');

/**
 * Base Page Object containing shared browser utilities and navigation.
 */
class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Dismisses the cookie tracking banner if visible.
   */
  async dismissCookieBanner() {
    try {
      const continueBtn = this.page
        .locator('#acceptAllCookieButton')
        .or(this.page.getByRole('button', { name: /continue to site|accept/i }))
        .or(this.page.locator('#truyo-consent-module button'));
      if (await continueBtn.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        await continueBtn.first().click().catch(() => {});
      }
      await this.page.evaluate(() => {
        const el = document.getElementById('truyo-consent-module');
        if (el) el.remove();
      }).catch(() => {});
    } catch {
      // Cookie banner not present or already dismissed
    }
  }

  /**
   * Navigates to a specific path relative to baseURL.
   * @param {string} [path='/']
   */
  async navigate(path = '/') {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    await this.dismissCookieBanner();
  }

  /**
   * Waits for a specific URL pattern.
   * @param {string | RegExp} urlPattern
   * @param {number} [timeout=15000]
   */
  async waitForUrl(urlPattern, timeout = 15000) {
    await this.page.waitForURL(urlPattern, { timeout });
  }

  /**
   * Waits for DOM to be idle.
   */
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }
}

module.exports = BasePage;
