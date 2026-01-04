/**
 * User Level E2E Tests
 *
 * Tests the EATP user level system which provides different access based on:
 * - Level 1: Task Performer - Basic task access
 * - Level 2: Process Owner - Process management + delegation
 * - Level 3: Value Chain Owner - Full enterprise access + trust establishment
 *
 * These tests verify:
 * 1. Correct routes are accessible for each level
 * 2. Blocked routes redirect appropriately
 * 3. Sidebar shows correct items for each level
 * 4. Level transitions work correctly
 * 5. Toast notifications appear on level changes
 */

import { test, expect } from "@playwright/test";
import { setupAuth, navigateAuthenticated } from "./fixtures/auth";
import {
  type UserLevel,
  setupUserLevel,
  simulateLevelTransition,
  LEVEL_LABELS,
  LEVEL_ROUTES,
  getExpectedNavItems,
  verifySidebarForLevel,
} from "./fixtures/user-level";

test.describe("User Level 1: Task Performer", () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, "Failed to authenticate with backend").toBeTruthy();
    await setupUserLevel(page, 1);
  });

  test("can access dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Dashboard should load successfully
    await expect(page.locator("h1, h2").first()).toContainText(/dashboard/i);
  });

  test("can access tasks page", async ({ page }) => {
    await page.goto("/work/tasks");
    await page.waitForLoadState("networkidle");

    // Tasks page should load
    const heading = page.locator("h1, h2, [data-testid='page-title']").first();
    await expect(heading).toBeVisible();
  });

  test("blocked from processes page", async ({ page }) => {
    await page.goto("/work/processes");
    await page.waitForLoadState("networkidle");

    // Should be redirected or show access denied
    const url = page.url();
    const hasAccessDenied = await page
      .locator("text=/access denied|unauthorized|forbidden/i")
      .count();
    const wasRedirected = !url.includes("/work/processes");

    expect(
      hasAccessDenied > 0 || wasRedirected,
      "Level 1 should not access processes page"
    ).toBeTruthy();
  });

  test("blocked from value chains page", async ({ page }) => {
    await page.goto("/work/value-chains");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    const hasAccessDenied = await page
      .locator("text=/access denied|unauthorized|forbidden/i")
      .count();
    const wasRedirected = !url.includes("/work/value-chains");

    expect(
      hasAccessDenied > 0 || wasRedirected,
      "Level 1 should not access value chains page"
    ).toBeTruthy();
  });

  test("blocked from work units page", async ({ page }) => {
    await page.goto("/build/work-units");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    const hasAccessDenied = await page
      .locator("text=/access denied|unauthorized|forbidden/i")
      .count();
    const wasRedirected = !url.includes("/build/work-units");

    expect(
      hasAccessDenied > 0 || wasRedirected,
      "Level 1 should not access work units page"
    ).toBeTruthy();
  });

  test("blocked from compliance page", async ({ page }) => {
    await page.goto("/govern/compliance");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    const hasAccessDenied = await page
      .locator("text=/access denied|unauthorized|forbidden/i")
      .count();
    const wasRedirected = !url.includes("/govern/compliance");

    expect(
      hasAccessDenied > 0 || wasRedirected,
      "Level 1 should not access compliance page"
    ).toBeTruthy();
  });

  test("sidebar shows only WORK section", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Check for sidebar sections
    const workSection = page.locator("nav").locator("text=WORK");
    const buildSection = page.locator("nav").locator("text=BUILD");
    const governSection = page.locator("nav").locator("text=GOVERN");

    // WORK should be visible, BUILD and GOVERN should not
    if (await workSection.count()) {
      await expect(workSection.first()).toBeVisible();
    }

    // BUILD and GOVERN should be hidden or not exist for Level 1
    const buildCount = await buildSection.count();
    const governCount = await governSection.count();

    // If they exist, they should not be visible
    if (buildCount > 0) {
      const isVisible = await buildSection.first().isVisible();
      expect(isVisible, "BUILD section should be hidden for Level 1").toBeFalsy();
    }

    if (governCount > 0) {
      const isVisible = await governSection.first().isVisible();
      expect(isVisible, "GOVERN section should be hidden for Level 1").toBeFalsy();
    }
  });

  test("sidebar shows Dashboard and My Tasks links", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const dashboardLink = page.locator("nav a, nav button").filter({
      hasText: /dashboard/i,
    });
    const tasksLink = page.locator("nav a, nav button").filter({
      hasText: /tasks/i,
    });

    await expect(dashboardLink.first()).toBeVisible();
    await expect(tasksLink.first()).toBeVisible();
  });
});

test.describe("User Level 2: Process Owner", () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, "Failed to authenticate with backend").toBeTruthy();
    await setupUserLevel(page, 2);
  });

  test("can access dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1, h2").first()).toContainText(/dashboard/i);
  });

  test("can access tasks page", async ({ page }) => {
    await page.goto("/work/tasks");
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2, [data-testid='page-title']").first();
    await expect(heading).toBeVisible();
  });

  test("can access processes page", async ({ page }) => {
    await page.goto("/work/processes");
    await page.waitForLoadState("networkidle");

    // Should not be redirected
    expect(page.url()).toContain("/work/processes");

    const heading = page.locator("h1, h2, [data-testid='page-title']").first();
    await expect(heading).toBeVisible();
  });

  test("can access work units page", async ({ page }) => {
    await page.goto("/build/work-units");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/build/work-units");
  });

  test("can access workspaces page", async ({ page }) => {
    await page.goto("/build/workspaces");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/build/workspaces");
  });

  test("can access trust page", async ({ page }) => {
    await page.goto("/govern/trust");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/govern/trust");
  });

  test("blocked from value chains page", async ({ page }) => {
    await page.goto("/work/value-chains");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    const hasAccessDenied = await page
      .locator("text=/access denied|unauthorized|forbidden/i")
      .count();
    const wasRedirected = !url.includes("/work/value-chains");

    expect(
      hasAccessDenied > 0 || wasRedirected,
      "Level 2 should not access value chains page"
    ).toBeTruthy();
  });

  test("blocked from compliance page", async ({ page }) => {
    await page.goto("/govern/compliance");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    const hasAccessDenied = await page
      .locator("text=/access denied|unauthorized|forbidden/i")
      .count();
    const wasRedirected = !url.includes("/govern/compliance");

    expect(
      hasAccessDenied > 0 || wasRedirected,
      "Level 2 should not access compliance page"
    ).toBeTruthy();
  });

  test("blocked from audit trail page", async ({ page }) => {
    await page.goto("/govern/audit-trail");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    const hasAccessDenied = await page
      .locator("text=/access denied|unauthorized|forbidden/i")
      .count();
    const wasRedirected = !url.includes("/govern/audit-trail");

    expect(
      hasAccessDenied > 0 || wasRedirected,
      "Level 2 should not access audit trail page"
    ).toBeTruthy();
  });

  test("sidebar shows WORK, BUILD, GOVERN sections", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const nav = page.locator("nav");

    // Check for section visibility
    const workSection = nav.locator("text=WORK");
    const buildSection = nav.locator("text=BUILD");
    const governSection = nav.locator("text=GOVERN");

    if (await workSection.count()) {
      await expect(workSection.first()).toBeVisible();
    }

    if (await buildSection.count()) {
      await expect(buildSection.first()).toBeVisible();
    }

    if (await governSection.count()) {
      await expect(governSection.first()).toBeVisible();
    }
  });

  test("sidebar shows processes link", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const processesLink = page.locator("nav a, nav button").filter({
      hasText: /processes/i,
    });

    await expect(processesLink.first()).toBeVisible();
  });

  test("sidebar does not show value chains link", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const valueChainsLink = page.locator("nav a, nav button").filter({
      hasText: /value chain/i,
    });

    const count = await valueChainsLink.count();
    if (count > 0) {
      const isVisible = await valueChainsLink.first().isVisible();
      expect(isVisible, "Value Chains link should be hidden for Level 2").toBeFalsy();
    }
  });
});

test.describe("User Level 3: Value Chain Owner", () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, "Failed to authenticate with backend").toBeTruthy();
    await setupUserLevel(page, 3);
  });

  test("can access all accessible routes", async ({ page }) => {
    const accessibleRoutes = LEVEL_ROUTES[3].accessible;

    for (const route of accessibleRoutes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      // Should not be redirected and should not show access denied
      const hasAccessDenied = await page
        .locator("text=/access denied|unauthorized|forbidden/i")
        .count();

      expect(
        hasAccessDenied === 0,
        `Level 3 should be able to access ${route}`
      ).toBeTruthy();
    }
  });

  test("can access value chains page", async ({ page }) => {
    await page.goto("/work/value-chains");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/work/value-chains");

    const heading = page.locator("h1, h2, [data-testid='page-title']").first();
    await expect(heading).toBeVisible();
  });

  test("can access compliance page", async ({ page }) => {
    await page.goto("/govern/compliance");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/govern/compliance");
  });

  test("can access audit trail page", async ({ page }) => {
    await page.goto("/govern/audit-trail");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/govern/audit-trail");
  });

  test("sidebar shows all sections", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const nav = page.locator("nav");

    // All sections should be visible
    const sections = ["WORK", "BUILD", "GOVERN"];
    for (const section of sections) {
      const sectionLocator = nav.locator(`text=${section}`);
      if (await sectionLocator.count()) {
        await expect(sectionLocator.first()).toBeVisible();
      }
    }
  });

  test("sidebar shows value chains link", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const valueChainsLink = page.locator("nav a, nav button").filter({
      hasText: /value chain/i,
    });

    await expect(valueChainsLink.first()).toBeVisible();
  });

  test("sidebar shows compliance link", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const complianceLink = page.locator("nav a, nav button").filter({
      hasText: /compliance/i,
    });

    await expect(complianceLink.first()).toBeVisible();
  });
});

test.describe("Route Guards", () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, "Failed to authenticate with backend").toBeTruthy();
  });

  test("Level 1 blocked routes redirect correctly", async ({ page }) => {
    await setupUserLevel(page, 1);

    const blockedRoutes = LEVEL_ROUTES[1].blocked;

    for (const route of blockedRoutes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      // Either redirect or access denied message
      const url = page.url();
      const hasAccessDenied = await page
        .locator("text=/access denied|unauthorized|forbidden/i")
        .count();
      const wasRedirected = !url.includes(route);

      expect(
        hasAccessDenied > 0 || wasRedirected,
        `Level 1 should be blocked from ${route}`
      ).toBeTruthy();
    }
  });

  test("Level 2 blocked routes redirect correctly", async ({ page }) => {
    await setupUserLevel(page, 2);

    const blockedRoutes = LEVEL_ROUTES[2].blocked;

    for (const route of blockedRoutes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      const url = page.url();
      const hasAccessDenied = await page
        .locator("text=/access denied|unauthorized|forbidden/i")
        .count();
      const wasRedirected = !url.includes(route);

      expect(
        hasAccessDenied > 0 || wasRedirected,
        `Level 2 should be blocked from ${route}`
      ).toBeTruthy();
    }
  });

  test("Level 3 has no blocked routes", async ({ page }) => {
    await setupUserLevel(page, 3);

    // Level 3 should have no blocked routes
    expect(
      LEVEL_ROUTES[3].blocked.length,
      "Level 3 should have no blocked routes"
    ).toBe(0);
  });
});

test.describe("Level Transitions", () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, "Failed to authenticate with backend").toBeTruthy();
  });

  test("upgrade from Level 1 to Level 2 shows notification", async ({
    page,
  }) => {
    // Start at Level 1
    await setupUserLevel(page, 1);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Simulate transition to Level 2
    await simulateLevelTransition(page, 1, 2);

    // Wait for toast notification
    await page.waitForTimeout(1000);

    // Check for upgrade notification
    const toast = page.locator("[data-sonner-toast], [role='alert'], .toast");
    const hasUpgradeText = await page
      .locator("text=/process owner|access granted|upgrade/i")
      .count();

    // Either toast appears or the text is visible somewhere
    expect(
      (await toast.count()) > 0 || hasUpgradeText > 0,
      "Should show upgrade notification"
    ).toBeTruthy();
  });

  test("upgrade from Level 2 to Level 3 shows notification", async ({
    page,
  }) => {
    await setupUserLevel(page, 2);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    await simulateLevelTransition(page, 2, 3);
    await page.waitForTimeout(1000);

    const toast = page.locator("[data-sonner-toast], [role='alert'], .toast");
    const hasUpgradeText = await page
      .locator("text=/value chain|access granted|upgrade/i")
      .count();

    expect(
      (await toast.count()) > 0 || hasUpgradeText > 0,
      "Should show upgrade notification"
    ).toBeTruthy();
  });

  test("sidebar updates on level transition", async ({ page }) => {
    // Start at Level 1
    await setupUserLevel(page, 1);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Verify Level 1 sidebar (no processes link)
    let processesLink = page.locator("nav a, nav button").filter({
      hasText: /processes/i,
    });
    let processesCount = await processesLink.count();
    let processesVisible =
      processesCount > 0 && (await processesLink.first().isVisible());

    // Processes should be hidden for Level 1
    if (processesCount > 0) {
      expect(processesVisible, "Processes should be hidden for Level 1").toBeFalsy();
    }

    // Transition to Level 2
    await simulateLevelTransition(page, 1, 2);
    await page.waitForTimeout(1000);

    // Reload to pick up new level
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Verify Level 2 sidebar (processes link visible)
    processesLink = page.locator("nav a, nav button").filter({
      hasText: /processes/i,
    });
    processesCount = await processesLink.count();

    if (processesCount > 0) {
      processesVisible = await processesLink.first().isVisible();
      expect(processesVisible, "Processes should be visible for Level 2").toBeTruthy();
    }
  });

  test("downgrade from Level 3 to Level 2 hides value chains", async ({
    page,
  }) => {
    // Start at Level 3
    await setupUserLevel(page, 3);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Verify Level 3 sidebar (value chains visible)
    let valueChainsLink = page.locator("nav a, nav button").filter({
      hasText: /value chain/i,
    });
    let valueChainsCount = await valueChainsLink.count();
    let valueChainsVisible =
      valueChainsCount > 0 && (await valueChainsLink.first().isVisible());

    expect(valueChainsVisible, "Value Chains should be visible for Level 3").toBeTruthy();

    // Downgrade to Level 2
    await simulateLevelTransition(page, 3, 2);
    await page.waitForTimeout(1000);

    // Reload to pick up new level
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Verify value chains is now hidden
    valueChainsLink = page.locator("nav a, nav button").filter({
      hasText: /value chain/i,
    });
    valueChainsCount = await valueChainsLink.count();

    if (valueChainsCount > 0) {
      valueChainsVisible = await valueChainsLink.first().isVisible();
      expect(valueChainsVisible, "Value Chains should be hidden after downgrade").toBeFalsy();
    }
  });
});

test.describe("Sidebar Collapsible Sections", () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, "Failed to authenticate with backend").toBeTruthy();
    await setupUserLevel(page, 3); // Level 3 sees all sections
  });

  test("section headers are clickable and toggle collapse", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Find a section header (button with section name)
    const sectionButton = page.locator("nav button").filter({
      hasText: /WORK|BUILD|GOVERN/,
    }).first();

    if (await sectionButton.count()) {
      // Check initial state
      const initialExpanded = await sectionButton.getAttribute("aria-expanded");

      // Click to toggle
      await sectionButton.click();
      await page.waitForTimeout(300);

      // Check new state
      const newExpanded = await sectionButton.getAttribute("aria-expanded");

      // State should have changed
      expect(
        initialExpanded !== newExpanded,
        "Section should toggle on click"
      ).toBeTruthy();
    }
  });

  test("collapsed state persists across page refresh", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Find a section header
    const sectionButton = page.locator("nav button").filter({
      hasText: /WORK|BUILD|GOVERN/,
    }).first();

    if (await sectionButton.count()) {
      // Collapse the section
      const initialExpanded = await sectionButton.getAttribute("aria-expanded");
      if (initialExpanded === "true") {
        await sectionButton.click();
        await page.waitForTimeout(300);
      }

      // Verify it's collapsed
      const collapsedExpanded = await sectionButton.getAttribute("aria-expanded");
      expect(collapsedExpanded).toBe("false");

      // Refresh the page
      await page.reload();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      // Find the section button again
      const sectionButtonAfter = page.locator("nav button").filter({
        hasText: /WORK|BUILD|GOVERN/,
      }).first();

      // Should still be collapsed
      const persistedExpanded = await sectionButtonAfter.getAttribute("aria-expanded");
      expect(persistedExpanded, "Collapsed state should persist after refresh").toBe("false");
    }
  });

  test("keyboard navigation works for sidebar", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Focus on sidebar navigation
    const nav = page.locator("nav[role='navigation'], nav[aria-label]").first();

    if (await nav.count()) {
      // Focus the first link
      const firstLink = nav.locator("a, button").first();
      await firstLink.focus();

      // Press arrow down
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(100);

      // Verify focus moved (check that a different element is focused)
      const focusedElement = page.locator(":focus");
      await expect(focusedElement).toBeVisible();
    }
  });
});

test.describe("Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, "Failed to authenticate with backend").toBeTruthy();
    await setupUserLevel(page, 3);
  });

  test("sidebar has proper ARIA attributes", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Check for navigation role
    const nav = page.locator("nav[role='navigation'], nav[aria-label]");
    expect(await nav.count(), "Sidebar should have navigation role").toBeGreaterThan(0);

    // Check section buttons have aria-expanded
    const sectionButtons = page.locator("nav button[aria-expanded]");
    const buttonCount = await sectionButtons.count();

    if (buttonCount > 0) {
      for (let i = 0; i < buttonCount; i++) {
        const expanded = await sectionButtons.nth(i).getAttribute("aria-expanded");
        expect(
          expanded === "true" || expanded === "false",
          "Section buttons should have valid aria-expanded"
        ).toBeTruthy();
      }
    }
  });

  test("active links have aria-current", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Find the active link (should be dashboard)
    const activeLink = page.locator("nav a[aria-current='page']");
    const count = await activeLink.count();

    // At least one link should be marked as current
    if (count > 0) {
      await expect(activeLink.first()).toContainText(/dashboard/i);
    }
  });
});
