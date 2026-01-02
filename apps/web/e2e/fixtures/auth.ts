import type { Page } from "@playwright/test";

/**
 * Backend API URL - Docker backend runs on port 8000
 */
export const API_BASE_URL = "http://localhost:8000";

/**
 * Get authorization headers for API requests
 * Exported for use by other fixture modules
 */
export async function getAuthHeaders(
  page: Page
): Promise<Record<string, string>> {
  const accessToken = await page.evaluate(() =>
    localStorage.getItem("access_token")
  );
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

/**
 * Test user credentials for E2E testing
 * These should match a user created in the backend or will be registered
 */
export const testUser = {
  email: "e2e-test-v2@example.com",
  password: "TestPassword123",
  name: "E2E Test User",
  organizationName: "E2E Test Organization",
};

/**
 * Perform real login against the backend API
 * Returns the tokens if successful
 */
export async function loginUser(
  page: Page,
  email: string = testUser.email,
  password: string = testUser.password
): Promise<{ accessToken: string; refreshToken: string } | null> {
  // First try to login
  const loginResponse = await page.request.post(
    `${API_BASE_URL}/api/v1/auth/login`,
    {
      data: { email, password },
    }
  );

  if (loginResponse.ok()) {
    const data = await loginResponse.json();
    const accessToken = data.access_token || data.tokens?.access_token;
    const refreshToken = data.refresh_token || data.tokens?.refresh_token;

    // Set tokens in localStorage
    await page.evaluate(
      ({ accessToken, refreshToken, user }) => {
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        localStorage.setItem(
          "kaizen-auth-storage",
          JSON.stringify({
            state: {
              user: user,
              tokens: {
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: "bearer",
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
      { accessToken, refreshToken, user: data.user }
    );

    return { accessToken, refreshToken };
  }

  return null;
}

/**
 * Register a new test user if not exists, then login
 */
export async function registerAndLoginUser(
  page: Page,
  user: {
    email: string;
    password: string;
    name: string;
    organizationName: string;
  } = testUser
): Promise<{ accessToken: string; refreshToken: string } | null> {
  // Try to register first (may fail if user exists)
  const registerResponse = await page.request.post(
    `${API_BASE_URL}/api/v1/auth/register`,
    {
      data: {
        email: user.email,
        password: user.password,
        name: user.name,
        organization_name: user.organizationName,
      },
    }
  );

  if (registerResponse.ok()) {
    const data = await registerResponse.json();
    const accessToken = data.tokens?.access_token || data.access_token;
    const refreshToken = data.tokens?.refresh_token || data.refresh_token;

    // Set tokens in localStorage
    await page.evaluate(
      ({ accessToken, refreshToken, user }) => {
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        localStorage.setItem(
          "kaizen-auth-storage",
          JSON.stringify({
            state: {
              user: user,
              tokens: {
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: "bearer",
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
      { accessToken, refreshToken, user: data.user }
    );

    return { accessToken, refreshToken };
  }

  // If registration failed (user exists), try login
  return loginUser(page, user.email, user.password);
}

/**
 * Setup authentication for E2E tests
 *
 * NOTE: With the new Playwright auth setup pattern, this function is only needed
 * as a fallback. The auth.setup.ts file handles authentication once before all tests,
 * and the storageState is automatically loaded for each test.
 *
 * This function now just verifies that auth state exists.
 * Call this in beforeEach if you need to ensure auth is present.
 */
export async function setupAuth(page: Page): Promise<boolean> {
  // Navigate to the app first to set up the page context (required for localStorage access)
  await page.goto("/");

  // Check if we already have auth state from the setup project
  const hasAuth = await page.evaluate(() => {
    const token = localStorage.getItem("access_token");
    const storage = localStorage.getItem("kaizen-auth-storage");
    return !!(token && storage);
  });

  if (hasAuth) {
    return true;
  }

  // Fallback: If no auth state, try to authenticate
  // This handles cases where tests run without the setup project
  console.warn("No auth state found, attempting to authenticate...");

  // Try to login or register
  const tokens = await registerAndLoginUser(page);

  if (!tokens) {
    console.error("Failed to authenticate test user");
    return false;
  }

  return true;
}

/**
 * Logout the current user
 */
export async function logoutUser(page: Page): Promise<void> {
  const accessToken = await page.evaluate(() =>
    localStorage.getItem("access_token")
  );
  const refreshToken = await page.evaluate(() =>
    localStorage.getItem("refresh_token")
  );

  if (accessToken && refreshToken) {
    await page.request.post(`${API_BASE_URL}/api/v1/auth/logout`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        refresh_token: refreshToken,
      },
    });
  }

  // Clear localStorage
  await page.evaluate(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("kaizen-auth-storage");
  });
}
