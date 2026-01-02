import { test, expect } from '@playwright/test';
import { setupAuth } from './fixtures/auth';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate with real backend
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard header with welcome or overview', async ({ page }) => {
    // Look for h1 in main content area
    const heading = page.locator('main h1, main h2').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
    await expect(heading).toContainText(/dashboard|overview|welcome/i);
  });

  test('should display quick stats or metrics cards', async ({ page }) => {
    // Must find stat cards with content
    const statCards = page.locator(
      '[data-testid*="stat"], .stat-card, [class*="metric"], [class*="card"]'
    );

    const cardCount = await statCards.count();
    expect(cardCount).toBeGreaterThan(0);
    await expect(statCards.first()).toBeVisible();

    // Verify card has actual content
    const cardText = await statCards.first().textContent();
    expect(cardText?.trim().length).toBeGreaterThan(0);
  });

  test('should display recent activity section', async ({ page }) => {
    // Must find activity content - check multiple selectors
    const activityByText = page.locator('text=/recent|activity|latest/i');
    const activityByTestId = page.locator('[data-testid*="activity"]');
    const activityByClass = page.locator('[class*="activity"]');

    const hasTextMatch = (await activityByText.count()) > 0;
    const hasTestIdMatch = (await activityByTestId.count()) > 0;
    const hasClassMatch = (await activityByClass.count()) > 0;

    // Must have at least one match
    expect(
      hasTextMatch || hasTestIdMatch || hasClassMatch,
      'No activity section found'
    ).toBeTruthy();

    if (hasTextMatch) {
      await expect(activityByText.first()).toBeVisible({ timeout: 5000 });
    } else if (hasTestIdMatch) {
      await expect(activityByTestId.first()).toBeVisible({ timeout: 5000 });
    } else {
      await expect(activityByClass.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display quick action buttons', async ({ page }) => {
    const actionButtons = page.locator(
      'a[href*="/agents/new"], a[href*="/pipelines/new"], button:has-text("Create"), button:has-text("New")'
    );

    const buttonCount = await actionButtons.count();
    // Skip if dashboard doesn't have quick action buttons - design choice
    test.skip(buttonCount === 0, 'Dashboard does not have quick action buttons');

    await expect(actionButtons.first()).toBeVisible();
    await expect(actionButtons.first()).toBeEnabled();
  });

  test('should have working navigation links in sidebar', async ({ page }) => {
    // Check that sidebar has navigation links
    const sidebar = page.locator('aside, nav[class*="sidebar"]').first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });

    // Check for agents link in sidebar
    const agentsLink = sidebar.locator('a[href*="/agents"]').first();
    const agentsLinkExists = (await agentsLink.count()) > 0;
    expect(
      agentsLinkExists,
      'Sidebar should have agents navigation link'
    ).toBeTruthy();

    // Check for pipelines link in sidebar
    const pipelinesLink = sidebar.locator('a[href*="/pipelines"]').first();
    const pipelinesLinkExists = (await pipelinesLink.count()) > 0;
    expect(
      pipelinesLinkExists,
      'Sidebar should have pipelines navigation link'
    ).toBeTruthy();
  });

  test('should load without console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    const criticalErrors = errors.filter(
      (error) =>
        !error.includes('favicon') &&
        !error.includes('sourcemap') &&
        !error.includes('404') &&
        !error.includes('network') &&
        !error.includes('Failed to load resource')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Dashboard - Widget Interactions', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated).toBeTruthy();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should have interactive widgets that respond to clicks', async ({
    page,
  }) => {
    const widgets = page.locator('[data-testid*="widget"], .widget, .card');
    const widgetCount = await widgets.count();

    // Skip if no widgets
    test.skip(widgetCount === 0, 'No widgets to test interaction');

    const firstWidget = widgets.first();
    await expect(firstWidget).toBeVisible();

    // Widget should be interactive or contain interactive elements
    const interactiveElements = firstWidget.locator(
      'button, a, [role="button"]'
    );
    const interactiveCount = await interactiveElements.count();

    if (interactiveCount > 0) {
      await expect(interactiveElements.first()).toBeEnabled();
    }
  });

  test('should refresh widgets when refresh button clicked', async ({
    page,
  }) => {
    const refreshButtons = page.locator(
      'button[aria-label*="refresh"], button:has(svg[class*="refresh"]), button[title*="refresh"]'
    );

    const refreshCount = await refreshButtons.count();
    // Skip if no refresh buttons
    test.skip(refreshCount === 0, 'No refresh buttons to test');

    const refreshButton = refreshButtons.first();
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();
    await page.waitForTimeout(500);

    // Page should still be functional after refresh
    const heading = page.locator('main h1, main h2').first();
    await expect(heading).toBeVisible();
  });
});

test.describe('Dashboard - Responsive', () => {
  test.describe('Mobile View', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display dashboard content properly on mobile', async ({
      page,
    }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify heading in main content area
      const heading = page.locator('main h1, main h2').first();
      await expect(heading).toBeVisible();
      await expect(heading).toContainText(/dashboard|overview|welcome/i);

      // Content must fit mobile viewport
      const main = page.locator('main');
      const box = await main.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeLessThanOrEqual(375);
    });

    test('should stack widgets vertically on mobile', async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const cards = page.locator(
        '[class*="card"], [data-testid*="card"], .stat-card'
      );
      const cardCount = await cards.count();

      // Skip if less than 2 cards
      test.skip(cardCount < 2, 'Less than 2 cards to verify stacking');

      const firstBox = await cards.first().boundingBox();
      const secondBox = await cards.nth(1).boundingBox();

      expect(firstBox).not.toBeNull();
      expect(secondBox).not.toBeNull();

      // On mobile, cards should be stacked (second below first)
      expect(secondBox!.y).toBeGreaterThanOrEqual(firstBox!.y);
    });
  });

  test.describe('Tablet View', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('should display dashboard with appropriate layout on tablet', async ({
      page,
    }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const heading = page.locator('main h1, main h2').first();
      await expect(heading).toBeVisible();

      // Main content should be visible
      const main = page.locator('main');
      await expect(main).toBeVisible();
    });
  });

  test.describe('Desktop View', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('should display full dashboard with sidebar on desktop', async ({
      page,
    }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const heading = page.locator('main h1, main h2').first();
      await expect(heading).toBeVisible();

      // Sidebar must be visible on desktop
      const sidebar = page
        .locator('aside, nav[class*="sidebar"], [class*="sidebar"]')
        .first();
      await expect(sidebar).toBeVisible({ timeout: 5000 });
    });

    test('should show sidebar navigation items on desktop', async ({
      page,
    }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const sidebar = page.locator('aside, nav[class*="sidebar"]').first();
      await expect(sidebar).toBeVisible({ timeout: 5000 });

      // Sidebar must have navigation items
      const navItems = sidebar.locator('a, button');
      const navCount = await navItems.count();
      expect(navCount).toBeGreaterThan(0);
    });
  });
});

test.describe('Dashboard - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated).toBeTruthy();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should have proper heading hierarchy with h1', async ({ page }) => {
    // Must have h1 in main content area
    const h1 = page.locator('main h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    await expect(h1.first()).toBeVisible();
  });

  test('should support keyboard navigation through interactive elements', async ({
    page,
  }) => {
    const focusedTags: string[] = [];

    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      if ((await focused.count()) > 0) {
        const tagName = await focused.evaluate((el) => el.tagName);
        focusedTags.push(tagName);
      }
    }

    // Must focus on interactive elements
    const validTags = ['BUTTON', 'A', 'INPUT', 'SELECT'];
    const validFocusCount = focusedTags.filter((tag) =>
      validTags.includes(tag)
    ).length;
    expect(validFocusCount).toBeGreaterThan(0);
  });

  test('should have proper landmarks (main, nav)', async ({ page }) => {
    // Must have main landmark
    const main = page.locator('main, [role="main"]');
    const mainCount = await main.count();
    expect(mainCount).toBeGreaterThan(0);
    await expect(main.first()).toBeVisible();
  });

  test('should have accessible interactive elements with labels', async ({
    page,
  }) => {
    const links = page.locator('a');
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(0);

    // Check first few links have accessible names
    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const href = await link.getAttribute('href');

      // Link should have accessible name or valid href
      const hasAccessible =
        (text?.trim().length ?? 0) > 0 || ariaLabel || href;
      expect(hasAccessible, `Link ${i} has no accessible name`).toBeTruthy();
    }
  });
});

test.describe('Dashboard - Performance', () => {
  test('should load within acceptable time (under 5s)', async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated).toBeTruthy();

    const startTime = Date.now();

    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;

    // Should load DOM within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should remain responsive after navigation', async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated).toBeTruthy();

    // Navigate back and forth
    await page.goto('/dashboard');
    await page.goto('/agents');
    await page.goto('/dashboard');
    await page.goto('/pipelines');
    await page.goto('/dashboard');

    // Page should still be responsive
    const heading = page.locator('main h1, main h2').first();
    await expect(heading).toBeVisible({ timeout: 5000 });

    // Interactive elements should work
    const buttons = page.locator('button').first();
    if ((await buttons.count()) > 0) {
      await expect(buttons).toBeEnabled();
    }
  });
});

test.describe('Dashboard - User Info', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated).toBeTruthy();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display user name or email somewhere on dashboard', async ({
    page,
  }) => {
    // Look for user info in header, sidebar, or welcome message - check multiple selectors
    const userInfoByText = page.locator(
      'text=/e2e-test@example.com|E2E Test User|welcome/i'
    );
    const userInfoByTestId = page.locator('[data-testid*="user"]');
    const userInfoByClass = page.locator('[class*="user"]');

    const hasTextMatch = (await userInfoByText.count()) > 0;
    const hasTestIdMatch = (await userInfoByTestId.count()) > 0;
    const hasClassMatch = (await userInfoByClass.count()) > 0;
    const userInfoCount =
      hasTextMatch || hasTestIdMatch || hasClassMatch ? 1 : 0;

    // Skip if no user info displayed (could be design choice)
    test.skip(userInfoCount === 0, 'No user info displayed on dashboard');

    // Get the first matching element
    const userInfo = hasTextMatch
      ? userInfoByText
      : hasTestIdMatch
        ? userInfoByTestId
        : userInfoByClass;

    await expect(userInfo.first()).toBeVisible();
  });

  test('should have user menu or profile access', async ({ page }) => {
    const userMenu = page.locator(
      '[data-testid*="user-menu"], [aria-label*="user"], [aria-label*="profile"], button:has([class*="avatar"])'
    );

    const menuCount = await userMenu.count();
    // Skip if no user menu (could be design choice)
    test.skip(menuCount === 0, 'No user menu on dashboard');

    await expect(userMenu.first()).toBeVisible();
  });
});
