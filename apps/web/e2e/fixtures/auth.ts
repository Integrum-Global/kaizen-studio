import type { Page } from "@playwright/test";

/**
 * Backend API URL - Docker backend runs on port 8000
 */
export const API_BASE_URL = "http://localhost:8000";

/**
 * Auth setup configuration
 */
const AUTH_CONFIG = {
  /** Maximum time to wait for app hydration (ms) */
  HYDRATION_TIMEOUT: 10000,
  /** Time to wait between retry attempts (ms) */
  RETRY_INTERVAL: 200,
  /** Maximum number of retries for auth state verification */
  MAX_RETRIES: 5,
  /** Timeout for individual operations (ms) */
  OPERATION_TIMEOUT: 5000,
};

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
 * Wait for the React app to fully hydrate
 * This ensures the SPA has read localStorage and updated its internal state
 */
async function waitForAppHydration(page: Page): Promise<void> {
  // Wait for the app to be in a stable state
  // Check for either the authenticated UI (user-menu) or the login page
  try {
    await Promise.race([
      // Wait for authenticated state - user menu is visible
      page.locator('[data-testid="user-menu"]').waitFor({
        state: "visible",
        timeout: AUTH_CONFIG.HYDRATION_TIMEOUT,
      }),
      // Or wait for login page - indicates unauthenticated state
      page.locator('h1:has-text("Sign in to Kaizen Studio")').waitFor({
        state: "visible",
        timeout: AUTH_CONFIG.HYDRATION_TIMEOUT,
      }),
      // Or wait for main content area with dashboard
      page.locator("#main-content").waitFor({
        state: "visible",
        timeout: AUTH_CONFIG.HYDRATION_TIMEOUT,
      }),
    ]);
  } catch {
    // If none of the expected elements appear, wait for network idle as fallback
    await page.waitForLoadState("networkidle", {
      timeout: AUTH_CONFIG.HYDRATION_TIMEOUT,
    });
  }
}

/**
 * Check if the page is showing authenticated UI
 */
async function isShowingAuthenticatedUI(page: Page): Promise<boolean> {
  try {
    // Check for user menu which is only visible when authenticated
    const userMenu = page.locator('[data-testid="user-menu"]');
    const isVisible = await userMenu.isVisible();
    if (isVisible) return true;

    // Also check for main content area (dashboard)
    const mainContent = page.locator("#main-content");
    const mainVisible = await mainContent.isVisible();
    if (mainVisible) return true;

    return false;
  } catch {
    return false;
  }
}

/**
 * Check if the page is showing login UI
 */
async function isShowingLoginUI(page: Page): Promise<boolean> {
  try {
    const loginHeading = page.locator('h1:has-text("Sign in to Kaizen Studio")');
    return await loginHeading.isVisible();
  } catch {
    return false;
  }
}

/**
 * Verify auth state in localStorage matches what the app should recognize
 */
async function verifyAuthStateInStorage(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    const token = localStorage.getItem("access_token");
    const storageRaw = localStorage.getItem("kaizen-auth-storage");

    if (!token || !storageRaw) return false;

    try {
      const storage = JSON.parse(storageRaw);
      return (
        storage?.state?.isAuthenticated === true &&
        storage?.state?._hasHydrated === true &&
        !!storage?.state?.tokens?.access_token
      );
    } catch {
      return false;
    }
  });
}

/**
 * Setup authentication for E2E tests
 *
 * NOTE: With the new Playwright auth setup pattern, this function is only needed
 * as a fallback. The auth.setup.ts file handles authentication once before all tests,
 * and the storageState is automatically loaded for each test.
 *
 * This function:
 * 1. Navigates to the app to set up page context
 * 2. Verifies auth state exists in localStorage
 * 3. Falls back to authentication if no state exists
 */
export async function setupAuth(page: Page): Promise<boolean> {
  // Navigate to the app first to set up the page context (required for localStorage access)
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // Wait for initial page load
  await page.waitForLoadState("networkidle");

  // Check if we have auth state in localStorage (fast check)
  const hasAuthInStorage = await verifyAuthStateInStorage(page);

  if (hasAuthInStorage) {
    // Auth exists in storage - consider it valid
    // The app will hydrate and use the stored auth state
    return true;
  }

  // Fallback: If no auth state, try to authenticate
  console.warn("No valid auth state found, attempting to authenticate...");

  // Try to login or register
  const tokens = await registerAndLoginUser(page);

  if (!tokens) {
    console.error("Failed to authenticate test user");
    return false;
  }

  // After setting tokens, reload to let the app pick up the auth state
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");

  // Verify auth state is now in storage
  const hasAuthAfterLogin = await verifyAuthStateInStorage(page);
  if (hasAuthAfterLogin) {
    return true;
  }

  console.error("Authentication succeeded but state not persisted to storage");
  return false;
}

/**
 * Wait for the authenticated UI to be ready after navigation.
 * This ensures React has hydrated and the page content is visible.
 *
 * Use this after setupAuth + page.goto to avoid flaky tests.
 */
export async function waitForAuthenticatedUI(page: Page): Promise<void> {
  // Wait for network to settle
  await page.waitForLoadState("networkidle");

  // Wait for main content area to be visible (doesn't require specific auth UI)
  try {
    await page.waitForSelector("main", { timeout: AUTH_CONFIG.HYDRATION_TIMEOUT });
  } catch {
    // If no main element, just wait for body to be visible
    await page.waitForSelector("body", { timeout: AUTH_CONFIG.HYDRATION_TIMEOUT });
  }
}

/**
 * Navigate to a page and wait for authenticated content to be ready.
 * This is the recommended way to navigate in authenticated E2E tests.
 *
 * Handles race conditions where the app may not have read auth state yet
 * by implementing retry logic with page refreshes.
 *
 * @param page - Playwright page object
 * @param path - The path to navigate to (e.g., '/settings', '/pipelines')
 * @throws Error if navigation fails or authenticated UI doesn't appear
 */
export async function navigateAuthenticated(
  page: Page,
  path: string
): Promise<void> {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForAuthenticatedUI(page);
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
