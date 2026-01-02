/**
 * Soak Test (Endurance Test)
 *
 * Sustained load over extended period to detect:
 * - Memory leaks
 * - Resource exhaustion
 * - Database connection pool issues
 * - Gradual performance degradation
 *
 * Runs 100 VUs for 30 minutes.
 *
 * Usage:
 *   k6 run scripts/soak.js
 *   k6 run --env ENVIRONMENT=staging scripts/soak.js
 */

import { sleep } from 'k6';
import { UserSession, getConfig, randomSleep } from '../lib/helpers.js';

// Test Configuration
export const options = {
  stages: [
    { duration: '5m', target: 100 },   // Ramp up to 100 users
    { duration: '30m', target: 100 },  // Sustain for 30 minutes
    { duration: '5m', target: 0 }      // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<700'],
    http_req_failed: ['rate<0.02'],
    success_rate: ['rate>0.98'],
    // Ensure metrics don't degrade over time
    login_duration: ['p(95)<250'],
    logout_duration: ['p(95)<150']
  },
  tags: {
    test_type: 'soak',
    environment: __ENV.ENVIRONMENT || 'development'
  }
};

export function setup() {
  const config = getConfig();
  console.log(`[SOAK TEST] Starting soak test (30 minute sustained load)`);
  console.log(`[SOAK TEST] Base URL: ${config.baseUrl}`);
  console.log(`[SOAK TEST] Monitoring for memory leaks and degradation`);

  // Create test users
  const testUsers = [];
  for (let i = 0; i < 20; i++) {
    const session = new UserSession(config.baseUrl);
    const email = `soak_${i}@kaizen.test`;
    const password = 'SoakTest123!@#';

    session.register(email, password, `Soak Test Org ${i}`);

    if (session.accessToken) {
      testUsers.push({ email, password });
    }
  }

  console.log(`[SOAK TEST] Created ${testUsers.length} test users`);
  return { config, testUsers };
}

export default function(data) {
  const { config, testUsers } = data;
  const session = new UserSession(config.baseUrl);

  // Login with rotating test user
  const user = testUsers[__VU % testUsers.length];
  session.login(user.email, user.password);
  sleep(randomSleep(1, 2));

  if (!session.accessToken) {
    sleep(randomSleep(2, 4));
    return;
  }

  // Realistic user workflow patterns
  const workflows = [
    // Workflow 1: Agent management
    () => {
      session.listAgents(1, 20);
      sleep(randomSleep(2, 4));

      const agent = session.createAgent();
      sleep(randomSleep(2, 3));

      if (agent && agent.id) {
        session.getAgent(agent.id);
        sleep(randomSleep(1, 2));

        session.updateAgent(agent.id, {
          description: `Updated in soak test at ${new Date().toISOString()}`
        });
        sleep(randomSleep(2, 3));

        session.deleteAgent(agent.id);
        sleep(randomSleep(1, 2));
      }
    },
    // Workflow 2: Pipeline management
    () => {
      session.listPipelines(1, 20);
      sleep(randomSleep(2, 4));

      const pipeline = session.createPipeline();
      sleep(randomSleep(2, 3));

      if (pipeline && pipeline.id) {
        session.getPipeline(pipeline.id);
        sleep(randomSleep(1, 2));

        session.updatePipeline(pipeline.id, {
          description: `Updated in soak test at ${new Date().toISOString()}`
        });
        sleep(randomSleep(2, 3));

        session.deletePipeline(pipeline.id);
        sleep(randomSleep(1, 2));
      }
    },
    // Workflow 3: Monitoring and metrics
    () => {
      session.getMe();
      sleep(randomSleep(1, 2));

      session.getMetrics('1h');
      sleep(randomSleep(2, 3));

      session.listAgents(1, 10);
      sleep(randomSleep(1, 2));

      session.listPipelines(1, 10);
      sleep(randomSleep(1, 2));
    }
  ];

  // Execute 1-2 workflows per session
  const numWorkflows = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < numWorkflows; i++) {
    const workflow = workflows[Math.floor(Math.random() * workflows.length)];
    workflow();
    sleep(randomSleep(3, 5));
  }

  // Logout
  session.logout();
  sleep(randomSleep(2, 4));
}

export function teardown(data) {
  console.log('[SOAK TEST] Soak test completed (30 minutes sustained load)');
  console.log('[SOAK TEST] Review metrics for degradation over time');
  console.log('[SOAK TEST] Check for memory leaks and resource exhaustion');
  console.log('[SOAK TEST] Compare first 10 minutes vs last 10 minutes');
}
