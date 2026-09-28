// @ts-check
const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');
const { checkoutLocators } = require('../locators');

/**
 * Page Object for Checkout, Payment selection, and Order submission.
 */
class CheckoutPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.savedCardRadio = checkoutLocators.savedCardRadio(page);
    this.savedCardDigits = checkoutLocators.savedCardDigits(page);
    this.savedCardExpiry = checkoutLocators.savedCardExpiry(page);
    this.placeOrderButton = checkoutLocators.placeOrderButton(page);
  }

  /**
   * Selects the Saved Credit Card payment radio option.
   */
  async selectSavedCard() {
    const savedCardGroup = this.page.getByRole('radiogroup', { name: 'saved_Card' }).first();
    const radio = savedCardGroup.getByRole('radio').first();
    const textEl = savedCardGroup.getByText(/ending in \d{4}/i).first();

    await expect(savedCardGroup).toBeVisible({ timeout: 25000 });

    // 1. Click the text or row to trigger React's synthetic onClick handler
    await textEl.click({ force: true }).catch(async () => {
      await savedCardGroup.click({ force: true });
    });
    await this.page.waitForTimeout(500);

    // 2. Click the radio button element directly
    await radio.click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(500);

    // 3. If still not checked, click the radiogroup container again
    const isChecked = await radio.isChecked().catch(() => false);
    if (!isChecked) {
      await savedCardGroup.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Validates that the Saved Card radio button is checked.
   */
  async validateSavedCardSelected() {
    const savedCardGroup = this.page.getByRole('radiogroup', { name: 'saved_Card' }).first();
    const radio = savedCardGroup.getByRole('radio').first();
    if (!await radio.isChecked().catch(() => false)) {
      await savedCardGroup.getByText(/ending in \d{4}/i).first().click({ force: true }).catch(() => {});
      await radio.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(500);
    }
    await expect(radio).toBeChecked({ timeout: 10000 });
  }

  /**
   * Validates the masked card details displayed on the checkout page.
   * @param {string} [expectedLast4='1111']
   * @param {string} [expectedExp='12/35']
   */
  async validateSavedCardDetails(expectedLast4 = '1111', expectedExp = '12/35') {
    const digits = this.savedCardDigits.first();
    await expect(digits).toBeVisible({ timeout: 10000 });
    await expect(digits).toContainText(expectedLast4);

    const expiry = this.savedCardExpiry.first();
    await expect(expiry).toBeVisible({ timeout: 10000 });
    await expect(expiry).toContainText(expectedExp);
  }

  /**
   * 10.1 Precondition validation:
   * Validates that the Place Order button is available and enabled before clicking.
   */
  async validatePlaceOrderReady() {
    const btn = this.placeOrderButton.first();
    await expect(btn).toBeVisible({ timeout: 15000 });

    // If disabled, click the saved card option to trigger selection and dismiss "Please select a payment method"
    if (await btn.isDisabled().catch(() => false)) {
      const savedCardGroup = this.page.getByRole('radiogroup', { name: 'saved_Card' }).first();
      await savedCardGroup.getByText(/ending in \d{4}/i).first().click({ force: true }).catch(() => {});
      await savedCardGroup.getByRole('radio').first().click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(1000);
    }

    await expect(btn).toBeEnabled({ timeout: 15000 });
  }

  /**
   * Action: Clicks the final "Place Order" button.
   */
  async clickPlaceOrder() {
    const btn = this.placeOrderButton.first();
    await btn.scrollIntoViewIfNeeded().catch(() => {});
    await expect(btn).toBeEnabled({ timeout: 10000 });
    await btn.click();
  }

  /**
   * 10.2 Post-order success validation:
   * Validates that the order was actually submitted successfully and confirmation page is displayed.
   */
  async validateOrderSubmittedSuccessfully() {
    // 1. Wait for navigation away from checkout
    await this.page.waitForURL(
      (url) => !url.href.toLowerCase().includes('/checkout'),
      { timeout: 45000 }
    ).catch(() => {});

    // 2. Validate that the post-order confirmation UI / success message is visible
    const confirmation = checkoutLocators.orderConfirmationContainer(this.page).first();
    await expect(confirmation).toBeVisible({ timeout: 45000 });

    // 3. Give confirmation details a moment to settle
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(2000);
  }
}

module.exports = CheckoutPage;
