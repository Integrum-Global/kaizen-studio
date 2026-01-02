# E2E Test Fixtures

Comprehensive test data fixtures for E2E testing in Kaizen Studio.

## Overview

This directory contains fixtures for setting up and cleaning up test data across all entity types in the Kaizen Studio platform.

## Files

- **auth.ts** - Authentication utilities (login, register, setup auth)
- **test-data.ts** - Individual entity creation and ensure functions
- **seed.ts** - Comprehensive test data seeding
- **cleanup.ts** - Test data cleanup with error handling

## Usage

### Basic Setup & Cleanup

```typescript
import { test } from "@playwright/test";
import { seedTestData } from "./fixtures/seed";
import { cleanupTestData } from "./fixtures/cleanup";

test.describe("My Feature Tests", () => {
  let testData;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    testData = await seedTestData(page);
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await cleanupTestData(page, testData);
    await page.close();
  });

  test("should work with test data", async ({ page }) => {
    // Your test here - testData contains all created entities
    console.log("Using agent:", testData.agents[0]);
  });
});
```

### Minimal Test Data

For quick tests that don't need comprehensive data:

```typescript
import { seedMinimalTestData } from "./fixtures/seed";

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  testData = await seedMinimalTestData(page); // Creates 1 of each entity
  await page.close();
});
```

### Ensure Functions

Use ensure functions to check if data exists before creating:

```typescript
import { ensureAgentExists, ensurePipelineExists } from "./fixtures/test-data";

test("should use existing or create new agent", async ({ page }) => {
  await setupAuth(page);
  const agent = await ensureAgentExists(page);
  // Will use existing agent if found, or create new one
});
```

### Selective Cleanup

Skip cleanup for specific entity types:

```typescript
import { cleanupTestData } from "./fixtures/cleanup";

await cleanupTestData(page, testData, {
  skipAgents: true, // Keep agents for next test
  skipPipelines: false, // Delete pipelines
  ignoreErrors: true, // Continue even if some deletions fail
});
```

### Cleanup All Data

Nuclear option - deletes everything:

```typescript
import { cleanupAllTestData } from "./fixtures/cleanup";

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  await cleanupAllTestData(page); // Deletes ALL entities
  await page.close();
});
```

### Verify Cleanup

Check if cleanup was successful:

```typescript
import { verifyCleanup } from "./fixtures/cleanup";

const result = await verifyCleanup(page, testData);
if (!result.success) {
  console.error("Cleanup failed:", result.remaining);
}
```

## Available Entities

The fixtures support these entity types:

- **Agents** - AI agents with different models and configurations
- **Pipelines** - Data processing pipelines
- **Deployments** - Pipeline deployments to different environments
- **Teams** - Organizational teams
- **Gateways** - API gateways
- **Connectors** - External system connectors
- **Webhooks** - Event webhooks

## Test Data Structure

```typescript
interface SeededTestData {
  agents: Array<{ id: string; name: string }>;
  pipelines: Array<{ id: string; name: string }>;
  deployments: Array<{ id: string; name: string }>;
  teams: Array<{ id: string; name: string }>;
  gateways: Array<{ id: string; name: string }>;
  connectors: Array<{ id: string; name: string }>;
  webhooks: Array<{ id: string; name: string }>;
}
```

## API Endpoints

All fixtures use these backend API endpoints:

- `POST /api/v1/agents` - Create agent
- `POST /api/v1/pipelines` - Create pipeline
- `POST /api/v1/deployments` - Create deployment
- `POST /api/v1/teams` - Create team
- `POST /api/v1/teams/{id}/members` - Add team member
- `POST /api/v1/gateways` - Create gateway
- `POST /api/v1/connectors` - Create connector
- `POST /api/v1/webhooks` - Create webhook
- `GET /api/v1/{entity_type}` - List entities
- `DELETE /api/v1/{entity_type}/{id}` - Delete entity

## Authentication

All fixtures automatically handle authentication using the test user credentials defined in `auth.ts`. The `setupAuth()` function will register or login the test user before any API calls.

## Error Handling

All fixture functions:

- Return `null` on failure (entity creation)
- Return empty arrays on failure (entity listing)
- Log errors to console for debugging
- Continue on 404 errors during cleanup (entity already deleted)

## Best Practices

1. **Use seedTestData() for comprehensive tests** - Creates multiple entities of each type
2. **Use seedMinimalTestData() for quick tests** - Creates just one of each entity
3. **Always cleanup after tests** - Use `cleanupTestData()` in `afterAll` or `afterEach`
4. **Use ensure functions for idempotent tests** - Checks before creating
5. **Handle cleanup errors gracefully** - Set `ignoreErrors: true` in cleanup options
6. **Verify cleanup in CI** - Use `verifyCleanup()` to ensure no test data leaks

## Example: Complete Test Suite

```typescript
import { test, expect } from "@playwright/test";
import { setupAuth } from "./fixtures/auth";
import { seedTestData } from "./fixtures/seed";
import { cleanupTestData } from "./fixtures/cleanup";

test.describe("Agent Management", () => {
  let testData;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    testData = await seedTestData(page);
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await cleanupTestData(page, testData);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
    await page.goto("/agents");
  });

  test("should display all test agents", async ({ page }) => {
    // Wait for agents to load
    await page.waitForSelector('[data-testid="agent-card"]');

    // Check that our test agents are visible
    for (const agent of testData.agents) {
      await expect(page.getByText(agent.name)).toBeVisible();
    }
  });

  test("should allow editing an agent", async ({ page }) => {
    const firstAgent = testData.agents[0];

    // Click edit button for first agent
    await page.click(`[data-testid="edit-agent-${firstAgent.id}"]`);

    // Update agent name
    await page.fill('[name="name"]', `${firstAgent.name} Updated`);
    await page.click('[type="submit"]');

    // Verify update
    await expect(page.getByText(`${firstAgent.name} Updated`)).toBeVisible();
  });
});
```

## Troubleshooting

### Authentication Fails

Ensure the backend is running on `http://localhost:8000` and the auth endpoints are accessible.

### Entity Creation Fails

Check the console logs for detailed error messages. Common issues:

- Missing required fields
- Invalid data types
- Backend validation errors

### Cleanup Incomplete

Use `verifyCleanup()` to identify which entities weren't deleted. Common causes:

- Entities with dependencies not deleted in correct order
- Network errors
- Backend errors

### Tests Interfere with Each Other

Ensure cleanup runs between tests or use unique names for entities created in individual tests.
