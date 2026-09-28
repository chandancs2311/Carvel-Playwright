/**
 * Location Selection Modal / Component Locators
 * Based on verified DOM from Carvel UAT.
 */
const locationLocators = {
  // Trigger to open change location modal or start order
  changeLocationButton: (page) =>
    page.getByTestId('order_changeButtonId').or(page.getByRole('button', { name: /start order/i })),

  // Location selector dropdown chevron
  locationChevron: (page) => page.getByTestId('chevron_icon'),

  // Address search textbox
  storeSearchInput: (page) =>
    page
      .getByRole('textbox', { name: /street, city, state, zip/i })
      .or(page.getByPlaceholder(/street, city, state, zip/i))
      .or(page.getByTestId('input_store_search_input'))
      .or(page.locator('input[aria-label*="Street, City, State, Zip"]')),

  // Matching address search result item
  addressResultItem: (page, addressText) =>
    page
      .getByRole('button', { name: /26 Broadway/i })
      .or(page.getByText(addressText, { exact: false })),

  // Order Now / Select Shoppe / Order Ahead button to select the store
  orderNowButton: (page) =>
    page.getByRole('button', { name: /select shoppe|order now|order ahead/i }).or(page.getByTestId('btn_order_now')),

  // Confirm location setup button
  confirmButton: (page) =>
    page.getByRole('button', { name: 'CONFIRM', exact: true }).or(page.getByTestId('confirm_Btn')),

  // "Continue" button on Edit Location warning modal
  continueEditLocationButton: (page) =>
    page.getByTestId('btn_continue').or(page.locator('#btn_continue')),

  // Order Timing / ASAP Trigger button on order header bar
  pickupTimingTrigger: (page) =>
    page.getByTestId('order_changeButtonId').or(page.getByRole('button', { name: /change/i })),

  // Pickup tab on /order-info
  pickupTab: (page) =>
    page.getByTestId('tab_btn_pickup').or(page.getByRole('tab', { name: /pickup/i })),

  // "ASAP" option inside scheduling (/order-info)
  asapOption: (page) =>
    page.getByTestId('orderInfoAsapBtn').or(page.getByRole('button', { name: /asap/i })),

  // "Later" option inside scheduling (/order-info)
  pickupLaterOption: (page) =>
    page.getByTestId('orderInfoLaterBtn').or(page.getByRole('button', { name: /later/i })),

  // Save / Apply timing button on /order-info
  applyTimingButton: (page) =>
    page.getByTestId('orderInfoConfirmBtn').or(page.getByRole('button', { name: /update/i })),
};


module.exports = locationLocators;
