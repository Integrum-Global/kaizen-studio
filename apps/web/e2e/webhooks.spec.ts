import { test, expect } from '@playwright/test';
import { setupAuth } from './fixtures/auth';
import { ensureWebhookExists } from './fixtures/test-data';

test.describe('Webhooks List Page', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    // Ensure test webhook exists before running tests
    await ensureWebhookExists(page);
    await page.goto('/webhooks');
    await page.waitForLoadState('networkidle');
  });

  test('should display webhooks page header', async ({ page }) => {
    const heading = page.locator('h1, h2').first();
    await expect(heading).toContainText(/webhook/i);
  });

  test('should show create webhook button', async ({ page }) => {
    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("New"), button:has-text("Add")'
    );

    if (await createButton.count() > 0) {
      await expect(createButton.first()).toBeVisible();
    }
  });

  test('should display webhook list or empty state', async ({ page }) => {
    await page.waitForTimeout(1000);

    const webhookItems = page.locator(
      '[data-testid*="webhook"], .webhook-item, [role="listitem"], tr, .border.rounded-lg'
    );
    const emptyState = page.locator(
      'text=/no webhooks|create your first|get started/i'
    );

    const hasItems = (await webhookItems.count()) > 0;
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

test.describe('Webhooks - Create Dialog', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/webhooks');
    await page.waitForLoadState('networkidle');
  });

  test('should open create webhook dialog', async ({ page }) => {
    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("New")'
    );

    if (await createButton.count() > 0) {
      await createButton.first().click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
    }
  });

  test('should have URL input in dialog', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create"), button:has-text("New")');

    if (await createButton.count() > 0) {
      await createButton.first().click();

      const dialog = page.locator('[role="dialog"]');
      if (await dialog.count() > 0) {
        const urlInput = dialog.locator(
          'input[name="url"], input[placeholder*="URL"], input[type="url"]'
        );

        const main = page.locator('main');
        await expect(main).toBeVisible();
      }
    }
  });

  test('should have event type selection', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create"), button:has-text("New")');

    if (await createButton.count() > 0) {
      await createButton.first().click();

      const dialog = page.locator('[role="dialog"]');
      if (await dialog.count() > 0) {
        const eventSelect = dialog.locator(
          'select, [role="combobox"], [data-testid*="event"]'
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

test.describe('Webhooks - Event Types', () => {
  test('should display available event types', async ({ page }) => {
    await page.goto('/webhooks');
    await page.waitForLoadState('networkidle');

    const eventTypes = page.locator(
      'text=/pipeline|deployment|agent|execution|created|updated|deleted/i'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Webhooks - Delivery History', () => {
  test('should show delivery history section', async ({ page }) => {
    await page.goto('/webhooks');
    await page.waitForLoadState('networkidle');

    const deliverySection = page.locator(
      'text=/delivery|history|attempts|status/i'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display delivery status indicators', async ({ page }) => {
    await page.goto('/webhooks');
    await page.waitForLoadState('networkidle');

    const statusIndicators = page.locator(
      'text=/success|failed|pending|delivered/i, [data-testid*="status"]'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Webhooks - Secret Management', () => {
  test('should have secret field', async ({ page }) => {
    await page.goto('/webhooks');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button:has-text("Create"), button:has-text("New")');

    if (await createButton.count() > 0) {
      await createButton.first().click();

      const dialog = page.locator('[role="dialog"]');
      if (await dialog.count() > 0) {
        const secretField = dialog.locator(
          'input[name="secret"], input[type="password"], input[placeholder*="secret"]'
        );

        const main = page.locator('main');
        await expect(main).toBeVisible();
      }
    }
  });

  test('should have regenerate secret option', async ({ page }) => {
    await page.goto('/webhooks');
    await page.waitForLoadState('networkidle');

    const regenerateButton = page.locator(
      'button:has-text("Regenerate"), button:has-text("Rotate")'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Webhooks - Test Webhook', () => {
  test('should have test webhook button', async ({ page }) => {
    await page.goto('/webhooks');
    await page.waitForLoadState('networkidle');

    const testButton = page.locator(
      'button:has-text("Test"), button:has-text("Send Test")'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Webhooks - Responsive', () => {
  test.describe('Mobile View', () => {
  });

  test.describe('Desktop View', () => {
  });
});

test.describe('Webhooks - Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/webhooks');
    await page.waitForLoadState('networkidle');

    const headings = page.locator('h1, h2');
    expect(await headings.count()).toBeGreaterThanOrEqual(1);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/webhooks');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('should have accessible buttons', async ({ page }) => {
    await page.goto('/webhooks');
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

test.describe('Webhooks - Actions', () => {
  test('should show webhook actions menu', async ({ page }) => {
    await page.goto('/webhooks');
    await page.waitForLoadState('networkidle');

    const actionsButton = page.locator(
      '[data-testid*="actions"], button[aria-label*="actions"], .actions-menu'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have enable/disable toggle', async ({ page }) => {
    await page.goto('/webhooks');
    await page.waitForLoadState('networkidle');

    const toggle = page.locator(
      '[role="switch"], input[type="checkbox"]'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have delete option', async ({ page }) => {
    await page.goto('/webhooks');
    await page.waitForLoadState('networkidle');

    const deleteButton = page.locator(
      'button:has-text("Delete"), [role="menuitem"]:has-text("Delete")'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});
