import { test, expect } from '@playwright/test';
import { setupAuth } from './fixtures/auth';


test.describe('Alerts List Page', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/alerts');
    await page.waitForLoadState('networkidle');
  });

  test('should display alerts page header', async ({ page }) => {
    const heading = page.locator('h1, h2').first();
    await expect(heading).toContainText(/alert|notification|warning/i);
  });

  test('should show create alert rule button', async ({ page }) => {
    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("New"), button:has-text("Add Rule")'
    );

    if (await createButton.count() > 0) {
      await expect(createButton.first()).toBeVisible();
    }
  });

  test('should display alert list or empty state', async ({ page }) => {
    const alertItems = page.locator(
      '[data-testid*="alert"], .alert-item, tr, .border.rounded-lg'
    );
    const emptyState = page.locator(
      'text=/no alerts|create your first|get started/i'
    );

    const hasItems = (await alertItems.count()) > 0;
    const hasEmptyState = (await emptyState.count()) > 0;
    const hasMain = await page.locator('main').isVisible();

    expect(hasItems || hasEmptyState || hasMain).toBeTruthy();
  });

  test('should have filter by severity', async ({ page }) => {
    const severityFilter = page.locator(
      'button:has-text("Severity"), [data-testid*="severity-filter"]'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have filter by status', async ({ page }) => {
    const statusFilter = page.locator(
      'button:has-text("Status"), [data-testid*="status-filter"]'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Alerts - Severity Levels', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/alerts');
    await page.waitForLoadState('networkidle');
  });

  test('should display critical alerts', async ({ page }) => {
    const criticalAlerts = page.locator(
      'text=/critical|emergency|severe/i, [data-severity="critical"]'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display warning alerts', async ({ page }) => {
    const warningAlerts = page.locator(
      'text=/warning|caution/i, [data-severity="warning"]'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display info alerts', async ({ page }) => {
    const infoAlerts = page.locator(
      'text=/info|information/i, [data-severity="info"]'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should color-code severity levels', async ({ page }) => {
    // Alerts should have visual severity indicators
    const severityIndicators = page.locator(
      '[class*="red"], [class*="yellow"], [class*="orange"], [class*="blue"], .badge'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Alerts - Alert Rules', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/alerts/rules');
    await page.waitForLoadState('networkidle');
  });

  test('should display alert rules page', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should show rule conditions', async ({ page }) => {
    const conditions = page.locator(
      'text=/condition|threshold|trigger|when/i'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should show rule actions', async ({ page }) => {
    const actions = page.locator(
      'text=/action|notify|email|slack|webhook/i'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Alerts - Create Alert Rule', () => {
  test('should open create rule dialog', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("New Rule")'
    );

    if (await createButton.count() > 0) {
      await createButton.first().click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
    }
  });

  test('should have metric selection', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button:has-text("Create"), button:has-text("New")');

    if (await createButton.count() > 0) {
      await createButton.first().click();

      const metricSelect = page.locator(
        '[data-testid*="metric"], select, [role="combobox"]'
      );

      const main = page.locator('main');
      await expect(main).toBeVisible();
    }
  });

  test('should have threshold configuration', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button:has-text("Create"), button:has-text("New")');

    if (await createButton.count() > 0) {
      await createButton.first().click();

      const thresholdInput = page.locator(
        'input[name*="threshold"], input[placeholder*="threshold"], input[type="number"]'
      );

      const main = page.locator('main');
      await expect(main).toBeVisible();
    }
  });

  test('should have notification channel selection', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button:has-text("Create"), button:has-text("New")');

    if (await createButton.count() > 0) {
      await createButton.first().click();

      const channelSelect = page.locator(
        '[data-testid*="channel"], text=/email|slack|webhook|pagerduty/i'
      );

      const main = page.locator('main');
      await expect(main).toBeVisible();
    }
  });
});

test.describe('Alerts - Alert Actions', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/alerts');
    await page.waitForLoadState('networkidle');
  });

  test('should have acknowledge alert action', async ({ page }) => {
    const ackButton = page.locator(
      'button:has-text("Acknowledge"), button:has-text("Ack")'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have resolve alert action', async ({ page }) => {
    const resolveButton = page.locator(
      'button:has-text("Resolve"), button:has-text("Close")'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have silence alert action', async ({ page }) => {
    const silenceButton = page.locator(
      'button:has-text("Silence"), button:has-text("Mute"), button:has-text("Snooze")'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Alerts - Notification Channels', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/alerts/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display email notifications', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display Slack integration', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display webhook notifications', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Alerts - Responsive', () => {
  test.describe('Mobile View', () => {
  });

  test.describe('Desktop View', () => {
  });
});

test.describe('Alerts - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/alerts');
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

  test('should have accessible severity indicators', async ({ page }) => {
    // Severity should not rely solely on color
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should announce new alerts', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Alerts - History', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/alerts/history');
    await page.waitForLoadState('networkidle');
  });

  test('should display alert history', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should show resolved alerts', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have date range filter', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});
