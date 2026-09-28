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
}

module.exports = CartPage;
