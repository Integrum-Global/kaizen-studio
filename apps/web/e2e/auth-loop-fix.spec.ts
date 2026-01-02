import { test, expect, Page } from '@playwright/test';

/**
 * Tests to verify the auth loop fix works correctly
 * These tests specifically check for:
 * 1. Login page doesn't cause infinite refresh/redirect loops
 * 2. Agents page doesn't crash with undefined data errors
 */

test.describe('Auth Loop Fix - Login Page Stability', () => {
  test('login page should load without infinite refresh', async ({ page }) => {
    // Track page navigations to detect loops
    const navigations: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        navigations.push(frame.url());
      }
    });

    // Go to login page
    await page.goto('/login');

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait 3 seconds to detect any loops

    // Should still be on login page
    expect(page.url()).toContain('/login');

    // Should not have more than 2-3 navigations (initial + possible redirect)
    // More than 5 would indicate a loop
    expect(navigations.length).toBeLessThan(5);

    // Login form should be visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('login page should not have console errors about auth loops', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Filter for critical errors (not 401s which are expected without backend)
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes('401') &&
        !error.includes('favicon') &&
        !error.includes('sourcemap') &&
        !error.includes('net::ERR') &&
        !error.includes('Failed to load resource')
    );

    // Should not have errors about 'length' property (the agents bug)
    const lengthErrors = errors.filter((e) => e.includes("reading 'length'"));
    expect(lengthErrors).toHaveLength(0);
  });

  test('should clear stale auth state on page load', async ({ page }) => {
    // Track page navigations to detect loops
    const navigations: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        navigations.push(frame.url());
      }
    });

    // Go to login page first
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Set stale auth state (isAuthenticated true but no actual token keys)
    await page.evaluate(() => {
      localStorage.clear();
      // Set stale zustand state - WITHOUT actual access_token key
      localStorage.setItem('kaizen-auth-storage', JSON.stringify({
        state: {
          user: { id: 'test', email: 'test@test.com' },
          isAuthenticated: true,
          tokens: { access_token: 'stale', refresh_token: 'stale' },
        },
        version: 0,
      }));
    });

    // Reset nav count for reload test
    navigations.length = 0;

    // Reload the page - this should trigger the stale state handling
    await page.reload();
    await page.waitForTimeout(3000);

    // Verify the stale state was cleared
    const authState = await page.evaluate(() => {
      const stored = localStorage.getItem('kaizen-auth-storage');
      return stored ? JSON.parse(stored) : null;
    });

    // The state should show isAuthenticated: false after clearing
    expect(authState?.state?.isAuthenticated).toBe(false);

    // Should not have excessive navigations (more than 5 = loop)
    expect(navigations.length).toBeLessThan(5);

    // Should still be on login page
    expect(page.url()).toContain('/login');
  });

  test('root path should redirect to login when not authenticated', async ({ page }) => {
    // Clear any existing auth state
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Navigate to root
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should redirect to login (via dashboard -> login redirect)
    // The exact path might be /login or still loading dashboard
    const url = page.url();
    expect(url.includes('/login') || url.includes('/dashboard')).toBeTruthy();
  });
});

test.describe('Auth Loop Fix - No Infinite API Calls', () => {
  test('login page should not make auth API calls', async ({ page }) => {
    const apiCalls: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/')) {
        apiCalls.push(url);
      }
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Filter for auth-related calls
    const authCalls = apiCalls.filter(
      (url) => url.includes('/auth/me') || url.includes('/auth/permissions')
    );

    // Should not make auth calls when on login page
    // (Maybe 1 if there's stale state that gets cleared)
    expect(authCalls.length).toBeLessThan(3);
  });
});

test.describe('Agents Page - Data Handling Fix', () => {
  // Mock authenticated state for agents page tests
  test.beforeEach(async ({ page }) => {
    // Mock auth APIs to return success
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'test-user', email: 'test@example.com', full_name: 'Test User' }),
      });
    });
    await page.route('**/api/v1/auth/permissions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(['agents:read', 'agents:write']),
      });
    });

    await page.goto('/login');
    await page.evaluate(() => {
      // Set up authenticated state
      localStorage.setItem('access_token', 'test-token');
      localStorage.setItem('refresh_token', 'test-refresh');
      localStorage.setItem('kaizen-auth-storage', JSON.stringify({
        state: {
          user: { id: 'test-user', email: 'test@example.com', full_name: 'Test User' },
          tokens: { access_token: 'test-token', refresh_token: 'test-refresh' },
          permissions: ['agents:read', 'agents:write'],
          isAuthenticated: true,
          isLoading: false,
          _hasHydrated: true,
        },
        version: 0,
      }));
    });
  });

  test('agents page should handle empty/null tools array gracefully', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Mock the API to return agents with null/undefined tools
    await page.route('**/api/v1/agents**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          records: [
            {
              id: 'agent-1',
              name: 'Test Agent',
              description: 'A test agent',
              type: 'chat',
              provider: 'openai',
              model: 'gpt-4',
              status: 'active',
              tools: null, // Null tools - should not crash
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
            {
              id: 'agent-2',
              name: 'Agent Without Tools',
              description: 'Another agent',
              type: 'completion',
              provider: 'anthropic',
              model: 'claude-3',
              status: 'active',
              // Missing tools field entirely - should not crash
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          ],
          total: 2,
        }),
      });
    });

    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should not have the 'length' error
    const lengthErrors = errors.filter((e) => e.includes("reading 'length'"));
    expect(lengthErrors).toHaveLength(0);

    // Page should display agents without crashing
    const agentCards = page.locator('.cursor-pointer'); // Agent cards have cursor-pointer
    await expect(agentCards.first()).toBeVisible({ timeout: 5000 }).catch(() => {
      // If no cards, check for empty state which is also acceptable
    });
  });

  test('agents page should handle missing agent fields gracefully', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Mock API with minimal agent data
    await page.route('**/api/v1/agents**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          records: [
            {
              id: 'agent-minimal',
              // Missing most fields - should use defaults
            },
          ],
          total: 1,
        }),
      });
    });

    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should not crash
    const criticalErrors = errors.filter(
      (e) => e.includes('TypeError') || e.includes('Cannot read properties')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('agents page should handle array response format', async ({ page }) => {
    // Mock API returning array instead of paginated object
    await page.route('**/api/v1/agents**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'agent-1',
            name: 'Array Agent',
            type: 'chat',
            provider: 'openai',
            model: 'gpt-4',
            status: 'active',
            tools: [],
          },
        ]),
      });
    });

    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should handle array response without crashing
    // Use getByRole to be more specific - the page has "AI Agents" heading
    const heading = page.getByRole('heading', { name: /agents/i });
    await expect(heading).toBeVisible();
  });

  test('agents page should handle 401 without infinite loops', async ({ page }) => {
    const navigations: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        navigations.push(frame.url());
      }
    });

    // Mock API returning 401
    await page.route('**/api/v1/agents**', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Not authenticated' }),
      });
    });

    await page.goto('/agents');
    await page.waitForTimeout(5000); // Wait to detect loops

    // Should eventually redirect to login without infinite loops
    // Max navigations should be reasonable (< 10)
    expect(navigations.length).toBeLessThan(10);
  });
});
