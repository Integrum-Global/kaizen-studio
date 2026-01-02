# Billing Feature

The Billing feature provides subscription management, usage tracking, quota monitoring, and upgrade prompts.

## Feature Location

```
src/features/billing/
├── types/
│   └── billing.ts          # Type definitions
├── api/
│   └── billing.ts          # API client
├── hooks/
│   └── useBilling.ts       # React Query hooks
├── components/
│   ├── PlanCard.tsx        # Plan display card
│   ├── QuotaProgress.tsx   # Quota usage bar
│   ├── QuotaList.tsx       # All quotas
│   ├── InvoiceList.tsx     # Invoice history
│   ├── BillingDashboard.tsx # Main dashboard
│   ├── UpgradePrompt.tsx   # Upgrade CTA
│   ├── UpgradeBanner.tsx   # Banner component
│   └── QuotaWarning.tsx    # Quota warning alert
└── index.ts                # Barrel exports
```

## Types

### BillingPlan
```typescript
interface BillingPlan {
  id: string;
  name: string;
  tier: PlanTier;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limits: PlanLimits;
  isCurrent?: boolean;
  isPopular?: boolean;
}

type PlanTier = 'free' | 'starter' | 'professional' | 'enterprise';

interface PlanLimits {
  agents: number;
  pipelines: number;
  executionsPerMonth: number;
  teamMembers: number;
  apiCallsPerMonth: number;
  storageGb: number;
}
```

### Quota
```typescript
interface Quota {
  id: string;
  name: string;
  description?: string;
  current: number;
  limit: number;
  unit: string;
  resetDate?: string;
  warningThreshold: number;  // Percentage (e.g., 80)
  criticalThreshold: number; // Percentage (e.g., 95)
}
```

### Invoice
```typescript
interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  items: InvoiceItem[];
  downloadUrl?: string;
}

type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
```

## Hooks

| Hook | Description |
|------|-------------|
| `usePlans()` | Get available plans |
| `useBillingSummary()` | Get current subscription summary |
| `useUsage()` | Get current usage data |
| `useQuotas()` | Get all quotas |
| `useInvoices(filters?)` | Get invoice history |
| `useUpgrade()` | Upgrade subscription |
| `useDowngrade()` | Downgrade subscription |
| `useChangeBillingCycle()` | Switch monthly/yearly |

## Components

### PlanCard
Display a pricing plan with features.

```tsx
import { PlanCard } from '@/features/billing';

<PlanCard
  plan={plan}
  billingCycle="monthly"
  onSelect={(plan) => handleUpgrade(plan)}
/>
```

### QuotaProgress
Display quota usage with warning thresholds.

```tsx
import { QuotaProgress } from '@/features/billing';

// Full display
<QuotaProgress quota={quota} showDetails />

// Compact display
<QuotaProgress quota={quota} compact />
```

### QuotaList
Display all quotas with usage.

```tsx
import { QuotaList } from '@/features/billing';

<QuotaList showDetails />
```

### InvoiceList
Display invoice history with download links.

```tsx
import { InvoiceList } from '@/features/billing';

<InvoiceList maxItems={10} />
```

### UpgradePrompt
Full upgrade call-to-action.

```tsx
import { UpgradePrompt } from '@/features/billing';

<UpgradePrompt
  title="Upgrade to unlock more features"
  features={['Unlimited agents', '24/7 support', 'Advanced analytics']}
  onUpgrade={() => navigate('/billing/plans')}
/>
```

### UpgradeBanner
Compact upgrade banner.

```tsx
import { UpgradeBanner } from '@/features/billing';

<UpgradeBanner
  message="You've used 90% of your API calls"
  buttonText="Upgrade Now"
  onUpgrade={() => navigate('/billing/plans')}
/>
```

### QuotaWarning
Alert when quota threshold exceeded.

```tsx
import { QuotaWarning } from '@/features/billing';

<QuotaWarning
  quota={quota}
  severity="warning"
  onDismiss={() => setDismissed(true)}
  onUpgrade={() => navigate('/billing/plans')}
/>
```

## Billing Cycles

- **Monthly**: Pay month-to-month, cancel anytime
- **Yearly**: Save ~17% with annual billing

Price calculation:
```typescript
const price = billingCycle === 'yearly'
  ? plan.yearlyPrice / 12  // Monthly equivalent
  : plan.monthlyPrice;
```

## Quota Thresholds

| Level | Threshold | Color |
|-------|-----------|-------|
| Normal | < 80% | Green |
| Warning | 80-94% | Yellow |
| Critical | >= 95% | Red |

## Usage Tracking

Quotas are tracked and reset monthly:
- API calls
- Executions
- Storage
- Team members
- Agents
- Pipelines

## Integration with PermissionGate

Combine billing with permissions for feature gating:

```tsx
import { PermissionGate } from '@/features/governance';
import { UpgradePrompt } from '@/features/billing';

<PermissionGate
  resource="analytics"
  action="read"
  fallback={
    <UpgradePrompt
      title="Advanced Analytics"
      features={['Real-time metrics', 'Custom dashboards']}
    />
  }
>
  <AnalyticsDashboard />
</PermissionGate>
```
