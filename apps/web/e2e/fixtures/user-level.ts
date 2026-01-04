import type { Page } from '@playwright/test';

/**
 * User level fixture helpers for E2E testing
 *
 * Simulates different user levels by setting up mock delegation data
 * in the app's state before navigation.
 */

export type UserLevel = 1 | 2 | 3;

/**
 * Level configuration for mock user levels
 */
const LEVEL_CONFIGS: Record<UserLevel, {
  delegationsReceived: number;
  delegationsGiven: number;
  canEstablishTrust: boolean;
  trustChainPosition: 'leaf' | 'intermediate' | 'root';
}> = {
  1: {
    delegationsReceived: 0,
    delegationsGiven: 0,
    canEstablishTrust: false,
    trustChainPosition: 'leaf',
  },
  2: {
    delegationsReceived: 1,
    delegationsGiven: 3,
    canEstablishTrust: false,
    trustChainPosition: 'intermediate',
  },
  3: {
    delegationsReceived: 0,
    delegationsGiven: 5,
    canEstablishTrust: true,
    trustChainPosition: 'root',
  },
};

/**
 * Level labels for display
 */
export const LEVEL_LABELS: Record<UserLevel, string> = {
  1: 'Task Performer',
  2: 'Process Owner',
  3: 'Value Chain Owner',
};

/**
 * Routes accessible by each level
 */
export const LEVEL_ROUTES: Record<UserLevel, {
  accessible: string[];
  blocked: string[];
}> = {
  1: {
    accessible: [
      '/dashboard',
      '/work/tasks',
    ],
    blocked: [
      '/work/processes',
      '/work/value-chains',
      '/build/work-units',
      '/build/workspaces',
      '/govern/compliance',
      '/govern/audit-trail',
    ],
  },
  2: {
    accessible: [
      '/dashboard',
      '/work/tasks',
      '/work/processes',
      '/build/work-units',
      '/build/workspaces',
      '/govern/trust',
    ],
    blocked: [
      '/work/value-chains',
      '/govern/compliance',
      '/govern/audit-trail',
    ],
  },
  3: {
    accessible: [
      '/dashboard',
      '/work/tasks',
      '/work/processes',
      '/work/value-chains',
      '/build/work-units',
      '/build/workspaces',
      '/govern/trust',
      '/govern/compliance',
      '/govern/audit-trail',
    ],
    blocked: [],
  },
};

/**
 * Set up mock user level in the browser context
 * This intercepts the user-level API and returns mock data
 */
export async function setupUserLevel(page: Page, level: UserLevel): Promise<void> {
  const config = LEVEL_CONFIGS[level];

  // Set up route interception for the user-level API
  await page.route('**/api/v1/delegations/my-delegations**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        level: level,
        ...config,
      }),
    });
  });

  // Also intercept the direct level check endpoint if it exists
  await page.route('**/api/v1/user/level**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        level: level,
        ...config,
      }),
    });
  });
}

/**
 * Simulate a level transition by updating the mock response
 */
export async function simulateLevelTransition(
  page: Page,
  fromLevel: UserLevel,
  toLevel: UserLevel
): Promise<void> {
  // Update the route to return new level
  await setupUserLevel(page, toLevel);

  // Trigger a refetch of the user level data
  // This is done by dispatching a custom event or calling refetch
  await page.evaluate(() => {
    // Dispatch a custom event that the app can listen for
    window.dispatchEvent(new CustomEvent('user-level-changed'));
  });

  // Wait for the app to process the change
  await page.waitForTimeout(500);
}

/**
 * Get the expected sidebar sections for a given level
 */
export function getExpectedSidebarSections(level: UserLevel): string[] {
  const sections: string[] = ['WORK'];

  if (level >= 2) {
    sections.push('BUILD');
    sections.push('GOVERN');
    sections.push('OBSERVE');
    sections.push('ADMIN');
  }

  if (level >= 3) {
    // Level 3 sees all sections
    sections.push('WORK'); // Value Chains appears in WORK
  }

  return Array.from(new Set(sections));
}

/**
 * Get expected navigation items for a level
 */
export function getExpectedNavItems(level: UserLevel): string[] {
  const items: string[] = ['Dashboard', 'My Tasks'];

  if (level >= 2) {
    items.push('My Processes');
    items.push('Work Units');
    items.push('Workspaces');
    items.push('Trust');
  }

  if (level >= 3) {
    items.push('Value Chains');
    items.push('Compliance');
    items.push('Audit Trail');
  }

  return items;
}

/**
 * Verify sidebar shows correct items for level
 */
export async function verifySidebarForLevel(
  page: Page,
  level: UserLevel
): Promise<{ visible: string[]; hidden: string[] }> {
  const visible: string[] = [];
  const hidden: string[] = [];

  const expectedItems = getExpectedNavItems(level);
  const allPossibleItems = ['Dashboard', 'My Tasks', 'My Processes', 'Value Chains',
    'Work Units', 'Workspaces', 'Trust', 'Compliance', 'Audit Trail'];

  for (const item of allPossibleItems) {
    const link = page.locator(`a:has-text("${item}"), button:has-text("${item}")`);
    const isVisible = await link.count() > 0 && await link.first().isVisible();

    if (isVisible) {
      visible.push(item);
    } else {
      hidden.push(item);
    }
  }

  return { visible, hidden };
}
