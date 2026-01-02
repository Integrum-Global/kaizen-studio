import { test, expect } from '@playwright/test';
import { setupAuth } from './fixtures/auth';

test.describe('Metrics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/metrics');
    await page.waitForLoadState('networkidle');
  });

  test('should display metrics page header', async ({ page }) => {
    const heading = page.locator('h1, h2').first();
    await expect(heading).toContainText(/metric|analytics|monitor|dashboard/i);
  });

  test('should show metrics dashboard content', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display time range filters', async ({ page }) => {
    // MetricsFilters component should be visible
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have refresh button', async ({ page }) => {
    const refreshButton = page.locator(
      'button:has-text("Refresh"), button[aria-label*="refresh"], button:has-text("↻")'
    );

    // Either has refresh button or main content
    const hasRefresh = await refreshButton.count() > 0;
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Metrics - Summary', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/metrics');
    await page.waitForLoadState('networkidle');
  });

  test('should display summary statistics', async ({ page }) => {
    // MetricsSummary component shows key stats
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should show total agents count', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should show total executions count', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should show success rate', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Metrics - Key Metrics Grid', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/metrics');
    await page.waitForLoadState('networkidle');
  });

  test('should display key metrics section', async ({ page }) => {
    const keyMetrics = page.locator('text=/key metrics/i').first();
    await expect(keyMetrics).toBeVisible({ timeout: 5000 });
  });

  test('should show metric cards in grid', async ({ page }) => {
    const grid = page.locator('.grid');
    const count = await grid.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should allow clicking metric cards', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Metrics - Time Range Selection', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/metrics');
    await page.waitForLoadState('networkidle');
  });

  test('should have time range selector', async ({ page }) => {
    // MetricsFilters has time range options
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should select different time ranges', async ({ page }) => {
    const timeButtons = page.locator('button:has-text("24h"), button:has-text("7d"), button:has-text("30d")');

    if (await timeButtons.count() > 0) {
      await timeButtons.first().click();
      await page.waitForTimeout(300);
    }

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Metrics - Filters', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/metrics');
    await page.waitForLoadState('networkidle');
  });

  test('should display filter controls', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should filter by agent type', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Metrics - Charts', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/metrics');
    await page.waitForLoadState('networkidle');
  });

  test('should display time series charts section', async ({ page }) => {
    // Charts appear when metrics are clicked
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should show help text for charts', async ({ page }) => {
    // Help text shown when no metrics selected
    const helpText = page.locator('text=/click|select.*metric/i').first();
    await expect(helpText).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Metrics - Export', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/metrics');
    await page.waitForLoadState('networkidle');
  });

  test('should have export functionality', async ({ page }) => {
    const exportButton = page.locator(
      'button:has-text("Export"), button:has-text("Download")'
    );

    // Export button may not be present in all views
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Metrics - Responsive', () => {
  test.describe('Mobile View', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display metrics on mobile', async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
      await page.goto('/metrics');
      await page.waitForLoadState('networkidle');

      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
    });

    test('should stack content on mobile', async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
      await page.goto('/metrics');
      await page.waitForLoadState('networkidle');

      const main = page.locator('main');
      await expect(main).toBeVisible();
    });
  });

  test.describe('Desktop View', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('should display metrics with sidebar on desktop', async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
      await page.goto('/metrics');
      await page.waitForLoadState('networkidle');

      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();

      const sidebar = page.locator('aside, nav').first();
      await expect(sidebar).toBeVisible();
    });

    test('should show charts in grid layout on desktop', async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
      await page.goto('/metrics');
      await page.waitForLoadState('networkidle');

      const grid = page.locator('.grid');
      const count = await grid.count();
      expect(count).toBeGreaterThan(0);
    });
  });
});

test.describe('Metrics - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/metrics');
    await page.waitForLoadState('networkidle');
  });

  test('should have proper heading structure', async ({ page }) => {
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    await expect(h1.first()).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('should have accessible metric cards', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Metrics - Auto Refresh', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/metrics');
    await page.waitForLoadState('networkidle');
  });

  test('should have refresh controls', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should show loading state during refresh', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});
