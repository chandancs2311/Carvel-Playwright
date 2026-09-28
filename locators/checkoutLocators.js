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

  // Final order success state (Order Confirmation page)
  orderConfirmationContainer: (page) =>
    page
      .getByRole('heading', { name: /thank you|order placed|order confirmed|order received|order status/i })
      .or(page.getByText(/thank you for your order|order successfully placed|order confirmed|your order is placed|your order has been|order #\s*\d+|confirmation #/i))
      .or(page.getByTestId('order_confirmation_container'))
      .or(page.locator('.orderConfirmation, [data-testid*="confirmation"], [class*="orderSuccess"], [class*="confirmation"]')),
};

module.exports = checkoutLocators;
