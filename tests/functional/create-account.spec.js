// @ts-check
const { test, expect } = require('@playwright/test');
const { SignUpPage } = require('../../pages');
const testData = require('../../data/testData');

test.describe('Fudgie Fanatics - Create Account Functional Tests', { tag: '@functional' }, () => {
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
    'TC_001: Verify user cannot create an account using an email address that is already registered',
    async ({ page }) => {
      test.setTimeout(90000);
      const signUpPage = new SignUpPage(page);

      await test.step('1. Open Carvel App & Navigate to Create Account page', async () => {
        await signUpPage.openSignUp();
      });

      await test.step('2. Enter an email address that is already registered', async () => {
        // Uses the registered account email from testData
        const existingEmail = testData.user.email || 'chandancs2311@gmail.com';
        await signUpPage.fillEmail(existingEmail);
      });
    
      await test.step('3. Enter password', async () => {
        const password = testData.user.password || 'CarvelTest@123';
        await signUpPage.fillPassword(password);
      });

      await test.step('4. Click Continue', async () => {
        await signUpPage.clickContinue();
      });

      await test.step('5. Verify error message "This email is already registered" and duplicate signup blocked', async () => {
        await signUpPage.validateAlreadyRegisteredError();
      });
    }
  );

  test(
    'TC_002: Verify system rejects an email address containing an emoji character and only accepts standard text characters',
    async ({ page }) => {
      test.setTimeout(90000);
      const signUpPage = new SignUpPage(page);

      await test.step('1. Open Carvel App & Navigate to Create Account page', async () => {
        await signUpPage.openSignUp();
      });
    
      await test.step('2. Enter an email address containing an emoji character', async () => {
        const emojiEmail = '🍦xsajhs@gmail.com';
        await signUpPage.fillEmail(emojiEmail);
      });

      await test.step('3. Enter password', async () => {
        await signUpPage.fillPassword('CarvelTest@123');
      });

      await test.step('4. Attempt to proceed / move focus out of the field', async () => {
        await signUpPage.validateInvalidEmailRejected();
      });
    }
  );
});
