/**
 * Authentication / Login Page Locators
 * Based on verified DOM from Carvel UAT.
 */
const authLocators = {
  // Initial Sign In header link / button (specified by role button and name 'SIGN IN')
  signInLink: (page) =>
    page.getByRole('button', { name: 'SIGN IN' }).first(),

  // Email / Username input field
  usernameInput: (page) =>
    page.locator('input[name="username"]').or(page.getByRole('textbox', { name: 'Email', exact: true })).or(page.locator('#username')),

  // Password input field
  passwordInput: (page) =>
    page.locator('input[name="password"]').or(page.getByRole('textbox', { name: 'Password', exact: true })).or(page.locator('#password')),

  // Show/Hide password toggle switch button
  showPasswordToggle: (page) =>
    page.getByRole('switch', { name: 'Show password' }),

  // Primary Sign In submit button (visible button named 'Sign In')
  submitButton: (page) =>
    page.locator('button[type="submit"]:not([aria-hidden="true"])').or(page.getByRole('button', { name: 'Sign In', exact: true })),
};

module.exports = authLocators;

