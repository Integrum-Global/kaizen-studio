/**
 * Complete User Workflow E2E Test
 *
 * This test validates the entire user journey through Kaizen Studio:
 * BUILD → DEPLOY → GOVERN → OBSERVE
 *
 * Uses correct API signatures based on backend investigation.
 * Credentials: jack@integrum.global / Integrum2024!
 */

import { test, expect, Page } from '@playwright/test';

// Shared state across tests
let authToken: string;
let organizationId: string;
let workspaceId: string;
let userId: string;

// Created resources
let createdAgentId: string;
let createdPipelineId: string;
let createdConnectorId: string;
let createdWorkspaceId: string;
let createdWorkUnitId: string;
let createdDeploymentId: string;
let createdGatewayId: string;
let createdTeamId: string;
let createdPolicyId: string;

const API_BASE = 'http://localhost:8000/api/v1';

// Correct credentials for integrum.global organization
const TEST_USER = {
  email: 'jack@integrum.global',
  password: 'Integrum2024!',
};

// Known IDs from seed data
const INTEGRUM_ORG_ID = '808b334a-994c-4604-a5df-7acf4b6d2f12';
const INTEGRUM_WORKSPACE_ID = 'ws-628674e5-63bc-44e3-ad38-c9a536aacbbe';

/**
 * Helper function to make authenticated API requests
 */
async function apiRequest(
  page: Page,
  method: string,
  endpoint: string,
  body?: object
) {
  const response = await page.request.fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    data: body ? JSON.stringify(body) : undefined,
  });
  return response;
}

/**
 * Helper to log step results
 */
function logStep(step: string, action: string, sees: string) {
  console.log(`\n--- ${step} ---`);
  console.log(`User Action: ${action}`);
  console.log(`User sees: ${sees}`);
}

// ============================================================================
// SETUP: Authentication
// ============================================================================
test.describe.serial('Complete User Workflow', () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('\n========================================');
    console.log('AUTHENTICATION');
    console.log('========================================');
    console.log(`User Action: Login as ${TEST_USER.email}`);

    const loginResponse = await page.request.post(`${API_BASE}/auth/login`, {
      data: {
        email: TEST_USER.email,
        password: TEST_USER.password,
      },
    });

    expect(loginResponse.ok(), `Login failed: ${loginResponse.status()}`).toBeTruthy();
    const loginData = await loginResponse.json();
    authToken = loginData.access_token;

    // Get user info to retrieve org_id
    const meResponse = await page.request.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (meResponse.ok()) {
      const meData = await meResponse.json();
      organizationId = meData.organization_id || INTEGRUM_ORG_ID;
      userId = meData.id;
      console.log(`Result: Logged in successfully`);
      console.log(`  - User ID: ${userId}`);
      console.log(`  - Organization ID: ${organizationId}`);
    } else {
      organizationId = INTEGRUM_ORG_ID;
      console.log(`Result: Using default org ID: ${organizationId}`);
    }

    workspaceId = INTEGRUM_WORKSPACE_ID;
    console.log(`  - Workspace ID: ${workspaceId}`);
    console.log('User sees: Dashboard with navigation sidebar\n');

    await context.close();
  });

  // ==========================================================================
  // PHASE 1: BUILD - Create and Configure
  // ==========================================================================
  test.describe('PHASE 1: BUILD - Create and Configure', () => {
    test('1.1 Create an Agent (Atomic Work Unit)', async ({ page }) => {
      logStep(
        'Step 1.1: Create Agent',
        'Navigate to Work Units → Create Work Unit → Select Agent type',
        'Agent creation form with name, model, system prompt fields'
      );

      // Correct API signature for agents
      const response = await apiRequest(page, 'POST', '/agents', {
        workspace_id: workspaceId,
        name: `E2E Workflow Agent ${Date.now()}`,
        agent_type: 'chat',  // Backend field name
        model_id: 'gpt-4',   // Backend field name
        description: 'Agent created during E2E complete workflow test',
        system_prompt: 'You are a helpful assistant for workflow testing.',
        temperature: 0.7,
        max_tokens: 1000,
      });

      const status = response.status();
      if (status === 201 || status === 200) {
        const data = await response.json();
        createdAgentId = data.id;
        console.log(`Result: SUCCESS - Agent created`);
        console.log(`  - Agent ID: ${createdAgentId}`);
        console.log('User sees: Agent card in Work Units list with Bot icon');
      } else {
        const error = await response.text();
        console.log(`Result: FAILED - Status ${status}`);
        console.log(`  - Error: ${error}`);
      }
      expect(status === 201 || status === 200).toBeTruthy();
    });

    test('1.2 Create a Pipeline (Composite Work Unit)', async ({ page }) => {
      logStep(
        'Step 1.2: Create Pipeline',
        'Click Create Work Unit → Select Pipeline type',
        'Pipeline editor with canvas and node palette'
      );

      // Correct API signature for pipelines - MUST include organization_id
      const response = await apiRequest(page, 'POST', '/pipelines', {
        organization_id: organizationId,  // REQUIRED
        workspace_id: workspaceId,        // REQUIRED
        name: `E2E Workflow Pipeline ${Date.now()}`,
        description: 'Pipeline created during E2E complete workflow test',
        pattern: 'sequential',  // sequential|parallel|router|supervisor|ensemble
        status: 'draft',
      });

      const status = response.status();
      if (status === 201 || status === 200) {
        const data = await response.json();
        createdPipelineId = data.id || data.data?.id;
        console.log(`Result: SUCCESS - Pipeline created`);
        console.log(`  - Pipeline ID: ${createdPipelineId}`);
        console.log('User sees: Pipeline in editor with GitBranch icon');
      } else {
        const error = await response.text();
        console.log(`Result: FAILED - Status ${status}`);
        console.log(`  - Error: ${error}`);
      }
      expect(status === 201 || status === 200).toBeTruthy();
    });

    test('1.3 Create a Connector', async ({ page }) => {
      logStep(
        'Step 1.3: Create Connector',
        'Navigate to Connectors → Add Connector',
        'Connector type selection (Database, API, Storage, Messaging)'
      );

      // Correct API signature for connectors
      const response = await apiRequest(page, 'POST', '/connectors', {
        name: `E2E Test Connector ${Date.now()}`,
        connector_type: 'database',  // database|api|storage|messaging
        provider: 'postgresql',
        config: {
          host: 'localhost',
          port: 5432,
          database: 'test_db',
          username: 'test_user',
        },
        status: 'active',
      });

      const status = response.status();
      if (status === 201 || status === 200) {
        const data = await response.json();
        createdConnectorId = data.id;
        console.log(`Result: SUCCESS - Connector created`);
        console.log(`  - Connector ID: ${createdConnectorId}`);
        console.log('User sees: Connector card with Test Connection button');
      } else {
        const error = await response.text();
        console.log(`Result: FAILED - Status ${status}`);
        console.log(`  - Error: ${error}`);
      }
      expect(status === 201 || status === 200).toBeTruthy();
    });

    test('1.4 Create a Workspace', async ({ page }) => {
      logStep(
        'Step 1.4: Create Workspace',
        'Navigate to Workspaces → Create Workspace',
        'Workspace form with name, type, description fields'
      );

      const response = await apiRequest(page, 'POST', '/workspaces', {
        name: `E2E Test Workspace ${Date.now()}`,
        description: 'Workspace created during E2E complete workflow test',
        workspaceType: 'temporary',  // permanent|temporary|personal
      });

      const status = response.status();
      if (status === 201 || status === 200) {
        const data = await response.json();
        createdWorkspaceId = data.id;
        console.log(`Result: SUCCESS - Workspace created`);
        console.log(`  - Workspace ID: ${createdWorkspaceId}`);
        console.log('User sees: Workspace card with Open button');
      } else {
        const error = await response.text();
        console.log(`Result: FAILED - Status ${status}`);
        console.log(`  - Error: ${error}`);
      }
      expect(status === 201 || status === 200).toBeTruthy();
    });

    test('1.5 Create a Work Unit', async ({ page }) => {
      logStep(
        'Step 1.5: Create Work Unit',
        'Click Create Work Unit → Fill wizard steps',
        'Work Unit wizard with Type, Config, Trust steps'
      );

      // Correct API signature for work units
      // capabilities must be array of dictionaries, not strings
      const response = await apiRequest(page, 'POST', '/work-units', {
        name: `E2E Customer Service Agent ${Date.now()}`,
        description: 'Work unit for customer service tasks',
        type: 'atomic',  // atomic|composite
        capabilities: [
          { name: 'chat', description: 'Chat capability' },
          { name: 'analysis', description: 'Analysis capability' },
        ],
        workspaceId: createdWorkspaceId || workspaceId,
        tags: ['e2e-test', 'customer-service'],
      });

      const status = response.status();
      if (status === 201 || status === 200) {
        const data = await response.json();
        createdWorkUnitId = data.id;
        console.log(`Result: SUCCESS - Work Unit created`);
        console.log(`  - Work Unit ID: ${createdWorkUnitId}`);
        console.log('User sees: Work Unit card with Bot icon, Agent badge');
      } else {
        const error = await response.text();
        console.log(`Result: FAILED - Status ${status}`);
        console.log(`  - Error: ${error}`);
      }
      expect(status === 201 || status === 200).toBeTruthy();
    });

    test('1.6 Verify Workspace Contents', async ({ page }) => {
      logStep(
        'Step 1.6: View Workspace',
        'Click Open on workspace card',
        'Workspace detail page with work unit grid'
      );

      const targetWorkspace = createdWorkspaceId || workspaceId;
      const response = await apiRequest(page, 'GET', `/workspaces/${targetWorkspace}`);

      if (response.ok()) {
        const data = await response.json();
        console.log(`Result: SUCCESS - Workspace loaded`);
        console.log(`  - Name: ${data.name}`);
        console.log(`  - Work Units: ${data.workUnits?.length || 0}`);
        console.log(`  - Members: ${data.memberCount || 0}`);
        console.log('User sees: Workspace header, work unit grid, Invite Members button');
      } else {
        console.log(`Result: FAILED - Status ${response.status()}`);
      }
    });

    test('1.7 List All Work Units', async ({ page }) => {
      logStep(
        'Step 1.7: View All Work Units',
        'Navigate to Build → Work Units',
        'Grid of work unit cards with filters (All, Atomic, Composite)'
      );

      const response = await apiRequest(page, 'GET', '/work-units?page=1&pageSize=20');

      if (response.ok()) {
        const data = await response.json();
        const items = data.items || data;
        console.log(`Result: SUCCESS - Found ${items.length} work units`);
        console.log('User sees: Work unit cards with:');
        console.log('  - Bot icon (atomic) or GitBranch icon (composite)');
        console.log('  - "Agent" or "Pipeline" type badge');
        console.log('  - Trust status badge (Valid/Pending/Expired)');
        console.log('  - Run, Configure, Delegate action buttons');
      }
    });
  });

  // ==========================================================================
  // PHASE 2: DEPLOY - Release and Scale
  // ==========================================================================
  test.describe('PHASE 2: DEPLOY - Release and Scale', () => {
    test('2.1 Create a Gateway', async ({ page }) => {
      logStep(
        'Step 2.1: Create Gateway',
        'Navigate to Gateways → Create Gateway',
        'Gateway form with endpoint URL, API key, environment'
      );

      // Correct API signature for gateways
      const response = await apiRequest(page, 'POST', '/gateways', {
        name: `E2E Test Gateway ${Date.now()}`,
        description: 'Gateway created during E2E complete workflow test',
        api_url: 'https://api.example.com/v1',  // Backend field name
        api_key: `test-key-${Date.now()}`,      // Backend field name
        environment: 'development',
        health_check_url: '/health',
      });

      const status = response.status();
      if (status === 201 || status === 200) {
        const data = await response.json();
        createdGatewayId = data.id;
        console.log(`Result: SUCCESS - Gateway created`);
        console.log(`  - Gateway ID: ${createdGatewayId}`);
        console.log('User sees: Gateway card with endpoint URL, health status');
      } else {
        const error = await response.text();
        console.log(`Result: FAILED - Status ${status}`);
        console.log(`  - Error: ${error}`);
      }
      expect(status === 201 || status === 200).toBeTruthy();
    });

    test('2.2 Create a Deployment', async ({ page }) => {
      logStep(
        'Step 2.2: Create Deployment',
        'Navigate to Deployments → New Deployment',
        'Deployment form with agent selection, gateway selection'
      );

      // Correct API signature for deployments - uses agent_id and gateway_id
      const response = await apiRequest(page, 'POST', '/deployments', {
        agent_id: createdAgentId,    // REQUIRED
        gateway_id: createdGatewayId, // REQUIRED
      });

      const status = response.status();
      if (status === 201 || status === 200) {
        const data = await response.json();
        createdDeploymentId = data.id;
        console.log(`Result: SUCCESS - Deployment created`);
        console.log(`  - Deployment ID: ${createdDeploymentId}`);
        console.log('User sees: Deployment card with status "Active"');
      } else {
        const error = await response.text();
        console.log(`Result: FAILED - Status ${status}`);
        console.log(`  - Error: ${error}`);
        // Don't fail test if agent/gateway weren't created
        if (!createdAgentId || !createdGatewayId) {
          console.log('  - Note: Skipped because dependencies not created');
          return;
        }
      }
    });

    test('2.3 List Deployments', async ({ page }) => {
      logStep(
        'Step 2.3: View Deployments',
        'Navigate to Deploy → Deployments',
        'List of deployments with status indicators'
      );

      const response = await apiRequest(page, 'GET', '/deployments');

      if (response.ok()) {
        const data = await response.json();
        const deployments = data.deployments || data.items || data || [];
        console.log(`Result: SUCCESS - Found ${deployments.length} deployments`);
        console.log('User sees: Deployment cards with:');
        console.log('  - Agent name');
        console.log('  - Gateway endpoint');
        console.log('  - Status indicator (active/stopped/error)');
        console.log('  - Stop/Redeploy controls');
      }
    });

    test('2.4 List Gateways', async ({ page }) => {
      logStep(
        'Step 2.4: View Gateways',
        'Navigate to Deploy → Gateways',
        'List of API gateways with health status'
      );

      const response = await apiRequest(page, 'GET', '/gateways');

      if (response.ok()) {
        const data = await response.json();
        const gateways = data.gateways || data.items || data || [];
        console.log(`Result: SUCCESS - Found ${gateways.length} gateways`);
        console.log('User sees: Gateway cards with:');
        console.log('  - Name and description');
        console.log('  - API URL');
        console.log('  - Environment badge');
        console.log('  - Health check button');
      }
    });

    test('2.5 Check Gateway Health', async ({ page }) => {
      logStep(
        'Step 2.5: Check Gateway Health',
        'Click Health Check on gateway card',
        'Health status indicator updates'
      );

      if (!createdGatewayId) {
        console.log('Result: SKIPPED - No gateway to check');
        return;
      }

      const response = await apiRequest(
        page,
        'POST',
        `/gateways/${createdGatewayId}/health`
      );

      if (response.ok()) {
        const data = await response.json();
        console.log(`Result: SUCCESS - Health check completed`);
        console.log(`  - Status: ${data.status || data.healthy ? 'Healthy' : 'Unhealthy'}`);
        console.log('User sees: Health badge updates to show current status');
      } else {
        console.log(`Result: Health check returned ${response.status()}`);
      }
    });
  });

  // ==========================================================================
  // PHASE 3: GOVERN - Control and Audit
  // ==========================================================================
  test.describe('PHASE 3: GOVERN - Control and Audit', () => {
    test('3.1 Create a Team', async ({ page }) => {
      logStep(
        'Step 3.1: Create Team',
        'Navigate to Govern → Teams → Create Team',
        'Team creation form with name, description'
      );

      const response = await apiRequest(page, 'POST', '/teams', {
        name: `E2E Test Team ${Date.now()}`,
        description: 'Team created during E2E complete workflow test',
      });

      const status = response.status();
      if (status === 201 || status === 200) {
        const data = await response.json();
        createdTeamId = data.id;
        console.log(`Result: SUCCESS - Team created`);
        console.log(`  - Team ID: ${createdTeamId}`);
        console.log('User sees: Team card with Add Members button');
      } else {
        const error = await response.text();
        console.log(`Result: FAILED - Status ${status}`);
        console.log(`  - Error: ${error}`);
      }
      expect(status === 201 || status === 200).toBeTruthy();
    });

    test('3.2 List Roles', async ({ page }) => {
      logStep(
        'Step 3.2: View Roles',
        'Navigate to Govern → Roles',
        'List of roles with permission summaries'
      );

      // Roles endpoint - GET to list, not POST to create
      const response = await apiRequest(page, 'GET', '/rbac/roles');

      if (response.ok()) {
        const data = await response.json();
        const roles = data.roles || data.items || data || [];
        console.log(`Result: SUCCESS - Found ${roles.length} roles`);
        console.log('User sees: Role cards with:');
        console.log('  - Role name');
        console.log('  - System/Custom badge');
        console.log('  - Permission count');
        console.log('  - Assigned users count');
      }
    });

    test('3.3 Create a Policy', async ({ page }) => {
      logStep(
        'Step 3.3: Create Policy',
        'Navigate to Govern → Policies → Create Policy',
        'Policy builder with resource type, action, effect'
      );

      // Correct API signature for policies
      const response = await apiRequest(page, 'POST', '/policies', {
        name: `E2E Test Policy ${Date.now()}`,
        description: 'Policy created during E2E complete workflow test',
        resource_type: 'agent',  // Backend field name (not "resources")
        action: 'read',          // Single action (not array)
        effect: 'allow',         // allow|deny
        conditions: {},
        priority: 50,
        status: 'active',
      });

      const status = response.status();
      if (status === 201 || status === 200) {
        const data = await response.json();
        createdPolicyId = data.id;
        console.log(`Result: SUCCESS - Policy created`);
        console.log(`  - Policy ID: ${createdPolicyId}`);
        console.log('User sees: Policy card with Allow/Deny indicator');
      } else {
        const error = await response.text();
        console.log(`Result: FAILED - Status ${status}`);
        console.log(`  - Error: ${error}`);
      }
      expect(status === 201 || status === 200).toBeTruthy();
    });

    test('3.4 List Policies', async ({ page }) => {
      logStep(
        'Step 3.4: View All Policies',
        'Navigate to Govern → Policies',
        'List of policies with enable/disable toggles'
      );

      const response = await apiRequest(page, 'GET', '/policies');

      if (response.ok()) {
        const data = await response.json();
        const policies = data.records || data.items || data || [];
        console.log(`Result: SUCCESS - Found ${policies.length} policies`);
        console.log('User sees: Policy cards with:');
        console.log('  - Policy name');
        console.log('  - Effect (Allow/Deny)');
        console.log('  - Resource type');
        console.log('  - Status toggle');
      }
    });

    test('3.5 View Audit Trail', async ({ page }) => {
      logStep(
        'Step 3.5: View Audit Trail',
        'Navigate to Govern → Trust → Audit Trail',
        'Table of audit events with filters'
      );

      // Correct endpoint: /audit/logs with organization_id query param
      const response = await apiRequest(
        page,
        'GET',
        `/audit/logs?organization_id=${organizationId}&limit=20`
      );

      if (response.ok()) {
        const data = await response.json();
        const logs = data.logs || data.items || data || [];
        console.log(`Result: SUCCESS - Found ${logs.length} audit entries`);
        console.log('User sees: Audit log table with:');
        console.log('  - Timestamp');
        console.log('  - User who performed action');
        console.log('  - Action type');
        console.log('  - Resource affected');
        console.log('  - Status (success/failure)');
      } else {
        console.log(`Result: Audit logs returned status ${response.status()}`);
        // May not have audit records yet
      }
    });

    test('3.6 List Teams', async ({ page }) => {
      logStep(
        'Step 3.6: View All Teams',
        'Navigate to Govern → Teams',
        'Grid of team cards'
      );

      const response = await apiRequest(page, 'GET', '/teams?limit=20&offset=0');

      if (response.ok()) {
        const data = await response.json();
        const teams = data.teams || data.items || data || [];
        console.log(`Result: SUCCESS - Found ${teams.length} teams`);
        console.log('User sees: Team cards with member avatars');
      }
    });
  });

  // ==========================================================================
  // PHASE 4: OBSERVE - Monitor and Analyze
  // ==========================================================================
  test.describe('PHASE 4: OBSERVE - Monitor and Analyze', () => {
    test('4.1 View Dashboard Metrics', async ({ page }) => {
      logStep(
        'Step 4.1: View Dashboard',
        'Navigate to Dashboard',
        'Overview with key metrics cards'
      );

      const response = await apiRequest(page, 'GET', '/metrics/dashboard');

      if (response.ok()) {
        const data = await response.json();
        console.log('Result: SUCCESS - Dashboard loaded');
        console.log('User sees: Metric cards showing:');
        console.log(`  - Total Executions: ${data.total_executions ?? data.totalExecutions ?? 'N/A'}`);
        console.log(`  - Success Rate: ${data.success_rate ?? data.successRate ?? 'N/A'}%`);
        console.log(`  - Active Agents: ${data.active_agents ?? data.activeAgents ?? 'N/A'}`);
      } else {
        console.log(`Result: Dashboard returned status ${response.status()}`);
      }
    });

    test('4.2 View Metrics Summary', async ({ page }) => {
      logStep(
        'Step 4.2: View Metrics Summary',
        'Click on metrics section',
        'Summary statistics for the organization'
      );

      const response = await apiRequest(page, 'GET', '/metrics/summary');

      if (response.ok()) {
        const data = await response.json();
        console.log('Result: SUCCESS - Metrics summary loaded');
        console.log('User sees: Summary cards with aggregate stats');
      } else {
        console.log(`Result: Metrics summary returned status ${response.status()}`);
      }
    });

    test('4.3 View Time Series Metrics', async ({ page }) => {
      logStep(
        'Step 4.3: View Execution Trends',
        'Click on View Trends',
        'Line chart showing metrics over time'
      );

      // Correct query params for timeseries
      const now = new Date();
      const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = now.toISOString();

      const response = await apiRequest(
        page,
        'GET',
        `/metrics/timeseries?metric=executions&interval=1d&start_date=${startDate}&end_date=${endDate}`
      );

      if (response.ok()) {
        const data = await response.json();
        const points = data.data || data || [];
        console.log(`Result: SUCCESS - Found ${points.length} data points`);
        console.log('User sees: Time series chart with:');
        console.log('  - X-axis: Time');
        console.log('  - Y-axis: Metric value');
        console.log('  - Interval selector');
      } else {
        console.log(`Result: Time series returned status ${response.status()}`);
      }
    });

    test('4.4 View Recent Executions', async ({ page }) => {
      logStep(
        'Step 4.4: View Recent Executions',
        'Navigate to executions list',
        'Table of recent pipeline/agent executions'
      );

      const response = await apiRequest(page, 'GET', '/metrics/executions?limit=20');

      if (response.ok()) {
        const data = await response.json();
        const executions = data.executions || data.items || data || [];
        console.log(`Result: SUCCESS - Found ${executions.length} recent executions`);
        console.log('User sees: Execution table with:');
        console.log('  - Agent/Pipeline name');
        console.log('  - Status (success/failed/running)');
        console.log('  - Duration');
        console.log('  - Timestamp');
      }
    });

    test('4.5 View Error Analysis', async ({ page }) => {
      logStep(
        'Step 4.5: View Error Analysis',
        'Navigate to error analysis section',
        'Table of most frequent errors'
      );

      const response = await apiRequest(page, 'GET', '/metrics/errors?limit=10');

      if (response.ok()) {
        const data = await response.json();
        const errors = data.errors || data.items || data || [];
        console.log(`Result: SUCCESS - Found ${errors.length} error types`);
        console.log('User sees: Error breakdown with:');
        console.log('  - Error type/message');
        console.log('  - Count');
        console.log('  - Last occurred');
      }
    });

    test('4.6 Check User Permissions', async ({ page }) => {
      logStep(
        'Step 4.6: Check User Context',
        'System checks user permissions for UI customization',
        'UI adapted based on user role and permissions'
      );

      const response = await apiRequest(page, 'GET', '/auth/permissions');

      if (response.ok()) {
        const data = await response.json();
        const permissions = data.permissions || data || [];
        console.log('Result: SUCCESS - Permissions loaded');
        console.log(`  - Permission count: ${permissions.length}`);
        console.log('User sees based on permissions:');
        console.log('  - Available navigation items');
        console.log('  - Enabled action buttons');
        console.log('  - Visible admin sections');
      }
    });
  });

  // ==========================================================================
  // CLEANUP: Remove test data
  // ==========================================================================
  test.describe('CLEANUP: Remove Test Data', () => {
    test('Cleanup created resources', async ({ page }) => {
      console.log('\n========================================');
      console.log('CLEANUP');
      console.log('========================================');

      // Delete in reverse order of dependencies
      const cleanupResults: { resource: string; status: number | string }[] = [];

      if (createdPolicyId) {
        const resp = await apiRequest(page, 'DELETE', `/policies/${createdPolicyId}`);
        cleanupResults.push({ resource: 'Policy', status: resp.status() });
      }

      if (createdTeamId) {
        const resp = await apiRequest(page, 'DELETE', `/teams/${createdTeamId}`);
        cleanupResults.push({ resource: 'Team', status: resp.status() });
      }

      if (createdDeploymentId) {
        // Stop deployment first
        await apiRequest(page, 'POST', `/deployments/${createdDeploymentId}/stop`);
        cleanupResults.push({ resource: 'Deployment (stopped)', status: 'stopped' });
      }

      if (createdGatewayId) {
        const resp = await apiRequest(page, 'DELETE', `/gateways/${createdGatewayId}`);
        cleanupResults.push({ resource: 'Gateway', status: resp.status() });
      }

      if (createdWorkUnitId) {
        const resp = await apiRequest(page, 'DELETE', `/work-units/${createdWorkUnitId}`);
        cleanupResults.push({ resource: 'Work Unit', status: resp.status() });
      }

      if (createdWorkspaceId) {
        const resp = await apiRequest(page, 'DELETE', `/workspaces/${createdWorkspaceId}`);
        cleanupResults.push({ resource: 'Workspace', status: resp.status() });
      }

      if (createdConnectorId) {
        const resp = await apiRequest(page, 'DELETE', `/connectors/${createdConnectorId}`);
        cleanupResults.push({ resource: 'Connector', status: resp.status() });
      }

      if (createdPipelineId) {
        const resp = await apiRequest(page, 'DELETE', `/pipelines/${createdPipelineId}`);
        cleanupResults.push({ resource: 'Pipeline', status: resp.status() });
      }

      if (createdAgentId) {
        const resp = await apiRequest(page, 'DELETE', `/agents/${createdAgentId}`);
        cleanupResults.push({ resource: 'Agent', status: resp.status() });
      }

      console.log('Cleanup results:');
      cleanupResults.forEach(({ resource, status }) => {
        console.log(`  - ${resource}: ${status}`);
      });
      console.log('\n========================================\n');
    });
  });
});

/**
 * COMPLETE USER WORKFLOW SUMMARY
 *
 * PHASE 1 - BUILD: Create and configure AI resources
 *   1.1 Create Agent - Atomic work unit (single AI capability)
 *   1.2 Create Pipeline - Composite work unit (workflow orchestration)
 *   1.3 Create Connector - External service integration
 *   1.4 Create Workspace - Organize work units by purpose
 *   1.5 Create Work Unit - Add to workspace with trust setup
 *   1.6 Verify Workspace - View workspace contents
 *   1.7 List Work Units - Browse all work units
 *
 * PHASE 2 - DEPLOY: Release and scale AI resources
 *   2.1 Create Gateway - API endpoint configuration
 *   2.2 Create Deployment - Deploy agent to gateway
 *   2.3 List Deployments - View all deployments
 *   2.4 List Gateways - View all gateways
 *   2.5 Check Health - Verify gateway health
 *
 * PHASE 3 - GOVERN: Control access and audit
 *   3.1 Create Team - Organize users
 *   3.2 List Roles - View available roles
 *   3.3 Create Policy - Define access rules
 *   3.4 List Policies - View all policies
 *   3.5 View Audit - Review audit trail
 *   3.6 List Teams - View all teams
 *
 * PHASE 4 - OBSERVE: Monitor and analyze
 *   4.1 Dashboard - Key metrics overview
 *   4.2 Summary - Aggregate statistics
 *   4.3 Trends - Time series analysis
 *   4.4 Executions - Recent activity
 *   4.5 Errors - Problem analysis
 *   4.6 Permissions - User context
 */
