/**
 * Cart & Cart Preview Locators
 * Based on verified DOM from Carvel UAT.
 */
const cartLocators = {
  // Cart link/icon button
  cartLink: (page) =>
    page.getByTestId('link_cart').or(page.getByRole('button', { name: /cart/i })),

  // Item count badge inside cart icon
  cartBadge: (page) =>
    page.getByRole('button', { name: /cart/i }).locator('span').or(page.getByTestId('link_cart').locator('span')).or(page.getByRole('button', { name: /cart/i })),

  // Checkout button inside cart drawer/page
  checkoutButton: (page) =>
    page.getByTestId('cart_checkout_button').or(page.getByRole('button', { name: /checkout/i })),

  // Displayed price span inside checkout button
  checkoutPrice: (page) =>
    page.getByTestId('cart_checkout_button').locator('.btnPrice').or(page.locator('.btnPrice')),

  // Price breakdown container in cart
  priceBreakdown: (page) =>
    page.locator('.priceBreakdown, .orderSummary, .cartSummary, [data-testid*="summary"]').or(page.locator('#drawer_container')),

  // Subtotal line item
  subtotal: (page) =>
    page.getByRole('listitem').filter({ hasText: /subtotal/i })
      .or(page.getByTestId('txt_cart_subtotal')),

  // Taxes line item
  taxes: (page) =>
    page.getByRole('listitem').filter({ hasText: /taxes|tax/i })
      .or(page.getByTestId('txt_cart_taxes')),

  // Fees line item (matches listitem with word "Fees" and dollar sign "$", avoiding footer links)
  fees: (page) =>
    page.getByRole('listitem').filter({ hasText: /\bfees?\b/i }).filter({ hasText: /\$/ })
      .or(page.getByTestId('txt_cart_fees')),

  // Info icon beside Fees
  feeInfoIcon: (page) =>
    page.getByRole('listitem').filter({ hasText: /\bfees?\b/i }).locator('button, svg, img, i')
      .or(page.locator('[aria-label*="fee" i], [title*="fee" i], .infoIcon, [data-testid*="fee_info"]')),

  // Delivery Fee line item (if applicable)
  deliveryFee: (page) =>
    page.getByRole('listitem').filter({ hasText: /delivery fee/i })
      .or(page.getByTestId('txt_cart_deliveryFee')),

  // Note: "A 3% service fee is added to all online orders."
  serviceFeeNote: (page) =>
    page.getByText(/3% service fee is added to all online orders|service fee is added to all online orders/i),
};

module.exports = cartLocators;
