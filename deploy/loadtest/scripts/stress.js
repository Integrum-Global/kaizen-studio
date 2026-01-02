/**
 * Stress Test
 *
 * Find the breaking point by gradually increasing load.
 * Ramps up to 500 virtual users to identify system limits.
 *
 * Purpose:
 * - Identify maximum capacity
 * - Find bottlenecks
 * - Observe degradation patterns
 * - Validate auto-scaling behavior
 *
 * Usage:
 *   k6 run scripts/stress.js
 *   k6 run --env ENVIRONMENT=staging scripts/stress.js
 */

import { sleep } from 'k6';
import { UserSession, getConfig, randomSleep } from '../lib/helpers.js';

// Test Configuration
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Warm up
    { duration: '3m', target: 100 },  // Ramp to normal load
    { duration: '3m', target: 200 },  // Push to 2x normal
    { duration: '3m', target: 300 },  // Push to 3x normal
    { duration: '3m', target: 400 },  // Push to 4x normal
    { duration: '3m', target: 500 },  // Push to 5x normal (breaking point)
    { duration: '2m', target: 500 },  // Sustain max load
    { duration: '3m', target: 0 }     // Recovery
  ],
  thresholds: {
    // More lenient thresholds for stress test
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.1'],     // Allow 10% errors
    success_rate: ['rate>0.85']        // 85% success acceptable
  },
  tags: {
    test_type: 'stress',
    environment: __ENV.ENVIRONMENT || 'development'
  }
};

export function setup() {
  const config = getConfig();
  console.log(`[STRESS TEST] Starting stress test`);
  console.log(`[STRESS TEST] Base URL: ${config.baseUrl}`);
  console.log(`[STRESS TEST] This test will ramp up to 500 VUs to find breaking points`);

  // Create test users
  const testUsers = [];
  for (let i = 0; i < 20; i++) {
    const session = new UserSession(config.baseUrl);
    const email = `stress_${i}@kaizen.test`;
    const password = 'StressTest123!@#';

    session.register(email, password, `Stress Test Org ${i}`);

    if (session.accessToken) {
      testUsers.push({ email, password });
    }
  }

  console.log(`[STRESS TEST] Created ${testUsers.length} test users`);
  return { config, testUsers };
}

export default function(data) {
  const { config, testUsers } = data;
  const session = new UserSession(config.baseUrl);

  // Login with rotating test user
  const user = testUsers[__VU % testUsers.length];
  session.login(user.email, user.password);
  sleep(randomSleep(0.3, 0.7));

  if (!session.accessToken) {
    sleep(randomSleep(1, 3));
    return;
  }

  // Mixed workload to stress all endpoints
  const operations = [
    // List operations (50%)
    () => {
      session.listAgents(Math.floor(Math.random() * 5) + 1, 20);
      sleep(randomSleep(0.5, 1));
    },
    () => {
      session.listPipelines(Math.floor(Math.random() * 5) + 1, 20);
      sleep(randomSleep(0.5, 1));
    },
    // Create operations (30%)
    () => {
      const agent = session.createAgent();
      sleep(randomSleep(0.5, 1));
      if (agent && agent.id) {
        session.getAgent(agent.id);
        sleep(randomSleep(0.3, 0.7));
      }
    },
    () => {
      const pipeline = session.createPipeline();
      sleep(randomSleep(0.5, 1));
      if (pipeline && pipeline.id) {
        session.getPipeline(pipeline.id);
        sleep(randomSleep(0.3, 0.7));
      }
    },
    // Metadata operations (20%)
    () => {
      session.getMe();
      sleep(randomSleep(0.3, 0.7));
    },
    () => {
      session.getMetrics('1h');
      sleep(randomSleep(0.5, 1));
    }
  ];

  // Execute 2-4 random operations per iteration
  const numOps = Math.floor(Math.random() * 3) + 2;
  for (let i = 0; i < numOps; i++) {
    const op = operations[Math.floor(Math.random() * operations.length)];
    op();
  }

  // Logout
  session.logout();
  sleep(randomSleep(0.5, 1.5));
}

export function teardown(data) {
  console.log('[STRESS TEST] Stress test completed');
  console.log('[STRESS TEST] Review metrics to identify breaking points');
  console.log('[STRESS TEST] Check http_req_duration and http_req_failed trends');
}
