import { test, expect } from "@playwright/test";

/**
 * Tier 2: Integration Tests with Real API (NO MOCKING)
 *
 * Intent: Verify that users can successfully register external agents
 * through the complete 6-step wizard workflow, with all data correctly
 * submitted to the real backend API and appearing in the agent list.
 */

test.describe("External Agent Registration Workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to external agents page
    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || "test@example.com");
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || "password");
    await page.click('button[type="submit"]');

    // Wait for login to complete
    await page.waitForURL("/dashboard");

    // Navigate to external agents page
    await page.goto("/settings/external-agents");
  });

  test("complete Teams agent registration workflow", async ({ page }) => {
    /**
     * Intent: User can register a Teams external agent by completing
     * all 6 wizard steps and see the agent appear in the list.
     */

    // Click Register External Agent button
    await page.click('button:has-text("Register External Agent")');

    // Wait for wizard dialog
    await expect(page.locator('[aria-labelledby="wizard-title"]')).toBeVisible();

    // Step 1: Select Teams provider
    await page.click('input[value="teams"]');
    await expect(page.locator('text=Selected:')).toBeVisible();
    await expect(page.locator('text=Microsoft Teams')).toBeVisible();
    await page.click('button:has-text("Next")');

    // Step 2: Fill basic information
    await expect(page.locator('text=Step 2 of 6')).toBeVisible();
    await page.fill('input[id="name"]', "Test Teams Agent E2E");
    await page.fill('textarea[id="description"]', "Created via E2E test");

    // Add tags
    await page.fill('input[id="tags"]', "test");
    await page.keyboard.press("Enter");
    await page.fill('input[id="tags"]', "e2e");
    await page.keyboard.press("Enter");

    await expect(page.locator('text=test')).toBeVisible();
    await expect(page.locator('text=e2e')).toBeVisible();
    await page.click('button:has-text("Next")');

    // Step 3: Configure authentication
    await expect(page.locator('text=Step 3 of 6')).toBeVisible();
    await page.click('input[id="api_key"]'); // Select API Key auth
    await page.fill('input[id="api-key"]', "test-api-key-123");
    await page.fill('input[id="header-name"]', "X-API-Key");
    await page.click('button:has-text("Next")');

    // Step 4: Configure platform (Teams)
    await expect(page.locator('text=Step 4 of 6')).toBeVisible();
    await page.fill('input[id="tenant-id"]', "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    await page.fill('input[id="channel-id"]', "19:xxxxxx@thread.tacv2");
    await page.click('button:has-text("Next")');

    // Step 5: Set governance settings (optional)
    await expect(page.locator('text=Step 5 of 6')).toBeVisible();
    await page.fill('input[id="max-monthly-cost"]', "100");
    await page.fill('input[id="requests-per-minute"]', "10");
    await page.fill('input[id="requests-per-hour"]', "100");
    await page.fill('input[id="requests-per-day"]', "1000");
    await page.click('button:has-text("Next")');

    // Step 6: Review and submit
    await expect(page.locator('text=Step 6 of 6')).toBeVisible();
    await expect(page.locator('text=Test Teams Agent E2E')).toBeVisible();
    await expect(page.locator('text=teams')).toBeVisible();

    // Submit the form
    await page.click('button:has-text("Submit")');

    // Verify success toast
    await expect(page.locator('text=External agent registered successfully')).toBeVisible({ timeout: 10000 });

    // Verify agent appears in the table
    await expect(page.locator('text=Test Teams Agent E2E')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="row"]:has-text("Test Teams Agent E2E")')).toBeVisible();
  });

  test("validate wizard prevents progression with invalid data", async ({ page }) => {
    /**
     * Intent: Wizard validates user input and prevents progression
     * to next step when required fields are missing or invalid.
     */

    await page.click('button:has-text("Register External Agent")');
    await expect(page.locator('[aria-labelledby="wizard-title"]')).toBeVisible();

    // Step 1: Next button should be disabled without provider selection
    const nextButton = page.locator('button[aria-label="Go to next step"]');
    await expect(nextButton).toBeDisabled();

    // Select provider and proceed
    await page.click('input[value="discord"]');
    await expect(nextButton).toBeEnabled();
    await page.click('button:has-text("Next")');

    // Step 2: Next button disabled with name < 3 characters
    await expect(page.locator('text=Step 2 of 6')).toBeVisible();
    await expect(nextButton).toBeDisabled();

    await page.fill('input[id="name"]', "ab");
    await expect(page.locator('text=Name must be at least 3 characters')).toBeVisible();
    await expect(nextButton).toBeDisabled();

    // Valid name enables next
    await page.fill('input[id="name"]', "Valid Agent Name");
    await expect(nextButton).toBeEnabled();
  });

  test("wizard persists data when navigating backward", async ({ page }) => {
    /**
     * Intent: Users can navigate backward through wizard steps
     * without losing previously entered data.
     */

    await page.click('button:has-text("Register External Agent")');
    await expect(page.locator('[aria-labelledby="wizard-title"]')).toBeVisible();

    // Step 1: Select Slack
    await page.click('input[value="slack"]');
    await page.click('button:has-text("Next")');

    // Step 2: Enter name
    await page.fill('input[id="name"]', "Slack Integration Test");
    await page.click('button:has-text("Next")');

    // Step 3: Configure auth
    await page.click('input[id="api_key"]');
    await page.fill('input[id="api-key"]', "slack-test-key");

    // Navigate back to step 2
    await page.click('button[aria-label="Go to previous step"]');
    await expect(page.locator('text=Step 2 of 6')).toBeVisible();

    // Verify name is still filled
    await expect(page.locator('input[id="name"]')).toHaveValue("Slack Integration Test");

    // Navigate back to step 1
    await page.click('button[aria-label="Go to previous step"]');
    await expect(page.locator('text=Step 1 of 6')).toBeVisible();

    // Verify Slack is still selected
    await expect(page.locator('text=Selected:')).toBeVisible();
    await expect(page.locator('text=Slack')).toBeVisible();
  });
});
