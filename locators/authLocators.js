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

  // Sign Up / Join Now / Create Account triggers
  signUpLink: (page) =>
    page.getByRole('button', { name: /join now|sign up|create account/i })
      .or(page.getByRole('link', { name: /join now|sign up|create account/i }))
      .or(page.locator('a[href*="signup"], a[href*="register"], button[id*="signup"]')),

  // Auth0 Sign Up tab or switch link inside universal login
  auth0SignUpTab: (page) =>
    page.getByRole('link', { name: /^sign up$/i })
      .or(page.locator('a:has-text("Sign up")'))
      .or(page.getByRole('tab', { name: /sign up/i })),

  // Primary Continue / Submit button on Create Account form
  continueButton: (page) =>
    page.getByRole('button', { name: /continue|sign up|create account/i })
      .or(page.locator('button[type="submit"]:not([aria-hidden="true"])')),

  // Error message for already registered email
  alreadyRegisteredError: (page) =>
    page.getByText(/this email is already registered|user already exists|email already in use/i)
      .or(page.locator('.ulp-input-error-message, .error-message, [role="alert"], #error-element-email')),

  // Error message or indicator for invalid email format (e.g., emojis)
  invalidEmailError: (page) =>
    page.getByText(/please enter valid email address|please enter a valid email address|valid email/i)
      .or(page.locator('.ulp-input-error-message, .error-message, [role="alert"], [aria-invalid="true"]')),
};

module.exports = authLocators;

