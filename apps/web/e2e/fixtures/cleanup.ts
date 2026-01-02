import type { Page } from "@playwright/test";
import { API_BASE_URL, getAuthHeaders } from "./auth";
import type { SeededTestData } from "./seed";

/**
 * Cleanup options for more granular control
 */
export interface CleanupOptions {
  skipAgents?: boolean;
  skipPipelines?: boolean;
  skipDeployments?: boolean;
  skipTeams?: boolean;
  skipGateways?: boolean;
  skipConnectors?: boolean;
  skipWebhooks?: boolean;
  ignoreErrors?: boolean; // Continue cleanup even if some deletions fail
}

/**
 * Remove all test data after tests complete
 * Handles errors gracefully (entity might not exist)
 */
export async function cleanupTestData(
  page: Page,
  data: SeededTestData,
  options: CleanupOptions = {}
): Promise<void> {
  console.log("Starting test data cleanup...");

  const headers = await getAuthHeaders(page);
  const { ignoreErrors = true } = options;

  // Track cleanup statistics
  const stats = {
    deleted: 0,
    failed: 0,
    skipped: 0,
  };

  // Helper function to delete with error handling
  async function deleteEntity(
    url: string,
    entityName: string,
    entityType: string
  ): Promise<boolean> {
    try {
      const response = await page.request.delete(url, { headers });
      if (response.ok()) {
        console.log(`✓ Deleted ${entityType}: ${entityName}`);
        stats.deleted++;
        return true;
      } else {
        const status = response.status();
        if (status === 404) {
          console.log(`- ${entityType} already deleted: ${entityName}`);
          stats.skipped++;
        } else {
          console.warn(
            `✗ Failed to delete ${entityType} (${status}): ${entityName}`
          );
          stats.failed++;
        }
        return ignoreErrors;
      }
    } catch (error) {
      console.error(`✗ Error deleting ${entityType}: ${entityName}`, error);
      stats.failed++;
      return ignoreErrors;
    }
  }

  // Delete webhooks first (no dependencies)
  if (!options.skipWebhooks && data.webhooks.length > 0) {
    console.log(`\nCleaning up ${data.webhooks.length} webhooks...`);
    for (const webhook of data.webhooks) {
      await deleteEntity(
        `${API_BASE_URL}/api/v1/webhooks/${webhook.id}`,
        webhook.name,
        "webhook"
      );
    }
  }

  // Delete connectors (no dependencies)
  if (!options.skipConnectors && data.connectors.length > 0) {
    console.log(`\nCleaning up ${data.connectors.length} connectors...`);
    for (const connector of data.connectors) {
      await deleteEntity(
        `${API_BASE_URL}/api/v1/connectors/${connector.id}`,
        connector.name,
        "connector"
      );
    }
  }

  // Delete gateways (no dependencies)
  if (!options.skipGateways && data.gateways.length > 0) {
    console.log(`\nCleaning up ${data.gateways.length} gateways...`);
    for (const gateway of data.gateways) {
      await deleteEntity(
        `${API_BASE_URL}/api/v1/gateways/${gateway.id}`,
        gateway.name,
        "gateway"
      );
    }
  }

  // Delete teams (no dependencies)
  if (!options.skipTeams && data.teams.length > 0) {
    console.log(`\nCleaning up ${data.teams.length} teams...`);
    for (const team of data.teams) {
      await deleteEntity(
        `${API_BASE_URL}/api/v1/teams/${team.id}`,
        team.name,
        "team"
      );
    }
  }

  // Delete deployments (depend on pipelines)
  if (!options.skipDeployments && data.deployments.length > 0) {
    console.log(`\nCleaning up ${data.deployments.length} deployments...`);
    for (const deployment of data.deployments) {
      await deleteEntity(
        `${API_BASE_URL}/api/v1/deployments/${deployment.id}`,
        deployment.name,
        "deployment"
      );
    }
  }

  // Delete pipelines (after deployments)
  if (!options.skipPipelines && data.pipelines.length > 0) {
    console.log(`\nCleaning up ${data.pipelines.length} pipelines...`);
    for (const pipeline of data.pipelines) {
      await deleteEntity(
        `${API_BASE_URL}/api/v1/pipelines/${pipeline.id}`,
        pipeline.name,
        "pipeline"
      );
    }
  }

  // Delete agents (no dependencies)
  if (!options.skipAgents && data.agents.length > 0) {
    console.log(`\nCleaning up ${data.agents.length} agents...`);
    for (const agent of data.agents) {
      await deleteEntity(
        `${API_BASE_URL}/api/v1/agents/${agent.id}`,
        agent.name,
        "agent"
      );
    }
  }

  // Summary
  console.log("\n=== Cleanup Summary ===");
  console.log(`Deleted: ${stats.deleted}`);
  console.log(`Skipped (already deleted): ${stats.skipped}`);
  console.log(`Failed: ${stats.failed}`);
  console.log("========================\n");
}

/**
 * Cleanup all entities of a specific type
 * Useful for cleaning up test data created outside the seed function
 */
export async function cleanupAllEntities(
  page: Page,
  entityType:
    | "agents"
    | "pipelines"
    | "deployments"
    | "teams"
    | "gateways"
    | "connectors"
    | "webhooks"
): Promise<void> {
  console.log(`Cleaning up all ${entityType}...`);

  const headers = await getAuthHeaders(page);
  const endpoint = `${API_BASE_URL}/api/v1/${entityType}`;

  try {
    // Get all entities
    const response = await page.request.get(endpoint, { headers });
    if (!response.ok()) {
      console.warn(`Failed to fetch ${entityType} for cleanup`);
      return;
    }

    const data = await response.json();
    const entities = Array.isArray(data) ? data : data.items || data.data || [];

    console.log(`Found ${entities.length} ${entityType} to cleanup`);

    // Delete each entity
    for (const entity of entities) {
      try {
        const deleteResponse = await page.request.delete(
          `${endpoint}/${entity.id}`,
          {
            headers,
          }
        );
        if (deleteResponse.ok()) {
          console.log(`✓ Deleted ${entityType}: ${entity.name || entity.id}`);
        } else {
          console.warn(
            `✗ Failed to delete ${entityType}: ${entity.name || entity.id}`
          );
        }
      } catch (error) {
        console.error(`Error deleting ${entityType}:`, error);
      }
    }
  } catch (error) {
    console.error(`Error during ${entityType} cleanup:`, error);
  }
}

/**
 * Nuclear option: cleanup ALL test data
 * Use with caution - this will delete everything the authenticated user has access to
 */
export async function cleanupAllTestData(page: Page): Promise<void> {
  console.log("Starting comprehensive cleanup of ALL test data...\n");

  const entityTypes = [
    "webhooks",
    "connectors",
    "gateways",
    "teams",
    "deployments",
    "pipelines",
    "agents",
  ] as const;

  for (const entityType of entityTypes) {
    await cleanupAllEntities(page, entityType);
  }

  console.log("\nComprehensive cleanup complete");
}

/**
 * Cleanup specific entities by ID
 * Useful for cleaning up entities created during individual tests
 */
export async function cleanupEntitiesById(
  page: Page,
  entities: Array<{
    type:
      | "agents"
      | "pipelines"
      | "deployments"
      | "teams"
      | "gateways"
      | "connectors"
      | "webhooks";
    id: string;
    name?: string;
  }>
): Promise<void> {
  const headers = await getAuthHeaders(page);

  for (const entity of entities) {
    try {
      const response = await page.request.delete(
        `${API_BASE_URL}/api/v1/${entity.type}/${entity.id}`,
        { headers }
      );

      if (response.ok()) {
        console.log(`✓ Deleted ${entity.type}: ${entity.name || entity.id}`);
      } else {
        const status = response.status();
        if (status === 404) {
          console.log(
            `- ${entity.type} already deleted: ${entity.name || entity.id}`
          );
        } else {
          console.warn(
            `✗ Failed to delete ${entity.type} (${status}): ${entity.name || entity.id}`
          );
        }
      }
    } catch (error) {
      console.error(`Error deleting ${entity.type}:`, error);
    }
  }
}

/**
 * Verify cleanup was successful by checking if entities still exist
 */
export async function verifyCleanup(
  page: Page,
  data: SeededTestData
): Promise<{
  success: boolean;
  remaining: {
    agents: number;
    pipelines: number;
    deployments: number;
    teams: number;
    gateways: number;
    connectors: number;
    webhooks: number;
  };
}> {
  const headers = await getAuthHeaders(page);
  const remaining = {
    agents: 0,
    pipelines: 0,
    deployments: 0,
    teams: 0,
    gateways: 0,
    connectors: 0,
    webhooks: 0,
  };

  // Check each entity type
  const entityTypes = [
    "agents",
    "pipelines",
    "deployments",
    "teams",
    "gateways",
    "connectors",
    "webhooks",
  ] as const;

  for (const entityType of entityTypes) {
    const entityList = data[entityType];
    for (const entity of entityList) {
      try {
        const response = await page.request.get(
          `${API_BASE_URL}/api/v1/${entityType}/${entity.id}`,
          { headers }
        );
        if (response.ok()) {
          remaining[entityType]++;
        }
      } catch {
        // Entity doesn't exist - good!
      }
    }
  }

  const totalRemaining = Object.values(remaining).reduce(
    (sum, count) => sum + count,
    0
  );
  const success = totalRemaining === 0;

  if (!success) {
    console.log("\n=== Cleanup Verification Failed ===");
    Object.entries(remaining).forEach(([type, count]) => {
      if (count > 0) {
        console.log(`${type}: ${count} entities still exist`);
      }
    });
    console.log("===================================\n");
  }

  return { success, remaining };
}
