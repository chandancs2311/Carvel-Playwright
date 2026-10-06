// @ts-check
const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');
const { menuLocators } = require('../locators');

/**
 * Page Object for Menu Navigation & Product Catalog.
 */
class MenuPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.iceCreamCategory = menuLocators.iceCreamCategory(page);
    this.scoopedIceCreamProduct = menuLocators.scoopedIceCreamProduct(page);
  }

  /**
   * Selects the Ice Cream category card.
   */
  async selectIceCreamCategory() {
    await this.page.waitForLoadState('domcontentloaded');
    // If Scooped Ice Cream is already displayed, no need to click category
    if (await this.scoopedIceCreamProduct.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      return;
    }
    const cat = this.iceCreamCategory.first();
    await expect(cat).toBeVisible({ timeout: 20000 });
    await cat.click();
  }
  
  /**
   * Clicks the Scooped Ice Cream product card to open its customization view.
   */
  async selectScoopedIceCream() {
    const product = this.scoopedIceCreamProduct.first();
    await expect(product).toBeVisible({ timeout: 15000 });
    await product.scrollIntoViewIfNeeded();
                                   
    const addToCartBtn = this.page.getByTestId('btn_add_to_cart');
    await expect(async () => {
      await product.click();
      await expect(addToCartBtn).toBeVisible({ timeout: 4000 });
    }).toPass({ intervals: [1000, 2000], timeout: 25000 });
  }

  /**
   * Validates that the Scooped Ice Cream product is rendered.
   */
  async validateScoopedIceCreamVisible() {
    await expect(this.scoopedIceCreamProduct.first()).toBeVisible();
  }
}

module.exports = MenuPage;
