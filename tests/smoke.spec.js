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
  // Run tests sequentially to avoid cart session and network collisions
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

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'passed') {
      await test.step('Verification: Smoke E2E Test completed successfully with Order Confirmation.', async () => {});
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
 
    
    // Stage 1: Sign In
    
    await test.step('Stage 1: Sign In', async () => {
      await loginPage.navigate('/');
      await loginPage.login(testData.user.email, testData.user.password);
      await loginPage.validateLoginSuccess();
    });

    
    // Stage 2: Change Location
    
    await test.step('Stage 2: Change Location', async () => {
      await locationPage.selectLocation(
        testData.location.searchAddress,
        testData.location.selectedAddressResult
      );
      await locationPage.validateLocationApplied();
    });

    
    // Stage 3: Pickup Later
  
    await test.step('Stage 3: Pickup Later', async () => {
      await locationPage.selectPickupLater();
      await locationPage.validatePickupLaterSelected();
    });

  
    // Stage 4: Open Menu

    await test.step('Stage 4: Open Menu', async () => {
      await menuPage.selectIceCreamCategory();
    });

    
    // Stage 5: Select Scooped Ice Cream Product
    
    await test.step('Stage 5: Select Scooped Ice Cream Product', async () => {
      await menuPage.selectScoopedIceCream();
      await productDetailsPage.validateProductTitle(testData.order.product);
    });

  
    // Stage 6: Select Modifier (Medium Cup)
    
    await test.step('Stage 6: Select Modifier (Medium Cup)', async () => {
      await productDetailsPage.selectMediumCup();
      await productDetailsPage.validateMediumCupSelected();
    });

    
    // Stage 7: Add to Cart
    
    let itemPrice = 0;
    await test.step('Stage 7: Add to Cart', async () => {
      itemPrice = await productDetailsPage.getDisplayedPrice();
      expect(itemPrice).toBeGreaterThan(0);
      await productDetailsPage.clickAddToCart();
      await cartPage.validateCartCount(testData.order.expectedItemCount);
    });

    
    // Stage 8: Open Cart & Price Validation
    
    await test.step('Stage 8: Open Cart & Price Validation', async () => {
      await cartPage.openCart();
      const checkoutPrice = await cartPage.getCheckoutPrice();
      expect(checkoutPrice).toBeGreaterThanOrEqual(itemPrice);
    });

    
    // Stage 9: Checkout & Saved Card Payment
    
    await test.step('Stage 9: Checkout & Saved Card Payment', async () => {
      await cartPage.clickCheckout();
      await checkoutPage.selectSavedCard();
      await checkoutPage.validateSavedCardSelected();
      await checkoutPage.validateSavedCardDetails(
        testData.payment.savedCard.expectedLast4,
        testData.payment.savedCard.expectedExp
      );
    });

    
    // Stage 10: Place Order
    
    await test.step('Stage 10: Place Order & Confirm', async () => {
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

  test('Smoke E2E Flow: Guest User - Location, Product, Modifiers, Cart, Checkout, and Place Order', async ({
    page,
  }) => {
    test.setTimeout(240000);

    const locationPage = new LocationPage(page);
    const menuPage = new MenuPage(page);
    const productDetailsPage = new ProductDetailsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    // Stage 1: Navigate to Home Page as Guest
    await test.step('Stage 1: Open Carvel App as Guest User', async () => {
      await menuPage.navigate('/');
      await menuPage.dismissCookieBanner();
    });

    // Stage 2: Select Location
    await test.step('Stage 2: Change Location', async () => {
      await locationPage.selectLocation(
        testData.location.searchAddress,
        testData.location.selectedAddressResult
      );
      await locationPage.validateLocationApplied();
    });

    // Stage 3: Pickup Later
    await test.step('Stage 3: Pickup Later', async () => {
      await locationPage.selectPickupLater();
      await locationPage.validatePickupLaterSelected();
    });

    // Stage 4: Open Menu
    await test.step('Stage 4: Open Menu', async () => {
      await menuPage.selectIceCreamCategory();
    });

    // Stage 5: Select Scooped Ice Cream Product
    await test.step('Stage 5: Select Scooped Ice Cream Product', async () => {
      await menuPage.selectScoopedIceCream();
      await productDetailsPage.validateProductTitle(testData.order.product);
    });

    // Stage 6: Select Modifier (Medium Cup)
    await test.step('Stage 6: Select Modifier (Medium Cup)', async () => {
      await productDetailsPage.selectMediumCup();
      await productDetailsPage.validateMediumCupSelected();
    });

    // Stage 7: Add to Cart
    let itemPrice = 0;
    await test.step('Stage 7: Add to Cart', async () => {
      itemPrice = await productDetailsPage.getDisplayedPrice();
      expect(itemPrice).toBeGreaterThan(0);
      await productDetailsPage.clickAddToCart();
      await cartPage.validateCartCount(testData.order.expectedItemCount);
    });

    // Stage 8: Open Cart & Price Validation
    await test.step('Stage 8: Open Cart & Price Validation', async () => {
      await cartPage.openCart();
      const checkoutPrice = await cartPage.getCheckoutPrice();
      expect(checkoutPrice).toBeGreaterThanOrEqual(itemPrice);
    });

    // Stage 9: Guest Checkout, Contact Info & Payment Details
    await test.step('Stage 9: Guest Checkout, Contact Info & Payment Details', async () => {
      await cartPage.clickCheckout();

      // Fill required contact details for guest order
      await checkoutPage.fillContactInfo({
        firstName: 'Chandan',
        lastName: 'CS',
        email: testData.user.email || 'chandancs2311@gmail.com',
        phone: '(415) 262-5265',
      });

      // Select Credit / Debit Card payment & fill card details
      await checkoutPage.selectNewCardPayment();
      await checkoutPage.fillCardDetails({
        cardNumber: testData.payment.cardNumber,
        expirationDate: testData.payment.expirationDate,
        securityCode: testData.payment.securityCode,
        postalCode: testData.payment.postalCode,
      });
    });

    // Stage 10: Place Order & Confirm
    await test.step('Stage 10: Place Order & Confirm', async () => {
      // 10.1 Before clicking Place Order: Validate Place Order button is available and enabled
      await checkoutPage.validatePlaceOrderReady();

      // Action: Click Place Order
      await checkoutPage.clickPlaceOrder();

      // 10.2 After clicking Place Order: Validate actual post-order submission success state
      await checkoutPage.validateOrderSubmittedSuccessfully();

      // Attach order confirmation screenshot to Playwright HTML report and save locally
      const confirmationScreenshot = await page.screenshot({
        path: 'test-results/order_confirmation_guest.png',
        fullPage: true,
      });
      await test.info().attach('Order Confirmation Page (Guest User)', {
        body: confirmationScreenshot,
        contentType: 'image/png',
      });
    });
  });
});
