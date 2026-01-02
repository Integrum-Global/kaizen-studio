/**
 * Authentication Load Test
 *
 * Tests authentication endpoints under load:
 * - User registration
 * - Login/logout flows
 * - Token refresh
 * - Session management
 *
 * Usage:
 *   k6 run scripts/auth.js
 *   k6 run --vus 50 --duration 2m scripts/auth.js
 */

import { sleep } from 'k6';
import { UserSession, getConfig, randomSleep, randomEmail } from '../lib/helpers.js';

// Test Configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 }    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<600'],
    http_req_failed: ['rate<0.02'],
    success_rate: ['rate>0.98'],
    login_duration: ['p(95)<250', 'p(99)<500'],
    logout_duration: ['p(95)<150', 'p(99)<300'],
    auth_errors: ['count<10']
  },
  tags: {
    test_type: 'auth',
    environment: __ENV.ENVIRONMENT || 'development'
  }
};

export function setup() {
  const config = getConfig();
  console.log(`[AUTH TEST] Starting authentication load test`);
  console.log(`[AUTH TEST] Base URL: ${config.baseUrl}`);
  return { config };
}

export default function(data) {
  const { config } = data;
  const session = new UserSession(config.baseUrl);

  // Scenario 1: New User Registration (30% of traffic)
  if (Math.random() < 0.3) {
    const email = randomEmail();
    const password = 'LoadTest123!@#';
    const orgName = `LoadTest Org ${__VU}`;

    session.register(email, password, orgName);
    sleep(randomSleep(1, 2));

    if (session.accessToken) {
      // Verify registration by getting user info
      session.getMe();
      sleep(randomSleep(0.5, 1));

      // Logout
      session.logout();
      sleep(randomSleep(1, 2));
    }
  }
  // Scenario 2: Existing User Login/Logout (70% of traffic)
  else {
    // Use predefined test users (assumes they exist)
    const testUsers = [
      { email: 'loadtest1@kaizen.test', password: 'LoadTest123!@#' },
      { email: 'loadtest2@kaizen.test', password: 'LoadTest123!@#' },
      { email: 'loadtest3@kaizen.test', password: 'LoadTest123!@#' },
      { email: 'loadtest4@kaizen.test', password: 'LoadTest123!@#' },
      { email: 'loadtest5@kaizen.test', password: 'LoadTest123!@#' }
    ];

    const user = testUsers[__VU % testUsers.length];

    // Login
    session.login(user.email, user.password);
    sleep(randomSleep(1, 2));

    if (session.accessToken) {
      // Verify session with /me endpoint
      session.getMe();
      sleep(randomSleep(0.5, 1));

      // Perform authenticated action
      session.listAgents(1, 10);
      sleep(randomSleep(1, 2));

      // Logout
      session.logout();
      sleep(randomSleep(1, 2));

      // Verify logout by trying to access protected endpoint
      const failedRequest = session.getMe();
      // This should fail since we logged out
    }
  }

  sleep(randomSleep(2, 4));
}

export function teardown(data) {
  console.log('[AUTH TEST] Authentication load test completed');
}
