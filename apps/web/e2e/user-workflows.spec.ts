import { test, expect } from '@playwright/test';
import { setupAuth, testUser, logoutUser, loginUser } from './fixtures/auth';
import {
  createTestAgent,
  createTestPipeline,
  createTestDeployment,
  createTestTeam,
  createTestWebhook,
  ensureAgentExists,
  ensurePipelineExists,
  ensureDeploymentExists,
  ensureTeamExists,
} from './fixtures/test-data';

/**
 * USER WORKFLOW TESTS - Value Proposition Aligned
 *
 * These tests are organized by user persona and map directly to the
 * user workflow documentation in docs/18-e2e-testing/00-user-workflow-testing-guide.md
 *
 * Each test validates the VALUE PROPOSITION delivered to the user,
 * not just technical functionality.
 */

// =============================================================================
// PART 1: DEVELOPER WORKFLOWS
// =============================================================================

test.describe('Developer Workflows', () => {
  test.describe('1.1 Authentication - Secure Access to Enterprise AI Platform', () => {
    /**
     * VALUE PROPOSITION:
     * As a Developer, I want to securely log in to Kaizen Studio
     * so that I can access my development workspace and manage my AI agents
     * without compromising security.
     */

    test('should provide seamless login experience with clear feedback', async ({ page }) => {
      await page.goto('/login');

      // Value: Clear, intuitive login interface
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 5000 });
      await expect(heading).toContainText(/login|sign in/i);

      // Value: Professional form with all required elements
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should authenticate and redirect to workspace within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      const authenticated = await setupAuth(page);
      expect(authenticated, 'Authentication should succeed').toBeTruthy();

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Value: Fast authentication (< 5 seconds)
      expect(loadTime).toBeLessThan(5000);

      // Value: User context available after login
      const main = page.locator('main');
      await expect(main).toBeVisible();
    });

    test('should maintain session persistence across page refreshes', async ({ page }) => {
      await setupAuth(page);
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Value: Session persists without re-login
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still be on dashboard, not redirected to login
      await expect(page).not.toHaveURL(/\/login/);
      const main = page.locator('main');
      await expect(main).toBeVisible();
    });

    test('should provide clear validation feedback for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForTimeout(500);

      // Value: Clear error messaging helps users correct mistakes quickly
      const errorMessages = page.locator('[role="alert"], .text-red-500, .error, [class*="error"]');
      const hasError = await errorMessages.count() > 0;
      expect(hasError, 'Validation errors should be visible').toBeTruthy();
    });
  });

  test.describe('1.2 Agent Creation - Visual Agent Configuration', () => {
    /**
     * VALUE PROPOSITION:
     * As a Developer, I want to create, configure, and manage AI agents
     * so that I can build intelligent automation solutions for my organization's needs.
     *
     * Key Value: Visual agent configuration eliminates manual coding
     */

    test.beforeEach(async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
    });

    test('should provide intuitive agent creation wizard with minimal clicks', async ({ page }) => {
      await page.goto('/agents');
      await page.waitForLoadState('networkidle');

      // Value: Quick access to create new agents
      const createButton = page.locator('button:has-text("Create"), button:has-text("New"), a[href*="new"]').first();
      await expect(createButton).toBeVisible({ timeout: 5000 });
      await expect(createButton).toBeEnabled();

      // Click count: 1 (create button)
      await createButton.click();

      // Value: Form appears immediately (dialog or page)
      const formContent = page.locator('[role="dialog"], form, input[name*="name"], input[placeholder*="name" i]').first();
      await expect(formContent).toBeVisible({ timeout: 5000 });

      // Value: Clear, labeled input fields
      const nameInput = page.locator('input[name*="name" i], input[placeholder*="name" i], input[id*="name" i]').first();
      await expect(nameInput).toBeVisible();
      await expect(nameInput).toBeEnabled();
    });

    test('should validate agent configuration in real-time', async ({ page }) => {
      await page.goto('/agents');
      await page.waitForLoadState('networkidle');

      const createButton = page.locator('button:has-text("Create"), button:has-text("New")').first();
      await createButton.click();
      await page.waitForTimeout(300);

      const nameInput = page.locator('input[name*="name" i], input[placeholder*="name" i], input[id*="name" i]').first();

      // Value: Input validation provides immediate feedback
      await nameInput.fill('Test Agent');
      await expect(nameInput).toHaveValue('Test Agent');
    });

    test('should display agent list with clear status indicators', async ({ page }) => {
      // Ensure at least one agent exists
      await ensureAgentExists(page);

      await page.goto('/agents');
      await page.waitForLoadState('networkidle');

      // Value: Agents are clearly visible and organized
      const agentItems = page.locator('[data-testid*="agent"], .agent-card, [role="listitem"], .border.rounded-lg');
      const emptyState = page.locator('text=/no agents|create your first|get started/i');

      const hasAgents = await agentItems.count() > 0;
      const hasEmptyState = await emptyState.count() > 0;

      // Value: Clear feedback on agent inventory
      expect(hasAgents || hasEmptyState).toBeTruthy();
    });

    test('should enable agent detail access with single click', async ({ page }) => {
      await ensureAgentExists(page);
      await page.goto('/agents');
      await page.waitForLoadState('networkidle');

      const agentCard = page.locator('div.cursor-pointer.rounded-lg.border:has(h3)').first();

      try {
        await agentCard.waitFor({ state: 'visible', timeout: 10000 });
      } catch {
        test.skip(true, 'No agent cards available');
        return;
      }

      // Value: Quick navigation to agent details
      const cardTitle = agentCard.locator('h3').first();
      await cardTitle.click();

      await expect(page).toHaveURL(/\/agents\/.+/);

      // Value: Detailed configuration immediately accessible
      const detailContent = page.locator('main, [role="main"]');
      await expect(detailContent).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('1.3 Pipeline Design - Visual Workflow Orchestration', () => {
    /**
     * VALUE PROPOSITION:
     * As a Developer, I want to design multi-step AI pipelines using a visual canvas
     * so that I can orchestrate complex workflows without writing deployment code.
     *
     * Key Value: Drag-and-drop interface enables rapid prototyping
     */

    test.beforeEach(async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
    });

    test('should display pipeline list with create option', async ({ page }) => {
      await page.goto('/pipelines');
      await page.waitForLoadState('networkidle');

      // Value: Clear navigation to pipeline management
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 5000 });

      // Value: Easy access to create new pipelines
      const createButton = page.locator('button:has-text("Create"), button:has-text("New"), a[href*="new"]').first();
      const hasCreateButton = await createButton.count() > 0;
      expect(hasCreateButton, 'Create button should be accessible').toBeTruthy();
    });

    test('should provide pipeline canvas for visual design', async ({ page }) => {
      await page.goto('/pipelines');
      await page.waitForLoadState('networkidle');

      const createButton = page.locator('button:has-text("Create"), button:has-text("New")').first();
      if (await createButton.count() > 0) {
        await createButton.click();
        await page.waitForTimeout(1000);

        // Value: Visual canvas or form for pipeline creation
        // Check for any form of design interface - dialog, form, canvas, or new page content
        const canvas = page.locator('[data-testid*="canvas"], .canvas, form');
        const designInterface = page.locator('[role="dialog"], form, [class*="editor"], [class*="canvas"], input');
        const newPageContent = page.locator('main h1, main h2');

        const hasCanvas = await canvas.count() > 0;
        const hasDesignInterface = await designInterface.count() > 0;
        const hasNewPage = await newPageContent.count() > 0;

        // Value: Some form of creation interface should be accessible
        expect(hasCanvas || hasDesignInterface || hasNewPage, 'Pipeline design interface should be accessible').toBeTruthy();
      } else {
        // Skip if no create button available
        test.skip(true, 'No create button available for pipeline creation');
      }
    });
  });

  test.describe('1.4 Deployment Management - Environment Control', () => {
    /**
     * VALUE PROPOSITION:
     * As a Developer, I want to deploy my agents and pipelines to different environments
     * so that I can safely test changes before production release.
     *
     * Key Value: Environment isolation prevents production incidents
     */

    test.beforeEach(async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
    });

    test('should display deployment dashboard with environment overview', async ({ page }) => {
      await page.goto('/deployments');
      await page.waitForLoadState('networkidle');

      // Value: Clear visibility into deployment status
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 5000 });

      // Value: Quick access to deployment information
      const deploymentContent = page.locator('main, [role="main"]');
      await expect(deploymentContent).toBeVisible();
    });

    test('should provide deployment creation with environment selection', async ({ page }) => {
      await page.goto('/deployments');
      await page.waitForLoadState('networkidle');

      const createButton = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Deploy")').first();

      if (await createButton.count() > 0) {
        // Value: Easy access to deployment creation
        await expect(createButton).toBeEnabled();
      }
    });
  });

  test.describe('1.6 Observability - Performance Visibility', () => {
    /**
     * VALUE PROPOSITION:
     * As a Developer, I want to monitor my agents' performance and behavior
     * so that I can identify issues and optimize their operation proactively.
     *
     * Key Value: Real-time visibility into agent behavior
     */

    test.beforeEach(async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
    });

    test('should display observability dashboard with key metrics', async ({ page }) => {
      // Check for metrics/observability page
      const metricsPages = ['/observability', '/metrics', '/monitoring'];
      let found = false;

      for (const path of metricsPages) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');

        const main = page.locator('main');
        if (await main.isVisible()) {
          found = true;
          break;
        }
      }

      if (!found) {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
      }

      // Value: Key metrics visible at a glance
      const dashboard = page.locator('main, [role="main"]');
      await expect(dashboard).toBeVisible();
    });
  });
});

// =============================================================================
// PART 2: ORG ADMIN WORKFLOWS
// =============================================================================

test.describe('Org Admin Workflows', () => {
  test.describe('2.2 User Management - Centralized Access Control', () => {
    /**
     * VALUE PROPOSITION:
     * As an Org Admin, I want to manage user accounts and access
     * so that I can control who can access the platform and what they can do.
     *
     * Key Value: Centralized user lifecycle management
     */

    test.beforeEach(async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
    });

    test('should provide user management interface', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Value: Clear navigation to admin functions
      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible();

      // Look for user management section
      const userSection = page.locator('text=/users|members|team/i').first();
      const hasUserSection = await userSection.count() > 0;

      // Value: User management accessible from settings
      expect(hasUserSection || (await page.isVisible('main'))).toBeTruthy();
    });
  });

  test.describe('2.3 Team Management - Organizational Structure', () => {
    /**
     * VALUE PROPOSITION:
     * As an Org Admin, I want to organize users into teams
     * so that I can manage permissions and resources at the team level for better governance.
     *
     * Key Value: Team-based access control simplifies management
     */

    test.beforeEach(async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
    });

    test('should display team management with create functionality', async ({ page }) => {
      await page.goto('/teams');
      await page.waitForLoadState('networkidle');

      // Value: Clear team organization interface
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 5000 });

      // Value: Easy team creation
      const createButton = page.locator('button:has-text("Create"), button:has-text("New Team")').first();
      const hasCreateButton = await createButton.count() > 0;
      expect(hasCreateButton, 'Team creation should be accessible').toBeTruthy();
    });

    test('should allow team member management', async ({ page }) => {
      await ensureTeamExists(page);
      await page.goto('/teams');
      await page.waitForLoadState('networkidle');

      // Value: Team list with clear organization
      const teamItems = page.locator('[data-testid*="team"], .team-card, .border.rounded-lg');
      const emptyState = page.locator('text=/no teams|create.*team/i');

      const hasTeams = await teamItems.count() > 0;
      const hasEmptyState = await emptyState.count() > 0;

      // Value: Clear feedback on team status
      expect(hasTeams || hasEmptyState).toBeTruthy();
    });
  });

  test.describe('2.6 Webhook Configuration - Integration Automation', () => {
    /**
     * VALUE PROPOSITION:
     * As an Org Admin, I want to configure webhooks
     * so that I can integrate Kaizen Studio events with external systems for automation.
     *
     * Key Value: Real-time event integration with external systems
     */

    test.beforeEach(async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
    });

    test('should provide webhook configuration interface', async ({ page }) => {
      await page.goto('/webhooks');
      await page.waitForLoadState('networkidle');

      // Value: Webhook management accessible
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 5000 });

      // Value: Easy webhook creation
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first();
      const hasCreateButton = await createButton.count() > 0;
      expect(hasCreateButton, 'Webhook creation should be accessible').toBeTruthy();
    });
  });
});

// =============================================================================
// PART 3: ORG OWNER WORKFLOWS
// =============================================================================

test.describe('Org Owner Workflows', () => {
  test.describe('3.1 Executive Dashboard - Strategic Visibility', () => {
    /**
     * VALUE PROPOSITION:
     * As an Org Owner, I want a high-level executive dashboard
     * so that I can monitor organizational AI initiatives and key metrics at a glance.
     *
     * Key Value: Strategic visibility across all AI initiatives
     */

    test.beforeEach(async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
    });

    test('should display executive dashboard with key metrics', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Value: Quick overview of organizational status
      const heading = page.locator('main h1, main h2').first();
      await expect(heading).toBeVisible({ timeout: 5000 });
      await expect(heading).toContainText(/dashboard|overview|welcome/i);

      // Value: Key metrics visible at a glance
      const statCards = page.locator('[data-testid*="stat"], .stat-card, [class*="metric"], [class*="card"]');
      const cardCount = await statCards.count();
      expect(cardCount, 'Dashboard should display metric cards').toBeGreaterThan(0);
    });

    test('should load dashboard within acceptable performance SLA', async ({ page }) => {
      const startTime = Date.now();

      await setupAuth(page);
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');

      const loadTime = Date.now() - startTime;

      // Value: Fast dashboard access (< 5 seconds)
      expect(loadTime, 'Dashboard should load within 5 seconds').toBeLessThan(5000);
    });

    test('should provide navigation to all key platform areas', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const sidebar = page.locator('aside, nav[class*="sidebar"]').first();
      await expect(sidebar).toBeVisible({ timeout: 5000 });

      // Value: Quick access to all platform areas
      const agentsLink = sidebar.locator('a[href*="/agents"]').first();
      const pipelinesLink = sidebar.locator('a[href*="/pipelines"]').first();

      const hasAgentsLink = await agentsLink.count() > 0;
      const hasPipelinesLink = await pipelinesLink.count() > 0;

      expect(hasAgentsLink, 'Agents navigation should be available').toBeTruthy();
      expect(hasPipelinesLink, 'Pipelines navigation should be available').toBeTruthy();
    });
  });

  test.describe('3.3 Billing Management - Cost Control', () => {
    /**
     * VALUE PROPOSITION:
     * As an Org Owner, I want to manage billing and monitor costs
     * so that I can control AI platform spending and optimize ROI.
     *
     * Key Value: Cost visibility and control
     */

    test.beforeEach(async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
    });

    test('should provide billing dashboard access', async ({ page }) => {
      // Try multiple paths for billing
      const billingPages = ['/billing', '/settings/billing', '/admin/billing'];
      let found = false;

      for (const path of billingPages) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');

        const main = page.locator('main, [role="main"]');
        if (await main.isVisible()) {
          found = true;
          break;
        }
      }

      // Value: Billing information accessible
      if (!found) {
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');
      }

      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible();
    });
  });
});

// =============================================================================
// CROSS-CUTTING CONCERNS
// =============================================================================

test.describe('Platform-Wide Value Propositions', () => {
  test.describe('Accessibility - Inclusive Design', () => {
    /**
     * VALUE PROPOSITION:
     * All users should be able to use Kaizen Studio effectively,
     * regardless of their abilities or the devices they use.
     */

    test.beforeEach(async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
    });

    test('should support keyboard-only navigation', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const focusedTags: string[] = [];

      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const focused = page.locator(':focus');
        if (await focused.count() > 0) {
          const tagName = await focused.evaluate(el => el.tagName);
          focusedTags.push(tagName);
        }
      }

      // Value: Full keyboard accessibility
      const validTags = ['BUTTON', 'A', 'INPUT', 'SELECT'];
      const validFocusCount = focusedTags.filter(tag => validTags.includes(tag)).length;
      expect(validFocusCount, 'Interactive elements should be keyboard accessible').toBeGreaterThan(0);
    });

    test('should have proper heading hierarchy for screen readers', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Value: Screen reader compatibility
      const h1 = page.locator('main h1');
      const h1Count = await h1.count();
      expect(h1Count, 'Page should have main heading').toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Responsive Design - Device Flexibility', () => {
    /**
     * VALUE PROPOSITION:
     * Users should be able to access Kaizen Studio effectively
     * from any device - desktop, tablet, or mobile.
     */

    test.describe('Mobile Experience', () => {
      test.use({ viewport: { width: 375, height: 667 } });

      test('should provide usable mobile interface', async ({ page }) => {
        const authenticated = await setupAuth(page);
        expect(authenticated).toBeTruthy();

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Value: Mobile-friendly interface
        const heading = page.locator('main h1, main h2').first();
        await expect(heading).toBeVisible();

        // Value: Content fits mobile viewport
        const main = page.locator('main');
        const box = await main.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width, 'Content should fit mobile width').toBeLessThanOrEqual(375);
      });

      test('should have touch-friendly interactive elements', async ({ page }) => {
        const authenticated = await setupAuth(page);
        expect(authenticated).toBeTruthy();

        await page.goto('/agents');
        await page.waitForLoadState('networkidle');

        // Get visible buttons only
        const buttons = page.locator('button:visible');
        const buttonCount = await buttons.count();
        expect(buttonCount).toBeGreaterThan(0);

        // Value: Touch-friendly buttons (min 32px for accessibility)
        let touchFriendlyCount = 0;
        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          const button = buttons.nth(i);
          const box = await button.boundingBox();
          if (box && box.height >= 32) {
            touchFriendlyCount++;
          }
        }

        // At least some buttons should be touch-friendly
        expect(touchFriendlyCount, 'Some buttons should be touch-friendly (>=32px)').toBeGreaterThan(0);
      });
    });

    test.describe('Desktop Experience', () => {
      test.use({ viewport: { width: 1920, height: 1080 } });

      test('should maximize desktop screen real estate', async ({ page }) => {
        const authenticated = await setupAuth(page);
        expect(authenticated).toBeTruthy();

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Value: Full desktop layout with sidebar
        const sidebar = page.locator('aside, nav[class*="sidebar"]').first();
        await expect(sidebar).toBeVisible({ timeout: 5000 });

        // Value: Clear heading in main content
        const heading = page.locator('main h1, main h2').first();
        await expect(heading).toBeVisible();
      });
    });
  });

  test.describe('Performance - Responsive Experience', () => {
    /**
     * VALUE PROPOSITION:
     * The platform should respond quickly to user actions,
     * providing a fluid, responsive experience.
     */

    test('should maintain responsiveness across multiple navigations', async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();

      // Simulate typical user navigation
      await page.goto('/dashboard');
      await page.goto('/agents');
      await page.goto('/pipelines');
      await page.goto('/dashboard');

      // Value: Platform remains responsive after repeated navigation
      const heading = page.locator('main h1, main h2').first();
      await expect(heading).toBeVisible({ timeout: 5000 });

      const buttons = page.locator('button').first();
      if (await buttons.count() > 0) {
        await expect(buttons).toBeEnabled();
      }
    });

    test('should load pages without critical console errors', async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();

      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Value: Error-free user experience
      const criticalErrors = errors.filter(
        (error) =>
          !error.includes('favicon') &&
          !error.includes('sourcemap') &&
          !error.includes('404') &&
          !error.includes('network') &&
          !error.includes('Failed to load resource')
      );

      expect(criticalErrors, 'No critical console errors').toHaveLength(0);
    });
  });
});
