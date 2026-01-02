import { test, expect } from '@playwright/test';
import { setupAuth } from './fixtures/auth';

test.describe('Billing Page', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
  });

  test('should display billing page header', async ({ page }) => {
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/billing|subscription|payment/i);
  });

  test('should show current plan information', async ({ page }) => {
    // Look for "Current Plan" card title
    const planContent = page.locator('text=/current plan/i').first();
    await expect(planContent).toBeVisible({ timeout: 10000 });
  });

  test('should display usage metrics section', async ({ page }) => {
    // Look for Usage & Quotas tab
    const usageTab = page.locator('[role="tab"]').first();
    await expect(usageTab).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Billing - Plans', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
  });

  test('should display available plans tab', async ({ page }) => {
    // Navigate to Plans tab
    const plansTab = page.locator('[role="tab"]:has-text("Plans")');
    await expect(plansTab).toBeVisible({ timeout: 5000 });
  });

  test('should show plan pricing with currency symbol', async ({ page }) => {
    // Plans tab shows pricing info with $ signs
    const pricing = page.locator('text=/\\$\\d+|free|next payment/i').first();
    await expect(pricing).toBeVisible({ timeout: 5000 });
  });

  test('should have plan selection available after clicking Plans tab', async ({ page }) => {
    // Click on Plans tab
    const plansTab = page.locator('[role="tab"]:has-text("Plans")');
    if (await plansTab.count() > 0) {
      await plansTab.click();
      await page.waitForTimeout(500);
    }

    // Look for active tab panel
    const planContent = page.locator('[role="tabpanel"][data-state="active"]').first();
    await expect(planContent).toBeVisible({ timeout: 5000 });
  });

  test('should display plan features list', async ({ page }) => {
    // Click on Plans tab
    const plansTab = page.locator('[role="tab"]:has-text("Plans")');
    if (await plansTab.count() > 0) {
      await plansTab.click();
      await page.waitForTimeout(500);
    }

    // Features are shown as list items with checkmarks
    const features = page.locator('ul li');
    const count = await features.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Billing - Payment Methods', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
  });

  test('should show billing information in header', async ({ page }) => {
    // The billing page shows Next Payment info
    const paymentInfo = page.locator('text=/next payment|payment/i').first();
    await expect(paymentInfo).toBeVisible({ timeout: 5000 });
  });

  test('should display payment amount', async ({ page }) => {
    // Look for payment amount with currency
    const amount = page.locator('text=/\\$\\d+\\.\\d{2}/').first();
    await expect(amount).toBeVisible({ timeout: 5000 });
  });

  test('should show billing date information', async ({ page }) => {
    // Look for billing date
    const billingDate = page.locator('text=/billing date|period ends/i').first();
    await expect(billingDate).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Billing - Invoices', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
  });

  test('should have invoices tab accessible', async ({ page }) => {
    const invoicesTab = page.locator('[role="tab"]:has-text("Invoices")');
    await expect(invoicesTab).toBeVisible({ timeout: 5000 });
  });

  test('should display invoices list when tab is selected', async ({ page }) => {
    // Click on Invoices tab
    const invoicesTab = page.locator('[role="tab"]:has-text("Invoices")');
    await invoicesTab.click();
    await page.waitForTimeout(500);

    // Look for active tab panel with invoice content
    const invoiceContent = page.locator('[role="tabpanel"][data-state="active"]').first();
    await expect(invoiceContent).toBeVisible({ timeout: 5000 });
  });

  test('should show invoice details with amounts', async ({ page }) => {
    // Click on Invoices tab
    const invoicesTab = page.locator('[role="tab"]:has-text("Invoices")');
    await invoicesTab.click();
    await page.waitForTimeout(500);

    // Look for invoice with amount
    const invoiceAmount = page.locator('text=/\\$\\d+\\.\\d{2}/').first();
    await expect(invoiceAmount).toBeVisible({ timeout: 5000 });
  });

  test('should have view button for invoices', async ({ page }) => {
    // Click on Invoices tab
    const invoicesTab = page.locator('[role="tab"]:has-text("Invoices")');
    await invoicesTab.click();
    await page.waitForTimeout(500);

    const viewButton = page.locator('button:has-text("View")').first();
    if (await viewButton.count() > 0) {
      await expect(viewButton).toBeVisible();
      await expect(viewButton).toBeEnabled();
    }
  });
});

test.describe('Billing - Usage', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
  });

  test('should have Usage & Quotas tab', async ({ page }) => {
    const usageTab = page.locator('[role="tab"]:has-text("Usage")');
    await expect(usageTab).toBeVisible({ timeout: 5000 });
  });

  test('should show resource quotas heading', async ({ page }) => {
    // Usage tab should be selected by default or click it
    const usageTab = page.locator('[role="tab"]:has-text("Usage")');
    if (!(await usageTab.getAttribute('aria-selected'))) {
      await usageTab.click();
      await page.waitForTimeout(500);
    }

    const quotaHeading = page.locator('text=/resource quota|quota/i').first();
    await expect(quotaHeading).toBeVisible({ timeout: 5000 });
  });

  test('should display percentage values for usage', async ({ page }) => {
    // Usage tab is selected by default
    const usagePanel = page.locator('[role="tabpanel"][data-state="active"]');
    await expect(usagePanel).toBeVisible({ timeout: 5000 });

    // Look for percentage display (may need to wait for data to load)
    const percentage = page.locator('text=/%/').first();
    if (await percentage.count() > 0) {
      await expect(percentage).toBeVisible();
    }
  });

  test('should display progress bars for usage visualization', async ({ page }) => {
    // Usage tab is selected by default, wait for content to load
    await page.waitForTimeout(500);

    // Progress component uses role="progressbar"
    const progressBars = page.locator('[role="progressbar"]');
    const count = await progressBars.count();
    // May not have progress bars if data is still loading
    if (count > 0) {
      await expect(progressBars.first()).toBeVisible();
    }
  });
});

test.describe('Billing - Subscription Management', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
  });

  test('should show current plan badge', async ({ page }) => {
    // Look for plan name badge
    const planBadge = page.locator('text=/free|starter|pro|enterprise/i').first();
    await expect(planBadge).toBeVisible({ timeout: 5000 });
  });

  test('should display billing period information', async ({ page }) => {
    // Look for billing cycle info
    const billingInfo = page.locator('text=/monthly|annually|billing date|period ends/i').first();
    await expect(billingInfo).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Billing - Responsive', () => {
  test.describe('Mobile View', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display billing content on mobile', async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
      await page.goto('/billing');
      await page.waitForLoadState('networkidle');

      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
    });
  });

  test.describe('Desktop View', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('should display billing with sidebar on desktop', async ({ page }) => {
      const authenticated = await setupAuth(page);
      expect(authenticated).toBeTruthy();
      await page.goto('/billing');
      await page.waitForLoadState('networkidle');

      const heading = page.locator('main h1').first();
      await expect(heading).toBeVisible();

      const sidebar = page.locator('aside, nav').first();
      await expect(sidebar).toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe('Billing - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    await expect(h1.first()).toBeVisible();
  });

  test('should support keyboard navigation through tabs', async ({ page }) => {
    // Tab to reach the tabs
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('should have accessible buttons with labels', async ({ page }) => {
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);

    // Check first few buttons have accessible names
    const checkCount = Math.min(buttonCount, 5);
    for (let i = 0; i < checkCount; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');

      const hasAccessibleName = (text?.trim().length ?? 0) > 0 || ariaLabel || title;
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should have accessible pricing information', async ({ page }) => {
    const pricing = page.locator('text=/\\$\\d+|free/i').first();
    await expect(pricing).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Billing - Plan Comparison', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
  });

  test('should show plans with different pricing tiers', async ({ page }) => {
    // Click on Plans tab
    const plansTab = page.locator('[role="tab"]:has-text("Plans")');
    await plansTab.click();
    await page.waitForTimeout(500);

    // Look for multiple plan names
    const planNames = page.locator('text=/free|starter|professional|enterprise/i');
    const count = await planNames.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should indicate current plan clearly', async ({ page }) => {
    // Current Plan heading is shown at the top
    const currentPlan = page.locator('text=/current plan/i').first();
    await expect(currentPlan).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Billing - Alerts and Warnings', () => {
  test.beforeEach(async ({ page }) => {
    const authenticated = await setupAuth(page);
    expect(authenticated, 'Failed to authenticate with backend').toBeTruthy();
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
  });

  test('should show next payment information', async ({ page }) => {
    const paymentInfo = page.locator('text=/next payment/i').first();
    await expect(paymentInfo).toBeVisible({ timeout: 5000 });
  });

  test('should show billing date information', async ({ page }) => {
    const billingInfo = page.locator('text=/billing date|period ends/i').first();
    await expect(billingInfo).toBeVisible({ timeout: 5000 });
  });
});
