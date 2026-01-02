# E2E Testing

End-to-end tests use Playwright for browser automation.

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# Run in debug mode
npm run test:e2e:debug
```

## Configuration

E2E tests are configured in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
    { name: 'webkit', use: devices['Desktop Safari'] },
    { name: 'mobile', use: devices['iPhone 13'] },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Test Structure

```
e2e/
├── auth.spec.ts        # Authentication flows
├── navigation.spec.ts  # Navigation and layout
├── agents.spec.ts      # Agent management
└── fixtures/
    └── test-data.ts    # Shared test data
```

## Writing Tests

### Basic Test

```typescript
import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Kaizen Studio/);
});
```

### Authentication Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page displays form', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows validation errors', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/email.*required/i)).toBeVisible();
  });

  test('SSO buttons are visible', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('button', { name: /microsoft/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /okta/i })).toBeVisible();
  });
});
```

### Navigation Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user: { id: '1', email: 'test@example.com' },
          tokens: { access_token: 'mock-token' },
          isAuthenticated: true,
        },
      }));
    });
  });

  test('sidebar navigation works', async ({ page }) => {
    await page.goto('/dashboard');

    // Click Agents link
    await page.getByRole('link', { name: /agents/i }).click();
    await expect(page).toHaveURL('/agents');

    // Click Pipelines link
    await page.getByRole('link', { name: /pipelines/i }).click();
    await expect(page).toHaveURL('/pipelines');
  });

  test('mobile menu opens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    // Open mobile menu
    await page.getByRole('button', { name: /menu/i }).click();

    // Verify navigation is visible
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});
```

## Page Object Model

For complex tests, use page objects:

```typescript
// e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: /sign in/i });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

// Usage in test
test('user can login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('test@example.com', 'password');
  await expect(page).toHaveURL('/dashboard');
});
```

## Visual Testing

```typescript
test('login page matches snapshot', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveScreenshot('login-page.png');
});
```

## API Mocking

```typescript
test('displays agents from API', async ({ page }) => {
  // Mock API response
  await page.route('**/api/v1/agents', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: '1', name: 'Test Agent' },
      ]),
    });
  });

  await page.goto('/agents');
  await expect(page.getByText('Test Agent')).toBeVisible();
});
```

## Debugging

```bash
# Run with debug mode
npm run test:e2e:debug

# Generate trace on failure
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```
