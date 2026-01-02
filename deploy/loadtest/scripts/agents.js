/**
 * Agents Load Test
 *
 * Tests agent CRUD operations under load:
 * - Create agents
 * - Read/list agents
 * - Update agents
 * - Delete agents
 *
 * Usage:
 *   k6 run scripts/agents.js
 *   k6 run --vus 100 --duration 5m scripts/agents.js
 */

import { sleep } from 'k6';
import { UserSession, getConfig, randomSleep, generateAgentData } from '../lib/helpers.js';

// Test Configuration
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Ramp up to 20 users
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 50 },   // Ramp down to 50
    { duration: '1m', target: 0 }     // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<700'],
    http_req_failed: ['rate<0.02'],
    success_rate: ['rate>0.98'],
    agent_crud_duration: ['p(95)<400', 'p(99)<800'],
    api_errors: ['count<50']
  },
  tags: {
    test_type: 'agents',
    environment: __ENV.ENVIRONMENT || 'development'
  }
};

// Shared state for agent IDs (per VU)
const createdAgents = [];

export function setup() {
  const config = getConfig();
  console.log(`[AGENTS TEST] Starting agents CRUD load test`);
  console.log(`[AGENTS TEST] Base URL: ${config.baseUrl}`);

  // Create a test user for each VU
  const testUsers = [];
  for (let i = 0; i < 10; i++) {
    const session = new UserSession(config.baseUrl);
    const email = `agenttest_${i}@kaizen.test`;
    const password = 'AgentTest123!@#';

    session.register(email, password, `Agent Test Org ${i}`);

    if (session.accessToken) {
      testUsers.push({ email, password });
    }
  }

  console.log(`[AGENTS TEST] Created ${testUsers.length} test users`);
  return { config, testUsers };
}

export default function(data) {
  const { config, testUsers } = data;
  const session = new UserSession(config.baseUrl);

  // Login with rotating test user
  const user = testUsers[__VU % testUsers.length];
  session.login(user.email, user.password);
  sleep(randomSleep(0.5, 1));

  if (!session.accessToken) {
    console.log(`[AGENTS TEST] Failed to login as ${user.email}`);
    return;
  }

  // Scenario distribution
  const scenario = Math.random();

  // Scenario 1: Create new agent (30% of traffic)
  if (scenario < 0.3) {
    const agentData = generateAgentData();
    const agent = session.createAgent(agentData);

    if (agent && agent.id) {
      createdAgents.push(agent.id);
      sleep(randomSleep(1, 2));

      // Read back the created agent
      session.getAgent(agent.id);
      sleep(randomSleep(0.5, 1));
    }
  }
  // Scenario 2: List agents (40% of traffic)
  else if (scenario < 0.7) {
    // List first page
    session.listAgents(1, 20);
    sleep(randomSleep(1, 2));

    // List second page
    session.listAgents(2, 20);
    sleep(randomSleep(0.5, 1));
  }
  // Scenario 3: Update agent (20% of traffic)
  else if (scenario < 0.9 && createdAgents.length > 0) {
    const agentId = createdAgents[Math.floor(Math.random() * createdAgents.length)];

    const updates = {
      description: `Updated at ${new Date().toISOString()}`,
      temperature: Math.random(),
      max_tokens: Math.floor(Math.random() * 2000) + 1000
    };

    session.updateAgent(agentId, updates);
    sleep(randomSleep(1, 2));

    // Verify update
    session.getAgent(agentId);
    sleep(randomSleep(0.5, 1));
  }
  // Scenario 4: Delete agent (10% of traffic)
  else if (createdAgents.length > 0) {
    const agentId = createdAgents.pop(); // Remove from array

    session.deleteAgent(agentId);
    sleep(randomSleep(1, 2));
  }

  // Logout
  session.logout();
  sleep(randomSleep(1, 2));
}

export function teardown(data) {
  console.log('[AGENTS TEST] Agents CRUD load test completed');
  console.log(`[AGENTS TEST] Total agents created: ${createdAgents.length}`);
}
