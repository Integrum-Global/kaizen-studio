# E2E Test Fixtures - Quick Reference Card

## Quick Start

```typescript
import { seedTestData } from "./fixtures/seed";
import { cleanupTestData } from "./fixtures/cleanup";

test.describe("My Tests", () => {
  let testData;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    testData = await seedTestData(page); // Creates 3+ of each entity
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await cleanupTestData(page, testData); // Cleans up everything
    await page.close();
  });
});
```

## Common Functions

### Seeding

```typescript
// Full seed (3+ entities each)
const data = await seedTestData(page);

// Minimal seed (1 entity each)
const data = await seedMinimalTestData(page);
```

### Ensure (Idempotent)

```typescript
const agent = await ensureAgentExists(page); // Reuses if exists
const pipeline = await ensurePipelineExists(page);
const deployment = await ensureDeploymentExists(page);
const team = await ensureTeamExists(page);
const gateway = await ensureGatewayExists(page);
const connector = await ensureConnectorExists(page);
const webhook = await ensureWebhookExists(page);
```

### Create

```typescript
const agent = await createTestAgent(page, {
  name: "My Agent",
  model: "gpt-4",
});

const team = await createTestTeam(page, {
  name: "Engineering",
  description: "Dev team",
});

const gateway = await createTestGateway(page, {
  name: "API Gateway",
  type: "rest",
});

const connector = await createTestConnector(page, {
  name: "Database",
  type: "database",
});

const webhook = await createTestWebhook(page, {
  name: "Events",
  url: "https://example.com/webhook",
  events: ["agent.created", "pipeline.deployed"],
});
```

### Get Existing

```typescript
const agents = await getExistingAgents(page);
const pipelines = await getExistingPipelines(page);
const deployments = await getExistingDeployments(page);
const teams = await getExistingTeams(page);
const gateways = await getExistingGateways(page);
const connectors = await getExistingConnectors(page);
const webhooks = await getExistingWebhooks(page);
```

### Cleanup

```typescript
// Standard cleanup
await cleanupTestData(page, testData);

// Selective cleanup
await cleanupTestData(page, testData, {
  skipAgents: true, // Keep agents
  skipTeams: true, // Keep teams
  ignoreErrors: true, // Continue on errors
});

// Nuclear option (delete everything)
await cleanupAllTestData(page);

// Verify cleanup worked
const result = await verifyCleanup(page, testData);
console.log(result.success); // true/false
console.log(result.remaining); // { agents: 0, pipelines: 0, ... }
```

## Data Structure

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

## Imports

```typescript
// Auth
import { setupAuth, loginUser, logoutUser } from "./fixtures/auth";

// Seeding
import { seedTestData, seedMinimalTestData } from "./fixtures/seed";

// Cleanup
import {
  cleanupTestData,
  cleanupAllTestData,
  verifyCleanup,
} from "./fixtures/cleanup";

// Individual entities
import {
  createTestAgent,
  createTestPipeline,
  createTestDeployment,
  createTestTeam,
  createTestGateway,
  createTestConnector,
  createTestWebhook,
  ensureAgentExists,
  ensurePipelineExists,
  ensureDeploymentExists,
  ensureTeamExists,
  ensureGatewayExists,
  ensureConnectorExists,
  ensureWebhookExists,
  getExistingAgents,
  getExistingPipelines,
  getExistingDeployments,
  getExistingTeams,
  getExistingGateways,
  getExistingConnectors,
  getExistingWebhooks,
} from "./fixtures/test-data";
```

## Tips

- Use `seedTestData()` for comprehensive tests
- Use `seedMinimalTestData()` for quick tests
- Use `ensure*()` functions for idempotent tests
- Always cleanup in `afterAll` or `afterEach`
- Set `ignoreErrors: true` when debugging
- Check console logs for detailed error messages
- All functions handle auth automatically

## Example Test

```typescript
test("should list agents", async ({ page }) => {
  await setupAuth(page);
  const agents = await getExistingAgents(page);
  await page.goto("/agents");
  for (const agent of agents) {
    await expect(page.getByText(agent.name)).toBeVisible();
  }
});
```
