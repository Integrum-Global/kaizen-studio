/**
 * Pipelines Load Test
 *
 * Tests pipeline CRUD operations under load:
 * - Create pipelines
 * - Read/list pipelines
 * - Update pipelines
 * - Delete pipelines
 * - Execute pipelines
 *
 * Usage:
 *   k6 run scripts/pipelines.js
 *   k6 run --vus 100 --duration 5m scripts/pipelines.js
 */

import { sleep } from 'k6';
import { UserSession, getConfig, randomSleep, generatePipelineData } from '../lib/helpers.js';

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
    pipeline_crud_duration: ['p(95)<400', 'p(99)<800'],
    api_errors: ['count<50']
  },
  tags: {
    test_type: 'pipelines',
    environment: __ENV.ENVIRONMENT || 'development'
  }
};

// Shared state for pipeline IDs (per VU)
const createdPipelines = [];

export function setup() {
  const config = getConfig();
  console.log(`[PIPELINES TEST] Starting pipelines CRUD load test`);
  console.log(`[PIPELINES TEST] Base URL: ${config.baseUrl}`);

  // Create test users
  const testUsers = [];
  for (let i = 0; i < 10; i++) {
    const session = new UserSession(config.baseUrl);
    const email = `pipelinetest_${i}@kaizen.test`;
    const password = 'PipelineTest123!@#';

    session.register(email, password, `Pipeline Test Org ${i}`);

    if (session.accessToken) {
      testUsers.push({ email, password });
    }
  }

  console.log(`[PIPELINES TEST] Created ${testUsers.length} test users`);
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
    console.log(`[PIPELINES TEST] Failed to login as ${user.email}`);
    return;
  }

  // Scenario distribution
  const scenario = Math.random();

  // Scenario 1: Create new pipeline (30% of traffic)
  if (scenario < 0.3) {
    const pipelineData = generatePipelineData();
    const pipeline = session.createPipeline(pipelineData);

    if (pipeline && pipeline.id) {
      createdPipelines.push(pipeline.id);
      sleep(randomSleep(1, 2));

      // Read back the created pipeline
      session.getPipeline(pipeline.id);
      sleep(randomSleep(0.5, 1));
    }
  }
  // Scenario 2: List pipelines (40% of traffic)
  else if (scenario < 0.7) {
    // List first page
    session.listPipelines(1, 20);
    sleep(randomSleep(1, 2));

    // List second page
    session.listPipelines(2, 20);
    sleep(randomSleep(0.5, 1));
  }
  // Scenario 3: Update pipeline (20% of traffic)
  else if (scenario < 0.9 && createdPipelines.length > 0) {
    const pipelineId = createdPipelines[Math.floor(Math.random() * createdPipelines.length)];

    const updates = {
      description: `Updated at ${new Date().toISOString()}`,
      status: ['draft', 'active', 'archived'][Math.floor(Math.random() * 3)],
      version: `1.0.${Math.floor(Math.random() * 100)}`
    };

    session.updatePipeline(pipelineId, updates);
    sleep(randomSleep(1, 2));

    // Verify update
    session.getPipeline(pipelineId);
    sleep(randomSleep(0.5, 1));
  }
  // Scenario 4: Delete pipeline (10% of traffic)
  else if (createdPipelines.length > 0) {
    const pipelineId = createdPipelines.pop(); // Remove from array

    session.deletePipeline(pipelineId);
    sleep(randomSleep(1, 2));
  }

  // Logout
  session.logout();
  sleep(randomSleep(1, 2));
}

export function teardown(data) {
  console.log('[PIPELINES TEST] Pipelines CRUD load test completed');
  console.log(`[PIPELINES TEST] Total pipelines created: ${createdPipelines.length}`);
}
