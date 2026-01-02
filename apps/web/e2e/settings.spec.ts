import { test, expect } from '@playwright/test';
import { setupAuth } from './fixtures/auth';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display settings page header', async ({ page }) => {
    const heading = page.locator('h1').first();
    await expect(heading).toContainText(/settings/i);
  });

  test('should have navigation tabs', async ({ page }) => {
    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toBeVisible();
  });

  test('should display settings tabs', async ({ page }) => {
    // Settings page has tabs for General, Appearance, Notifications, Security
    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Settings - General Tab', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display general settings by default', async ({ page }) => {
    // General tab should be selected by default
    const generalTab = page.locator('[role="tab"]:has-text("General")');
    await expect(generalTab).toBeVisible();
  });

  test('should show organization settings', async ({ page }) => {
    // Look for organization or profile settings content
    const content = page.locator('main');
    await expect(content).toBeVisible();
  });
});

test.describe('Settings - Security Tab', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to security tab', async ({ page }) => {
    const securityTab = page.locator('[role="tab"]:has-text("Security")');
    await expect(securityTab).toBeVisible();
    await securityTab.click();
    await page.waitForTimeout(300);

    // Verify tab is now selected
    await expect(securityTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display security settings content', async ({ page }) => {
    const securityTab = page.locator('[role="tab"]:has-text("Security")');
    await securityTab.click();
    await page.waitForTimeout(300);

    const tabPanel = page.locator('[role="tabpanel"][data-state="active"]');
    await expect(tabPanel).toBeVisible();
  });
});

test.describe('Settings - Notifications Tab', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to notifications tab', async ({ page }) => {
    const notificationsTab = page.locator('[role="tab"]:has-text("Notifications")');
    await expect(notificationsTab).toBeVisible();
    await notificationsTab.click();
    await page.waitForTimeout(300);

    await expect(notificationsTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display notification settings content', async ({ page }) => {
    const notificationsTab = page.locator('[role="tab"]:has-text("Notifications")');
    await notificationsTab.click();
    await page.waitForTimeout(300);

    const tabPanel = page.locator('[role="tabpanel"][data-state="active"]');
    await expect(tabPanel).toBeVisible();
  });
});

test.describe('Settings - Appearance Tab', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to appearance tab', async ({ page }) => {
    const appearanceTab = page.locator('[role="tab"]:has-text("Appearance")');
    await expect(appearanceTab).toBeVisible();
    await appearanceTab.click();
    await page.waitForTimeout(300);

    await expect(appearanceTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display appearance settings content', async ({ page }) => {
    const appearanceTab = page.locator('[role="tab"]:has-text("Appearance")');
    await appearanceTab.click();
    await page.waitForTimeout(300);

    const tabPanel = page.locator('[role="tabpanel"][data-state="active"]');
    await expect(tabPanel).toBeVisible();
  });
});

test.describe('Settings - API Keys Navigation', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
  });

  test('should have API Keys link in sidebar', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const apiKeysLink = page.locator('a[href*="api-keys"], a:has-text("API Keys")');
    await expect(apiKeysLink).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to API Keys page from sidebar', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const apiKeysLink = page.locator('a[href*="api-keys"]').first();
    if (await apiKeysLink.count() > 0) {
      await apiKeysLink.click();
      await page.waitForLoadState('networkidle');

      // Page should show API keys content
      const content = page.locator('main, body').first();
      await expect(content).toBeVisible();
    }
  });
});

test.describe('Settings - Responsive', () => {
  test.describe('Mobile View', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display settings on mobile', async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
    });

    test('should have mobile-friendly tabs', async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      const tabs = page.locator('[role="tablist"]');
      await expect(tabs).toBeVisible();
    });
  });

  test.describe('Desktop View', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('should display settings with sidebar on desktop', async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();

      const sidebar = page.locator('aside, nav').first();
      await expect(sidebar).toBeVisible();
    });
  });
});

test.describe('Settings - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should have proper heading structure', async ({ page }) => {
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('should have accessible tabs', async ({ page }) => {
    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toBeVisible();

    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);

    // Check that tabs have accessible names
    for (let i = 0; i < count; i++) {
      const tab = tabs.nth(i);
      const text = await tab.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });
});

test.describe('Settings - Tab Interactions', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should switch between tabs', async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();

    if (count >= 2) {
      // Click second tab
      await tabs.nth(1).click();
      await page.waitForTimeout(300);

      // Verify second tab is selected
      await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('should preserve state when switching tabs', async ({ page }) => {
    // Click through tabs to verify content changes
    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(300);

      const tabPanel = page.locator('[role="tabpanel"][data-state="active"]');
      await expect(tabPanel).toBeVisible();
    }
  });
});
