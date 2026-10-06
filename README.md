# Carvel E2E Automation Testing Framework

An enterprise-grade, robust End-to-End (E2E) automated smoke test suite for the **Carvel Web Ordering Platform** built with **Playwright** and the **Page Object Model (POM)** pattern in JavaScript.

---

## Table of Contents
1. [Framework Overview](#framework-overview)
2. [Architecture & Design Pattern](#architecture--design-pattern)
3. [Directory & File Structure](#directory--file-structure)
4. [Prerequisites & Installation](#prerequisites--installation)
5. [Environment Configuration (`.env`)](#environment-configuration-env)
6. [Detailed Code & Function Breakdown](#detailed-code--function-breakdown)
   - [Setup & Teardown Mechanisms](#setup--teardown-mechanisms)
   - [1. Authentication Module (`LoginPage.js`)](#1-authentication-module-loginpagejs)
   - [2. Store Location & Timing Module (`LocationPage.js`)](#2-store-location--timing-module-locationpagejs)
   - [3. Menu Navigation Module (`MenuPage.js`)](#3-menu-navigation-module-menupagejs)
   - [4. Product Details & Modifiers Module (`ProductDetailsPage.js`)](#4-product-details--modifiers-module-productdetailspagejs)
   - [5. Cart & Price Validation Module (`CartPage.js`)](#5-cart--price-validation-module-cartpagejs)
   - [6. Checkout & Saved Card Payment Module (`CheckoutPage.js`)](#6-checkout--saved-card-payment-module-checkoutpagejs)
7. [End-to-End Test Workflow (`smoke.spec.js`)](#end-to-end-test-workflow-smokespecjs)
8. [Executing Tests & Viewing Reports](#executing-tests--viewing-reports)
9. [Key Technical Solutions & Reliability Enhancements](#key-technical-solutions--reliability-enhancements)

---

## Framework Overview

This automation suite exercises the complete customer ordering journey on Carvel's online ordering platform:
- **Authentication**: Auth0 credentials sign-in with automatic cookie consent handling.
- **Location Fulfillment**: Searches `26 Broadway, New York, NY 10004` and selects `Carvel Qu Sandbox`.
- **Dynamic Order Timing**: Selects **Pickup Later** by default with an intelligent, automatic fallback to **ASAP** if scheduled pickup slots are unavailable or store cutoff has passed.
- **Product Customization**: Browses the `Ice Cream` catalog, selects `Scooped Ice Cream`, applies modifiers (`Medium Cup` size and `Black Raspberry` flavor), and validates item pricing.
- **Cart Review**: Verifies bag count and subtotal pricing.
- **Checkout & Payment**: Enters checkout, interacts directly with custom React radio groups to select the saved Visa card (`Ending in 1111`, `Expires 12/35`), and resolves payment method validation.
- **Order Placement & Confirmation**: Places the order, monitors post-submission URL transitions, validates the final confirmation screen (`Order #`, `Pickup at Shoppe`, `QR Code`), and captures full-page screenshot attachments.

---

## Architecture & Design Pattern

The repository strictly adheres to the **Page Object Model (POM)**:
- **Separation of Concerns**: Test logic (`tests/`), business actions (`pages/`), UI selectors (`locators/`), and runtime configuration (`data/`) are decoupled.
- **Barrel Exports**: Clean single-line imports via index files (`pages/index.js`, `locators/index.js`).
- **Resilient Locators**: Prioritizes Playwright user-facing locators (`getByRole`, `getByText`, `getByTestId`) with resilient fallback selectors.
- **Native Interceptors**: Utilizes Playwright's `addLocatorHandler` to dismiss asynchronous overlays (cookie banners) without test pollution.

---

## Directory & File Structure

```
├── data/
│   └── testData.js             # Centralized runtime configuration & env mapping
├── locators/
│   ├── cartLocators.js         # Locators for cart icon, badge, drawer, and checkout button
│   ├── checkoutLocators.js     # Locators for payment methods, radio groups, and confirmation
│   ├── locationLocators.js     # Locators for location search, store cards, and timing modals
│   ├── loginLocators.js        # Locators for sign-in links and Auth0 login fields
│   ├── menuLocators.js         # Locators for category tabs and menu product items
│   ├── productDetailsLocators.js # Locators for sizes, flavors, and add-to-cart buttons
│   └── index.js                # Central barrel export for all locators
├── pages/
│   ├── BasePage.js             # Common base page with shared navigation & utility functions
│   ├── CartPage.js             # Page actions for cart drawer, count check, and checkout trigger
│   ├── CheckoutPage.js         # Page actions for card selection, place order, and confirmation
│   ├── LocationPage.js         # Page actions for address search, shoppe selection, and pickup timing
│   ├── LoginPage.js            # Page actions for navigation, login, and Auth0 flow
│   ├── MenuPage.js             # Page actions for menu category and item selection
│   ├── ProductDetailsPage.js   # Page actions for size/flavor modifier selection and add-to-cart
│   └── index.js                # Central barrel export for all page classes
├── tests/
│   ├── smoke/
│   │   └── smoke.spec.js           # 2 end-to-end smoke test scenarios (Registered & Guest)
│   ├── functional/
│   │   └── create-account.spec.js  # 2 functional test scenarios
│   └── regression/
│       └── cart-checkout.spec.js   # 2 regression test scenarios
├── .env                        # Local environment variables (credentials, addresses, cards)
├── .env.example                # Template for environment configuration
├── .gitignore                  # Git ignore rules for node_modules and reports
├── package.json                # Project dependencies and test run scripts
├── playwright.config.js        # Playwright runner configuration (timeouts, artifacts, reporters)
└── README.md                   # Complete framework documentation
```

---

## Prerequisites & Installation

### Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Google Chrome / Chromium**: Installed via Playwright

### Installation Steps
1. Open the project root in your terminal:
   ```bash
   cd "Carvel smoke testing"
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Install Playwright browser binaries:
   ```bash
   npx playwright install chromium
   ```

---

## Environment Configuration (`.env`)

Create or update your `.env` file in the project root:

```env
# Application Base URL
BASE_URL=https://order.carvel.com

# User Credentials (Auth0)
USER_EMAIL=chandancs2311@gmail.com
USER_PASSWORD=YourPasswordHere

# Store Location Settings
TEST_ADDRESS=26 Broadway, New York, NY 10004
TEST_ADDRESS_RESULT=26 Broadway, New York, NY 10004, USA

# Payment Details
PAYMENT_CARD_NUMBER=4111111111111111
PAYMENT_EXP_DATE=12/35
PAYMENT_CVV=123
PAYMENT_POSTAL_CODE=10004
```

---

## Detailed Code & Function Breakdown

### Setup & Teardown Mechanisms

Implemented in [`tests/smoke/smoke.spec.js`](file:///c:/Users/chandan.cherukuri/OneDrive%20-%20psiog.com/Desktop/Carvel%20smoke%20%20testing/tests/smoke/smoke.spec.js):

* **`test.beforeEach(async ({ page }) => { ... })`**:
  - `page.on('dialog', (dialog) => dialog.accept())`: Listens for and automatically accepts native browser dialogs (alerts, confirms).
  - `page.addLocatorHandler(cookieBtn, ...)`: Automatically detects and dismisses cookie consent banners (`Continue to Site`, `Accept All`) in the background without needing explicit step calls.
* **`test.afterEach(async ({ page }, testInfo) => { ... })`**:
  - Logs execution completion status.
  - Automatically preserves video recordings (`video.webm`) and execution traces (`trace.zip`).
* **Post-Test Artifact Capture**:
  - `page.screenshot({ path: 'test-results/order_confirmation.png', fullPage: true })`: Captures the full-page confirmation receipt and attaches it directly to the HTML report.

---

### 1. Authentication Module (`LoginPage.js`)

File: [`pages/LoginPage.js`](file:///c:/Users/chandan.cherukuri/OneDrive%20-%20psiog.com/Desktop/Carvel%20smoke%20%20testing/pages/LoginPage.js)

* **`navigate(path = '/')`**:
  - Navigates to the base URL and awaits DOM content loading.
  - Automatically dismisses lingering cookie banners.
* **`login(email, password)`**:
  - Clicks the header "Sign In" / "Account" trigger.
  - If already signed in, skips redundant login.
  - If redirected to Auth0 (`/u/login`), enters the email and password into the Auth0 form and submits.
* **`validateLoginSuccess()`**:
  - Verifies that the Auth0 login flow completes and navigates back to the Carvel domain.
  - Confirms user authentication by validating header greeting or account icon visibility.

---

### 2. Store Location & Timing Module (`LocationPage.js`)

File: [`pages/LocationPage.js`](file:///c:/Users/chandan.cherukuri/OneDrive%20-%20psiog.com/Desktop/Carvel%20smoke%20%20testing/pages/LocationPage.js)

* **`openChangeLocation()`**:
  - Opens the store search modal via the header location button.
  - Automatically dismisses the "Edit Location?" confirmation prompt if items are already in the cart.
* **`searchAddress(address)`**:
  - Fills the address input with `26 Broadway, New York, NY 10004` and triggers the autocomplete dropdown.
* **`selectAddressResult(resultAddress)`**:
  - Selects the matching address item from the suggestion list.
* **`clickOrderNow()`**:
  - Targets the **Carvel Qu Sandbox** shoppe card specifically and clicks `Select Shoppe` / `Order Now`.
* **`confirmLocation()`**:
  - Awaits and clicks the final `CONFIRM` button on the store selection modal.
* **`selectLocation(searchAddress, resultAddress)`**:
  - Orchestrates the entire store search, selection, and confirmation sequence in one call.
* **`validateLocationApplied()`**:
  - Asserts that the location modal closes and dismisses any "Your cart was updated" notices.
* **`selectPickupLater()`**:
  - Navigates to the `/order-info?isEdit=true` scheduling page.
  - **Priority 1 (Pickup Later)**: Clicks `Later`. Verifies that the store is open for later orders and clicks `Apply` -> `Confirm`.
  - **Priority 2 (ASAP Fallback)**: If Later is unavailable, disabled, or outside the store's operating cutoff, automatically switches to `ASAP`, applies, and confirms.
* **`validatePickupLaterSelected()`**:
  - Verifies the store header clock label reflects either scheduled later time or ASAP fallback.

---

### 3. Menu Navigation Module (`MenuPage.js`)

File: [`pages/MenuPage.js`](file:///c:/Users/chandan.cherukuri/OneDrive%20-%20psiog.com/Desktop/Carvel%20smoke%20%20testing/pages/MenuPage.js)

* **`selectIceCreamCategory()`**:
  - Clicks the primary `Ice Cream` category button/link.
  - Awaits network idle and verifies URL transition to the category view.
* **`selectScoopedIceCream()`**:
  - Locates the `Scooped Ice Cream` product card.
  - Scrolls the item into view and clicks it to open the product details modal.

---

### 4. Product Details & Modifiers Module (`ProductDetailsPage.js`)

File: [`pages/ProductDetailsPage.js`](file:///c:/Users/chandan.cherukuri/OneDrive%20-%20psiog.com/Desktop/Carvel%20smoke%20%20testing/pages/ProductDetailsPage.js)

* **`validateProductTitle(expectedTitle = 'Scooped Ice Cream')`**:
  - Asserts that the product customization modal title matches the expected item.
* **`selectMediumCup()`**:
  - Clicks the `Medium Cup` size modifier radio option.
  - Selects the required `Black Raspberry` ice cream flavor option.
* **`validateMediumCupSelected()`**:
  - Asserts that the `Medium Cup` option reflects a selected/checked state.
* **`getDisplayedPrice()`**:
  - Extracts and parses the numeric price (e.g. `$5.79`) displayed on the `Add to Cart` button.
* **`clickAddToCart()`**:
  - Clicks `Add to Cart` and waits for modal dismissal and drawer update.

---

### 5. Cart & Price Validation Module (`CartPage.js`)

File: [`pages/CartPage.js`](file:///c:/Users/chandan.cherukuri/OneDrive%20-%20psiog.com/Desktop/Carvel%20smoke%20%20testing/pages/CartPage.js)

* **`openCart()`**:
  - Clicks the shopping bag icon in the header to open the slide-out cart drawer.
* **`closeCart()`**:
  - Closes the cart drawer using the red close button, `Escape` key, or backdrop click.
* **`validateCartCount(expectedCount = 1)`**:
  - Validates that the cart icon badge reflects at least 1 added item.
* **`getCheckoutPrice()`**:
  - Parses the numeric subtotal price displayed inside the drawer's `Checkout` button.
* **`clickCheckout()`**:
  - Validates that the `Checkout` button is visible.
  - **Automatic Cutoff Recovery**: If the Checkout button is disabled due to an expired scheduled time slot, clicks the `Change` button inside the cart drawer, updates timing to `ASAP`, re-opens the cart, and proceeds to checkout.

---

### 6. Checkout & Saved Card Payment Module (`CheckoutPage.js`)

File: [`pages/CheckoutPage.js`](file:///c:/Users/chandan.cherukuri/OneDrive%20-%20psiog.com/Desktop/Carvel%20smoke%20%20testing/pages/CheckoutPage.js)

* **`selectSavedCard()`**:
  - Targets the saved card radiogroup: `radiogroup "saved_Card"`.
  - Dispatches direct synthetic user clicks on the card text (`Ending in 1111`) and radio input to properly trigger React's `onClick` state handler.
  - Ensures the `"Please select a payment method"` error is dismissed.
* **`validateSavedCardSelected()`**:
  - Asserts that the saved card radio input is checked.
* **`validateSavedCardDetails(expectedLast4 = '1111', expectedExp = '12/35')`**:
  - Asserts that masked digits (`Ending in 1111`) and expiration date (`Expires 12/35`) are visible.
* **`validatePlaceOrderReady()`**:
  - Verifies that the final `Place Order` button is enabled and ready for submission.
* **`clickPlaceOrder()`**:
  - Scrolls the `Place Order` button into view, confirms enabled state, and clicks it.
* **`validateOrderSubmittedSuccessfully()`**:
  - Awaits URL navigation away from `/checkout`.
  - Asserts that the post-order confirmation landmark (`Order #`, `Pickup at Shoppe`, `QR Code`) is visible within a 45-second processing timeout.

---

## End-to-End Test Workflow (`smoke.spec.js`)

File: [`tests/smoke/smoke.spec.js`](file:///c:/Users/chandan.cherukuri/OneDrive%20-%20psiog.com/Desktop/Carvel%20smoke%20%20testing/tests/smoke/smoke.spec.js)

| Stage | Action / Assertion | Page Object Method |
| :--- | :--- | :--- |
| **Stage 1** | Sign In via Auth0 & verify account header | `loginPage.login()`, `validateLoginSuccess()` |
| **Stage 2** | Change Location to `26 Broadway, New York, NY 10004` (`Carvel Qu Sandbox`) | `locationPage.selectLocation()`, `validateLocationApplied()` |
| **Stage 3** | Set Pickup Later (with automatic fallback to ASAP if closed) | `locationPage.selectPickupLater()`, `validatePickupLaterSelected()` |
| **Stage 4** | Browse to `Ice Cream` category | `menuPage.selectIceCreamCategory()` |
| **Stage 5** | Select `Scooped Ice Cream` product | `menuPage.selectScoopedIceCream()`, `productDetailsPage.validateProductTitle()` |
| **Stage 6** | Select Modifiers (`Medium Cup` + `Black Raspberry`) | `productDetailsPage.selectMediumCup()`, `validateMediumCupSelected()` |
| **Stage 7** | Add to Cart & Validate Badge Count | `productDetailsPage.clickAddToCart()`, `cartPage.validateCartCount()` |
| **Stage 8** | Open Cart Drawer & Validate Subtotal Price | `cartPage.openCart()`, `cartPage.getCheckoutPrice()` |
| **Stage 9** | Click Checkout & Select Saved Visa Card (`1111`, `12/35`) | `cartPage.clickCheckout()`, `checkoutPage.selectSavedCard()`, `validateSavedCardSelected()` |
| **Stage 10** | Validate Enabled Place Order Button, Click Submit & Verify Confirmation | `checkoutPage.validatePlaceOrderReady()`, `checkoutPage.clickPlaceOrder()`, `checkoutPage.validateOrderSubmittedSuccessfully()` |

---

## Executing Tests & Viewing Reports

### Run Smoke Test in Headed Mode (Browser Visible)
```powershell
npx playwright test --headed
```

### Run Smoke Test in Headless Mode
```powershell
npx playwright test
```

### View Interactive HTML Report
```powershell
npx playwright show-report
```
The HTML report includes:
- Test step logs with execution timing.
- Video recording of the full browser session.
- Playwright trace file (inspect DOM, network calls, console logs step-by-step).
- The attached **Order Confirmation Page** screenshot.

### View the Saved Confirmation Screenshot Directly
The screenshot is saved on disk at:
```
test-results/order_confirmation.png
```

---

## Key Technical Solutions & Reliability Enhancements

1. **React Synthetic Event Click for Payment Selection**:
   - Calling native `radio.check({ force: true })` on styled React radio groups set the DOM checked attribute without triggering React's synthetic `onClick` state.
   - Refined `selectSavedCard()` to click the container text (`Ending in 1111`) and radio directly, properly updating React state and enabling the `Place Order` button.

2. **Accurate Order Confirmation Detection**:
   - Previously, the confirmation locator matched headings like `"Order Details"` and `"Order Summary"` which already exist on the checkout page, causing premature completion.
   - Tightened `orderConfirmationContainer` to exclusively match post-order elements (`Order #`, `Pickup at Shoppe`, `QR Code`, `Thank you`) and verified that the browser navigates away from `/checkout`.

3. **Intelligent Pickup Later & Cutoff Fallback**:
   - When placing orders outside operating hours or within the 15-minute pickup cutoff, the checkout button becomes disabled.
   - Both `LocationPage.selectPickupLater()` and `CartPage.clickCheckout()` include self-healing logic: if scheduled time is rejected or cutoff has passed, they automatically fall back to `ASAP` to allow the order to proceed smoothly.

4. **Global Overlay Management**:
   - Automated cookie banner dismissal via Playwright's `page.addLocatorHandler`.
   - Automated native dialog acceptance via `page.on('dialog')`.
   - Handled the `"Edit Location?"` confirmation dialog when updating store location with items in the cart.
