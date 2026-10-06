// @ts-check
const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');
const { checkoutLocators } = require('../locators');

/**
 * Page Object for Checkout, Payment selection, and Order submission.
 */
class CheckoutPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.savedCardRadio = checkoutLocators.savedCardRadio(page);
    this.savedCardDigits = checkoutLocators.savedCardDigits(page);
    this.savedCardExpiry = checkoutLocators.savedCardExpiry(page);
    this.placeOrderButton = checkoutLocators.placeOrderButton(page);
  }

  /**
   * Selects the Saved Credit Card payment radio option.
   */
  async selectSavedCard() {
    const savedCardGroup = this.page.getByRole('radiogroup', { name: 'saved_Card' }).first();
    const radio = savedCardGroup.getByRole('radio').first();
    const textEl = savedCardGroup.getByText(/ending in \d{4}/i).first();

    await expect(savedCardGroup).toBeVisible({ timeout: 25000 });

    // 1. Click the text or row to trigger React's synthetic onClick handler
    await textEl.click({ force: true }).catch(async () => {
      await savedCardGroup.click({ force: true });
    });
    await this.page.waitForTimeout(500);

    // 2. Click the radio button element directly
    await radio.click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(500);

    // 3. If still not checked, click the radiogroup container again
    const isChecked = await radio.isChecked().catch(() => false);
    if (!isChecked) {
      await savedCardGroup.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Validates that the Saved Card radio button is checked.
   */
  async validateSavedCardSelected() {
    const savedCardGroup = this.page.getByRole('radiogroup', { name: 'saved_Card' }).first();
    const radio = savedCardGroup.getByRole('radio').first();
    if (!await radio.isChecked().catch(() => false)) {
      await savedCardGroup.getByText(/ending in \d{4}/i).first().click({ force: true }).catch(() => {});
      await radio.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(500);
    }
    await expect(radio).toBeChecked({ timeout: 10000 });
  }

  /**
   * Validates the masked card details displayed on the checkout page.
   * @param {string} [expectedLast4='1111']
   * @param {string} [expectedExp='12/35']
   */
  async validateSavedCardDetails(expectedLast4 = '1111', expectedExp = '12/35') {
    const digits = this.savedCardDigits.first();
    await expect(digits).toBeVisible({ timeout: 10000 });
    await expect(digits).toContainText(expectedLast4);

    const expiry = this.savedCardExpiry.first();
    await expect(expiry).toBeVisible({ timeout: 10000 });
    await expect(expiry).toContainText(expectedExp);
  }

  /**
   * 10.1 Precondition validation:
   * Validates that the Place Order button is available and enabled before clicking.
   */
  async validatePlaceOrderReady() {
    const btn = this.placeOrderButton.first();
    await expect(btn).toBeVisible({ timeout: 15000 });

    // Ensure contact fields are not empty for guest checkout
    const fn = checkoutLocators.firstNameInput(this.page).first();
    if (await fn.isVisible({ timeout: 1000 }).catch(() => false)) {
      const val = await fn.inputValue().catch(() => '');
      if (!val) {
        await this.fillContactInfo({});
      }
    }

    // If disabled, click the payment option to ensure selection is active and dismiss "Please select a payment method"
    if (await btn.isDisabled().catch(() => false)) {
      const newCardRadio = this.page.getByRole('radiogroup', { name: 'creditcard' }).getByRole('radio').first();
      const isNewCardActive = await newCardRadio.isChecked().catch(() => false);

      if (!isNewCardActive) {
        const savedCardGroup = this.page.getByRole('radiogroup', { name: 'saved_Card' }).first();
        await savedCardGroup.getByText(/ending in \d{4}/i).first().click({ force: true }).catch(() => {});
        await savedCardGroup.getByRole('radio').first().click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(1000);
      }
    }

    await expect(btn).toBeEnabled({ timeout: 15000 });
  }

  /**
   * Action: Clicks the final "Place Order" button.
   */
  async clickPlaceOrder() {
    const btn = this.placeOrderButton.first();
    await btn.scrollIntoViewIfNeeded().catch(() => {});
    await expect(btn).toBeEnabled({ timeout: 10000 });
    await btn.click();
  }

  /**
   * 10.2 Post-order success validation:
   * Validates that the order was actually submitted successfully and confirmation page is displayed.
   */
  async validateOrderSubmittedSuccessfully() {
    // 1. Wait for navigation away from checkout
    await this.page.waitForURL(
      (url) => !url.href.toLowerCase().includes('/checkout'),
      { timeout: 45000 }
    ).catch(() => {});

    // 2. Validate that the post-order confirmation UI / success message is visible
    const confirmation = checkoutLocators.orderConfirmationContainer(this.page).first();
    await expect(confirmation).toBeVisible({ timeout: 45000 });

    // 3. Give confirmation details a moment to settle
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(2000);
  }

  /**
   * Helper to parse monetary amounts from locator text.
   * @param {import('@playwright/test').Locator} locator
   * @returns {Promise<number>}
   */
  async getAmountFromLocator(locator) {
    if (await locator.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      const text = await locator.first().innerText().catch(() => '');
      const match = text.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
      if (match) return parseFloat(match[1]);
      const anyNum = text.match(/(\d+(?:\.\d{1,2})?)/);
      if (anyNum) return parseFloat(anyNum[1]);
    }
    return 0;
  }

  /**
   * Selects or adjusts tip amount on the Checkout page.
   */
  async selectTipOption() {
    const tipSection = checkoutLocators.tipSection(this.page).first();
    await tipSection.scrollIntoViewIfNeeded().catch(() => {});
    await expect(tipSection).toBeVisible({ timeout: 20000 });

    // Look for preset tip button (e.g. 20% or 15% or 10%)
    const tip20 = this.page.getByRole('button', { name: '20%' }).first();
    const tip15 = this.page.getByRole('button', { name: '15%' }).first();
    const tip10 = this.page.getByRole('button', { name: '10%' }).first();

    if (await tip20.isVisible({ timeout: 4000 }).catch(() => false)) {
      await tip20.click({ force: true });
    } else if (await tip15.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tip15.click({ force: true });
    } else if (await tip10.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tip10.click({ force: true });
    }

    await this.page.waitForTimeout(1000);
  }

  /**
   * Validates that the order total updates to include the Tip amount in the price breakdown.
   */
  async validateOrderTotalWithTip() {
    // 1. Verify Tip line item appears in the order breakdown with amount > 0
    let tipAmount = 0;
    await expect(async () => {
      const tipRow = checkoutLocators.tipBreakdownRow(this.page).first();
      await expect(tipRow).toBeVisible({ timeout: 5000 });
      tipAmount = await this.getAmountFromLocator(tipRow);
      expect(tipAmount).toBeGreaterThan(0);
    }).toPass({ timeout: 15000 });

    // 2. Read final Order Total
    const totalEl = checkoutLocators.orderTotal(this.page).first();
    await expect(totalEl).toBeVisible({ timeout: 10000 });
    const finalTotal = await this.getAmountFromLocator(totalEl);
    expect(finalTotal).toBeGreaterThan(tipAmount);
  }

  /**
   * Selects the New Credit / Debit Card payment option.
   */
  async selectNewCardPayment() {
    const cardRadio = this.page.getByTestId('btn_creditcard').first();

    await expect(cardRadio).toBeVisible({ timeout: 25000 });
    await cardRadio.scrollIntoViewIfNeeded().catch(() => {});

    // Click creditcard radio option (switching away from Google Pay)
    await cardRadio.click({ force: true });
    await this.page.waitForTimeout(1000);

    // Ensure the radio is checked
    if (!(await cardRadio.isChecked().catch(() => false))) {
      await cardRadio.check({ force: true }).catch(() => {});
      await this.page.waitForTimeout(1000);
    }

    // Wait for FreedomPay / payment fields to mount
    await this.page.waitForTimeout(2000);
  }

  /**
   * Enters credit card details into the checkout payment form.
   * @param {Object} cardDetails
   * @param {string} cardDetails.cardNumber
   * @param {string} [cardDetails.expirationDate]
   * @param {string} [cardDetails.securityCode]
   * @param {string} [cardDetails.postalCode]
   */
  async fillCardDetails({ cardNumber, expirationDate, securityCode, postalCode }) {
    await this.page.waitForTimeout(1000);

    const cleanCard = (cardNumber || '').replace(/\s+/g, '');

    // Diagnostic logging to inspect actual Checkout DOM and payment frames
    console.log('=== CHECKOUT PAYMENT DIAGNOSTICS ===');
    console.log('Frames:', this.page.frames().map((f) => f.url()));
    const pageInputs = await this.page
      .locator('input')
      .evaluateAll((els) =>
        els.map((e) => ({
          name: e.getAttribute('name'),
          id: e.getAttribute('id'),
          placeholder: e.getAttribute('placeholder'),
          type: e.getAttribute('type'),
          testid: e.getAttribute('data-testid'),
        }))
      )
      .catch(() => []);
    console.log('Page Inputs:', JSON.stringify(pageInputs, null, 2));

    for (const f of this.page.frames()) {
      const fInputs = await f
        .locator('input')
        .evaluateAll((els) =>
          els.map((e) => ({
            name: e.getAttribute('name'),
            id: e.getAttribute('id'),
            placeholder: e.getAttribute('placeholder'),
            type: e.getAttribute('type'),
          }))
        )
        .catch(() => []);
      if (fInputs.length > 0) {
        console.log(`Inputs in frame [${f.url()}]:`, JSON.stringify(fInputs, null, 2));
      }
    }
    console.log('====================================');

    /**
     * Helper to find an input either on the main page or inside payment iframes (e.g. FreedomPay / Stripe)
     * @param {import('@playwright/test').Locator} mainLocator
     * @param {string} iframeInputSelector
     * @returns {Promise<import('@playwright/test').Locator>}
     */
    const resolveInput = async (mainLocator, iframeInputSelector) => {
      const startTime = Date.now();
      while (Date.now() - startTime < 15000) {
        if (await mainLocator.first().isVisible().catch(() => false)) {
          return mainLocator.first();
        }
        for (const frame of this.page.frames()) {
          const inputInFrame = frame.locator(iframeInputSelector).first();
          if (await inputInFrame.isVisible().catch(() => false)) {
            return inputInFrame;
          }
        }
        await this.page.waitForTimeout(500);
      }
      return mainLocator.first();
    };

    // 1. Fill Card Number
    const cardNum = await resolveInput(
      checkoutLocators.cardNumberInput(this.page),
      'input[name*="card" i], input[placeholder*="card" i], input[id*="card" i], input[type="tel"]'
    );
    await expect(cardNum).toBeVisible({ timeout: 20000 });
    await cardNum.scrollIntoViewIfNeeded().catch(() => {});
    await cardNum.click();
    await cardNum.fill(cleanCard);

    // 2. Fill Expiration Date
    if (expirationDate) {
      const exp = await resolveInput(
        checkoutLocators.cardExpiryInput(this.page),
        'input[name*="exp" i], input[placeholder*="MM" i], input[id*="exp" i]'
      );
      if (await exp.isVisible({ timeout: 5000 }).catch(() => false)) {
        await exp.click();
        await exp.fill(expirationDate).catch(async () => {
          await exp.fill(expirationDate.replace(/[^0-9]/g, ''));
        });
      }
    }

    // 3. Fill Security Code / CVV
    if (securityCode) {
      const cvv = await resolveInput(
        checkoutLocators.cardCvvInput(this.page),
        'input[name*="cv" i], input[placeholder*="CV" i], input[id*="cv" i]'
      );
      if (await cvv.isVisible({ timeout: 5000 }).catch(() => false)) {
        await cvv.click();
        await cvv.fill(String(securityCode).trim());
      }
    }

    // 4. Fill Postal / ZIP code
    if (postalCode) {
      const zip = await resolveInput(
        checkoutLocators.cardPostalInput(this.page),
        'input[name*="zip" i], input[name*="postal" i], input[placeholder*="zip" i]'
      );
      if (await zip.isVisible({ timeout: 5000 }).catch(() => false)) {
        await zip.click();
        await zip.fill(String(postalCode).trim());
      }
    }

    // 5. Click FreedomPay "SAVE" button to submit/tokenize card details
    await this.page.waitForTimeout(500);
    let saveClicked = false;
    for (const frame of this.page.frames()) {
      const btnInFrame = frame
        .getByRole('button', { name: /^save$/i })
        .or(frame.locator('button:has-text("SAVE"), input[value="SAVE"], [data-testid*="save"]'))
        .first();
      if (await btnInFrame.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btnInFrame.scrollIntoViewIfNeeded().catch(() => {});
        await btnInFrame.click({ force: true });
        saveClicked = true;
        break;
      }
    }
    if (!saveClicked) {
      const mainSaveBtn = this.page
        .getByRole('button', { name: /^save$/i })
        .or(this.page.locator('button:has-text("SAVE"), [data-testid*="save"]'))
        .first();
      if (await mainSaveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await mainSaveBtn.scrollIntoViewIfNeeded().catch(() => {});
        await mainSaveBtn.click({ force: true });
      }
    }

    // Wait for FreedomPay tokenization to process and Place Order button to become active
    await this.page.waitForTimeout(2000);
  }

  /**
   * Fills contact info fields for Guest User checkout if they are present and empty.
   * @param {Object} contact
   * @param {string} [contact.firstName='Test']
   * @param {string} [contact.lastName='User']
   * @param {string} [contact.email]
   * @param {string} [contact.phone]
   */
  async fillContactInfo({ firstName = 'Chandan', lastName = 'CS', email = 'chandancs2311@gmail.com', phone = '4152625265' }) {
    const fn = checkoutLocators.firstNameInput(this.page).first();
    await expect(fn).toBeVisible({ timeout: 15000 });
    await fn.scrollIntoViewIfNeeded().catch(() => {});
    await fn.click();
    await fn.fill('');
    await fn.pressSequentially(firstName, { delay: 20 });
    await fn.press('Tab');

    const ln = checkoutLocators.lastNameInput(this.page).first();
    await expect(ln).toBeVisible({ timeout: 5000 });
    await ln.click();
    await ln.fill('');
    await ln.pressSequentially(lastName, { delay: 20 });
    await ln.press('Tab');

    const em = checkoutLocators.contactEmailInput(this.page).first();
    await expect(em).toBeVisible({ timeout: 5000 });
    await em.click();
    await em.fill('');
    await em.pressSequentially(email, { delay: 20 });
    await em.press('Tab');

    const ph = checkoutLocators.contactPhoneInput(this.page).first();
    await expect(ph).toBeVisible({ timeout: 5000 });
    await ph.click();
    await ph.fill('');
    const cleanPhone = phone.replace(/\D/g, '');
    await ph.pressSequentially(cleanPhone, { delay: 20 });
    await ph.press('Tab');

    console.log('Contact info values:', {
      fn: await fn.inputValue().catch(() => ''),
      ln: await ln.inputValue().catch(() => ''),
      em: await em.inputValue().catch(() => ''),
      ph: await ph.inputValue().catch(() => ''),
    });

    await this.page.waitForTimeout(500);
  }
}

module.exports = CheckoutPage;
