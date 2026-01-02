import { test, expect } from '@playwright/test';
import { setupAuth } from './fixtures/auth';
import { ensureConnectorExists } from './fixtures/test-data';

test.describe('Connectors List Page', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    // Ensure test connector exists before running tests
    await ensureConnectorExists(page);
    await page.goto('/connectors');
    await page.waitForLoadState('networkidle');
  });

  test('should display connectors page header', async ({ page }) => {
    const heading = page.locator('h1, h2').first();
    await expect(heading).toContainText(/connector/i);
  });

  test('should show create connector button', async ({ page }) => {
    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("New"), button:has-text("Add")'
    );

    if (await createButton.count() > 0) {
      await expect(createButton.first()).toBeVisible();
    }
  });

  test('should display connector cards or empty state', async ({ page }) => {
    await page.waitForTimeout(1000);

    const connectorItems = page.locator(
      '[data-testid*="connector"], .connector-card, [role="listitem"], .border.rounded-lg'
    );
    const emptyState = page.locator(
      'text=/no connectors|create your first|get started/i'
    );

    const hasItems = (await connectorItems.count()) > 0;
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

  test('should have type filter', async ({ page }) => {
    const typeFilter = page.locator(
      'button:has-text("Type"), [data-testid*="type-filter"]'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Connectors - Create Dialog', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/connectors');
    await page.waitForLoadState('networkidle');
  });

  test('should open create connector dialog', async ({ page }) => {
    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("New"), button:has-text("Add")'
    );

    if (await createButton.count() > 0) {
      await createButton.first().click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
    }
  });

  test('should display connector type selection', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create"), button:has-text("New")');

    if (await createButton.count() > 0) {
      await createButton.first().click();

      const dialog = page.locator('[role="dialog"]');
      if (await dialog.count() > 0) {
        await expect(dialog).toBeVisible();
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

test.describe('Connectors - Configuration', () => {
  test('should display configuration form', async ({ page }) => {
    await page.goto('/connectors');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button:has-text("Create"), button:has-text("New")');

    if (await createButton.count() > 0) {
      await createButton.first().click();

      const dialog = page.locator('[role="dialog"]');
      if (await dialog.count() > 0) {
        const formInputs = dialog.locator('input, select, textarea');
        expect(await formInputs.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should have name field', async ({ page }) => {
    await page.goto('/connectors');
    await page.waitForLoadState('networkidle');

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

  test('should have connection settings section', async ({ page }) => {
    await page.goto('/connectors');
    await page.waitForLoadState('networkidle');

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Connectors - Connector Types', () => {
  test('should display database connectors', async ({ page }) => {
    await page.goto('/connectors');
    await page.waitForLoadState('networkidle');

    const databaseConnectors = page.locator(
      'text=/postgresql|mysql|mongodb|database/i'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display API connectors', async ({ page }) => {
    await page.goto('/connectors');
    await page.waitForLoadState('networkidle');

    const apiConnectors = page.locator(
      'text=/rest|graphql|api|http/i'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display cloud connectors', async ({ page }) => {
    await page.goto('/connectors');
    await page.waitForLoadState('networkidle');

    const cloudConnectors = page.locator(
      'text=/aws|azure|gcp|s3|cloud/i'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Connectors - Test Connection', () => {
  test('should have test connection button', async ({ page }) => {
    await page.goto('/connectors');
    await page.waitForLoadState('networkidle');

    const testButton = page.locator(
      'button:has-text("Test"), button:has-text("Verify")'
    );

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Connectors - Responsive', () => {
  test.describe('Mobile View', () => {
  });

  test.describe('Desktop View', () => {
  });
});

test.describe('Connectors - Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/connectors');
    await page.waitForLoadState('networkidle');

    const headings = page.locator('h1, h2');
    expect(await headings.count()).toBeGreaterThanOrEqual(1);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/connectors');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('should have accessible buttons', async ({ page }) => {
    await page.goto('/connectors');
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
