// @ts-check
const { test, expect } = require('@playwright/test');
const {
  LoginPage,
  LocationPage,
  MenuPage,
  ProductDetailsPage,
  CartPage,
  CheckoutPage,
} = require('../../pages');
const testData = require('../../data/testData');

test.describe('Carvel Regression Suite - Cart and Checkout', { tag: '@regression' }, () => {
  // Run tests sequentially to avoid cart session collisions on the shared account
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    // Automatically accept browser alert dialogs if any appear
    page.on('dialog', (dialog) => dialog.accept().catch(() => {}));

    // Register locator handler for cookie consent overlays
    const cookieBtn = page
      .getByRole('button', { name: /continue to site|accept all/i })
      .or(page.locator('#acceptAllCookieButton'));
    await page.addLocatorHandler(cookieBtn, async () => {
      await cookieBtn.first().click().catch(() => {});
    });
  });

  test(
    'TC_022: Verify the cart fee breakdown (Subtotal, Taxes, Fees, Delivery Fee) and service fee note are displayed accurately',
    async ({ page }) => {
      test.setTimeout(180000);

      const loginPage = new LoginPage(page);
      const locationPage = new LocationPage(page);
      const menuPage = new MenuPage(page);
      const productDetailsPage = new ProductDetailsPage(page);
      const cartPage = new CartPage(page);

      await test.step('1. Open Carvel App as logged in user', async () => {
        await loginPage.navigate('/');
        await loginPage.login(testData.user.email, testData.user.password);
        await loginPage.validateLoginSuccess();
      });

      await test.step('2. Select Location & Pickup Timing', async () => {
        await locationPage.selectLocation(
          testData.location.searchAddress,
          testData.location.selectedAddressResult
        );
        await locationPage.validateLocationApplied();
        await locationPage.selectPickupLater();
      });

      await test.step('3. Ensure at least 1 item is added to cart', async () => {
        await cartPage.clearCartIfNotEmpty();
        await menuPage.selectIceCreamCategory();
        await menuPage.selectScoopedIceCream();
        await productDetailsPage.validateProductTitle(testData.order.product);
        await productDetailsPage.selectMediumCup();
        await productDetailsPage.clickAddToCart();
        await cartPage.validateCartCount(1);
      }); 
    
      await test.step('4. Open cart & observe price breakdown section above Checkout button', async () => {
        await cartPage.openCart();
      });

      await test.step('5. Validate fee breakdown lines, info icon, sum to total, and 3% service fee note', async () => {
        await cartPage.validateCartFeeBreakdown();
      });
    }
  );
 
  test(
    'TC_028: Verify the order total updates to include the Tip amount before payment',
    async ({ page }) => {
      test.setTimeout(210000);

      const loginPage = new LoginPage(page);
      const locationPage = new LocationPage(page);
      const menuPage = new MenuPage(page);
      const productDetailsPage = new ProductDetailsPage(page);
      const cartPage = new CartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await test.step('1. Open Carvel App as logged in user & setup cart item', async () => {
        await loginPage.navigate('/');
        await loginPage.login(testData.user.email, testData.user.password);
        await loginPage.validateLoginSuccess();

        await locationPage.selectLocation(
          testData.location.searchAddress,
          testData.location.selectedAddressResult
        );
        await locationPage.validateLocationApplied();
        await locationPage.selectPickupLater();

        await cartPage.clearCartIfNotEmpty();
        await menuPage.selectIceCreamCategory();
        await menuPage.selectScoopedIceCream();
        await productDetailsPage.validateProductTitle(testData.order.product);
        await productDetailsPage.selectMediumCup();
        await productDetailsPage.clickAddToCart();
        await cartPage.validateCartCount(1);
      });

      await test.step('2. Proceed to Checkout', async () => {
        await cartPage.openCart();
        await cartPage.clickCheckout();
      });

      await test.step('3. Add / adjust a tip amount', async () => {
        await checkoutPage.selectTipOption();
      });

      await test.step('4. Verify order total updates to include the Tip amount in the breakdown', async () => {
        await checkoutPage.validateOrderTotalWithTip();
      });
    }
  );
});
