// @ts-check
const { test, expect } = require('@playwright/test');
const {
  LoginPage,
  LocationPage,
  MenuPage,
  ProductDetailsPage,
  CartPage,
  CheckoutPage,
} = require('../pages');
const testData = require('../data/testData');

test.describe('Carvel Smoke End-to-End Test', () => {
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

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'passed') {
      console.log('✓ Smoke E2E Test completed successfully with Order Confirmation.');
    }
  });

  test('Smoke E2E Flow: Sign In, Location, Product, Modifiers, Cart, Checkout, and Place Order', async ({
    page,
  }) => {
    test.setTimeout(240000);

    const loginPage = new LoginPage(page);
    const locationPage = new LocationPage(page);
    const menuPage = new MenuPage(page);
    const productDetailsPage = new ProductDetailsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    // =========================================================================
    // Stage 1: Sign In
    // =========================================================================
    await loginPage.navigate('/');
    await loginPage.login(testData.user.email, testData.user.password);
    await loginPage.validateLoginSuccess();

    // =========================================================================
    // Stage 2: Change Location
    // =========================================================================
    await locationPage.selectLocation(
      testData.location.searchAddress,
      testData.location.selectedAddressResult
    );
    await locationPage.validateLocationApplied();

    // =========================================================================
    // Stage 3: Pickup Later
    // =========================================================================
    await locationPage.selectPickupLater();
    await locationPage.validatePickupLaterSelected();

    // =========================================================================
    // Stage 4: Open Menu
    // =========================================================================
    await menuPage.selectIceCreamCategory();

    // =========================================================================
    // Stage 5: Select Scooped Ice Cream Product
    // =========================================================================
    await menuPage.selectScoopedIceCream();
    await productDetailsPage.validateProductTitle(testData.order.product);

    // =========================================================================
    // Stage 6: Select Modifier (Medium Cup)
    // =========================================================================
    await productDetailsPage.selectMediumCup();
    await productDetailsPage.validateMediumCupSelected();

    // =========================================================================
    // Stage 7: Add to Cart
    // =========================================================================
    const itemPrice = await productDetailsPage.getDisplayedPrice();
    expect(itemPrice).toBeGreaterThan(0);
    await productDetailsPage.clickAddToCart();
    await cartPage.validateCartCount(testData.order.expectedItemCount);

    // =========================================================================
    // Stage 8: Open Cart & Price Validation
    // =========================================================================
    await cartPage.openCart();
    const checkoutPrice = await cartPage.getCheckoutPrice();
    expect(checkoutPrice).toBeGreaterThanOrEqual(itemPrice);

    // =========================================================================
    // Stage 9: Checkout & Saved Card Payment
    // =========================================================================
    await cartPage.clickCheckout();
    await checkoutPage.selectSavedCard();
    await checkoutPage.validateSavedCardSelected();
    await checkoutPage.validateSavedCardDetails(
      testData.payment.savedCard.expectedLast4,
      testData.payment.savedCard.expectedExp
    );

    // =========================================================================
    // Stage 10: Place Order
    // =========================================================================
    // 10.1 Before clicking Place Order: Validate Place Order button is available and enabled
    await checkoutPage.validatePlaceOrderReady();

    // Action: Click Place Order
    await checkoutPage.clickPlaceOrder();

    // 10.2 After clicking Place Order: Validate actual post-order submission success state
    await checkoutPage.validateOrderSubmittedSuccessfully();

    // Attach order confirmation screenshot to Playwright HTML report and save locally
    const confirmationScreenshot = await page.screenshot({ path: 'test-results/order_confirmation.png', fullPage: true });
    await test.info().attach('Order Confirmation Page', {
      body: confirmationScreenshot,
      contentType: 'image/png',
    });
  });
});
