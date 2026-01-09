import { test as setup, expect } from '@playwright/test';
import { API_BASE_URL, testUser } from './fixtures/auth';

const authFile = 'playwright/.auth/user.json';

/**
 * Authentication Setup
 *
 * This runs once before all tests to authenticate and save the session state.
 * All test projects depend on this setup, so they reuse the authenticated state.
 *
 * Benefits:
 * - Authenticates only once per test run (not per test)
 * - Avoids rate limiting issues
 * - Faster test execution
 */
setup('authenticate', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');

  // Try to register first (may fail if user exists)
  const registerResponse = await page.request.post(
    `${API_BASE_URL}/api/v1/auth/register`,
    {
      data: {
        email: testUser.email,
        password: testUser.password,
        name: testUser.name,
        organization_name: testUser.organizationName,
      },
      timeout: 30000, // 30s timeout for API request
    }
  );

  let accessToken: string;
  let refreshToken: string;
  let user: Record<string, unknown>;

  if (registerResponse.ok()) {
    const data = await registerResponse.json();
    accessToken = data.tokens?.access_token || data.access_token;
    refreshToken = data.tokens?.refresh_token || data.refresh_token;
    user = data.user;
  } else {
    // User exists, try login
    const loginResponse = await page.request.post(
      `${API_BASE_URL}/api/v1/auth/login`,
      {
        data: {
          email: testUser.email,
          password: testUser.password,
        },
        timeout: 30000, // 30s timeout for API request
      }
    );

    expect(loginResponse.ok(), 'Login should succeed').toBeTruthy();

    const data = await loginResponse.json();
    accessToken = data.access_token || data.tokens?.access_token;
    refreshToken = data.refresh_token || data.tokens?.refresh_token;
    user = data.user;
  }

  // Set tokens in localStorage
  await page.evaluate(
    ({ accessToken, refreshToken, user }) => {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem(
        'kaizen-auth-storage',
        JSON.stringify({
          state: {
            user: user,
            tokens: {
              access_token: accessToken,
              refresh_token: refreshToken,
              token_type: 'bearer',
            },
            permissions: [],
            isAuthenticated: true,
            isLoading: false,
            _hasHydrated: true,
          },
          version: 0,
        })
      );
    },
    { accessToken, refreshToken, user }
  );

  // Verify we're authenticated by navigating to a protected route
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Save the authenticated state
  await page.context().storageState({ path: authFile });
});
