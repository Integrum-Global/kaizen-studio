/**
 * Smoke Test
 *
 * Quick validation that the system handles minimal load.
 * Runs with 5 virtual users for 30 seconds.
 *
 * Purpose:
 * - Verify system is operational
 * - Validate all critical endpoints respond
 * - Run before deploying to production
 * - Quick sanity check after changes
 *
 * Usage:
 *   k6 run scripts/smoke.js
 *   k6 run --env ENVIRONMENT=staging scripts/smoke.js
 */

import { sleep } from 'k6';
import { UserSession, getConfig, randomSleep } from '../lib/helpers.js';

// Test Configuration
export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // Lenient for smoke test
    http_req_failed: ['rate<0.05'],
    success_rate: ['rate>0.95'],
    login_duration: ['p(95)<300'],
    logout_duration: ['p(95)<200']
  },
  tags: {
    test_type: 'smoke',
    environment: __ENV.ENVIRONMENT || 'development'
  }
};

// Test Lifecycle
export function setup() {
  const config = getConfig();
  console.log(`[SMOKE TEST] Starting smoke test against ${config.baseUrl}`);
  console.log(`[SMOKE TEST] Environment: ${__ENV.ENVIRONMENT || 'development'}`);
  return { config };
}

export default function(data) {
  const { config } = data;
  const session = new UserSession(config.baseUrl);

  // Test 1: Health Check
  const healthCheck = session.headers;
  delete healthCheck.Authorization;
  const health = session.getMe(); // This will fail without auth, but that's OK for smoke test

  sleep(randomSleep(0.5, 1));

  // Test 2: User Registration and Login
  const email = `smoke_${__VU}_${Date.now()}@kaizen.test`;
  const password = 'SmokeTest123!@#';

  session.register(email, password, `Smoke Test Org ${__VU}`);
  sleep(randomSleep(0.5, 1));

  // Test 3: Verify Authentication
  if (session.accessToken) {
    session.getMe();
    sleep(randomSleep(0.5, 1));

    // Test 4: List Agents
    session.listAgents(1, 10);
    sleep(randomSleep(0.5, 1));

    // Test 5: List Pipelines
    session.listPipelines(1, 10);
    sleep(randomSleep(0.5, 1));

    // Test 6: Get Metrics
    session.getMetrics('1h');
    sleep(randomSleep(0.5, 1));

    // Test 7: Logout
    session.logout();
  }

  sleep(randomSleep(1, 2));
}

export function teardown(data) {
  console.log('[SMOKE TEST] Smoke test completed');
  console.log('[SMOKE TEST] Check the summary for pass/fail metrics');
}
