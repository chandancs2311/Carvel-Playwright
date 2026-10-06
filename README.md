# Carvel E2E Automation Testing Framework

An enterprise-grade, robust End-to-End (E2E) automated test suite for the **Carvel Web Ordering Platform** built with **Playwright** and the **Page Object Model (POM)** architectural pattern in JavaScript.

---

## Table of Contents
1. [Framework Overview](#framework-overview)
2. [Architecture & Design Principles](#architecture--design-principles)
3. [Directory & File Structure](#directory--file-structure)
4. [Prerequisites & Installation](#prerequisites--installation)
5. [Environment Configuration & Security](#environment-configuration--security)
6. [Test Suites Breakdown](#test-suites-breakdown)
7. [Executing Tests & Viewing Reports](#executing-tests--viewing-reports)
8. [Page Object Model (POM) Modules](#page-object-model-pom-modules)
9. [Key Technical Solutions & Reliability Enhancements](#key-technical-solutions--reliability-enhancements)

---

## Framework Overview

This test automation framework delivers automated coverage across customer ordering flows on Carvel's web platform:
- **Authentication**: Auth0 credentials sign-in with automatic overlay/consent handling.
- **Location Fulfillment**: Dynamic address lookup and shoppe fulfillment selection.
- **Dynamic Order Timing**: Automated pickup scheduling with intelligent fallback handling.
- **Catalog & Product Customization**: Menu navigation, product selection, modifier configuration (size/flavor), and price validation.
- **Cart Management**: Cart drawer interaction, item count assertion, and pricing breakdown.
- **Checkout & Payment**: Saved card payment method selection, form resolution, and guest checkout support.
- **Order Placement & Confirmation**: Post-order submission assertions, receipt validation, and artifact capture.

---

## Architecture & Design Principles

The framework follows best practices for scalable, maintainable test automation:
- **Page Object Model (POM)**: Complete decoupling of test specifications (`tests/`), business workflows (`pages/`), UI selectors (`locators/`), and test data (`data/`).
- **Information Hiding & Abstraction**: Zero sensitive data (credentials, card numbers, personal emails, PII) in code or documentation. All environment-specific variables are abstracted behind `.env` and `.gitignore`.
- **Barrel Exports**: Clean, organized single-point module imports via index files (`pages/index.js`, `locators/index.js`).
- **Resilient Locators**: Prioritizes user-facing accessibility locators (`getByRole`, `getByText`, `getByLabel`, `getByTestId`) with resilient fallback selectors.
- **Automatic Interception**: Uses Playwright native handlers (`addLocatorHandler`, `page.on('dialog')`) to dismiss asynchronous overlays (cookie banners, alerts) without test disruption.
- **Multi-Format Reporting**: Generates interactive HTML reports, video recordings, trace files, full-page screenshots, and custom structured Excel test execution reports.

---

## Directory & File Structure

```text
├── data/
│   └── testData.js             # Centralized runtime configuration & env mapping
├── locators/
│   ├── cartLocators.js         # Locators for cart icon, drawer, and checkout triggers
│   ├── checkoutLocators.js     # Locators for payment methods, radios, and order confirmation
│   ├── locationLocators.js     # Locators for address search, shoppe cards, and timing modals
│   ├── loginLocators.js        # Locators for sign-in triggers and Auth0 authentication forms
│   ├── menuLocators.js         # Locators for catalog categories and product cards
│   ├── productDetailsLocators.js # Locators for size, flavor modifiers, and add-to-cart buttons
│   ├── signUpLocators.js       # Locators for registration forms and validation messages
│   └── index.js                # Central barrel export for all locators
├── pages/
│   ├── BasePage.js             # Common base page with navigation and shared actions
│   ├── CartPage.js             # Page actions for cart drawer and checkout initiation
│   ├── CheckoutPage.js         # Page actions for payment method, place order, and confirmation
│   ├── LocationPage.js         # Page actions for address search, shoppe selection, and pickup timing
│   ├── LoginPage.js            # Page actions for Auth0 authentication flows
│   ├── MenuPage.js             # Page actions for category and product selection
│   ├── ProductDetailsPage.js   # Page actions for modifier selection and add-to-cart
│   ├── SignUpPage.js           # Page actions for account creation and validation
│   └── index.js                # Central barrel export for all page classes
├── tests/
│   ├── smoke/
│   │   └── smoke.spec.js       # 2 E2E Smoke scenarios (Registered & Guest flows)
│   ├── functional/
│   │   └── create-account.spec.js # 2 Functional scenarios (Account validation rules)
│   └── regression/
│       └── cart-checkout.spec.js  # 2 Regression scenarios (Fee breakdown & Tip calculation)
├── utils/
│   └── excelReporter.js        # Custom Playwright Excel report generator
├── .env.example                # Sanitized template for environment configuration
├── .gitignore                  # Exclusion rules for local env, node_modules, and test results
├── package.json                # Project scripts and dependencies
├── playwright.config.js        # Runner configuration (timeouts, retries, reporters)
└── README.md                   # Project documentation
```

---

## Prerequisites & Installation

### Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Chromium / Chrome**: Managed via Playwright

### Setup
1. Clone the repository and enter the directory:
   ```bash
   git clone https://github.com/chandancs2311/Carvel-Playwright.git
   cd Carvel-Playwright
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Install Playwright browser binaries:
   ```bash
   npx playwright install chromium
   ```

---

## Environment Configuration & Security

> [!IMPORTANT]
> **Security Best Practice**: Never commit actual credentials, payment details, or personal emails to version control. The `.env` file is excluded via `.gitignore`.

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Populate `.env` with your test environment values:

```env
# Application Base URL
BASE_URL=https://order.carvel.com

# Test User Credentials (Auth0)
USER_EMAIL=your_test_account@example.com
USER_PASSWORD=your_test_password

# Test Store Location Settings
TEST_ADDRESS="Your Test Address, City, State ZIP"
TEST_ADDRESS_RESULT="Expected Store Address Match"

# Test Payment Details
PAYMENT_CARD_NUMBER=4111XXXXXXXX1111
PAYMENT_EXP_DATE=MM/YY
PAYMENT_CVV=XXX
PAYMENT_POSTAL_CODE=00000
```

---

## Test Suites Breakdown

| Suite | Directory | Test Cases | Description |
| :--- | :--- | :---: | :--- |
| **Smoke** | `tests/smoke/` | 2 | End-to-end purchasing flows: (1) Registered User E2E with Auth0 login and saved payment, (2) Guest User E2E checkout. |
| **Functional** | `tests/functional/` | 2 | Form field validations: (1) Duplicate email rejection on signup, (2) Emoji character validation on email input. |
| **Regression** | `tests/regression/` | 2 | Cart & Checkout logic: (1) Fee breakdown accuracy (Subtotal, Taxes, Fees), (2) Dynamic Tip calculation before payment. |

---

## Executing Tests & Viewing Reports

### Run All Tests
```bash
npm test
```
To run all tests in headed mode:
```bash
npm run test:headed
```

### Run by Suite
```bash
# Smoke Suite
npm run test:smoke
npm run test:smoke:headed

# Functional Suite
npm run test:functional
npm run test:functional:headed

# Regression Suite
npm run test:regression
npm run test:regression:headed
```

### View Reports
1. **Interactive HTML Report**:
   ```bash
   npm run report
   ```
   Provides step-by-step logs, screenshots, trace inspection, and video replays.

2. **Custom Excel Report**:
   After each test run, a summary Excel spreadsheet is automatically generated at:
   ```text
   test-results/SmokeTestReport.xlsx
   ```

---

## Page Object Model (POM) Modules

- **`LoginPage`**: Manages sign-in actions, Auth0 login forms, and authentication state validation.
- **`LocationPage`**: Handles address search, suggestion autocomplete, store selection, and pickup timing (with automatic ASAP fallback).
- **`MenuPage`**: Manages catalog categories and product tile selection.
- **`ProductDetailsPage`**: Manages modifier selections (sizes, flavors) and validates customized item addition to the cart.
- **`CartPage`**: Validates drawer contents, badge count, pricing summary, and checkout navigation.
- **`CheckoutPage`**: Handles saved payment card selection, guest checkout details, order submission, and confirmation receipt validation.
- **`SignUpPage`**: Drives user registration workflows and asserts validation error feedback.

---

## Key Technical Solutions & Reliability Enhancements

1. **Information Hiding & Abstraction**:
   - Environment variables are centralized in `data/testData.js` and loaded dynamically via `process.env`.
   - No sensitive data or environment secrets are exposed in code repositories or documentation.

2. **React Synthetic Event Handling for Payment Methods**:
   - Radio buttons with custom React event handlers require direct synthetic interactions to properly trigger state updates and enable submission controls.

3. **Intelligent Pickup Time & Cutoff Fallback**:
   - If scheduled pickup times are disabled or outside operational hours, both `LocationPage` and `CartPage` feature automatic recovery mechanisms that switch to `ASAP`.

4. **Global Dialog & Overlay Handling**:
   - Automated cookie consent banner dismissal via Playwright's `page.addLocatorHandler`.
   - Native browser dialogs (confirmations/alerts) are automatically listened for and accepted.
   - Handled store location change prompts when items already exist in the bag.
