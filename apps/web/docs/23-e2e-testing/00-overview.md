# E2E Testing with Playwright

End-to-end tests validate critical user flows across the application using Playwright.

## Test Location

```
e2e/
├── accessibility.spec.ts # WCAG 2.1 AA compliance tests
├── agents.spec.ts        # Agent management workflows
├── alerts.spec.ts        # Alert rules and notifications
├── auth.spec.ts          # Authentication flows
├── billing.spec.ts       # Billing and subscription management
├── connectors.spec.ts    # Connector management
├── dashboard.spec.ts     # Dashboard functionality
├── deployments.spec.ts   # Deployment management
├── execution.spec.ts     # Execution monitoring
├── gateways.spec.ts      # Gateway/API management
├── governance.spec.ts    # RBAC/ABAC policy management
├── health.spec.ts        # System health monitoring
├── metrics.spec.ts       # Metrics dashboard
├── navigation.spec.ts    # Navigation and routing
├── pipelines.spec.ts     # Pipeline editor
├── settings.spec.ts      # User settings
├── teams.spec.ts         # Team management
└── webhooks.spec.ts      # Webhook configuration
```

## Running Tests

```bash
# Install browsers (first time)
npx playwright install

# Run all tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run with UI mode
npx playwright test --ui

# Run headed (see browser)
npx playwright test --headed

# Run specific project (browser)
npx playwright test --project=chromium
```

## Configuration

`playwright.config.ts`:
- Base URL: `http://localhost:5173`
- Browsers: Chromium, Firefox, WebKit
- Mobile: Pixel 5, iPhone 12
- Reports: HTML, JSON, List

## Test Structure

### Authentication Tests

```typescript
test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/login/i);
  });

  test('should validate form fields', async ({ page }) => {
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });
});
```

### Authenticated Tests

```typescript
// Mock authentication via localStorage
test.use({
  storageState: {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:5173',
        localStorage: [
          {
            name: 'kaizen-auth-storage',
            value: JSON.stringify({
              state: {
                user: { id: 'test', email: 'test@example.com' },
                isAuthenticated: true,
              },
            }),
          },
        ],
      },
    ],
  },
});

test('should access protected route', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('main')).toBeVisible();
});
```

### Responsive Tests

```typescript
test.describe('Mobile View', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile layout', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Desktop View', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('should display desktop layout', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('aside')).toBeVisible();
  });
});
```

## Test Categories

### Functional Tests
- Form submissions
- Navigation flows
- CRUD operations
- State management

### Visual Tests
- Page layout
- Responsive design
- Component rendering

### Accessibility Tests
- Keyboard navigation
- ARIA landmarks
- Focus management
- Screen reader support

### Performance Tests
- Page load time
- Navigation speed
- Memory leaks

## Debugging

```bash
# Generate trace on failure
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip

# Debug mode (pause on first line)
npx playwright test --debug

# Screenshot on failure (automatic)
# Configured in playwright.config.ts
```

## CI Integration

Tests run automatically in CI:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E Tests
  run: npm run test:e2e
```

## Best Practices

1. **Use data-testid for selectors**
   ```typescript
   page.locator('[data-testid="submit-button"]')
   ```

2. **Wait for network idle**
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

3. **Use proper assertions**
   ```typescript
   await expect(element).toBeVisible();
   await expect(page).toHaveURL(/expected-path/);
   ```

4. **Handle conditional elements**
   ```typescript
   if (await element.count() > 0) {
     await expect(element).toBeVisible();
   }
   ```

5. **Test mobile and desktop**
   ```typescript
   test.describe('Mobile', () => {
     test.use({ viewport: { width: 375, height: 667 } });
   });
   ```
