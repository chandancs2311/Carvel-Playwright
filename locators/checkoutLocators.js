/**
 * Checkout & Payment Locators
 * Based on verified DOM from Carvel UAT.
 */
const checkoutLocators = {
  // Saved card radio input option ("Ending in 1111")
  savedCardRadio: (page) =>
    page
      .getByRole('radiogroup', { name: 'saved_Card' })
      .getByRole('radio')
      .or(page.locator('div').filter({ hasText: /ending in 1111/i }).locator('input[type="radio"]'))
      .or(page.locator('[data-testid="btn_saved_Card"] input[type="radio"]'))
      .or(page.getByTestId('btn_saved_Card'))
      .or(page.getByRole('radio', { name: /ending in/i }))
      .or(page.getByRole('radio', { name: 'creditcard' })),

  // Saved card masked digits display ("Ending in 1111")
  savedCardDigits: (page) =>
    page.getByTestId('txt_checkout_primFourDigits').or(page.getByText(/Ending in \d{4}/i)),

  // Saved card expiration date display ("Expires 12/35")
  savedCardExpiry: (page) =>
    page.getByTestId('txt_checkout_primExp').or(page.getByText(/Expires/i)),

  // Final Place Order button
  placeOrderButton: (page) =>
    page.getByTestId('btn_place_order').or(page.getByRole('button', { name: /place order/i })),

  // Tip selection section / options container
  tipSection: (page) =>
    page.getByTestId('tip_container')
      .or(page.locator('[data-testid*="tip"], .tipContainer, .tip-section'))
      .or(page.locator('div').filter({ hasText: /^tip/i })),

  // Tip amount buttons (e.g. $1.00, $2.00, 15%, 20%, etc.)
  tipButtons: (page) =>
    page.locator('button[data-testid*="tip"], button[id*="tip"], .tipButton')
      .or(page.getByRole('button', { name: /\$|\d+%/i })),

  // Line item displaying Tip amount in order summary or tip card
  tipBreakdownRow: (page) =>
    page.getByText(/tip amount\s*=/i)
      .or(page.getByTestId('txt_checkout_tip'))
      .or(page.locator('div, li, p').filter({ hasText: /^tip/i })),

  // Final Order Total display element
  orderTotal: (page) =>
    page.getByTestId('txt_checkout_total')
      .or(page.locator('[data-testid*="total"], .orderTotal, .checkoutTotal'))
      .or(page.locator('div, li, p').filter({ hasText: /^total/i })),

  // Final order success state (Order Confirmation page)
  orderConfirmationContainer: (page) =>
    page
      .getByRole('heading', { name: /thank you|order placed|order confirmed|order received|order status/i })
      .or(page.getByText(/thank you for your order|order successfully placed|order confirmed|your order is placed|your order has been|order #\s*\d+|confirmation #/i))
      .or(page.getByTestId('order_confirmation_container'))
      .or(page.locator('.orderConfirmation, [data-testid*="confirmation"], [class*="orderSuccess"], [class*="confirmation"]')),
};

module.exports = checkoutLocators;
