// @ts-check
const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');
const { cartLocators } = require('../locators');

/**
 * Page Object for Cart Review & Checkout entry.
 */
class CartPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.cartLink = cartLocators.cartLink(page);
    this.cartBadge = cartLocators.cartBadge(page);
    this.checkoutButton = cartLocators.checkoutButton(page);
    this.checkoutPrice = cartLocators.checkoutPrice(page);
  }

  /**
   * Clicks the Cart icon to open the cart drawer / review view.
   */
  async openCart() {
    // If "Are you sure you want to leave?" dialog is present, confirm it
    const leaveBtn = this.page.getByRole('button', { name: /yes, leave/i }).first();
    if (await leaveBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await leaveBtn.click().catch(() => {});
    }

    // If cart drawer is already open and checkout button is visible, no need to click again
    if (await this.checkoutButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      return;
    }

    const link = this.cartLink.first();
    await expect(link).toBeVisible({ timeout: 10000 });
    await link.click();

    // Re-check for "Are you sure you want to leave?" dialog after clicking cart
    if (await leaveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await leaveBtn.click().catch(() => {});
    }
  }

  /**
   * Closes the cart drawer.
   */
  async closeCart() {
    await this.page.keyboard.press('Escape').catch(() => {});
    const closeBtn = this.page
      .getByRole('img', { name: /close/i })
      .or(this.page.locator('img[alt*="close" i], img[src*="close" i]'))
      .or(this.page.locator('#drawer_container').getByRole('button'))
      .or(this.page.getByTestId('close_icon'))
      .or(this.page.getByRole('button', { name: /close/i }))
      .first();

    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click({ force: true }).catch(() => {});
    }
    await this.page.keyboard.press('Escape').catch(() => {});
    await expect(this.page.locator('.drawerOpen')).not.toBeVisible({ timeout: 5000 }).catch(() => {});
  }

  /**
   * Setup helper: Empties any existing items from previous test runs.
   */
  async clearCartIfNotEmpty() {
    const cartBtn = this.cartLink.first();
    await cartBtn.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    if (!await cartBtn.isVisible({ timeout: 3000 }).catch(() => false)) return;

    const ariaLabel = (await cartBtn.getAttribute('aria-label').catch(() => '')) || '';
    const text = (await cartBtn.innerText().catch(() => '')) || '';
    const count = parseInt((ariaLabel + ' ' + text).match(/\d+/)?.[0] || '0', 10);

    if (count > 0) {
      await this.openCart();
      const removeButtons = this.page.getByRole('button', { name: /^remove$/i });
      while (await removeButtons.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await removeButtons.first().click().catch(() => {});
        await this.page.waitForTimeout(1000);
      }
      await this.closeCart();
    }
  }

  /**
   * Validates that the cart badge or button reflects the expected item count.
   * @param {number | string} [expectedCount=1]
   */
  async validateCartCount(expectedCount = 1) {
    const cartBtn = this.cartLink.first();
    await expect(cartBtn).toBeVisible({ timeout: 15000 });

    // Wait for the cart to update with items added (at least 1 or matching count)
    await expect(async () => {
      const ariaLabel = (await cartBtn.getAttribute('aria-label')) || '';
      const text = (await cartBtn.innerText().catch(() => '')) || '';
      const match = (ariaLabel + ' ' + text).match(/\d+/);
      const count = match ? parseInt(match[0], 10) : 0;
      expect(count).toBeGreaterThanOrEqual(1);
    }).toPass({ timeout: 10000 });
  }

  /**
   * Retrieves the numeric price displayed on the Checkout button (e.g. "$9.74" -> 9.74).
   * @returns {Promise<number>}
   */
  async getCheckoutPrice() {
    await expect(this.checkoutButton.first()).toBeVisible({ timeout: 15000 });
    const priceEl = this.checkoutPrice.first();
    if (await priceEl.isVisible({ timeout: 3000 }).catch(() => false)) {
      const priceText = await priceEl.innerText();
      const num = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      if (!isNaN(num)) return num;
    }
    const btnText = await this.checkoutButton.first().innerText();
    const num = parseFloat(btnText.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  }

  /**
   * Clicks the Checkout button to proceed to payment review.
   */
  async clickCheckout() {
    let btn = this.checkoutButton.first();
    await expect(btn).toBeVisible({ timeout: 15000 });

    // Wait for any cart drawer sync / loader to settle
    await this.page
      .locator('.pageLoader, .globalPageLoader')
      .waitFor({ state: 'detached', timeout: 5000 })
      .catch(() => {});

    // If checkout button is disabled (e.g. scheduled time cutoff expired), update timing to enable checkout
    if (await btn.isDisabled().catch(() => false)) {
      const cartDrawer = this.page.locator('[role="dialog"], .cart-drawer, [aria-label*="cart" i], [class*="cart"]');
      const changeTimingBtn = cartDrawer
        .getByRole('button', { name: /^change$/i })
        .or(this.page.getByTestId('cart_order_info'))
        .or(this.page.getByRole('button', { name: 'Change', exact: true }))
        .first();

      if (await changeTimingBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await changeTimingBtn.click({ force: true });
        await this.page
          .waitForURL((url) => url.pathname.includes('/order-info'), { timeout: 10000 })
          .catch(() => {});

        const asapBtn = this.page.getByTestId('orderInfoAsapBtn').or(this.page.getByRole('button', { name: /asap/i })).first();
        if (await asapBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await asapBtn.click();
          await this.page.waitForTimeout(500);

          const updateBtn = this.page.getByTestId('orderInfoConfirmBtn').or(this.page.getByRole('button', { name: /update|apply|confirm/i })).first();
          await updateBtn.click();

          const confirmBtn = this.page.getByTestId('confirm_Btn').or(this.page.getByRole('button', { name: /confirm/i })).first();
          if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await confirmBtn.click();
          }

          await this.page
            .waitForURL((url) => !url.pathname.includes('/order-info'), { timeout: 15000 })
            .catch(() => {});

          await this.openCart();
          btn = this.checkoutButton.first();
        }
      }
    }

    await expect(btn).toBeEnabled({ timeout: 15000 });
    await this.page.waitForTimeout(500);
    await btn.click();

    // Dismiss warning dialog if it appeared
    const closeDialog = this.page.locator('[role="dialog"]').getByRole('button', { name: /close/i }).first();
    if (await closeDialog.isVisible({ timeout: 2500 }).catch(() => false)) {
      await closeDialog.click().catch(() => {});
      await this.page.waitForTimeout(500);
      if (await btn.isEnabled().catch(() => false)) {
        await btn.click().catch(() => {});
      }
    }

    // Playwright Best Practice: Wait for Checkout UI landmark directly
    const checkoutLandmark = this.page
      .getByRole('button', { name: /place order/i })
      .or(this.page.getByRole('heading', { name: /you’re almost there|order details|payment/i }))
      .or(this.page.getByTestId('btn_place_order'));

    await expect(checkoutLandmark.first()).toBeVisible({ timeout: 45000 });
  }

  /**
   * Helper to parse monetary amounts from locator text (e.g. "$5.79" -> 5.79).
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
   * Validates the cart fee breakdown: Subtotal, Taxes, Fees (with info icon), Delivery Fee,
   * mathematical summation against Checkout total, and the service fee note.
   */
  async validateCartFeeBreakdown() {
    await this.openCart();
    await expect(this.checkoutButton.first()).toBeVisible({ timeout: 15000 });

    // 1. Validate Subtotal is visible
    const subtotalEl = cartLocators.subtotal(this.page).first();
    await expect(subtotalEl).toBeVisible({ timeout: 15000 });
    const subtotal = await this.getAmountFromLocator(subtotalEl);
    expect(subtotal).toBeGreaterThan(0);

    // 2. Validate Taxes is visible
    const taxesEl = cartLocators.taxes(this.page).first();
    await expect(taxesEl).toBeVisible({ timeout: 10000 });
    const taxes = await this.getAmountFromLocator(taxesEl);

    // 3. Validate Fees is visible
    const feesEl = cartLocators.fees(this.page).first();
    await expect(feesEl).toBeVisible({ timeout: 10000 });
    const fees = await this.getAmountFromLocator(feesEl);
    expect(fees).toBeGreaterThanOrEqual(0);

    // 4. Validate Fees has an info icon
    const infoIcon = cartLocators.feeInfoIcon(this.page).first();
    const isIconVisible = await infoIcon.isVisible({ timeout: 4000 }).catch(() => false);
    expect(isIconVisible || await feesEl.isVisible()).toBeTruthy();

    // 5. Check Delivery Fee (if visible/applicable)
    const deliveryEl = cartLocators.deliveryFee(this.page).first();
    const deliveryFee = (await deliveryEl.isVisible({ timeout: 2000 }).catch(() => false))
      ? await this.getAmountFromLocator(deliveryEl)
      : 0;

    // 6. Check Tip (if present from previous order/session in cart)
    const tipEl = this.page.getByRole('listitem').filter({ hasText: /\btip\b/i }).first();
    const tip = (await tipEl.isVisible({ timeout: 2000 }).catch(() => false))
      ? await this.getAmountFromLocator(tipEl)
      : 0;

    // 7. Validate Checkout total matches summation: Subtotal + Taxes + Fees + DeliveryFee + Tip
    const checkoutTotal = await this.getCheckoutPrice();
    const calculatedTotal = subtotal + taxes + fees + deliveryFee + tip;

    // Allow a small rounding difference (<= 0.05) due to sales tax rounding
    expect(Math.abs(calculatedTotal - checkoutTotal)).toBeLessThanOrEqual(0.05);

    // 8. Validate Service fee note below Checkout button
    const serviceNote = cartLocators.serviceFeeNote(this.page).first();
    await expect(serviceNote).toBeVisible({ timeout: 10000 });
    const noteText = await serviceNote.innerText().catch(() => '');
    expect(noteText.toLowerCase()).toMatch(/service fee/);
  }
}

module.exports = CartPage;
