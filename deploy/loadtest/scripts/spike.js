/**
 * Spike Test
 *
 * Tests system behavior under sudden extreme load spikes.
 * Simulates viral events, marketing campaigns, or DDoS scenarios.
 *
 * Purpose:
 * - Validate system recovery from sudden traffic bursts
 * - Test auto-scaling responsiveness
 * - Identify resource bottlenecks
 * - Ensure graceful degradation
 *
 * Usage:
 *   k6 run scripts/spike.js
 *   k6 run --env ENVIRONMENT=staging scripts/spike.js
 */

import { sleep } from 'k6';
import { UserSession, getConfig, randomSleep } from '../lib/helpers.js';

// Test Configuration
export const options = {
  stages: [
    { duration: '1m', target: 20 },    // Normal load
    { duration: '30s', target: 1000 }, // SPIKE! 50x increase
    { duration: '2m', target: 1000 },  // Sustain spike
    { duration: '30s', target: 20 },   // Drop back to normal
    { duration: '2m', target: 20 },    // Recovery period
    { duration: '30s', target: 0 }     // Ramp down
  ],
  thresholds: {
    // Very lenient thresholds for spike test
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.15'],    // Allow 15% errors during spike
    success_rate: ['rate>0.80']        // 80% success acceptable
  },
  tags: {
    test_type: 'spike',
    environment: __ENV.ENVIRONMENT || 'development'
  }
};

export function setup() {
  const config = getConfig();
  console.log(`[SPIKE TEST] Starting spike test`);
  console.log(`[SPIKE TEST] Base URL: ${config.baseUrl}`);
  console.log(`[SPIKE TEST] Will spike from 20 to 1000 VUs suddenly`);

  // Create test users
  const testUsers = [];
  for (let i = 0; i < 50; i++) {
    const session = new UserSession(config.baseUrl);
    const email = `spike_${i}@kaizen.test`;
    const password = 'SpikeTest123!@#';

    session.register(email, password, `Spike Test Org ${i}`);

    if (session.accessToken) {
      testUsers.push({ email, password });
    }
  }

  console.log(`[SPIKE TEST] Created ${testUsers.length} test users`);
  return { config, testUsers };
}

export default function(data) {
  const { config, testUsers } = data;
  const session = new UserSession(config.baseUrl);

  // Login with rotating test user
  const user = testUsers[__VU % testUsers.length];
  session.login(user.email, user.password);
  sleep(randomSleep(0.1, 0.3));

  if (!session.accessToken) {
    sleep(randomSleep(0.5, 1));
    return;
  }

  // During spike, focus on read-heavy operations (most common in real spikes)
  const scenario = Math.random();

  if (scenario < 0.5) {
    // Read agents (50%)
    session.listAgents(1, 20);
    sleep(randomSleep(0.1, 0.3));
  } else if (scenario < 0.8) {
    // Read pipelines (30%)
    session.listPipelines(1, 20);
    sleep(randomSleep(0.1, 0.3));
  } else if (scenario < 0.95) {
    // Get metrics (15%)
    session.getMetrics('1h');
    sleep(randomSleep(0.1, 0.3));
  } else {
    // Create operations (5%)
    const agent = session.createAgent();
    sleep(randomSleep(0.2, 0.5));
    if (agent && agent.id) {
      session.getAgent(agent.id);
      sleep(randomSleep(0.1, 0.3));
    }
  }

  // Quick logout
  session.logout();
  sleep(randomSleep(0.1, 0.3));
}

export function teardown(data) {
  console.log('[SPIKE TEST] Spike test completed');
  console.log('[SPIKE TEST] Review recovery metrics');
  console.log('[SPIKE TEST] Check auto-scaling behavior during spike');
  console.log('[SPIKE TEST] Verify system returned to normal after spike');
}
