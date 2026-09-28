/**
 * Menu Catalog & Category Locators
 * Based on verified DOM from Carvel UAT.
 */
const menuLocators = {
  // Ice Cream category card / navigation link
  iceCreamCategory: (page) =>
    page.getByRole('button', { name: /^ice cream$/i })
      .or(page.locator('[data-testid^="menu_category_id_"]').filter({ hasText: /ice cream/i }))
      .or(page.getByRole('button', { name: /ice cream/i })),

  // Scooped Ice Cream product card heading / link
  scoopedIceCreamProduct: (page) =>
    page.getByRole('link', { name: 'Scooped Ice Cream' })
      .or(page.getByText('Scooped Ice Cream', { exact: true }))
      .or(page.getByTestId('txt_title').filter({ hasText: 'Scooped Ice Cream' })),
};

module.exports = menuLocators;
