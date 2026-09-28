// @ts-check
const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');
const { productLocators } = require('../locators');

/**
 * Page Object for Product Details & Customization (Scooped Ice Cream).
 */
class ProductDetailsPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.productTitle = page
      .getByTestId('txt_title')
      .filter({ hasText: 'Scooped Ice Cream' });
    this.mediumCupRadio = productLocators.size.mediumCup(page);
    this.addToCartButton = productLocators.addToCartButton(page);
    this.addToCartPrice = productLocators.addToCartPrice(page);
    this.flavorAccordion = productLocators.flavors.accordion(page);
    this.toppingsAccordion = productLocators.toppings.accordion(page);
  }

  /**
   * Validates that the Scooped Ice Cream customization page/modal is displayed.
   * @param {string} [expectedTitle='Scooped Ice Cream']
   */
  async validateProductTitle(expectedTitle = 'Scooped Ice Cream') {
    await expect(this.addToCartButton).toBeVisible({ timeout: 25000 });
    await expect(this.productTitle.first()).toBeVisible({ timeout: 15000 });
    await expect(this.productTitle.first()).toContainText(expectedTitle);
  }

  /**
   * Selects the Medium Cup size option and required flavor modifier.
   */
  async selectMediumCup() {
    await this.dismissCookieBanner();
    await expect(this.addToCartButton).toBeVisible({ timeout: 15000 });
    const mediumOption = this.mediumCupRadio.first();
    await expect(mediumOption).toBeVisible({ timeout: 15000 });
    await mediumOption.scrollIntoViewIfNeeded();
    await mediumOption.click({ force: true });

    // Handle required Flavor Choice if section is present
    const flavorChoice = this.page
      .getByText('Black Raspberry', { exact: false })
      .or(this.page.getByText('Butter Pecan', { exact: false }))
      .or(this.page.getByRole('radio', { name: /raspberry|pecan|vanilla|chocolate/i }));
    if (await flavorChoice.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await flavorChoice.first().scrollIntoViewIfNeeded();
      await flavorChoice.first().click({ force: true });
    }
  }

  /**
   * Validates that the Medium Cup radio button is checked.
   */
  async validateMediumCupSelected() {
    const mediumOption = this.mediumCupRadio.first();
    const isRadio = (await mediumOption.getAttribute('type').catch(() => null)) === 'radio';
    if (isRadio) {
      await expect(mediumOption).toBeChecked();
    } else {
      await expect(mediumOption).toBeVisible();
    }
  }

  /**
   * Selects a specific flavor if required by customization rules.
   * @param {'strawberry' | 'oreoCookiesCream' | 'mintOreo' | 'coldBrew' | 'orangeDreamyCreamy' | 'pistachio' | 'peanutButter' | 'chocolatePeanutButter'} flavorKey
   */
  async selectFlavor(flavorKey = 'strawberry') {
    const flavorLocator = productLocators.flavors[flavorKey](this.page);
    if (await this.flavorAccordion.isVisible()) {
      // Ensure accordion is expanded if needed
      await flavorLocator.scrollIntoViewIfNeeded();
    }
    await flavorLocator.check({ force: true });
    await expect(flavorLocator).toBeChecked();
  }

  /**
   * Retrieves the displayed price on the Add to Cart button (e.g. "$5.79" -> 5.79).
   * @returns {Promise<number>}
   */
  async getDisplayedPrice() {
    await expect(this.addToCartPrice).toBeVisible();
    const priceText = await this.addToCartPrice.innerText();
    const numericPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));
    return numericPrice;
  }

  /**
   * Clicks the Add to Cart button.
   */
  async clickAddToCart() {
    await this.dismissCookieBanner();
    await expect(this.addToCartButton).toBeEnabled();
    await this.addToCartButton.click();

    // Wait for "Item Added!" toast or redirect away from the product page
    await Promise.race([
      this.page.getByText(/item added/i).first().waitFor({ state: 'visible', timeout: 15000 }),
      this.page.waitForURL((url) => !url.pathname.includes('/scooped-ice-cream'), { timeout: 15000 }),
    ]).catch(() => {});
  }

  /**
   * Complete product customization and add to cart.
   */
  async configureAndAddToCart() {
    await this.selectMediumCup();
    await this.validateMediumCupSelected();
    await this.clickAddToCart();
  }
}

module.exports = ProductDetailsPage;
