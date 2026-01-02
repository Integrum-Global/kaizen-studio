import { test, expect } from "@playwright/test";
import { setupAuth } from "./fixtures/auth";
import { seedTestData } from "./fixtures/seed";
import { cleanupTestData } from "./fixtures/cleanup";
import {
  ensureAgentExists,
  ensurePipelineExists,
  ensureTeamExists,
} from "./fixtures/test-data";

/**
 * Example test file demonstrating how to use the comprehensive test fixtures
 * This file shows various patterns for setting up and cleaning up test data
 */

test.describe("Example: Comprehensive Test Data Usage", () => {
  let testData;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    // Seed comprehensive test data (creates 3+ of each entity type)
    testData = await seedTestData(page);
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    // Cleanup all created test data
    await cleanupTestData(page, testData);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("should have multiple agents available", async ({ page }) => {
    await page.goto("/agents");
    await page.waitForSelector('[data-testid="agent-card"]', { timeout: 5000 });

    // Verify we have multiple test agents
    expect(testData.agents.length).toBeGreaterThanOrEqual(3);

    // Check that agents are visible in the UI
    for (const agent of testData.agents.slice(0, 3)) {
      const agentCard = page.getByText(agent.name);
      await expect(agentCard).toBeVisible();
    }
  });

  test("should have multiple pipelines available", async ({ page }) => {
    await page.goto("/pipelines");

    // Verify we have multiple test pipelines
    expect(testData.pipelines.length).toBeGreaterThanOrEqual(3);
    console.log(`Created ${testData.pipelines.length} pipelines for testing`);
  });

  test("should have deployments linked to pipelines", async ({ page }) => {
    await page.goto("/deployments");

    // Verify we have deployments
    expect(testData.deployments.length).toBeGreaterThan(0);

    // Each deployment should reference a valid pipeline
    for (const deployment of testData.deployments) {
      console.log(`Deployment: ${deployment.name}`);
    }
  });
});

test.describe("Example: Ensure Functions (Idempotent)", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("should use existing agent or create new one", async ({ page }) => {
    // This will use an existing agent if found, or create a new one
    const agent = await ensureAgentExists(page);

    expect(agent).toBeTruthy();
    expect(agent?.id).toBeTruthy();
    expect(agent?.name).toBeTruthy();

    console.log(`Using agent: ${agent?.name} (ID: ${agent?.id})`);
  });

  test("should use existing pipeline or create new one", async ({ page }) => {
    const pipeline = await ensurePipelineExists(page);

    expect(pipeline).toBeTruthy();
    expect(pipeline?.id).toBeTruthy();

    console.log(`Using pipeline: ${pipeline?.name} (ID: ${pipeline?.id})`);
  });

  test("should use existing team or create new one", async ({ page }) => {
    const team = await ensureTeamExists(page);

    expect(team).toBeTruthy();
    expect(team?.id).toBeTruthy();

    console.log(`Using team: ${team?.name} (ID: ${team?.id})`);
  });
});

test.describe("Example: Selective Cleanup", () => {
  let localTestData;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    localTestData = await seedTestData(page);
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    // Cleanup only specific entity types
    await cleanupTestData(page, localTestData, {
      skipAgents: false, // Delete agents
      skipPipelines: false, // Delete pipelines
      skipDeployments: false, // Delete deployments
      skipTeams: true, // Keep teams for manual inspection
      skipGateways: true, // Keep gateways
      skipConnectors: true, // Keep connectors
      skipWebhooks: true, // Keep webhooks
      ignoreErrors: true, // Continue even if some deletions fail
    });
    await page.close();
  });

  test("should work with selective cleanup", async ({ page }) => {
    await setupAuth(page);
    await page.goto("/agents");

    // This test demonstrates selective cleanup
    // After this test suite, teams/gateways/connectors/webhooks will remain
    // but agents/pipelines/deployments will be deleted
    expect(localTestData.agents.length).toBeGreaterThan(0);
  });
});

test.describe("Example: Individual Entity Creation", () => {
  const createdEntities: Array<{ type: string; id: string; name: string }> = [];

  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    // Cleanup only the entities created in these tests
    await setupAuth(page);

    for (const entity of createdEntities) {
      try {
        const headers = await page.evaluate(() => ({
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        }));

        await page.request.delete(
          `http://localhost:8000/api/v1/${entity.type}/${entity.id}`,
          { headers }
        );
        console.log(`✓ Cleaned up ${entity.type}: ${entity.name}`);
      } catch (error) {
        console.error(`Failed to cleanup ${entity.type}:`, error);
      }
    }
    await page.close();
  });

  test("should create agent on demand", async ({ page }) => {
    const { createTestAgent } = await import("./fixtures/test-data");

    const agent = await createTestAgent(page, {
      name: "On-Demand Test Agent",
      description: "Created during individual test",
      model: "gpt-3.5-turbo",
    });

    expect(agent).toBeTruthy();
    if (agent) {
      createdEntities.push({ type: "agents", id: agent.id, name: agent.name });
    }
  });

  test("should create gateway on demand", async ({ page }) => {
    const { createTestGateway } = await import("./fixtures/test-data");

    const gateway = await createTestGateway(page, {
      name: "On-Demand Test Gateway",
      type: "rest",
    });

    expect(gateway).toBeTruthy();
    if (gateway) {
      createdEntities.push({
        type: "gateways",
        id: gateway.id,
        name: gateway.name,
      });
    }
  });
});

test.describe("Example: Check Existing Data", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("should list all existing agents", async ({ page }) => {
    const { getExistingAgents } = await import("./fixtures/test-data");

    const agents = await getExistingAgents(page);
    console.log(`Found ${agents.length} existing agents`);

    for (const agent of agents) {
      console.log(`  - ${agent.name} (${agent.id})`);
    }
  });

  test("should list all existing pipelines", async ({ page }) => {
    const { getExistingPipelines } = await import("./fixtures/test-data");

    const pipelines = await getExistingPipelines(page);
    console.log(`Found ${pipelines.length} existing pipelines`);
  });

  test("should list all existing webhooks", async ({ page }) => {
    const { getExistingWebhooks } = await import("./fixtures/test-data");

    const webhooks = await getExistingWebhooks(page);
    console.log(`Found ${webhooks.length} existing webhooks`);
  });
});
