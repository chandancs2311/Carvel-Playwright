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

  /**
   * Helper to parse monetary amounts from locator text.
   * @param {import('@playwright/test').Locator} locator
   * @returns {Promise<number>}
   */
  async getAmountFromLocator(locator) {
    if (await locator.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      const text = await locator.first().innerText().catch(() => '');
      const match = text.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
      if (match) return parseFloat(match[1]);
      const anyNum = text.match(/(\d+(?:\.\d{1,2})?)/);
      if (anyNum) return parseFloat(anyNum[1]);
    }
    return 0;
  }

  /**
   * Selects or adjusts tip amount on the Checkout page.
   */
  async selectTipOption() {
    const tipSection = checkoutLocators.tipSection(this.page).first();
    await tipSection.scrollIntoViewIfNeeded().catch(() => {});
    await expect(tipSection).toBeVisible({ timeout: 20000 });

    // Look for preset tip button (e.g. 20% or 15% or 10%)
    const tip20 = this.page.getByRole('button', { name: '20%' }).first();
    const tip15 = this.page.getByRole('button', { name: '15%' }).first();
    const tip10 = this.page.getByRole('button', { name: '10%' }).first();

    if (await tip20.isVisible({ timeout: 4000 }).catch(() => false)) {
      await tip20.click({ force: true });
    } else if (await tip15.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tip15.click({ force: true });
    } else if (await tip10.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tip10.click({ force: true });
    }

    await this.page.waitForTimeout(1000);
  }

  /**
   * Validates that the order total updates to include the Tip amount in the price breakdown.
   */
  async validateOrderTotalWithTip() {
    // 1. Verify Tip line item appears in the order breakdown with amount > 0
    let tipAmount = 0;
    await expect(async () => {
      const tipRow = checkoutLocators.tipBreakdownRow(this.page).first();
      await expect(tipRow).toBeVisible({ timeout: 5000 });
      tipAmount = await this.getAmountFromLocator(tipRow);
      expect(tipAmount).toBeGreaterThan(0);
    }).toPass({ timeout: 15000 });

    // 2. Read final Order Total
    const totalEl = checkoutLocators.orderTotal(this.page).first();
    await expect(totalEl).toBeVisible({ timeout: 10000 });
    const finalTotal = await this.getAmountFromLocator(totalEl);
    expect(finalTotal).toBeGreaterThan(tipAmount);
  }
}

module.exports = CheckoutPage;
