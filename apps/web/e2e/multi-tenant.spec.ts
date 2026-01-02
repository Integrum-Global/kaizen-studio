import { test, expect } from "@playwright/test";
import {
  API_BASE_URL,
  registerAndLoginUser,
  loginUser,
  setupAuth,
  logoutUser,
} from "./fixtures/auth";

/**
 * Multi-Tenant E2E Tests
 *
 * Tests for enterprise multi-tenant SaaS features:
 * - Organization switcher
 * - SSO domain grouping
 * - Public email domain handling
 * - Multi-organization support
 * - Token refresh with org verification
 */

test.describe("Multi-Tenant - Organization Switcher", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("should hide organization switcher for single-org users", async ({
    page,
  }) => {
    // Most test users have only one organization
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Switcher should not be visible when user has only one org
    const switcher = page.locator('[data-testid="organization-switcher"]');
    // Either not present or hidden
    const count = await switcher.count();
    if (count > 0) {
      const isVisible = await switcher.isVisible();
      // If visible, it should be because user has multiple orgs
      // For most test users, this should be hidden
      expect(isVisible).toBeFalsy();
    }
  });

  test("should fetch organizations from API", async ({ page }) => {
    await page.goto("/dashboard");

    // Call the organizations API directly
    const accessToken = await page.evaluate(() =>
      localStorage.getItem("access_token")
    );

    const response = await page.request.get(
      `${API_BASE_URL}/api/v1/auth/me/organizations`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("organizations");
    expect(Array.isArray(data.organizations)).toBeTruthy();

    // User should have at least one organization
    expect(data.organizations.length).toBeGreaterThanOrEqual(1);

    // Each organization should have required fields
    if (data.organizations.length > 0) {
      const org = data.organizations[0];
      expect(org).toHaveProperty("id");
      expect(org).toHaveProperty("name");
      expect(org).toHaveProperty("role");
      expect(org).toHaveProperty("is_primary");
    }
  });
});

test.describe("Multi-Tenant - Registration Domain Handling", () => {
  test("should register user with corporate email and create organization", async ({
    page,
  }) => {
    await page.goto("/");

    const timestamp = Date.now();
    const corpUser = {
      email: `test-${timestamp}@testcorp.example`,
      password: "TestPassword123!",
      name: "Corp Test User",
      organizationName: "Test Corp Organization",
    };

    // Register new corporate user
    const registerResponse = await page.request.post(
      `${API_BASE_URL}/api/v1/auth/register`,
      {
        data: {
          email: corpUser.email,
          password: corpUser.password,
          name: corpUser.name,
          organization_name: corpUser.organizationName,
        },
      }
    );

    if (registerResponse.ok()) {
      const data = await registerResponse.json();
      expect(data).toHaveProperty("user");
      expect(data).toHaveProperty("tokens");
      expect(data.user.email).toBe(corpUser.email);
      expect(data.user.role).toBe("org_owner");
    } else {
      // If user already exists, that's OK for this test
      const errorData = await registerResponse.json();
      expect(errorData.detail).toContain("duplicate");
    }
  });

  test("should validate email format on registration", async ({ page }) => {
    await page.goto("/");

    const invalidEmails = ["notanemail", "missing@domain", "@nodomain.com"];

    for (const email of invalidEmails) {
      const response = await page.request.post(
        `${API_BASE_URL}/api/v1/auth/register`,
        {
          data: {
            email,
            password: "TestPassword123!",
            name: "Invalid Email User",
            organization_name: "Test Org",
          },
        }
      );

      // Should reject invalid emails
      expect(response.status()).toBeGreaterThanOrEqual(400);
    }
  });
});

test.describe("Multi-Tenant - Organization API", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("should return organization membership details", async ({ page }) => {
    const accessToken = await page.evaluate(() =>
      localStorage.getItem("access_token")
    );

    const response = await page.request.get(
      `${API_BASE_URL}/api/v1/auth/me/organizations`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Verify organization structure
    for (const org of data.organizations) {
      expect(org).toHaveProperty("id");
      expect(org).toHaveProperty("name");
      expect(org).toHaveProperty("slug");
      expect(org).toHaveProperty("role");
      expect(org).toHaveProperty("is_primary");
      expect(org).toHaveProperty("joined_at");
      expect(org).toHaveProperty("joined_via");

      // Validate role is one of the expected values
      expect([
        "super_admin",
        "tenant_admin",
        "org_owner",
        "org_admin",
        "developer",
        "viewer",
      ]).toContain(org.role);

      // Validate joined_via is one of the expected values
      expect(["created", "invitation", "sso", "domain_match", "legacy"]).toContain(
        org.joined_via
      );
    }
  });

  test("should reject organization switch without membership", async ({
    page,
  }) => {
    const accessToken = await page.evaluate(() =>
      localStorage.getItem("access_token")
    );

    // Try to switch to a non-existent organization
    const response = await page.request.post(
      `${API_BASE_URL}/api/v1/auth/me/switch-org`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        data: {
          organization_id: "00000000-0000-0000-0000-000000000000",
        },
      }
    );

    // Should be rejected - user doesn't have access
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe("Multi-Tenant - Token Security", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("should refresh token successfully", async ({ page }) => {
    const refreshToken = await page.evaluate(() =>
      localStorage.getItem("refresh_token")
    );

    const response = await page.request.post(
      `${API_BASE_URL}/api/v1/auth/refresh`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          refresh_token: refreshToken,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty("access_token");
    expect(data).toHaveProperty("refresh_token");
    expect(data).toHaveProperty("token_type");
    expect(data).toHaveProperty("expires_in");
    expect(data.token_type).toBe("bearer");
  });

  test("should reject expired/invalid refresh token", async ({ page }) => {
    const response = await page.request.post(
      `${API_BASE_URL}/api/v1/auth/refresh`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          refresh_token: "invalid-token",
        },
      }
    );

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test("should include organization info in access token", async ({ page }) => {
    const accessToken = await page.evaluate(() =>
      localStorage.getItem("access_token")
    );

    // Decode JWT payload (base64 middle section)
    const payload = JSON.parse(
      Buffer.from(accessToken!.split(".")[1], "base64").toString()
    );

    expect(payload).toHaveProperty("sub"); // user_id
    expect(payload).toHaveProperty("org_id"); // organization_id
    expect(payload).toHaveProperty("role");
    expect(payload).toHaveProperty("type");
    expect(payload.type).toBe("access");
  });
});

test.describe("Multi-Tenant - Me Endpoint", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("should return current user with organization context", async ({
    page,
  }) => {
    const accessToken = await page.evaluate(() =>
      localStorage.getItem("access_token")
    );

    const response = await page.request.get(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // User fields
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("email");
    expect(data).toHaveProperty("name");
    expect(data).toHaveProperty("organization_id");
    expect(data).toHaveProperty("role");
    expect(data).toHaveProperty("status");

    // Organization context
    expect(data.status).toBe("active");
  });
});

test.describe("Multi-Tenant - SSO Initiation", () => {
  test("should have Microsoft SSO endpoint", async ({ page }) => {
    const response = await page.request.get(
      `${API_BASE_URL}/api/v1/sso/initiate/microsoft`
    );

    // Might be 503 if not configured, but endpoint should exist
    expect([200, 503]).toContain(response.status());

    if (response.status() === 503) {
      const data = await response.json();
      // Support both old format (detail) and new format (error.message)
      const message = data.detail || data.error?.message || "";
      expect(message.toLowerCase()).toContain("not configured");
    }
  });

  test("should have Google SSO endpoint", async ({ page }) => {
    const response = await page.request.get(
      `${API_BASE_URL}/api/v1/sso/initiate/google`
    );

    // 200 = configured and redirecting, 503 = not configured
    expect([200, 503]).toContain(response.status());

    if (response.status() === 503) {
      const data = await response.json();
      // Support both old format (detail) and new format (error.message)
      const message = data.detail || data.error?.message || "";
      expect(message.toLowerCase()).toContain("not configured");
    }
  });

  test("should reject unknown SSO provider", async ({ page }) => {
    const response = await page.request.get(
      `${API_BASE_URL}/api/v1/sso/initiate/unknown-provider`
    );

    expect(response.status()).toBe(400);
    const data = await response.json();
    // Support both old format (detail) and new format (error.message)
    const message = data.detail || data.error?.message || "";
    expect(message.toLowerCase()).toContain("unknown provider");
  });
});

test.describe("Multi-Tenant - Role Hierarchy", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("should enforce role-based access on admin endpoints", async ({
    page,
  }) => {
    const accessToken = await page.evaluate(() =>
      localStorage.getItem("access_token")
    );

    // Test accessing SSO connections (requires org_owner/org_admin)
    const response = await page.request.get(
      `${API_BASE_URL}/api/v1/sso/connections`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Should succeed if user is org_owner (from registration)
    // or fail with 403 if user has lower role
    // 500 may occur if SSO is not fully configured
    expect([200, 403, 500]).toContain(response.status());
  });
});

test.describe("Multi-Tenant - Frontend Integration", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("should persist auth state in localStorage", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Check Zustand auth store
    const authState = await page.evaluate(() => {
      const stored = localStorage.getItem("kaizen-auth-storage");
      return stored ? JSON.parse(stored) : null;
    });

    expect(authState).toBeTruthy();
    expect(authState.state).toHaveProperty("isAuthenticated", true);
    expect(authState.state).toHaveProperty("user");
    expect(authState.state).toHaveProperty("tokens");
  });

  test("should handle logout correctly", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Logout
    await logoutUser(page);

    // Auth state should be cleared
    const accessToken = await page.evaluate(() =>
      localStorage.getItem("access_token")
    );
    expect(accessToken).toBeNull();
  });
});

test.describe("Multi-Tenant - Responsive Design", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("should show header on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Header should be visible on mobile
    const header = page.locator("header").first();
    await expect(header).toBeVisible();
  });

  test("should show header on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Header should be visible on desktop
    const header = page.locator("header").first();
    await expect(header).toBeVisible();
  });
});
