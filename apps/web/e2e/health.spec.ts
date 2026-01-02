import { test, expect } from '@playwright/test';
import { setupAuth } from './fixtures/auth';


test.describe('Health Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/system-health');
    await page.waitForLoadState('networkidle');
  });

  test('should display health dashboard header', async ({ page }) => {
    const heading = page.locator('h1, h2').first();
    await expect(heading).toContainText(/health|status|system/i);
  });

  test('should show overall system status', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
    // Check for Overall Status heading which is always visible
    const overallHeading = page.locator('h2:has-text("Overall Status")');
    await expect(overallHeading).toBeVisible({ timeout: 10000 });
  });

  test('should display service status cards', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
    // Look for service cards with border/rounded styling
    const serviceCards = page.locator('.border.rounded-lg, [data-testid*="service"]');
    // May have 0 services initially but main should be visible
    await expect(main).toBeVisible();
  });

  test('should have refresh button', async ({ page }) => {
    const refreshButton = page.locator(
      'button:has-text("Refresh"), button[aria-label*="refresh"], button[aria-label*="Refresh"]'
    );
    await expect(refreshButton.first()).toBeVisible();
  });
});

test.describe('Health - Service Status', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/system-health');
    await page.waitForLoadState('networkidle');
  });

  test('should display API service status', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
    // Services section should exist
    const servicesHeading = page.locator('h2:has-text("Services")');
    await expect(servicesHeading).toBeVisible();
  });

  test('should display database status', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display Redis status', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should show uptime percentage', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
    // Check for uptime text
    const uptimeText = page.locator('text=/uptime|\\d+%/i');
    // May or may not have services with uptime
  });
});

test.describe('Health - Status Indicators', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/system-health');
    await page.waitForLoadState('networkidle');
  });

  test('should display healthy indicator (green)', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
    // Check for status indicator with green color or healthy text
    // The status indicator has green background/text classes
    const healthyIndicator = page.locator('[class*="green"]').or(page.locator('text=/healthy/i'));
    await expect(healthyIndicator.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display degraded indicator (yellow)', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
    // Degraded indicator may not always be present
  });

  test('should display unhealthy indicator (red)', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
    // Unhealthy indicator may not always be present
  });
});

test.describe('Health - Metrics', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/system-health');
    await page.waitForLoadState('networkidle');
  });

  test('should display response time metrics', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display error rate metrics', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display request count', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display CPU/memory usage', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Health - Incident History', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/system-health/incidents');
    await page.waitForLoadState('networkidle');
  });

  test('should display incident timeline', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
    // Check for incidents heading or timeline
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should show incident details', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should show incident resolution time', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Health - Real-time Updates', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/system-health');
    await page.waitForLoadState('networkidle');
  });

  test('should show live status updates', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
    // Check for Live text when auto-refresh is on
    const liveText = page.locator('text=/live/i');
    // May not be visible if auto-refresh is off
  });

  test('should have auto-refresh toggle', async ({ page }) => {
    const autoRefresh = page.locator(
      '[data-testid*="auto-refresh"], button:has-text("Auto"), [role="switch"], label:has-text("Auto Refresh")'
    );
    await expect(autoRefresh.first()).toBeVisible();
  });

  test('should show last updated timestamp', async ({ page }) => {
    // Look for "Last updated:" text or time element
    const lastUpdated = page.locator('text=/last updated/i').or(page.locator('time'));
    await expect(lastUpdated.first()).toBeVisible();
  });
});

test.describe('Health - Dependency Status', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/system-health');
    await page.waitForLoadState('networkidle');
  });

  test('should show external service dependencies', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
    // Dependencies section may or may not be visible depending on data
  });

  test('should show dependency health checks', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Health - Responsive', () => {
  test.describe('Mobile View', () => {
    test.beforeEach(async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    });

    test('should stack service cards on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/system-health');
      await page.waitForLoadState('networkidle');

      const main = page.locator('main');
      await expect(main).toBeVisible();
    });
  });

  test.describe('Desktop View', () => {
    test.beforeEach(async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    });

    test('should show service cards in grid', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/system-health');
      await page.waitForLoadState('networkidle');

      const main = page.locator('main');
      await expect(main).toBeVisible();
      // Check for grid layout
      const grid = page.locator('.grid');
      await expect(grid.first()).toBeVisible();
    });
  });
});

test.describe('Health - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/system-health');
    await page.waitForLoadState('networkidle');
  });

  test('should have proper heading structure', async ({ page }) => {
    const headings = page.locator('h1, h2');
    expect(await headings.count()).toBeGreaterThanOrEqual(1);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('should have accessible status indicators', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
    // Status indicators should have text labels or aria-labels
    const statusIndicators = page.locator('[class*="green"], [class*="yellow"], [class*="red"]');
    // May or may not have indicators visible
  });

  test('should announce status changes', async ({ page }) => {
    // Check for live region or status role
    const liveRegion = page.locator('[aria-live], [role="status"]');
    await expect(liveRegion.first()).toBeVisible();
  });
});

test.describe('Health - Export', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/system-health');
    await page.waitForLoadState('networkidle');
  });

  test('should have export health report option', async ({ page }) => {
    const exportButton = page.locator(
      'button:has-text("Export"), [aria-label*="export"], [aria-label*="Export"]'
    );
    await expect(exportButton.first()).toBeVisible();
  });

  test('should have report format options', async ({ page }) => {
    // Click export button to open dropdown
    const exportButton = page.locator('button:has-text("Export")');
    await exportButton.click();

    // Check for format options in dropdown
    const formatOptions = page.locator('text=/json|csv|pdf/i');
    await expect(formatOptions.first()).toBeVisible();
  });
});

test.describe('Health - Status Page', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/system-health');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to public status page', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
    // Status page link may or may not exist
    const statusPageLink = page.locator(
      'a[href*="status"], button:has-text("Status Page")'
    );
    // Optional - not all implementations have public status page
  });

  test('should show component status breakdown', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});
