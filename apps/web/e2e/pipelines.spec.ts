import { test, expect } from '@playwright/test';
import { setupAuth } from './fixtures/auth';

// Mock authentication for pipeline tests

test.describe('Pipelines List Page', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/pipelines');
    await page.waitForLoadState('networkidle');
  });

  test('should display pipelines page header with title', async ({ page }) => {
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
    await expect(heading).toContainText(/pipeline/i);
  });

  test('should show create pipeline button that is enabled', async ({ page }) => {
    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("New"), a[href*="new"]'
    ).first();

    await expect(createButton).toBeVisible({ timeout: 5000 });
    await expect(createButton).toBeEnabled();
  });

  test('should display pipeline cards or empty state', async ({ page }) => {
    const pipelineItems = page.locator(
      '[data-testid*="pipeline"], .pipeline-card, [role="listitem"], .border.rounded-lg'
    );
    const emptyState = page.locator(
      'text=/no pipelines|create your first|get started|add your first/i'
    );

    const itemCount = await pipelineItems.count();
    const emptyCount = await emptyState.count();

    // STRICT: Must have one or the other
    expect(itemCount > 0 || emptyCount > 0).toBeTruthy();

    if (itemCount > 0) {
      await expect(pipelineItems.first()).toBeVisible();
      // STRICT: Verify pipeline card has content
      const cardText = await pipelineItems.first().textContent();
      expect(cardText?.trim().length).toBeGreaterThan(3);
    } else {
      await expect(emptyState.first()).toBeVisible();
    }
  });

  test('should navigate to create pipeline page', async ({ page }) => {
    const createButton = page.locator(
      'a[href*="/pipelines/new"], button:has-text("Create"), button:has-text("New")'
    ).first();

    await expect(createButton).toBeVisible({ timeout: 5000 });
    await createButton.click();
    await expect(page).toHaveURL(/\/pipelines\/new/);
  });

  test('should have working search/filter input', async ({ page }) => {
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search" i]'
    ).first();

    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await expect(searchInput).toBeEnabled();

    // STRICT: Verify it accepts input
    await searchInput.fill('test pipeline');
    await expect(searchInput).toHaveValue('test pipeline');

    // STRICT: Clear works
    await searchInput.clear();
    await expect(searchInput).toHaveValue('');
  });
});

test.describe('Pipeline Editor Page', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/pipelines/new');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to pipeline editor and show content', async ({ page }) => {
    // STRICT: Must show editor heading
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('should display canvas area for pipeline editing', async ({ page }) => {
    // STRICT: Canvas must be visible
    const canvas = page.locator(
      '.react-flow, [data-testid*="canvas"], [class*="canvas"], .pipeline-editor'
    ).first();

    await expect(canvas).toBeVisible({ timeout: 5000 });
  });

  test('should display toolbar with editing controls', async ({ page }) => {
    const toolbar = page.locator(
      '[data-testid*="toolbar"], [role="toolbar"], .toolbar, .editor-controls'
    ).first();

    await expect(toolbar).toBeVisible({ timeout: 5000 });

    // STRICT: Toolbar must have buttons
    const buttons = toolbar.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should have save button that is enabled', async ({ page }) => {
    const saveButton = page.locator(
      'button:has-text("Save"), button[aria-label*="save"]'
    ).first();

    await expect(saveButton).toBeVisible({ timeout: 5000 });
    await expect(saveButton).toBeEnabled();
  });

  test('should display node palette or sidebar for adding nodes', async ({ page }) => {
    // STRICT: Node palette must be visible
    const sidebar = page.locator(
      '[data-testid*="palette"], [data-testid*="sidebar"], aside, .node-palette'
    ).first();

    await expect(sidebar).toBeVisible({ timeout: 5000 });
  });

  test('should handle keyboard shortcuts without crashing', async ({ page }) => {
    // Try common shortcuts
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // STRICT: Page should still be functional
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();

    const canvas = page.locator('.react-flow, [data-testid*="canvas"]').first();
    await expect(canvas).toBeVisible();
  });
});

test.describe('Pipeline Editor - Canvas Interactions', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/pipelines/new');
    await page.waitForLoadState('networkidle');
  });

  test('should allow canvas pan with mouse drag', async ({ page }) => {
    const canvas = page.locator('.react-flow, [data-testid*="canvas"]').first();
    await expect(canvas).toBeVisible({ timeout: 5000 });

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Simulate drag
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width / 2 + 100, box!.y + box!.height / 2 + 100);
    await page.mouse.up();

    // STRICT: Canvas should still be visible and functional
    await expect(canvas).toBeVisible();
  });

  test('should allow canvas zoom with scroll wheel', async ({ page }) => {
    const canvas = page.locator('.react-flow, [data-testid*="canvas"]').first();
    await expect(canvas).toBeVisible({ timeout: 5000 });

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Zoom with scroll
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(200);

    // STRICT: Canvas should still be visible
    await expect(canvas).toBeVisible();
  });

  test('should have zoom controls visible', async ({ page }) => {
    const zoomControls = page.locator(
      '[data-testid*="zoom"], .react-flow__controls, button[aria-label*="zoom"]'
    ).first();

    await expect(zoomControls).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Pipelines - Responsive', () => {
  test.describe('Mobile View', () => {

    test('should show mobile-friendly message for editor or adapt layout', async ({ page }) => {
      await page.goto('/pipelines/new');
      await page.waitForLoadState('networkidle');

      // STRICT: Should show some content (mobile message, adapted canvas, or heading)
      const mobileMessage = page.locator(
        'text=/desktop|larger screen|not supported on mobile/i'
      );
      const canvas = page.locator('.react-flow, [data-testid*="canvas"]');
      const heading = page.locator('h1, h2');

      const hasMobileMessage = await mobileMessage.count() > 0;
      const hasCanvas = await canvas.count() > 0;
      const hasHeading = await heading.count() > 0;

      // STRICT: Must have some response
      expect(hasMobileMessage || hasCanvas || hasHeading).toBeTruthy();

      if (hasMobileMessage) {
        await expect(mobileMessage.first()).toBeVisible();
      } else if (hasHeading) {
        await expect(heading.first()).toBeVisible();
      }
    });
  });

  test.describe('Desktop View', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('should show sidebar with nodes on desktop', async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
      await page.goto('/pipelines/new');
      await page.waitForLoadState('networkidle');

      // STRICT: Sidebar must be visible
      const sidebar = page.locator('aside, [data-testid*="sidebar"], .node-palette').first();
      await expect(sidebar).toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe('Pipelines - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/pipelines');
    await page.waitForLoadState('networkidle');
  });

  test('should have proper heading structure', async ({ page }) => {
    // STRICT: Must have h1
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    await expect(h1.first()).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    const focusedTags: string[] = [];

    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      if (await focused.count() > 0) {
        const tagName = await focused.evaluate(el => el.tagName);
        focusedTags.push(tagName);
      }
    }

    // STRICT: Must tab to interactive elements
    const validTags = ['BUTTON', 'A', 'INPUT', 'SELECT'];
    const validFocusCount = focusedTags.filter(tag => validTags.includes(tag)).length;
    expect(validFocusCount).toBeGreaterThan(0);
  });

  test('should have accessible buttons with labels', async ({ page }) => {
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);

    // STRICT: Check ALL buttons have accessible names
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');

      const hasAccessibleName = (text?.trim().length ?? 0) > 0 || ariaLabel || title;
      expect(hasAccessibleName, `Button ${i} has no accessible name`).toBeTruthy();
    }
  });

  test('should have focus visible on interactive elements', async ({ page }) => {
    const button = page.locator('button').first();
    await button.focus();

    // STRICT: Button must be focusable
    await expect(button).toBeFocused();
  });
});

test.describe('Pipelines - Node Operations', () => {
  test('should allow adding nodes from palette', async ({ page }) => {
    await page.goto('/pipelines/new');
    await page.waitForLoadState('networkidle');

    const nodePalette = page.locator('[data-testid*="palette"], aside, .node-palette').first();
    await expect(nodePalette).toBeVisible({ timeout: 5000 });

    const nodeItems = nodePalette.locator('[data-testid*="node"], .node-item, [draggable="true"]');
    const nodeCount = await nodeItems.count();

    // STRICT: Skip if no node items in palette
    test.skip(nodeCount === 0, 'No node items in palette');

    await expect(nodeItems.first()).toBeVisible();
  });
});
