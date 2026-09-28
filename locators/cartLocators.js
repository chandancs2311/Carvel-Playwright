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
};

module.exports = cartLocators;
