/**
 * Billing types and interfaces
 */

export type BillingTier = "free" | "starter" | "professional" | "enterprise";
export type BillingCycle = "monthly" | "yearly";
export type InvoiceStatus =
  | "draft"
  | "pending"
  | "paid"
  | "failed"
  | "cancelled";
export type UsageTrend = "up" | "down" | "stable";

/**
 * Billing plan details
 */
export interface BillingPlan {
  id: string;
  name: string;
  tier: BillingTier;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limits: BillingLimits;
  isCurrent: boolean;
  isPopular?: boolean;
}

/**
 * Usage limits for a plan
 */
export interface BillingLimits {
  agents: number;
  pipelines: number;
  executionsPerMonth: number;
  teamMembers: number;
  apiCallsPerMonth: number;
  storageGb: number;
}

/**
 * Current usage against limits
 */
export interface BillingUsage {
  agents: UsageMetric;
  pipelines: UsageMetric;
  executions: UsageMetric;
  teamMembers: UsageMetric;
  apiCalls: UsageMetric;
  storage: UsageMetric;
}

/**
 * Single usage metric
 */
export interface UsageMetric {
  current: number;
  limit: number;
  unit: string;
  trend: UsageTrend;
  percentUsed: number;
}

/**
 * Quota with progress tracking
 */
export interface Quota {
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

/**
 * Invoice record
 */
export interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  paidAt?: string;
  downloadUrl?: string;
  items: InvoiceItem[];
}

/**
 * Invoice line item
 */
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

/**
 * Billing summary
 */
export interface BillingSummary {
  currentPlan: BillingPlan;
  billingCycle: BillingCycle;
  nextBillingDate: string;
  currentPeriodEnd: string;
  usage: BillingUsage;
  upcomingAmount: number;
  currency: string;
}

/**
 * Subscription details
 */
export interface Subscription {
  id: string;
  planId: string;
  status: "active" | "past_due" | "cancelled" | "trialing";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
}

/**
 * Payment method
 */
export interface PaymentMethod {
  id: string;
  type: "card" | "bank_account";
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

/**
 * Response from plans endpoint
 */
export interface PlansResponse {
  plans: BillingPlan[];
}

/**
 * Response from invoices endpoint
 */
export interface InvoicesResponse {
  records: Invoice[];
  total: number;
}

/**
 * Upgrade request payload
 */
export interface UpgradeRequest {
  planId: string;
  billingCycle: BillingCycle;
}
