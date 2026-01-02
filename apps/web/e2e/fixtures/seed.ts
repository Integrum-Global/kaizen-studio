import type { Page } from "@playwright/test";
import { setupAuth } from "./auth";
import {
  createTestAgent,
  createTestPipeline,
  createTestDeployment,
  createTestTeam,
  createTestGateway,
  createTestConnector,
  createTestWebhook,
} from "./test-data";

/**
 * Comprehensive test data structure
 */
export interface SeededTestData {
  agents: Array<{ id: string; name: string }>;
  pipelines: Array<{ id: string; name: string }>;
  deployments: Array<{ id: string; name: string }>;
  teams: Array<{ id: string; name: string }>;
  gateways: Array<{ id: string; name: string }>;
  connectors: Array<{ id: string; name: string }>;
  webhooks: Array<{ id: string; name: string }>;
}

/**
 * Seed comprehensive test data before E2E tests run
 * Creates at least 3 items for each entity type
 * Handles authentication automatically
 */
export async function seedTestData(page: Page): Promise<SeededTestData> {
  console.log("Starting test data seeding...");

  // Ensure authentication is set up
  const authSuccess = await setupAuth(page);
  if (!authSuccess) {
    throw new Error("Failed to authenticate for test data seeding");
  }

  const result: SeededTestData = {
    agents: [],
    pipelines: [],
    deployments: [],
    teams: [],
    gateways: [],
    connectors: [],
    webhooks: [],
  };

  // Create test agents (at least 3)
  console.log("Creating test agents...");
  const agentNames = [
    "Customer Support Agent",
    "Data Analysis Agent",
    "Content Writer Agent",
    "Code Review Agent",
    "Sales Assistant Agent",
  ];

  for (const name of agentNames) {
    const agent = await createTestAgent(page, {
      name,
      description: `E2E test agent: ${name}`,
      model: "gpt-4",
    });
    if (agent) {
      result.agents.push(agent);
      console.log(`✓ Created agent: ${name}`);
    } else {
      console.warn(`✗ Failed to create agent: ${name}`);
    }
  }

  // Create test pipelines (at least 3)
  console.log("Creating test pipelines...");
  const pipelineNames = [
    "Data Processing Pipeline",
    "Customer Onboarding Pipeline",
    "Report Generation Pipeline",
    "ETL Pipeline",
  ];

  for (const name of pipelineNames) {
    const pipeline = await createTestPipeline(page, {
      name,
      description: `E2E test pipeline: ${name}`,
    });
    if (pipeline) {
      result.pipelines.push(pipeline);
      console.log(`✓ Created pipeline: ${name}`);
    } else {
      console.warn(`✗ Failed to create pipeline: ${name}`);
    }
  }

  // Create test deployments (at least 3, using created pipelines)
  console.log("Creating test deployments...");
  if (result.pipelines.length > 0) {
    const environments = ["development", "staging", "production"];
    const deploymentCount = Math.min(3, result.pipelines.length);

    for (let i = 0; i < deploymentCount; i++) {
      const environment = environments[i % environments.length];
      const deployment = await createTestDeployment(page, {
        name: `${environment} Deployment ${i + 1}`,
        environment,
        pipeline_id: result.pipelines[i].id,
      });
      if (deployment) {
        result.deployments.push(deployment);
        console.log(`✓ Created deployment: ${deployment.name}`);
      } else {
        console.warn(`✗ Failed to create deployment for ${environment}`);
      }
    }
  }

  // Create test teams (at least 3)
  console.log("Creating test teams...");
  const teamNames = [
    "Engineering Team",
    "Data Science Team",
    "Product Team",
    "DevOps Team",
  ];

  for (const name of teamNames) {
    const team = await createTestTeam(page, {
      name,
      description: `E2E test team: ${name}`,
    });
    if (team) {
      result.teams.push(team);
      console.log(`✓ Created team: ${name}`);
    } else {
      console.warn(`✗ Failed to create team: ${name}`);
    }
  }

  // Create test gateways (at least 3)
  console.log("Creating test gateways...");
  const gatewayNames = [
    "Primary API Gateway",
    "Analytics Gateway",
    "Integration Gateway",
    "External API Gateway",
  ];

  for (const name of gatewayNames) {
    const gateway = await createTestGateway(page, {
      name,
      type: "rest",
    });
    if (gateway) {
      result.gateways.push(gateway);
      console.log(`✓ Created gateway: ${name}`);
    } else {
      console.warn(`✗ Failed to create gateway: ${name}`);
    }
  }

  // Create test connectors (at least 3)
  console.log("Creating test connectors...");
  const connectorConfigs = [
    { name: "PostgreSQL Database", type: "database" },
    { name: "Redis Cache", type: "cache" },
    { name: "S3 Storage", type: "storage" },
    { name: "Kafka Streaming", type: "streaming" },
  ];

  for (const config of connectorConfigs) {
    const connector = await createTestConnector(page, config);
    if (connector) {
      result.connectors.push(connector);
      console.log(`✓ Created connector: ${config.name}`);
    } else {
      console.warn(`✗ Failed to create connector: ${config.name}`);
    }
  }

  // Create test webhooks (at least 3)
  console.log("Creating test webhooks...");
  const webhookConfigs = [
    {
      name: "Agent Events Webhook",
      url: "https://webhook.example.com/agents",
      events: ["agent.created", "agent.updated", "agent.deleted"],
    },
    {
      name: "Pipeline Events Webhook",
      url: "https://webhook.example.com/pipelines",
      events: ["pipeline.deployed", "pipeline.failed"],
    },
    {
      name: "Deployment Events Webhook",
      url: "https://webhook.example.com/deployments",
      events: ["deployment.started", "deployment.completed"],
    },
    {
      name: "System Events Webhook",
      url: "https://webhook.example.com/system",
      events: ["system.error", "system.warning"],
    },
  ];

  for (const config of webhookConfigs) {
    const webhook = await createTestWebhook(page, config);
    if (webhook) {
      result.webhooks.push(webhook);
      console.log(`✓ Created webhook: ${config.name}`);
    } else {
      console.warn(`✗ Failed to create webhook: ${config.name}`);
    }
  }

  // Summary
  console.log("\n=== Test Data Seeding Summary ===");
  console.log(`Agents: ${result.agents.length}`);
  console.log(`Pipelines: ${result.pipelines.length}`);
  console.log(`Deployments: ${result.deployments.length}`);
  console.log(`Teams: ${result.teams.length}`);
  console.log(`Gateways: ${result.gateways.length}`);
  console.log(`Connectors: ${result.connectors.length}`);
  console.log(`Webhooks: ${result.webhooks.length}`);
  console.log("=================================\n");

  return result;
}

/**
 * Seed minimal test data (1 of each entity)
 * Useful for quick tests that don't need comprehensive data
 */
export async function seedMinimalTestData(page: Page): Promise<SeededTestData> {
  console.log("Starting minimal test data seeding...");

  // Ensure authentication is set up
  const authSuccess = await setupAuth(page);
  if (!authSuccess) {
    throw new Error("Failed to authenticate for test data seeding");
  }

  const result: SeededTestData = {
    agents: [],
    pipelines: [],
    deployments: [],
    teams: [],
    gateways: [],
    connectors: [],
    webhooks: [],
  };

  // Create one of each entity
  const agent = await createTestAgent(page, { name: "Minimal Test Agent" });
  if (agent) result.agents.push(agent);

  const pipeline = await createTestPipeline(page, {
    name: "Minimal Test Pipeline",
  });
  if (pipeline) result.pipelines.push(pipeline);

  if (pipeline) {
    const deployment = await createTestDeployment(page, {
      name: "Minimal Test Deployment",
      pipeline_id: pipeline.id,
    });
    if (deployment) result.deployments.push(deployment);
  }

  const team = await createTestTeam(page, { name: "Minimal Test Team" });
  if (team) result.teams.push(team);

  const gateway = await createTestGateway(page, {
    name: "Minimal Test Gateway",
  });
  if (gateway) result.gateways.push(gateway);

  const connector = await createTestConnector(page, {
    name: "Minimal Test Connector",
  });
  if (connector) result.connectors.push(connector);

  const webhook = await createTestWebhook(page, {
    name: "Minimal Test Webhook",
    url: "https://webhook.example.com/minimal",
  });
  if (webhook) result.webhooks.push(webhook);

  console.log("Minimal test data seeding complete\n");

  return result;
}
