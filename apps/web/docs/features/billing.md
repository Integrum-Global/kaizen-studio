# Billing Feature

The Billing feature provides subscription management, usage tracking, and invoice handling for the Kaizen Studio platform.

## Overview

The billing dashboard displays:
- **Current Plan**: Shows active subscription with name, description, and pricing
- **Usage & Quotas**: Resource usage with progress bars and limits
- **Plans**: All available plans with features and pricing comparison
- **Invoices**: Billing history with invoice details

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/billing` | BillingPage | Main billing dashboard |

## Components

### BillingDashboard
The main dashboard component with tabbed interface for billing management.

Features:
- Current plan summary card
- Billing cycle toggle (Monthly/Yearly)
- Tab navigation (Usage & Quotas, Plans, Invoices)
- Upgrade workflow with confirmation dialog

### PlanCard
Individual plan display with pricing and features.

Features:
- Plan name and description
- Monthly/yearly pricing display
- Feature list with checkmarks
- "Most Popular" and "Current Plan" badges
- Select Plan button

### QuotaList
Resource usage display with visual indicators.

Features:
- Sorted by usage percentage (highest first)
- Progress bars with color-coded thresholds
- Used/limit values with units
- Reset date information

### QuotaProgress
Individual quota visualization.

Features:
- Name and description
- Percentage used with color coding (green/yellow/red)
- Progress bar visualization
- Limit display (or "Unlimited")

### InvoiceList
Billing history with invoice details.

Features:
- Invoice number and status badge
- Billing period display
- Amount with currency
- View button for details

### UpgradePrompt
Plan upgrade confirmation dialog.

Features:
- Selected plan details
- Pricing confirmation
- Cancel/Confirm actions

## Data Flow

The billing feature connects to backend billing APIs:

```typescript
// src/features/billing/api/billing.ts
export const billingApi = {
  getPlans: async (): Promise<PlansResponse> => { ... },
  getSummary: async (): Promise<BillingSummary> => { ... },
  getUsage: async (): Promise<BillingUsage> => { ... },
  getQuotas: async (): Promise<Quota[]> => { ... },
  getInvoices: async (): Promise<InvoicesResponse> => { ... },
  upgrade: async (request: UpgradeRequest): Promise<Subscription> => { ... },
};
```

## React Query Hooks

```typescript
// Available hooks from src/features/billing/hooks
usePlans()              // Get available plans
useBillingSummary()     // Get billing summary with current plan
useUsage()              // Get current usage metrics
useQuotas()             // Get resource quotas
useInvoices()           // Get invoice history
useInvoice(id)          // Get single invoice details
useUpgrade()            // Mutation for plan upgrade
useCancel()             // Mutation for subscription cancellation
usePaymentMethods()     // Get saved payment methods
```

## Types

Key TypeScript interfaces:

```typescript
type BillingCycle = "monthly" | "yearly";
type PlanTier = "free" | "starter" | "professional" | "enterprise";

interface BillingPlan {
  id: string;
  name: string;
  tier: PlanTier;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limits: PlanLimits;
  isPopular?: boolean;
  isCurrent?: boolean;
}

interface Quota {
  id: string;
  name: string;
  description?: string;
  current: number;
  limit: number;
  unit: string;
  resetDate?: string;
  warningThreshold: number;
  criticalThreshold: number;
}

interface BillingSummary {
  currentPlan: BillingPlan;
  billingCycle: BillingCycle;
  nextBillingDate: string;
  currentPeriodEnd: string;
  usage: BillingUsage;
  upcomingAmount: number;
  currency: string;
}
```

## Pricing Tiers

| Tier | Monthly | Yearly | Features |
|------|---------|--------|----------|
| Free | $0 | $0 | 3 agents, 5 pipelines, 1K executions |
| Starter | $29 | $290 | 10 agents, 25 pipelines, 10K executions |
| Professional | $99 | $990 | 50 agents, unlimited pipelines, 100K executions |
| Enterprise | $499 | $4,990 | Unlimited everything, SLA guarantee |

## Testing

Run billing tests:
```bash
npx playwright test e2e/billing.spec.ts --project=chromium
```

Tests cover:
- Current plan display
- Usage metrics section
- Plan comparison and selection
- Invoice list and details
- Tab navigation
- Responsive design
- Accessibility requirements
