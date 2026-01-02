import type { Page, APIRequestContext } from "@playwright/test";
import { API_BASE_URL, getAuthHeaders } from "./auth";

/**
 * Create a test agent via API
 */
export async function createTestAgent(
  page: Page,
  agentData: {
    name: string;
    description?: string;
    model?: string;
    status?: string;
  }
): Promise<{ id: string; name: string } | null> {
  const headers = await getAuthHeaders(page);

  // Generate a random workspace_id (backend accepts any UUID)
  const workspaceId = crypto.randomUUID();

  const response = await page.request.post(`${API_BASE_URL}/api/v1/agents`, {
    headers,
    data: {
      workspace_id: workspaceId,
      name: agentData.name,
      agent_type: "chat",
      model_id: agentData.model || "gpt-4",
      description: agentData.description || `Test agent: ${agentData.name}`,
      system_prompt: "You are a helpful assistant.",
      temperature: 0.7,
      max_tokens: 1000,
    },
  });

  if (response.ok()) {
    const data = await response.json();

    // Set agent to 'active' status so it shows in the list
    // (Backend only returns agents with explicit status filter, but UI defaults to showing all)
    const updateResponse = await page.request.put(
      `${API_BASE_URL}/api/v1/agents/${data.id}`,
      {
        headers,
        data: { status: "active" },
      }
    );

    if (!updateResponse.ok()) {
      console.warn(
        "Failed to set agent status to active:",
        await updateResponse.text()
      );
    }

    return { id: data.id, name: data.name };
  }

  console.error("Failed to create agent:", await response.text());
  return null;
}

/**
 * Create a test pipeline via API
 */
export async function createTestPipeline(
  page: Page,
  pipelineData: {
    name: string;
    description?: string;
  }
): Promise<{ id: string; name: string } | null> {
  const headers = await getAuthHeaders(page);

  const response = await page.request.post(`${API_BASE_URL}/api/v1/pipelines`, {
    headers,
    data: {
      name: pipelineData.name,
      description:
        pipelineData.description || `Test pipeline: ${pipelineData.name}`,
      nodes: [],
      edges: [],
      status: "draft",
    },
  });

  if (response.ok()) {
    const data = await response.json();
    return { id: data.id, name: data.name };
  }

  console.error("Failed to create pipeline:", await response.text());
  return null;
}

/**
 * Create a test deployment via API
 */
export async function createTestDeployment(
  page: Page,
  deploymentData: {
    name: string;
    environment?: string;
    pipeline_id?: string;
  }
): Promise<{ id: string; name: string } | null> {
  const headers = await getAuthHeaders(page);

  // First create a pipeline if no pipeline_id provided
  let pipelineId = deploymentData.pipeline_id;
  if (!pipelineId) {
    const pipeline = await createTestPipeline(page, {
      name: `Pipeline for ${deploymentData.name}`,
    });
    if (!pipeline) return null;
    pipelineId = pipeline.id;
  }

  const response = await page.request.post(
    `${API_BASE_URL}/api/v1/deployments`,
    {
      headers,
      data: {
        name: deploymentData.name,
        environment: deploymentData.environment || "development",
        pipeline_id: pipelineId,
        config: {},
        status: "pending",
      },
    }
  );

  if (response.ok()) {
    const data = await response.json();
    return { id: data.id, name: data.name };
  }

  console.error("Failed to create deployment:", await response.text());
  return null;
}

/**
 * Invite a team member via API
 */
export async function inviteTeamMember(
  page: Page,
  memberData: {
    email: string;
    role?: string;
  }
): Promise<{ id: string; email: string } | null> {
  const headers = await getAuthHeaders(page);

  const response = await page.request.post(
    `${API_BASE_URL}/api/v1/invitations`,
    {
      headers,
      data: {
        email: memberData.email,
        role: memberData.role || "member",
      },
    }
  );

  if (response.ok()) {
    const data = await response.json();
    return { id: data.id, email: data.email };
  }

  // May fail if invitation already exists - that's ok
  console.log("Invitation result:", response.status());
  return null;
}

/**
 * Create a webhook via API
 */
export async function createTestWebhook(
  page: Page,
  webhookData: {
    name: string;
    url: string;
    events?: string[];
  }
): Promise<{ id: string; name: string } | null> {
  const headers = await getAuthHeaders(page);

  const response = await page.request.post(`${API_BASE_URL}/api/v1/webhooks`, {
    headers,
    data: {
      name: webhookData.name,
      url: webhookData.url,
      events: webhookData.events || ["agent.created", "pipeline.deployed"],
      active: true,
    },
  });

  if (response.ok()) {
    const data = await response.json();
    return { id: data.id, name: data.name };
  }

  console.error("Failed to create webhook:", await response.text());
  return null;
}

/**
 * Setup all test data needed for comprehensive E2E testing
 */
export async function setupTestData(page: Page): Promise<{
  agents: Array<{ id: string; name: string }>;
  pipelines: Array<{ id: string; name: string }>;
  deployments: Array<{ id: string; name: string }>;
}> {
  const result = {
    agents: [] as Array<{ id: string; name: string }>,
    pipelines: [] as Array<{ id: string; name: string }>,
    deployments: [] as Array<{ id: string; name: string }>,
  };

  // Create test agents
  const agentNames = [
    "Customer Support Agent",
    "Data Analysis Agent",
    "Content Writer Agent",
  ];

  for (const name of agentNames) {
    const agent = await createTestAgent(page, { name });
    if (agent) {
      result.agents.push(agent);
    }
  }

  // Create test pipelines
  const pipelineNames = [
    "Data Processing Pipeline",
    "Customer Onboarding Pipeline",
  ];

  for (const name of pipelineNames) {
    const pipeline = await createTestPipeline(page, { name });
    if (pipeline) {
      result.pipelines.push(pipeline);
    }
  }

  // Create test deployments
  if (result.pipelines.length > 0) {
    const deployment = await createTestDeployment(page, {
      name: "Production Deployment",
      environment: "production",
      pipeline_id: result.pipelines[0].id,
    });
    if (deployment) {
      result.deployments.push(deployment);
    }
  }

  return result;
}

/**
 * Cleanup test data after tests
 */
export async function cleanupTestData(
  page: Page,
  data: {
    agents?: Array<{ id: string }>;
    pipelines?: Array<{ id: string }>;
    deployments?: Array<{ id: string }>;
  }
): Promise<void> {
  const headers = await getAuthHeaders(page);

  // Delete deployments first (they depend on pipelines)
  if (data.deployments) {
    for (const deployment of data.deployments) {
      await page.request.delete(
        `${API_BASE_URL}/api/v1/deployments/${deployment.id}`,
        { headers }
      );
    }
  }

  // Delete pipelines
  if (data.pipelines) {
    for (const pipeline of data.pipelines) {
      await page.request.delete(
        `${API_BASE_URL}/api/v1/pipelines/${pipeline.id}`,
        { headers }
      );
    }
  }

  // Delete agents
  if (data.agents) {
    for (const agent of data.agents) {
      await page.request.delete(`${API_BASE_URL}/api/v1/agents/${agent.id}`, {
        headers,
      });
    }
  }
}

/**
 * Check if test data exists (to avoid duplicate creation)
 */
export async function getExistingAgents(
  page: Page
): Promise<Array<{ id: string; name: string }>> {
  const headers = await getAuthHeaders(page);

  const response = await page.request.get(`${API_BASE_URL}/api/v1/agents`, {
    headers,
  });

  if (response.ok()) {
    const data = await response.json();
    // Handle both array response and paginated response
    const agents = Array.isArray(data) ? data : data.items || data.data || [];
    return agents.map((a: { id: string; name: string }) => ({
      id: a.id,
      name: a.name,
    }));
  }

  return [];
}

/**
 * Ensure at least one agent exists for testing
 */
export async function ensureAgentExists(
  page: Page
): Promise<{ id: string; name: string } | null> {
  const existing = await getExistingAgents(page);

  if (existing.length > 0) {
    return existing[0];
  }

  return createTestAgent(page, { name: "E2E Test Agent" });
}

/**
 * Check if pipelines exist
 */
export async function getExistingPipelines(
  page: Page
): Promise<Array<{ id: string; name: string }>> {
  const headers = await getAuthHeaders(page);

  const response = await page.request.get(`${API_BASE_URL}/api/v1/pipelines`, {
    headers,
  });

  if (response.ok()) {
    const data = await response.json();
    const pipelines = Array.isArray(data)
      ? data
      : data.items || data.data || [];
    return pipelines.map((p: { id: string; name: string }) => ({
      id: p.id,
      name: p.name,
    }));
  }

  return [];
}

/**
 * Ensure at least one pipeline exists for testing
 */
export async function ensurePipelineExists(
  page: Page
): Promise<{ id: string; name: string } | null> {
  const existing = await getExistingPipelines(page);

  if (existing.length > 0) {
    return existing[0];
  }

  return createTestPipeline(page, { name: "E2E Test Pipeline" });
}

/**
 * Check if deployments exist
 */
export async function getExistingDeployments(
  page: Page
): Promise<Array<{ id: string; name: string }>> {
  const headers = await getAuthHeaders(page);

  const response = await page.request.get(
    `${API_BASE_URL}/api/v1/deployments`,
    {
      headers,
    }
  );

  if (response.ok()) {
    const data = await response.json();
    const deployments = Array.isArray(data)
      ? data
      : data.items || data.data || [];
    return deployments.map((d: { id: string; name: string }) => ({
      id: d.id,
      name: d.name,
    }));
  }

  return [];
}

/**
 * Ensure at least one deployment exists for testing
 */
export async function ensureDeploymentExists(
  page: Page
): Promise<{ id: string; name: string } | null> {
  const existing = await getExistingDeployments(page);

  if (existing.length > 0) {
    return existing[0];
  }

  return createTestDeployment(page, { name: "E2E Test Deployment" });
}

/**
 * Create a test team via API
 */
export async function createTestTeam(
  page: Page,
  teamData: {
    name: string;
    description?: string;
  }
): Promise<{ id: string; name: string } | null> {
  const headers = await getAuthHeaders(page);

  const response = await page.request.post(`${API_BASE_URL}/api/v1/teams`, {
    headers,
    data: {
      name: teamData.name,
      description: teamData.description || `Test team: ${teamData.name}`,
    },
  });

  if (response.ok()) {
    const data = await response.json();
    return { id: data.id, name: data.name };
  }

  console.error("Failed to create team:", await response.text());
  return null;
}

/**
 * Add member to a team via API
 */
export async function addTeamMember(
  page: Page,
  teamId: string,
  memberData: {
    user_id: string;
    role?: string;
  }
): Promise<{ id: string; user_id: string } | null> {
  const headers = await getAuthHeaders(page);

  const response = await page.request.post(
    `${API_BASE_URL}/api/v1/teams/${teamId}/members`,
    {
      headers,
      data: {
        user_id: memberData.user_id,
        role: memberData.role || "member",
      },
    }
  );

  if (response.ok()) {
    const data = await response.json();
    return { id: data.id, user_id: data.user_id };
  }

  console.error("Failed to add team member:", await response.text());
  return null;
}

/**
 * Create a test gateway via API
 */
export async function createTestGateway(
  page: Page,
  gatewayData: {
    name: string;
    url?: string;
    type?: string;
  }
): Promise<{ id: string; name: string } | null> {
  const headers = await getAuthHeaders(page);

  const response = await page.request.post(`${API_BASE_URL}/api/v1/gateways`, {
    headers,
    data: {
      name: gatewayData.name,
      url: gatewayData.url || `https://gateway-${Date.now()}.example.com`,
      type: gatewayData.type || "rest",
      config: {
        timeout: 30,
        retries: 3,
      },
      status: "active",
    },
  });

  if (response.ok()) {
    const data = await response.json();
    return { id: data.id, name: data.name };
  }

  console.error("Failed to create gateway:", await response.text());
  return null;
}

/**
 * Create a test connector via API
 */
export async function createTestConnector(
  page: Page,
  connectorData: {
    name: string;
    type?: string;
    credentials?: Record<string, unknown>;
  }
): Promise<{ id: string; name: string } | null> {
  const headers = await getAuthHeaders(page);

  const response = await page.request.post(
    `${API_BASE_URL}/api/v1/connectors`,
    {
      headers,
      data: {
        name: connectorData.name,
        type: connectorData.type || "database",
        credentials: connectorData.credentials || {
          host: "localhost",
          port: 5432,
          database: "test_db",
          username: "test_user",
        },
        config: {},
        status: "active",
      },
    }
  );

  if (response.ok()) {
    const data = await response.json();
    return { id: data.id, name: data.name };
  }

  console.error("Failed to create connector:", await response.text());
  return null;
}

/**
 * Check if teams exist
 */
export async function getExistingTeams(
  page: Page
): Promise<Array<{ id: string; name: string }>> {
  const headers = await getAuthHeaders(page);

  const response = await page.request.get(`${API_BASE_URL}/api/v1/teams`, {
    headers,
  });

  if (response.ok()) {
    const data = await response.json();
    const teams = Array.isArray(data) ? data : data.items || data.data || [];
    return teams.map((t: { id: string; name: string }) => ({
      id: t.id,
      name: t.name,
    }));
  }

  return [];
}

/**
 * Ensure at least one team exists for testing
 */
export async function ensureTeamExists(
  page: Page
): Promise<{ id: string; name: string } | null> {
  const existing = await getExistingTeams(page);

  if (existing.length > 0) {
    return existing[0];
  }

  return createTestTeam(page, { name: "E2E Test Team" });
}

/**
 * Check if gateways exist
 */
export async function getExistingGateways(
  page: Page
): Promise<Array<{ id: string; name: string }>> {
  const headers = await getAuthHeaders(page);

  const response = await page.request.get(`${API_BASE_URL}/api/v1/gateways`, {
    headers,
  });

  if (response.ok()) {
    const data = await response.json();
    const gateways = Array.isArray(data) ? data : data.items || data.data || [];
    return gateways.map((g: { id: string; name: string }) => ({
      id: g.id,
      name: g.name,
    }));
  }

  return [];
}

/**
 * Ensure at least one gateway exists for testing
 */
export async function ensureGatewayExists(
  page: Page
): Promise<{ id: string; name: string } | null> {
  const existing = await getExistingGateways(page);

  if (existing.length > 0) {
    return existing[0];
  }

  return createTestGateway(page, { name: "E2E Test Gateway" });
}

/**
 * Check if connectors exist
 */
export async function getExistingConnectors(
  page: Page
): Promise<Array<{ id: string; name: string }>> {
  const headers = await getAuthHeaders(page);

  const response = await page.request.get(`${API_BASE_URL}/api/v1/connectors`, {
    headers,
  });

  if (response.ok()) {
    const data = await response.json();
    const connectors = Array.isArray(data)
      ? data
      : data.items || data.data || [];
    return connectors.map((c: { id: string; name: string }) => ({
      id: c.id,
      name: c.name,
    }));
  }

  return [];
}

/**
 * Ensure at least one connector exists for testing
 */
export async function ensureConnectorExists(
  page: Page
): Promise<{ id: string; name: string } | null> {
  const existing = await getExistingConnectors(page);

  if (existing.length > 0) {
    return existing[0];
  }

  return createTestConnector(page, { name: "E2E Test Connector" });
}

/**
 * Check if webhooks exist
 */
export async function getExistingWebhooks(
  page: Page
): Promise<Array<{ id: string; name: string }>> {
  const headers = await getAuthHeaders(page);

  const response = await page.request.get(`${API_BASE_URL}/api/v1/webhooks`, {
    headers,
  });

  if (response.ok()) {
    const data = await response.json();
    const webhooks = Array.isArray(data) ? data : data.items || data.data || [];
    return webhooks.map((w: { id: string; name: string }) => ({
      id: w.id,
      name: w.name,
    }));
  }

  return [];
}

/**
 * Ensure at least one webhook exists for testing
 */
export async function ensureWebhookExists(
  page: Page
): Promise<{ id: string; name: string } | null> {
  const existing = await getExistingWebhooks(page);

  if (existing.length > 0) {
    return existing[0];
  }

  return createTestWebhook(page, {
    name: "E2E Test Webhook",
    url: "https://webhook.example.com/test",
  });
}
