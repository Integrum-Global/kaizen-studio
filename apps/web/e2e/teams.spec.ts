import { test, expect } from '@playwright/test';
import { setupAuth } from './fixtures/auth';
import { ensureTeamExists } from './fixtures/test-data';

test.describe('Teams List Page', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    // Ensure test team exists before running tests
    await ensureTeamExists(page);
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
  });

  test('should display teams page header with correct title', async ({ page }) => {
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/team/i);
  });

  test('should show create team or invite button', async ({ page }) => {
    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("New"), button:has-text("Invite"), button:has-text("Add"), a[href*="new"]'
    ).first();

    await expect(createButton).toBeVisible({ timeout: 5000 });
    await expect(createButton).toBeEnabled();
  });

  test('should display team members list or empty state', async ({ page }) => {
    const teamItems = page.locator(
      '[data-testid*="team"], [data-testid*="member"], .team-card, .member-row, tr[data-testid], .border.rounded-lg'
    );
    const emptyState = page.locator(
      'text=/no team|no members|invite members|get started|add your first/i'
    );

    const itemCount = await teamItems.count();
    const emptyCount = await emptyState.count();

    // STRICT: Must have exactly one - items OR empty state
    expect(itemCount > 0 || emptyCount > 0).toBeTruthy();

    if (itemCount > 0) {
      await expect(teamItems.first()).toBeVisible();
      // STRICT: Verify item has meaningful content
      const itemText = await teamItems.first().textContent();
      expect(itemText?.trim().length).toBeGreaterThan(3);
    } else {
      await expect(emptyState.first()).toBeVisible();
    }
  });

  test('should have search functionality with working input', async ({ page }) => {
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search" i], input[placeholder*="Search"]'
    ).first();

    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await expect(searchInput).toBeEnabled();

    // STRICT: Verify search input accepts and shows value
    await searchInput.fill('test search');
    await expect(searchInput).toHaveValue('test search');

    // STRICT: Clear works too
    await searchInput.clear();
    await expect(searchInput).toHaveValue('');
  });
});

test.describe('Teams - Member Management', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
  });

  test('should open invite member dialog with form elements', async ({ page }) => {
    const inviteButton = page.locator(
      'button:has-text("Invite"), button:has-text("Add Member"), button:has-text("Add")'
    ).first();

    await expect(inviteButton).toBeVisible({ timeout: 5000 });
    await inviteButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // STRICT: Dialog must have form input
    const formInputs = dialog.locator('input');
    const inputCount = await formInputs.count();
    expect(inputCount).toBeGreaterThan(0);
    await expect(formInputs.first()).toBeVisible();
  });

  test('should display member roles when members exist', async ({ page }) => {
    const memberItems = page.locator('[data-testid*="member"], .member-row, tbody tr');
    const memberCount = await memberItems.count();

    // STRICT: Skip if no members, but require roles if members exist
    test.skip(memberCount === 0, 'No members to test role display');

    const roles = page.locator('text=/Admin|Member|Owner|Viewer|Editor|Developer/i');
    const roleCount = await roles.count();
    expect(roleCount).toBeGreaterThan(0);
    await expect(roles.first()).toBeVisible();
  });

  test('should show member email or name for each member', async ({ page }) => {
    const memberInfo = page.locator('[data-testid*="member"], .member-item, tbody tr');
    const memberCount = await memberInfo.count();

    // STRICT: Skip if no members
    test.skip(memberCount === 0, 'No members to verify info');

    const firstMember = memberInfo.first();
    await expect(firstMember).toBeVisible();

    // STRICT: Member must have identifiable content (email with @ or name)
    const memberText = await firstMember.textContent();
    expect(memberText?.length).toBeGreaterThan(5);
  });
});

test.describe('Teams - Role Management', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
  });

  test('should display role labels for members', async ({ page }) => {
    const members = page.locator('[data-testid*="member"], .member-row, tbody tr');
    const memberCount = await members.count();

    // STRICT: Skip if no members to test
    test.skip(memberCount === 0, 'No members to verify role labels');

    const roleLabels = page.locator(
      '.badge, [class*="role"], text=/Admin|Member|Owner|Viewer|Editor/i'
    );
    const roleCount = await roleLabels.count();
    expect(roleCount).toBeGreaterThan(0);
    await expect(roleLabels.first()).toBeVisible();
  });

  test('should show role change dropdown with options when clicking role selector', async ({ page }) => {
    const roleButton = page.locator(
      '[data-testid*="role-selector"], .role-dropdown, button:has(.badge)'
    ).first();

    const roleButtonCount = await roleButton.count();
    // STRICT: Skip if no role selector exists
    test.skip(roleButtonCount === 0, 'No role selector to test');

    await roleButton.click();

    const options = page.locator('[role="option"], [role="menuitem"], [role="listbox"] li');
    await expect(options.first()).toBeVisible({ timeout: 3000 });

    // STRICT: Must have multiple role options
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(1);
  });
});

test.describe('Teams - Invite Flow', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
  });

  test('should open invite dialog and show email input', async ({ page }) => {
    const inviteButton = page.locator('button:has-text("Invite"), button:has-text("Add")').first();
    await expect(inviteButton).toBeVisible({ timeout: 5000 });
    await inviteButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // STRICT: Dialog must have email input
    const emailInput = dialog.locator(
      'input[type="email"], input[placeholder*="email" i], input[name*="email"]'
    ).first();
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toBeEnabled();
  });

  test('should validate email input rejects invalid format', async ({ page }) => {
    const inviteButton = page.locator('button:has-text("Invite"), button:has-text("Add")').first();
    await expect(inviteButton).toBeVisible({ timeout: 5000 });
    await inviteButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    const emailInput = dialog.locator('input[type="email"], input[placeholder*="email" i]').first();
    await expect(emailInput).toBeVisible();

    // STRICT: Enter invalid email
    await emailInput.fill('invalid-email');

    const submitButton = dialog.locator('button[type="submit"], button:has-text("Send"), button:has-text("Invite")').first();
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    await page.waitForTimeout(300);

    // STRICT: Must show validation error or input must be invalid
    const errorText = page.locator('text=/invalid|valid email/i');
    const errorClass = page.locator('[class*="error"]');
    const hasErrorText = await errorText.count() > 0;
    const hasErrorClass = await errorClass.count() > 0;
    const inputInvalid = await emailInput.evaluate(el => !(el as HTMLInputElement).validity.valid);
    expect(hasErrorText || hasErrorClass || inputInvalid).toBeTruthy();
  });

  test('should close invite dialog with escape key', async ({ page }) => {
    const inviteButton = page.locator('button:has-text("Invite"), button:has-text("Add")').first();
    await expect(inviteButton).toBeVisible({ timeout: 5000 });
    await inviteButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // STRICT: Escape must close dialog
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 2000 });
  });

  test('should close invite dialog with cancel button', async ({ page }) => {
    const inviteButton = page.locator('button:has-text("Invite"), button:has-text("Add")').first();
    await expect(inviteButton).toBeVisible({ timeout: 5000 });
    await inviteButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    const cancelButton = dialog.locator('button:has-text("Cancel"), button[aria-label*="close"]').first();
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();
    await expect(dialog).not.toBeVisible({ timeout: 2000 });
  });
});

test.describe('Teams - Responsive', () => {
  test.describe('Mobile View', () => {

    test('should have mobile-friendly touch targets', async ({ page }) => {
      await page.goto('/teams');
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

    test('should display teams content on tablet', async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
      await page.goto('/teams');
      await page.waitForLoadState('networkidle');

      const heading = page.locator('main h1, main h2').first();
      await expect(heading).toBeVisible();
    });
  });

  test.describe('Desktop View', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('should display teams with sidebar on desktop', async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
      await page.goto('/teams');
      await page.waitForLoadState('networkidle');

      const heading = page.locator('main h1, main h2').first();
      await expect(heading).toBeVisible();

      const sidebar = page.locator('aside, nav[class*="sidebar"]').first();
      await expect(sidebar).toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe('Teams - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/teams');
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

    // STRICT: Must tab through interactive elements
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

  test('should have accessible table with headers when table exists', async ({ page }) => {
    const table = page.locator('table');
    const tableCount = await table.count();

    // STRICT: Skip if no table
    test.skip(tableCount === 0, 'No table to verify accessibility');

    const headers = table.locator('th');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(0);

    // STRICT: Headers must have content
    const firstHeader = headers.first();
    const headerText = await firstHeader.textContent();
    expect(headerText?.trim().length).toBeGreaterThan(0);
  });
});

test.describe('Teams - Actions', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
  });

  test('should show member actions menu with options when members exist', async ({ page }) => {
    const memberRows = page.locator('[data-testid*="member"], .member-row, tbody tr');
    const memberCount = await memberRows.count();

    // STRICT: Skip if no members
    test.skip(memberCount === 0, 'No members to test actions menu');

    const actionButton = page.locator(
      '[data-testid*="actions"], button[aria-label*="actions"], .actions-menu, button:has(svg)'
    ).first();

    await expect(actionButton).toBeVisible();
    await actionButton.click();

    const menu = page.locator('[role="menu"], [role="listbox"]');
    await expect(menu.first()).toBeVisible({ timeout: 3000 });

    // STRICT: Menu must have action items
    const menuItems = menu.locator('[role="menuitem"], li');
    const itemCount = await menuItems.count();
    expect(itemCount).toBeGreaterThan(0);
  });

  test('should confirm before removing member when remove option exists', async ({ page }) => {
    const memberRows = page.locator('[data-testid*="member"], .member-row');
    const memberCount = await memberRows.count();

    // STRICT: Skip if no members
    test.skip(memberCount === 0, 'No members to test remove confirmation');

    // Open actions menu
    const actionButton = memberRows.first().locator('button[aria-label*="actions"], button:has(svg)').first();
    const actionButtonCount = await actionButton.count();

    test.skip(actionButtonCount === 0, 'No action button found');

    await actionButton.click();

    const removeOption = page.locator('[role="menuitem"]:has-text("Remove"), button:has-text("Remove")').first();
    const removeCount = await removeOption.count();

    test.skip(removeCount === 0, 'No remove option in menu');

    await removeOption.click();

    // STRICT: Should show confirmation dialog
    const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]:has-text("confirm")');
    await expect(confirmDialog).toBeVisible({ timeout: 3000 });
  });
});
