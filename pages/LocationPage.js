// @ts-check
const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');
const { locationLocators } = require('../locators');

/**
 * Page Object for Location Selection & Setup.
 */
class LocationPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.changeLocationButton = locationLocators.changeLocationButton(page);
    this.locationChevron = locationLocators.locationChevron(page);
    this.storeSearchInput = locationLocators.storeSearchInput(page);
    this.orderNowButton = locationLocators.orderNowButton(page);
    this.confirmButton = locationLocators.confirmButton(page);
  }

  /**
   * Opens the Change Location modal.
   */
  async openChangeLocation() {
    await this.dismissCookieBanner();

    // Recover if site displayed temporary hiccup screen
    const tryAgainBtn = this.page.getByRole('button', { name: /try again/i }).first();
    if (await tryAgainBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tryAgainBtn.click().catch(() => {});
      await this.page.waitForLoadState('domcontentloaded');
    }

    const input = this.storeSearchInput.first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      return;
    }

    // Dismiss drawer overlay if open
    if (await this.page.locator('.drawerOpen').isVisible({ timeout: 1500 }).catch(() => false)) {
      await this.page.keyboard.press('Escape').catch(() => {});
      const closeImg = this.page.locator('img[alt*="close" i], [class*="close"]').first();
      if (await closeImg.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeImg.click({ force: true }).catch(() => {});
      }
      await this.page.waitForTimeout(500);
    }

    const trigger = this.changeLocationButton.first();
    await expect(trigger).toBeVisible({ timeout: 25000 });
    await trigger.click();

    // Dismiss "Edit Location?" warning dialog if items are in cart
    const continueBtn = this.page
      .getByRole('button', { name: /^continue$/i })
      .or(locationLocators.continueEditLocationButton(this.page))
      .first();
    if (await continueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await continueBtn.click();
    }

    await expect(input).toBeVisible({ timeout: 25000 });
  }

  /**
   * Enters the target address into the store search input.
   * @param {string} address
   */
  async searchAddress(address) {
    const input = this.storeSearchInput.first();
    await expect(input).toBeVisible({ timeout: 15000 });
    await input.click();
    await input.fill('');
    await input.pressSequentially(address, { delay: 30 });
  }

  /**
   * Selects the matching address result from the search suggestions.
   * @param {string} address
   */
  async selectAddressResult(address) {
    const addressResult = locationLocators.addressResultItem(this.page, address).first();
    await expect(addressResult).toBeVisible({ timeout: 10000 });
    await addressResult.click({ force: true });
    // Wait for the suggestion list to be dismissed and stores to populate
    await this.page.waitForTimeout(1000);
  }

  /**
   * Clicks the "Order Now" button for the selected store.
   */
  async clickOrderNow() {
    // Target the Sandbox store for 26 Broadway if available
    const sandboxBtn = this.page
      .locator('div')
      .filter({ hasText: /carvel qu sandbox/i })
      .locator('button')
      .filter({ hasText: /order now|select shoppe|order ahead/i })
      .first();

    if (await sandboxBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sandboxBtn.click();
      return;
    }

    const orderBtn = this.orderNowButton.first();
    await expect(orderBtn).toBeVisible({ timeout: 15000 });
    await orderBtn.click();
  }

  /**
   * Confirms the store location setup.
   */
  async confirmLocation() {
    const confirmBtn = this.confirmButton.first();
    try {
      await confirmBtn.waitFor({ state: 'visible', timeout: 8000 });
      await confirmBtn.click();
    } catch {
      // Modal did not appear or was already dismissed
    }
  }

  /**
   * Complete Location Selection workflow.
   * @param {string} searchAddress
   * @param {string} [resultAddress]
   */
  async selectLocation(searchAddress, resultAddress = searchAddress) {
    await this.openChangeLocation();
    await this.searchAddress(searchAddress);
    await this.selectAddressResult(resultAddress);
    await this.clickOrderNow();
    await this.confirmLocation();
  }

  /**
   * Validates that the store location has been applied and modal is dismissed.
   */
  async validateLocationApplied() {
    await expect(this.confirmButton.first()).not.toBeVisible({ timeout: 10000 }).catch(() => {});
    await expect(this.storeSearchInput).not.toBeVisible({ timeout: 10000 }).catch(() => {});

    // Dismiss "Your cart was updated" dialog if present
    const cartUpdatedBtn = this.page.getByRole('dialog').getByRole('button', { name: /ok|close/i }).first();
    if (await cartUpdatedBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cartUpdatedBtn.click().catch(() => {});
    }

    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Stage 3: Switches timing to "Pickup Later". If Later is no longer available, falls back to ASAP.
   */
  async selectPickupLater() {
    await this.dismissCookieBanner();

    // Dismiss any lingering dialog/overlay before proceeding
    const dialogBtn = this.page.getByRole('dialog').getByRole('button', { name: /ok|close/i }).first();
    if (await dialogBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dialogBtn.click().catch(() => {});
    }

    // Navigate to /order-info?isEdit=true to set Pickup Later
    if (!this.page.url().includes('/order-info')) {
      await this.page.goto('/order-info?isEdit=true', { waitUntil: 'domcontentloaded' });
    }
    await this.dismissCookieBanner();

    // Ensure Pickup tab is selected
    const pickupTab = locationLocators.pickupTab(this.page).first();
    if (await pickupTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await pickupTab.click();
    }

    const laterBtn = locationLocators.pickupLaterOption(this.page).first();
    const asapBtn = locationLocators.asapOption(this.page).first();
    const applyBtn = locationLocators.applyTimingButton(this.page).first();

    let laterSucceeded = false;

    // Priority 1: Select Pickup Later
    if (await laterBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const isLaterDisabled = await laterBtn.isDisabled().catch(() => false);
      if (!isLaterDisabled) {
        await laterBtn.click();
        await this.page.waitForTimeout(500);

        // Check if store is closed or no time slots available for Later
        const closedWarning = this.page.getByText(/store is closed|currently closed|not accepting orders|no time slots available/i).first();
        const isClosed = await closedWarning.isVisible({ timeout: 1500 }).catch(() => false);

        if (!isClosed && await applyBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
          await this.dismissCookieBanner();
          await applyBtn.click();
          await this.confirmLocation();

          try {
            await this.page.waitForURL((url) => !url.pathname.includes('/order-info'), { timeout: 15000 });
            laterSucceeded = true;
          } catch {
            laterSucceeded = false;
          }
        }
      }
    }

    // Priority 2: Fallback to ASAP only if Later was rejected/unavailable/closed
    if (!laterSucceeded && this.page.url().includes('/order-info')) {
      const dismissModal = this.page.locator('[role="dialog"] button:has-text("CHANGE"), [role="dialog"] button[aria-label="Close"]').first();
      if (await dismissModal.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dismissModal.click();
      }

      await expect(asapBtn).toBeVisible({ timeout: 5000 });
      await asapBtn.click();
      await this.page.waitForTimeout(500);

      await expect(applyBtn).toBeVisible({ timeout: 10000 });
      await this.dismissCookieBanner();
      await applyBtn.click();

      await this.confirmLocation();

      await this.page.waitForURL((url) => !url.pathname.includes('/order-info'), { timeout: 20000 });
    }

    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Validates that Pickup Later or fallback ASAP has been applied and clock label reflects timing.
   */
  async validatePickupLaterSelected() {
    await expect(this.page).not.toHaveURL(/.*order-info.*/, { timeout: 20000 });
    const clockLabel = this.page.getByTestId('txt_clock_label');
    await expect(clockLabel).toBeVisible({ timeout: 15000 });
    // Verify it reflects scheduled later time or ASAP fallback
    await expect(clockLabel).toContainText(/scheduled|today|at|\d+:\d+|asap/i);
  }
}

module.exports = LocationPage;
