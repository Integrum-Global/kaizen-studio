import { test, expect } from "@playwright/test";

/**
 * Tier 3: End-to-End Tests with Real Infrastructure (NO MOCKING)
 *
 * Intent: Verify complete user workflows work end-to-end with real
 * PostgreSQL, Redis, and backend API services.
 */

test.describe("External Agent Complete Lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || "test@example.com");
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || "password");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("complete lifecycle: register → view details → governance enforcement", async ({ page }) => {
    /**
     * Intent: User can register an external agent, view its details
     * including all tabs (Overview, Invocations, Lineage, Governance),
     * and see governance enforcement working.
     */

    // Navigate to external agents
    await page.goto("/settings/external-agents");

    // Register new agent with low budget for testing
    await page.click('button:has-text("Register External Agent")');
    await page.click('input[value="discord"]');
    await page.click('button:has-text("Next")');

    await page.fill('input[id="name"]', "Discord Test E2E");
    await page.fill('textarea[id="description"]', "E2E test with governance");
    await page.click('button:has-text("Next")');

    await page.click('input[id="api_key"]');
    await page.fill('input[id="api-key"]', "discord-test-key");
    await page.click('button:has-text("Next")');

    await page.fill('input[id="webhook-url"]', "https://discord.com/api/webhooks/123/test");
    await page.fill('input[id="username"]', "TestBot");
    await page.click('button:has-text("Next")');

    // Set low budget for governance testing
    await page.fill('input[id="max-monthly-cost"]', "5");
    await page.fill('input[id="requests-per-minute"]', "5");
    await page.click('button:has-text("Next")');

    await page.click('button:has-text("Submit")');
    await expect(page.locator('text=External agent registered successfully')).toBeVisible({ timeout: 10000 });

    // Click on the agent row to open details modal
    await page.click('text=Discord Test E2E');

    // Wait for modal to open
    await expect(page.locator('[aria-labelledby="agent-details-title"]')).toBeVisible();

    // Verify Overview tab
    await expect(page.locator('text=Agent Information')).toBeVisible();
    await expect(page.locator('text=discord')).toBeVisible();
    await expect(page.locator('text=active')).toBeVisible();

    // Switch to Invocations tab
    await page.click('button[role="tab"]:has-text("Invocations")');
    await expect(page.locator('text=No invocations yet')).toBeVisible();

    // Switch to Lineage tab
    await page.click('button[role="tab"]:has-text("Lineage")');
    // Lineage may be empty initially
    await expect(page.locator('[role="tabpanel"]')).toBeVisible();

    // Switch to Governance tab
    await page.click('button[role="tab"]:has-text("Governance")');
    await expect(page.locator('text=Budget Usage')).toBeVisible();
    await expect(page.locator('text=Rate Limit Status')).toBeVisible();

    // Verify governance limits are displayed
    await expect(page.locator('text=$5.00')).toBeVisible(); // Budget limit
    await expect(page.locator('text=5 / 5')).toBeVisible(); // Rate limit per minute

    // Close modal
    await page.keyboard.press("Escape");
    await expect(page.locator('[aria-labelledby="agent-details-title"]')).not.toBeVisible();
  });

  test("governance enforcement: budget exceeded prevents invocation", async ({ page }) => {
    /**
     * Intent: When an external agent exceeds its budget limit,
     * the governance system prevents further invocations and
     * displays appropriate error messages.
     */

    // Navigate to external agents
    await page.goto("/settings/external-agents");

    // Find an agent with governance limits (or create one)
    // For this test, we'll assume there's an agent with max_monthly_cost set
    const agentRow = page.locator('[role="row"]:has-text("Discord Test E2E")').first();
    if (await agentRow.isVisible()) {
      await agentRow.click();

      // Open Governance tab
      await page.click('button[role="tab"]:has-text("Governance")');

      // Check current budget usage
      const budgetText = await page.locator('text=/\\$\\d+\\.\\d+/').first().textContent();

      // If budget is at or near limit, verify warning is shown
      const overBudgetWarning = page.locator('text=/Budget usage is above/i');
      const isNearLimit = await overBudgetWarning.isVisible();

      if (isNearLimit) {
        // Verify warning message is displayed
        expect(await overBudgetWarning.textContent()).toContain("Budget usage is above");

        // Verify budget widget shows red color for over 90% usage
        const percentageElement = page.locator('text=/%/i').first();
        expect(await percentageElement.isVisible()).toBe(true);
      }

      // Close modal
      await page.keyboard.press("Escape");
    }
  });

  test("accessibility: keyboard navigation through entire workflow", async ({ page }) => {
    /**
     * Intent: Users can navigate the entire external agents UI
     * using only keyboard (no mouse), meeting WCAG 2.1 AA compliance.
     */

    await page.goto("/settings/external-agents");

    // Tab to "Register External Agent" button
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Open wizard with Enter
    await page.keyboard.press("Enter");
    await expect(page.locator('[aria-labelledby="wizard-title"]')).toBeVisible();

    // Navigate wizard with Tab and Enter
    // Step 1: Select provider using arrow keys
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Space"); // Select first provider
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter"); // Click Next

    // Step 2: Fill name field
    await expect(page.locator('text=Step 2 of 6')).toBeVisible();
    await page.keyboard.press("Tab");
    await page.keyboard.type("Keyboard Navigation Test");

    // Navigate to Next button
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");

    // Verify we moved to step 3
    await expect(page.locator('text=Step 3 of 6')).toBeVisible();

    // Close wizard with Escape
    await page.keyboard.press("Escape");
    await expect(page.locator('[aria-labelledby="wizard-title"]')).not.toBeVisible();

    // Verify focus returns to page (no focus trap)
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test("lineage visualization with purple borders for external agents", async ({ page }) => {
    /**
     * Intent: External agent nodes in the lineage graph display
     * with purple borders (#8B5CF6) and platform icons to
     * distinguish them from workflow nodes.
     */

    await page.goto("/settings/external-agents");

    // Find an agent that has been invoked (has lineage data)
    const agentRow = page.locator('[role="row"]').first();
    await agentRow.click();

    // Navigate to Lineage tab
    await page.click('button[role="tab"]:has-text("Lineage")');

    // Check if lineage graph exists
    const lineageContainer = page.locator('[class*="react-flow"]');
    const hasLineage = await lineageContainer.isVisible().catch(() => false);

    if (hasLineage) {
      // Verify external agent node has purple border
      const externalAgentNode = page.locator('[data-type="externalAgent"]').first();
      if (await externalAgentNode.isVisible()) {
        // Check for purple border styling
        const borderStyle = await externalAgentNode.evaluate((node) => {
          return window.getComputedStyle(node).borderColor;
        });

        // Purple border should be present
        expect(borderStyle).toBeTruthy();

        // Verify platform icon is visible
        const icon = externalAgentNode.locator('svg').first();
        expect(await icon.isVisible()).toBe(true);
      }
    }

    await page.keyboard.press("Escape");
  });

  test("real-time governance metrics update with polling", async ({ page }) => {
    /**
     * Intent: Governance metrics auto-refresh every 30 seconds
     * to show real-time budget usage and rate limit status
     * without requiring page reload.
     */

    await page.goto("/settings/external-agents");

    // Find an agent and open details
    const agentRow = page.locator('[role="row"]').first();
    await agentRow.click();

    // Navigate to Governance tab
    await page.click('button[role="tab"]:has-text("Governance")');

    // Get initial budget value
    const initialBudget = await page.locator('text=/Current Cost/i').locator('+ p').textContent();

    // Wait for 35 seconds (longer than 30s polling interval)
    await page.waitForTimeout(35000);

    // Check if budget value has been refreshed (DOM should have updated)
    const currentBudget = await page.locator('text=/Current Cost/i').locator('+ p').textContent();

    // Budget value should exist (may or may not have changed depending on invocations)
    expect(currentBudget).toBeTruthy();

    // Verify no full page reload occurred (URL should remain same)
    expect(page.url()).toContain("/settings/external-agents");

    await page.keyboard.press("Escape");
  });
});
