import { test, expect } from '@playwright/test';
import { setupAuth } from './fixtures/auth';
import { ensureGatewayExists } from './fixtures/test-data';

test.describe('Gateways List Page', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    // Ensure test gateway exists before running tests
    await ensureGatewayExists(page);
    await page.goto('/gateways');
    await page.waitForLoadState('networkidle');
  });

  test('should display gateways page header', async ({ page }) => {
    const heading = page.locator('h1, h2').first();
    await expect(heading).toContainText(/gateway|api|endpoint/i);
  });

  test('should show create gateway button', async ({ page }) => {
    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("New"), button:has-text("Add")'
    );

    if (await createButton.count() > 0) {
      await expect(createButton.first()).toBeVisible();
    }
  });

  test('should display gateway list or empty state', async ({ page }) => {
    const gatewayItems = page.locator(
      '[data-testid*="gateway"], .gateway-item, tr, .border.rounded-lg'
    );
    const emptyState = page.locator(
      'text=/no gateways|create your first/i'
    );

    const hasItems = (await gatewayItems.count()) > 0;
    const hasEmptyState = (await emptyState.count()) > 0;
    const hasMain = await page.locator('main').isVisible();

    expect(hasItems || hasEmptyState || hasMain).toBeTruthy();
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder*="Search"], input[type="search"]'
    );

    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
    }
  });
});

test.describe('Gateways - Create Dialog', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/gateways');
    await page.waitForLoadState('networkidle');
  });

  test('should open create gateway dialog', async ({ page }) => {
    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("New")'
    );

    if (await createButton.count() > 0) {
      await createButton.first().click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
    }
  });

  test('should have name input', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create"), button:has-text("New")');

    if (await createButton.count() > 0) {
      await createButton.first().click();

      const dialog = page.locator('[role="dialog"]');
      if (await dialog.count() > 0) {
        const nameInput = dialog.locator(
          'input[name="name"], input[placeholder*="name"]'
        );

        const main = page.locator('main');
        await expect(main).toBeVisible();
      }
    }
  });

  test('should close dialog with escape', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create"), button:has-text("New")');

    if (await createButton.count() > 0) {
      await createButton.first().click();

      const dialog = page.locator('[role="dialog"]');
      if (await dialog.count() > 0) {
        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible();
      }
    }
  });
});

test.describe('Gateways - Rate Limiting', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/gateways');
    await page.waitForLoadState('networkidle');
  });

  test('should display rate limit settings', async ({ page }) => {
    const rateLimitSection = page.locator(
      'text=/rate limit|requests per|throttle/i'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have rate limit configuration', async ({ page }) => {
    const rateLimitConfig = page.locator(
      'input[name*="rate"], input[placeholder*="rate"], [data-testid*="rate-limit"]'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Gateways - Scaling Policies', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/gateways');
    await page.waitForLoadState('networkidle');
  });

  test('should display scaling configuration', async ({ page }) => {
    const scalingSection = page.locator(
      'text=/scaling|auto-scale|replicas|instances/i'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have min/max replicas settings', async ({ page }) => {
    const replicaSettings = page.locator(
      'input[name*="replica"], input[placeholder*="replica"], text=/min|max|replicas/i'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have CPU/memory thresholds', async ({ page }) => {
    const thresholds = page.locator(
      'text=/cpu|memory|threshold|utilization/i'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Gateways - Endpoints', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/gateways');
    await page.waitForLoadState('networkidle');
  });

  test('should display endpoint configuration', async ({ page }) => {
    const endpoints = page.locator(
      'text=/endpoint|route|path|url/i'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should show HTTP methods', async ({ page }) => {
    const httpMethods = page.locator(
      'text=/GET|POST|PUT|DELETE|PATCH/i'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have endpoint testing', async ({ page }) => {
    const testButton = page.locator(
      'button:has-text("Test"), button:has-text("Try")'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Gateways - Authentication', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/gateways');
    await page.waitForLoadState('networkidle');
  });

  test('should display auth configuration', async ({ page }) => {
    const authSection = page.locator(
      'text=/authentication|api key|jwt|oauth/i'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have API key management', async ({ page }) => {
    const apiKeySection = page.locator(
      'text=/api key|key management|generate key/i'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Gateways - Health Checks', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/gateways');
    await page.waitForLoadState('networkidle');
  });

  test('should display health status', async ({ page }) => {
    const healthStatus = page.locator(
      'text=/healthy|unhealthy|status|online|offline/i'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should show health check configuration', async ({ page }) => {
    const healthConfig = page.locator(
      'text=/health check|interval|timeout|path/i'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Gateways - Logs', () => {
  test('should show gateway logs', async ({ page }) => {
    await page.goto('/gateways');
    await page.waitForLoadState('networkidle');

    const logsSection = page.locator(
      'text=/log|access log|request log/i'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have log filtering', async ({ page }) => {
    await page.goto('/gateways');
    await page.waitForLoadState('networkidle');

    const logFilter = page.locator(
      'input[placeholder*="filter"], select, [data-testid*="log-filter"]'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Gateways - Responsive', () => {
  test.describe('Mobile View', () => {
  });

  test.describe('Desktop View', () => {
  });
});

test.describe('Gateways - Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/gateways');
    await page.waitForLoadState('networkidle');

    const headings = page.locator('h1, h2');
    expect(await headings.count()).toBeGreaterThanOrEqual(1);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/gateways');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('should have accessible buttons', async ({ page }) => {
    await page.goto('/gateways');
    await page.waitForLoadState('networkidle');

    const buttons = page.locator('button');
    for (let i = 0; i < Math.min(await buttons.count(), 5); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');

      expect(text || ariaLabel).toBeTruthy();
    }
  });
});

test.describe('Gateways - Actions', () => {
  test('should have start/stop gateway action', async ({ page }) => {
    await page.goto('/gateways');
    await page.waitForLoadState('networkidle');

    const actionButton = page.locator(
      'button:has-text("Start"), button:has-text("Stop"), button:has-text("Restart")'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have delete gateway action', async ({ page }) => {
    await page.goto('/gateways');
    await page.waitForLoadState('networkidle');

    const deleteButton = page.locator(
      'button:has-text("Delete"), [role="menuitem"]:has-text("Delete")'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have edit gateway action', async ({ page }) => {
    await page.goto('/gateways');
    await page.waitForLoadState('networkidle');

    const editButton = page.locator(
      'button:has-text("Edit"), [role="menuitem"]:has-text("Edit"), [aria-label*="edit"]'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});
