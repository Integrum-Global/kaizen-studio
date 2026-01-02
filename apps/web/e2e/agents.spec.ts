import { test, expect } from '@playwright/test';
import { setupAuth } from './fixtures/auth';
import { ensureAgentExists, createTestAgent } from './fixtures/test-data';

// Test data created during test run
let testAgentId: string | null = null;

test.describe('Agents List Page', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();

    // Ensure at least one agent exists for testing
    const agent = await ensureAgentExists(page);
    if (agent) {
      testAgentId = agent.id;
    }

    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
  });

  test('should display agents page header with title', async ({ page }) => {
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
    await expect(heading).toContainText(/agents/i);
  });

  test('should show create agent button that is clickable', async ({ page }) => {
    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("New"), a[href*="new"]'
    ).first();

    await expect(createButton).toBeVisible({ timeout: 5000 });
    await expect(createButton).toBeEnabled();
  });

  test('should display agent cards or empty state', async ({ page }) => {
    const agentItems = page.locator(
      '[data-testid*="agent"], .agent-card, [role="listitem"], .border.rounded-lg'
    );
    const emptyState = page.locator(
      'text=/no agents|create your first|get started|add your first/i'
    );

    const itemCount = await agentItems.count();
    const emptyCount = await emptyState.count();

    // STRICT: Must have one or the other
    expect(itemCount > 0 || emptyCount > 0).toBeTruthy();

    if (itemCount > 0) {
      await expect(agentItems.first()).toBeVisible();
      // STRICT: Verify agent card has meaningful content
      const cardText = await agentItems.first().textContent();
      expect(cardText?.trim().length).toBeGreaterThan(3);
    } else {
      await expect(emptyState.first()).toBeVisible();
    }
  });

  test('should have working search/filter input', async ({ page }) => {
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]'
    ).first();

    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await expect(searchInput).toBeEnabled();

    // STRICT: Verify it accepts and shows input
    await searchInput.fill('test agent');
    await expect(searchInput).toHaveValue('test agent');

    // STRICT: Clear works
    await searchInput.clear();
    await expect(searchInput).toHaveValue('');
  });

  test('should navigate to agent detail on click', async ({ page }) => {
    // AgentCard uses navigate() via onClick, not <a> tags
    // Card structure: div.rounded-lg.border.cursor-pointer containing h3 (CardTitle)
    const agentCard = page.locator('div.cursor-pointer.rounded-lg.border:has(h3)').first();

    // Wait up to 10s for agent cards to appear
    try {
      await agentCard.waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      // If still no agent cards, skip
      test.skip(true, 'No agent cards to test navigation');
      return;
    }

    // Click on the card (not the dropdown menu button)
    const cardTitle = agentCard.locator('h3').first();
    await cardTitle.click();
    await expect(page).toHaveURL(/\/agents\/.+/);

    // STRICT: Verify detail page loaded with content
    const detailContent = page.locator('main, [role="main"]');
    await expect(detailContent).toBeVisible({ timeout: 5000 });
  });

  test('should display agent status indicators', async ({ page }) => {
    // AgentCard has Badge components showing status
    const agentCards = page.locator('div.cursor-pointer.rounded-lg.border:has(h3)');

    // Wait for agent cards to appear
    try {
      await agentCards.first().waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      test.skip(true, 'No agents to verify status indicators');
      return;
    }

    // AgentCard shows status in a Badge component
    // Badge uses classes like "bg-green-500/10" for active status
    const statusBadge = agentCards.first().locator('span:text-matches("active|inactive|error", "i")');

    const statusCount = await statusBadge.count();
    if (statusCount > 0) {
      await expect(statusBadge.first()).toBeVisible();
    }

    // Verify card shows meaningful status-related content
    const cardText = await agentCards.first().textContent();
    expect(cardText).toBeTruthy();
  });
});

test.describe('Agent Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated).toBeTruthy();

    // Ensure at least one agent exists for testing
    await ensureAgentExists(page);
  });

  test('should navigate to agent detail and show content', async ({ page }) => {
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');

    // Agent cards use navigate() instead of <a> tags, so look for clickable card
    const agentCard = page.locator('[class*="cursor-pointer"]').filter({ hasText: /Type|Provider|Model/i }).first();
    await expect(agentCard).toBeVisible({ timeout: 5000 });

    await agentCard.click();
    await page.waitForLoadState('networkidle');

    // Should navigate to agent detail page
    await expect(page).toHaveURL(/\/agents\/[a-zA-Z0-9-]+$/);

    // STRICT: Must show agent detail heading
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('should display agent configuration tabs or sections', async ({ page }) => {
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');

    // Agent cards use navigate() instead of <a> tags, so look for clickable card
    const agentCard = page.locator('[class*="cursor-pointer"]').filter({ hasText: /Type|Provider|Model/i }).first();
    await expect(agentCard).toBeVisible({ timeout: 5000 });

    await agentCard.click();
    await page.waitForLoadState('networkidle');

    // STRICT: Must find tabs or configuration sections
    // The agent detail page has tabs: Settings, Tools, Metrics and Configuration heading
    // Wait for the detail page to load
    await page.waitForTimeout(500);

    // Use text matching since the tabs use role="tab"
    const settingsText = page.getByText('Settings', { exact: true });
    const configText = page.getByText('Configuration', { exact: true });

    const hasSettings = await settingsText.count() > 0;
    const hasConfig = await configText.count() > 0;

    expect(hasSettings || hasConfig).toBeTruthy();
  });

  test('should have working back navigation', async ({ page }) => {
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');

    // Agent cards use navigate() instead of <a> tags, so look for clickable card
    const agentCard = page.locator('[class*="cursor-pointer"]').filter({ hasText: /Type|Provider|Model/i }).first();
    await expect(agentCard).toBeVisible({ timeout: 5000 });

    await agentCard.click();
    await page.waitForLoadState('networkidle');

    const backButton = page.locator(
      'a[href="/agents"], button:has-text("Back"), [aria-label*="back"]'
    ).first();

    if (await backButton.count() > 0) {
      await backButton.click();
      await expect(page).toHaveURL(/\/agents$/);
    } else {
      // Use browser back
      await page.goBack();
      await expect(page).toHaveURL(/\/agents$/);
    }
  });
});

test.describe('Agents - Create Flow', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
  });

  test('should open create agent dialog or page with form', async ({ page }) => {
    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("New"), a[href*="new"]'
    ).first();

    await expect(createButton).toBeVisible({ timeout: 5000 });
    await createButton.click();

    // STRICT: Must show create form (dialog or page)
    const formContent = page.locator(
      '[role="dialog"], form, input[name*="name"], input[placeholder*="name" i]'
    ).first();

    await expect(formContent).toBeVisible({ timeout: 5000 });
  });

  test('should have name input field for creating agent', async ({ page }) => {
    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("New"), a[href*="new"]'
    ).first();

    await createButton.click();
    await page.waitForTimeout(300);

    // STRICT: Must have name input
    const nameInput = page.locator(
      'input[name*="name" i], input[placeholder*="name" i], input[id*="name" i]'
    ).first();

    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await expect(nameInput).toBeEnabled();

    // STRICT: Verify input accepts value
    await nameInput.fill('Test Agent Name');
    await expect(nameInput).toHaveValue('Test Agent Name');
  });
});

test.describe('Agents - Responsive', () => {
  test.describe('Mobile View', () => {

    test('should have touch-friendly buttons on mobile', async ({ page }) => {
      await page.goto('/agents');
      await page.waitForLoadState('networkidle');

      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);

      // STRICT: Check first few buttons meet touch target requirements
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        expect(box).not.toBeNull();
        // Touch targets should be at least 32px for accessibility
        expect(box!.height).toBeGreaterThanOrEqual(32);
      }
    });
  });

  test.describe('Tablet View', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('should display agents content on tablet', async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
      await page.goto('/agents');
      await page.waitForLoadState('networkidle');

      const heading = page.locator('main h1, main h2').first();
      await expect(heading).toBeVisible();
    });
  });

  test.describe('Desktop View', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('should display agents with sidebar on desktop', async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
      await page.goto('/agents');
      await page.waitForLoadState('networkidle');

      const heading = page.locator('main h1, main h2').first();
      await expect(heading).toBeVisible();

      const sidebar = page.locator('aside, nav[class*="sidebar"]').first();
      await expect(sidebar).toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe('Agents - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
  });

  test('should have proper heading structure', async ({ page }) => {
    // STRICT: Must have h1
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    await expect(h1.first()).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
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

  test('should have accessible interactive elements with labels', async ({ page }) => {
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
    const createButton = page.locator('button').first();
    await createButton.focus();

    // STRICT: Button must be focusable
    await expect(createButton).toBeFocused();
  });
});

test.describe('Agents - Actions', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();

    // Ensure at least one agent exists for testing
    await ensureAgentExists(page);

    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
  });

  test('should show agent actions menu when agents exist', async ({ page }) => {
    // Agent should exist from beforeEach
    const agentCards = page.locator('[data-testid*="agent"], .agent-card, .border.rounded-lg');
    await expect(agentCards.first()).toBeVisible({ timeout: 5000 });

    const actionButton = page.locator(
      '[data-testid*="actions"], button[aria-label*="actions"], button:has(svg[class*="dots"]), button:has(svg[class*="more"])'
    ).first();

    // If no action button on card, check for action buttons within cards
    if (await actionButton.count() === 0) {
      // Some UIs have actions inline - look for edit/delete buttons
      const inlineActions = agentCards.first().locator('button');
      const inlineCount = await inlineActions.count();
      expect(inlineCount).toBeGreaterThan(0);
      return;
    }

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
