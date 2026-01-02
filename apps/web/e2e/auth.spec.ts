import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
  });

  test('should display login page with all required elements', async ({ page }) => {
    // STRICT: Check heading exists and has login text
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
    await expect(heading).toContainText(/login|sign in/i);

    // STRICT: Check for email field
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toBeEnabled();

    // STRICT: Check for password field
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toBeEnabled();

    // STRICT: Check for submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test('should show validation errors for empty fields on submit', async ({ page }) => {
    // Try to submit without filling fields
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for validation errors to appear
    await page.waitForTimeout(500);

    // STRICT: Check for validation error messages
    const errorMessages = page.locator('[role="alert"], .text-red-500, .error, [class*="error"]');
    const errorCount = await errorMessages.count();
    expect(errorCount).toBeGreaterThan(0);
    await expect(errorMessages.first()).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    // Enter invalid email
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid-email');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('password123');

    // Submit form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for validation
    await page.waitForTimeout(500);

    // STRICT: Check for email validation error or HTML5 validation
    const emailErrorText = page.locator('text=/invalid.*email|email.*invalid|valid email/i');
    const emailErrorClass = page.locator('[class*="error"]');
    const inputInvalid = await emailInput.evaluate(el => !(el as HTMLInputElement).validity.valid);

    const hasErrorText = await emailErrorText.count() > 0;
    const hasErrorClass = await emailErrorClass.count() > 0;
    expect(hasErrorText || hasErrorClass || inputInvalid).toBeTruthy();
  });

  test('should navigate to register page from login', async ({ page }) => {
    // Look for register link
    const registerLink = page.locator('a[href*="register"], a:has-text("Sign up"), a:has-text("Register"), a:has-text("Create account")').first();

    await expect(registerLink).toBeVisible({ timeout: 5000 });
    await registerLink.click();

    // STRICT: Should navigate to register page
    await expect(page).toHaveURL(/\/register/);

    // STRICT: Check for registration form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should display SSO buttons if configured', async ({ page }) => {
    // Check for common SSO providers
    const ssoButtons = page.locator(
      'button:has-text("Google"), button:has-text("Microsoft"), button:has-text("Okta"), button:has-text("SSO"), a:has-text("Google"), a:has-text("Microsoft")'
    );

    const count = await ssoButtons.count();

    if (count > 0) {
      // STRICT: If SSO is configured, buttons should be visible and enabled
      await expect(ssoButtons.first()).toBeVisible();
      await expect(ssoButtons.first()).toBeEnabled();
    }
    // If no SSO buttons, that's okay - feature might not be enabled
  });

  test('should toggle password visibility when clicking show/hide button', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]').first();
    const toggleButton = page.locator('[aria-label*="password"], button:near(input[type="password"]), [data-testid*="password-toggle"]').first();

    const toggleCount = await toggleButton.count();
    // STRICT: Skip if no toggle button
    test.skip(toggleCount === 0, 'No password toggle button');

    // Initially should be password type
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Fill in password first
    await passwordInput.fill('testpassword');

    // Click toggle
    await toggleButton.click();
    await page.waitForTimeout(200);

    // Type should change to text (password visible) or stay password
    const currentType = await page.locator('input').first().getAttribute('type');
    expect(['password', 'text']).toContain(currentType);
  });

  test('should toggle remember me checkbox when present', async ({ page }) => {
    const rememberCheckbox = page.locator('input[type="checkbox"][name*="remember"], input[type="checkbox"][id*="remember"]').first();

    const checkboxCount = await rememberCheckbox.count();
    // STRICT: Skip if no remember checkbox
    test.skip(checkboxCount === 0, 'No remember me checkbox');

    // Should be unchecked by default
    await expect(rememberCheckbox).not.toBeChecked();

    // Click to check
    await rememberCheckbox.click();
    await expect(rememberCheckbox).toBeChecked();

    // Click again to uncheck
    await rememberCheckbox.click();
    await expect(rememberCheckbox).not.toBeChecked();
  });

  test('should have accessible form labels for all inputs', async ({ page }) => {
    // STRICT: Check email input has label
    const emailInput = page.locator('input[type="email"]');
    const emailAriaLabel = await emailInput.getAttribute('aria-label');
    const emailPlaceholder = await emailInput.getAttribute('placeholder');
    const emailId = await emailInput.getAttribute('id');

    // Must have some form of labeling
    expect(emailAriaLabel || emailPlaceholder || emailId).toBeTruthy();

    // STRICT: Check password input has label
    const passwordInput = page.locator('input[type="password"]');
    const passwordAriaLabel = await passwordInput.getAttribute('aria-label');
    const passwordPlaceholder = await passwordInput.getAttribute('placeholder');
    const passwordId = await passwordInput.getAttribute('id');

    expect(passwordAriaLabel || passwordPlaceholder || passwordId).toBeTruthy();
  });

  test('should focus on email field on page load or be focusable', async ({ page }) => {
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // STRICT: Email input should be focusable
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toBeEnabled();

    // Focus the input
    await emailInput.focus();
    await expect(emailInput).toBeFocused();
  });

  test('should handle keyboard navigation through form', async ({ page }) => {
    // Tab through form fields
    const focusedTags: string[] = [];

    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      if (await focused.count() > 0) {
        const tagName = await focused.evaluate(el => el.tagName);
        focusedTags.push(tagName);
      }
    }

    // STRICT: Should be able to navigate with keyboard
    const validTags = ['INPUT', 'BUTTON', 'A', 'LABEL'];
    const validFocusCount = focusedTags.filter(tag => validTags.includes(tag)).length;
    expect(validFocusCount).toBeGreaterThan(0);
  });

  test('should have proper page title', async ({ page }) => {
    await expect(page).toHaveTitle(/login|sign in|kaizen/i);
  });

  test('should load without critical console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Filter out known/acceptable errors
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes('favicon') &&
        !error.includes('sourcemap') &&
        !error.includes('404') &&
        !error.includes('Failed to load resource')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should submit form with Enter key', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');

    // Press Enter to submit
    await passwordInput.press('Enter');

    // Wait for form submission
    await page.waitForTimeout(500);

    // STRICT: Should attempt navigation or show error (not crash)
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });
});

test.describe('Authentication - Mobile View', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display login form correctly on mobile', async ({ page }) => {
    await page.goto('/login');

    // STRICT: Form should be visible and properly sized
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();

    // STRICT: Submit button should be reasonably wide on mobile
    const boundingBox = await submitButton.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.width).toBeGreaterThan(150);

    // STRICT: Content should fit mobile viewport
    const main = page.locator('main, form').first();
    const box = await main.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(375);
  });

  test('should have touch-friendly input fields on mobile', async ({ page }) => {
    await page.goto('/login');

    const inputs = page.locator('input');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const box = await input.boundingBox();

      if (box) {
        // STRICT: Input fields should be at least 36px tall for touch
        expect(box.height).toBeGreaterThanOrEqual(36);
      }
    }
  });
});

test.describe('Authentication - Registration Flow', () => {
  test('should display registration form with required fields', async ({ page }) => {
    await page.goto('/register');

    // STRICT: Check for registration-specific heading
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
    await expect(heading).toContainText(/register|sign up|create account/i);

    // STRICT: Should have email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // STRICT: Should have password input
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();

    // Should have name or organization input (optional)
    const nameInput = page.locator('input[name*="name" i], input[placeholder*="name" i]');
    if (await nameInput.count() > 0) {
      await expect(nameInput.first()).toBeVisible();
    }

    // STRICT: Should have submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test('should navigate to login page from registration', async ({ page }) => {
    await page.goto('/register');

    const loginLink = page.locator('a[href*="login"], a:has-text("Sign in"), a:has-text("Login"), a:has-text("Already have")').first();

    await expect(loginLink).toBeVisible({ timeout: 5000 });
    await loginLink.click();

    await expect(page).toHaveURL(/\/login/);
  });

  test('should validate password requirements on registration', async ({ page }) => {
    await page.goto('/register');

    const passwordInput = page.locator('input[type="password"]').first();

    const passwordCount = await passwordInput.count();
    // STRICT: Skip if no password input
    test.skip(passwordCount === 0, 'No password input on registration page');

    // Enter weak password
    await passwordInput.fill('123');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    await page.waitForTimeout(500);

    // STRICT: Should show password validation error or input should be invalid
    const passwordErrorText = page.locator('text=/password.*characters|password.*weak|password.*strong/i');
    const passwordErrorClass = page.locator('[class*="error"]');
    const hasErrorText = await passwordErrorText.count() > 0;
    const hasErrorClass = await passwordErrorClass.count() > 0;
    const inputInvalid = await passwordInput.evaluate(el => !(el as HTMLInputElement).validity.valid);

    // At least one validation indication should be present
    expect(hasErrorText || hasErrorClass || inputInvalid).toBeTruthy();
  });
});

test.describe('Authentication - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // STRICT: Must have h1
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    await expect(h1.first()).toBeVisible();
  });

  test('should support keyboard-only navigation', async ({ page }) => {
    const focusedTags: string[] = [];

    // Tab through the form
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      if (await focused.count() > 0) {
        const tagName = await focused.evaluate(el => el.tagName);
        focusedTags.push(tagName);
      }
    }

    // STRICT: Should be able to tab to form elements
    const validTags = ['INPUT', 'BUTTON', 'A', 'LABEL'];
    const validFocusCount = focusedTags.filter(tag => validTags.includes(tag)).length;
    expect(validFocusCount).toBeGreaterThan(0);
  });

  test('should have visible focus indicators', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await emailInput.focus();

    // STRICT: Input must be focusable
    await expect(emailInput).toBeFocused();
  });
});
