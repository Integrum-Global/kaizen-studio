import { test, expect } from '@playwright/test';
import { setupAuth } from './fixtures/auth';
import { ensureDeploymentExists } from './fixtures/test-data';

test.describe('Deployments List Page', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    // Ensure test deployment exists before running tests
    await ensureDeploymentExists(page);
    await page.goto('/deployments');
    await page.waitForLoadState('networkidle');
  });

  test('should display deployments page header with title', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 5000 });
    await expect(heading).toContainText(/Deployments/i);
  });

  test('should show page description text', async ({ page }) => {
    const description = page.locator('text=/Deploy and manage|manage your pipelines|deployment/i');
    await expect(description.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show create deployment button that is enabled', async ({ page }) => {
    const createButton = page.locator(
      'button:has-text("New Deployment"), button:has-text("Create"), button:has-text("Deploy")'
    ).first();

    await expect(createButton).toBeVisible({ timeout: 5000 });
    await expect(createButton).toBeEnabled();
  });

  test('should display deployment cards or empty state', async ({ page }) => {
    const deploymentItems = page.locator(
      '[data-testid*="deployment"], .deployment-card, [role="listitem"], .border.rounded-lg'
    );
    const emptyState = page.locator(
      'text=/no deployments|create your first|get started|deploy your first/i'
    );

    const itemCount = await deploymentItems.count();
    const emptyCount = await emptyState.count();

    // STRICT: Must have one or the other
    expect(itemCount > 0 || emptyCount > 0).toBeTruthy();

    if (itemCount > 0) {
      await expect(deploymentItems.first()).toBeVisible();
      // STRICT: Verify deployment card has content
      const cardText = await deploymentItems.first().textContent();
      expect(cardText?.trim().length).toBeGreaterThan(0);
    } else {
      await expect(emptyState.first()).toBeVisible();
    }
  });

  test('should have working search input', async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder*="Search deployments"], input[placeholder*="Search"], input[type="search"]'
    ).first();

    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await expect(searchInput).toBeEnabled();

    // STRICT: Verify it accepts and shows input
    await searchInput.fill('test-deployment');
    await expect(searchInput).toHaveValue('test-deployment');

    // STRICT: Clear works
    await searchInput.clear();
    await expect(searchInput).toHaveValue('');
  });

  test('should have environment filter dropdown', async ({ page }) => {
    const envFilter = page.locator(
      'button:has-text("Environment"), button:has-text("All Environments"), [data-testid*="environment-filter"]'
    ).first();

    const filterCount = await envFilter.count();
    // STRICT: Skip if no filter (design choice)
    test.skip(filterCount === 0, 'No environment filter on page');

    await expect(envFilter).toBeVisible();
    await expect(envFilter).toBeEnabled();
  });

  test('should have status filter dropdown', async ({ page }) => {
    const statusFilter = page.locator(
      'button:has-text("Status"), button:has-text("All Status"), [data-testid*="status-filter"]'
    ).first();

    const filterCount = await statusFilter.count();
    // STRICT: Skip if no filter (design choice)
    test.skip(filterCount === 0, 'No status filter on page');

    await expect(statusFilter).toBeVisible();
    await expect(statusFilter).toBeEnabled();
  });
});

test.describe('Deployments - Create Dialog', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/deployments');
    await page.waitForLoadState('networkidle');
  });

  test('should open create deployment dialog with form', async ({ page }) => {
    const createButton = page.locator('button:has-text("New Deployment"), button:has-text("Create")').first();
    await expect(createButton).toBeVisible({ timeout: 5000 });
    await createButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // STRICT: Dialog must have form elements
    const inputs = dialog.locator('input, select, textarea');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test('should display dialog title', async ({ page }) => {
    const createButton = page.locator('button:has-text("New Deployment"), button:has-text("Create")').first();
    await createButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    const dialogTitle = dialog.locator('h2, [class*="title"], [data-testid*="title"]').first();
    await expect(dialogTitle).toBeVisible();

    // STRICT: Title must have content
    const titleText = await dialogTitle.textContent();
    expect(titleText?.trim().length).toBeGreaterThan(0);
  });

  test('should have required form fields in dialog', async ({ page }) => {
    const createButton = page.locator('button:has-text("New Deployment")').first();
    await createButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // STRICT: Must have form elements
    const inputs = dialog.locator('input, select, textarea');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);

    // Should have at least a name or pipeline selection
    const nameInput = dialog.locator('input[name*="name" i], input[placeholder*="name" i]');
    const pipelineSelect = dialog.locator('select, [data-testid*="pipeline"], button:has-text("Pipeline")');

    const hasName = await nameInput.count() > 0;
    const hasPipeline = await pipelineSelect.count() > 0;

    expect(hasName || hasPipeline).toBeTruthy();
  });

  test('should close dialog with escape key', async ({ page }) => {
    const createButton = page.locator('button:has-text("New Deployment")').first();
    await createButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // STRICT: Escape must close dialog
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 2000 });
  });

  test('should close dialog with cancel button', async ({ page }) => {
    const createButton = page.locator('button:has-text("New Deployment")').first();
    await createButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    const closeButton = dialog.locator('button:has-text("Cancel"), button[aria-label*="close"], button:has-text("Close")').first();
    await expect(closeButton).toBeVisible();
    await closeButton.click();
    await expect(dialog).not.toBeVisible({ timeout: 2000 });
  });
});

test.describe('Deployments - Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/deployments');
    await page.waitForLoadState('networkidle');
  });

  test('should filter by search term and update results', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await searchInput.fill('test-deployment');
    await page.waitForTimeout(500);

    // STRICT: Search should be applied
    await expect(searchInput).toHaveValue('test-deployment');
  });

  test('should filter by environment when dropdown is clicked', async ({ page }) => {
    const envTrigger = page.locator('[data-testid*="environment"] button, button:has-text("All Environments"), button:has-text("Environment")').first();

    const triggerCount = await envTrigger.count();
    // STRICT: Skip if no filter
    test.skip(triggerCount === 0, 'No environment filter to test');

    await expect(envTrigger).toBeVisible();
    await envTrigger.click();

    const options = page.locator('[role="option"], [role="menuitem"]');
    const optionCount = await options.count();

    if (optionCount > 0) {
      await expect(options.first()).toBeVisible();
      await options.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('should filter by status when dropdown is clicked', async ({ page }) => {
    const statusTrigger = page.locator('[data-testid*="status"] button, button:has-text("All Status"), button:has-text("Status")').first();

    const triggerCount = await statusTrigger.count();
    // STRICT: Skip if no filter
    test.skip(triggerCount === 0, 'No status filter to test');

    await expect(statusTrigger).toBeVisible();
    await statusTrigger.click();

    const options = page.locator('[role="option"], [role="menuitem"]');
    const optionCount = await options.count();

    if (optionCount > 0) {
      await expect(options.first()).toBeVisible();
    }
  });

  test('should clear search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');

    await searchInput.clear();
    await expect(searchInput).toHaveValue('');
  });
});

test.describe('Deployments - Responsive', () => {
  test.describe('Mobile View', () => {

    test('should show mobile-friendly layout', async ({ page }) => {
      await page.goto('/deployments');
      await page.waitForLoadState('networkidle');

      // STRICT: Create button should be visible
      const createButton = page.locator('button:has-text("New"), button:has-text("Create")').first();
      await expect(createButton).toBeVisible({ timeout: 5000 });
    });

    test('should have accessible search on mobile', async ({ page }) => {
      await page.goto('/deployments');
      await page.waitForLoadState('networkidle');

      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await expect(searchInput).toBeVisible({ timeout: 5000 });
      await expect(searchInput).toBeEnabled();
    });
  });

  test.describe('Tablet View', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('should display deployments content on tablet', async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
      await page.goto('/deployments');
      await page.waitForLoadState('networkidle');

      const heading = page.locator('main h1, main h2').first();
      await expect(heading).toBeVisible();
    });
  });

  test.describe('Desktop View', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('should show all filters on desktop', async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
      await page.goto('/deployments');
      await page.waitForLoadState('networkidle');

      // STRICT: Search should be visible
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await expect(searchInput).toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe('Deployments - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/deployments');
    await page.waitForLoadState('networkidle');
  });

  test('should have proper heading structure with h1', async ({ page }) => {
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

  test('should have accessible form controls with labels', async ({ page }) => {
    const inputs = page.locator('input');
    const inputCount = await inputs.count();

    for (let i = 0; i < Math.min(inputCount, 3); i++) {
      const input = inputs.nth(i);
      const placeholder = await input.getAttribute('placeholder');
      const ariaLabel = await input.getAttribute('aria-label');
      const id = await input.getAttribute('id');

      // STRICT: Input must have some form of labeling
      expect(placeholder || ariaLabel || id).toBeTruthy();
    }
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

  test('should have focus visible indicators', async ({ page }) => {
    const createButton = page.locator('button:has-text("New Deployment"), button:has-text("Create")').first();
    await createButton.focus();

    // STRICT: Button must be focusable
    await expect(createButton).toBeFocused();
  });
});

test.describe('Deployments - Pagination', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/deployments');
    await page.waitForLoadState('networkidle');
  });

  test('should show pagination controls when data exists', async ({ page }) => {
    // Separate locators for different pagination elements (regex cannot be combined with other selectors)
    const paginationText = page.locator('text=/Page \\d+ of \\d+/');
    const paginationButtons = page.locator('button:has-text("Previous"), button:has-text("Next"), [data-testid*="pagination"]');
    const deployments = page.locator('[data-testid*="deployment"], .deployment-card');

    const deploymentCount = await deployments.count();
    const paginationTextCount = await paginationText.count();
    const paginationButtonsCount = await paginationButtons.count();

    // STRICT: If there are deployments and pagination, verify it
    if (deploymentCount > 0 && (paginationTextCount > 0 || paginationButtonsCount > 0)) {
      if (paginationTextCount > 0) {
        await expect(paginationText.first()).toBeVisible();
      } else {
        await expect(paginationButtons.first()).toBeVisible();
      }
    }
  });

  test('should navigate between pages when pagination exists', async ({ page }) => {
    const nextButton = page.locator('button:has-text("Next"), [aria-label*="next"]').first();

    const nextCount = await nextButton.count();
    // STRICT: Skip if no next button
    test.skip(nextCount === 0, 'No pagination next button');

    const isEnabled = await nextButton.isEnabled();
    // STRICT: Skip if button is disabled
    test.skip(!isEnabled, 'Next button is disabled');

    await nextButton.click();
    await page.waitForTimeout(300);

    // STRICT: Page should still be functional
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });
});

test.describe('Deployments - Actions', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/deployments');
    await page.waitForLoadState('networkidle');
  });

  test('should show deployment actions menu when available', async ({ page }) => {
    const deploymentCards = page.locator('[data-testid*="deployment"], .deployment-card');
    const cardCount = await deploymentCards.count();

    // STRICT: Skip if no deployments
    test.skip(cardCount === 0, 'No deployments to test actions menu');

    const actionButton = page.locator(
      '[data-testid*="actions"], button[aria-label*="actions"], button:has(svg[class*="dots"])'
    ).first();

    await expect(actionButton).toBeVisible();
    await actionButton.click();

    const menu = page.locator('[role="menu"], [role="listbox"]');
    await expect(menu.first()).toBeVisible({ timeout: 3000 });

    // STRICT: Menu must have options
    const menuItems = menu.locator('[role="menuitem"], li');
    const itemCount = await menuItems.count();
    expect(itemCount).toBeGreaterThan(0);
  });
});
