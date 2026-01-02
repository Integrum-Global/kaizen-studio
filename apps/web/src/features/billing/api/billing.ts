import apiClient from "@/api";
import type {
  BillingPlan,
  BillingUsage,
  BillingSummary,
  Quota,
  Invoice,
  PlansResponse,
  InvoicesResponse,
  UpgradeRequest,
  Subscription,
  PaymentMethod,
  UsageTrend,
} from "../types";

/**
 * Default plan configurations - these match the backend PLAN_QUOTAS
 */
const PLAN_CONFIGS: Record<string, Omit<BillingPlan, "isCurrent">> = {
  free: {
    id: "plan-free",
    name: "Free",
    tier: "free",
    description: "Get started with basic features",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "Up to 3 agents",
      "5 pipelines",
      "1,000 executions/month",
      "1 team member",
      "Community support",
    ],
    limits: {
      agents: 3,
      pipelines: 5,
      executionsPerMonth: 1000,
      teamMembers: 1,
      apiCallsPerMonth: 10000,
      storageGb: 1,
    },
  },
  starter: {
    id: "plan-starter",
    name: "Starter",
    tier: "starter",
    description: "Perfect for small teams",
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      "Up to 10 agents",
      "25 pipelines",
      "10,000 executions/month",
      "5 team members",
      "Email support",
      "Basic analytics",
    ],
    limits: {
      agents: 10,
      pipelines: 25,
      executionsPerMonth: 10000,
      teamMembers: 5,
      apiCallsPerMonth: 100000,
      storageGb: 10,
    },
  },
  pro: {
    id: "plan-professional",
    name: "Professional",
    tier: "professional",
    description: "For growing organizations",
    monthlyPrice: 99,
    yearlyPrice: 990,
    isPopular: true,
    features: [
      "Up to 50 agents",
      "Unlimited pipelines",
      "100,000 executions/month",
      "20 team members",
      "Priority support",
      "Advanced analytics",
      "Custom integrations",
      "SSO/SAML",
    ],
    limits: {
      agents: 50,
      pipelines: -1,
      executionsPerMonth: 100000,
      teamMembers: 20,
      apiCallsPerMonth: 1000000,
      storageGb: 100,
    },
  },
  enterprise: {
    id: "plan-enterprise",
    name: "Enterprise",
    tier: "enterprise",
    description: "For large-scale deployments",
    monthlyPrice: 499,
    yearlyPrice: 4990,
    features: [
      "Unlimited agents",
      "Unlimited pipelines",
      "Unlimited executions",
      "Unlimited team members",
      "24/7 dedicated support",
      "Advanced security",
      "Custom contracts",
      "On-premise option",
      "SLA guarantee",
    ],
    limits: {
      agents: -1,
      pipelines: -1,
      executionsPerMonth: -1,
      teamMembers: -1,
      apiCallsPerMonth: -1,
      storageGb: -1,
    },
  },
};

/**
 * Transform backend quota to frontend Quota type
 */
function transformQuota(backendQuota: Record<string, unknown>): Quota {
  const current = (backendQuota.current_usage as number) || 0;
  const limit = (backendQuota.limit_value as number) || -1;
  const resourceType = backendQuota.resource_type as string;

  return {
    id: backendQuota.id as string,
    name: formatResourceName(resourceType),
    description: `${formatResourceName(resourceType)} usage`,
    current,
    limit,
    unit: getResourceUnit(resourceType),
    resetDate: backendQuota.last_reset_at as string | undefined,
    warningThreshold: 80,
    criticalThreshold: 95,
  };
}

/**
 * Format resource type to display name
 */
function formatResourceName(resourceType: string): string {
  const names: Record<string, string> = {
    agent_execution: "Agent Executions",
    token: "Tokens",
    storage: "Storage",
    api_call: "API Calls",
  };
  return names[resourceType] || resourceType;
}

/**
 * Get unit for resource type
 */
function getResourceUnit(resourceType: string): string {
  const units: Record<string, string> = {
    agent_execution: "executions",
    token: "tokens",
    storage: "GB",
    api_call: "calls",
  };
  return units[resourceType] || "units";
}

/**
 * Calculate usage trend based on current vs limit
 */
function calculateTrend(percentUsed: number): UsageTrend {
  if (percentUsed > 70) return "up";
  if (percentUsed < 30) return "down";
  return "stable";
}

/**
 * Transform backend billing period to frontend Invoice type
 */
function transformBillingPeriodToInvoice(
  period: Record<string, unknown>
): Invoice {
  const status = period.status as string;

  return {
    id: period.id as string,
    number: `INV-${(period.id as string).substring(0, 8).toUpperCase()}`,
    status:
      status === "closed" ? "paid" : status === "active" ? "pending" : "draft",
    amount: (period.total_cost as number) || 0,
    currency: "USD",
    periodStart: period.start_date as string,
    periodEnd: period.end_date as string,
    dueDate: period.end_date as string,
    paidAt: status === "closed" ? (period.end_date as string) : undefined,
    downloadUrl: undefined,
    items: [
      {
        id: `item-${period.id}`,
        description: `Usage for billing period`,
        quantity: 1,
        unitPrice: (period.total_cost as number) || 0,
        amount: (period.total_cost as number) || 0,
      },
    ],
  };
}

/**
 * Billing API client
 */
export const billingApi = {
  /**
   * Get all available plans
   */
  getPlans: async (): Promise<PlansResponse> => {
    try {
      const response = await apiClient.get<{ plans: Record<string, unknown> }>(
        "/api/v1/billing/plans"
      );
      const backendPlans = response.data.plans;

      // Transform backend plans to frontend format
      const plans: BillingPlan[] = Object.entries(PLAN_CONFIGS).map(
        ([tier, config]) => ({
          ...config,
          isCurrent: false, // Will be updated by getSummary
          limits: backendPlans[tier]
            ? {
                agents:
                  (backendPlans[tier] as Record<string, number>)
                    .agent_execution || config.limits.agents,
                pipelines: config.limits.pipelines,
                executionsPerMonth:
                  (backendPlans[tier] as Record<string, number>)
                    .agent_execution || config.limits.executionsPerMonth,
                teamMembers: config.limits.teamMembers,
                apiCallsPerMonth:
                  (backendPlans[tier] as Record<string, number>).api_call ||
                  config.limits.apiCallsPerMonth,
                storageGb:
                  (backendPlans[tier] as Record<string, number>).storage ||
                  config.limits.storageGb,
              }
            : config.limits,
        })
      );

      return { plans };
    } catch {
      // Return default plans if backend fails
      return {
        plans: Object.values(PLAN_CONFIGS).map((config) => ({
          ...config,
          isCurrent: false,
        })),
      };
    }
  },

  /**
   * Get billing summary
   */
  getSummary: async (): Promise<BillingSummary> => {
    // Get current period, quotas, and usage in parallel
    const [periodResponse, quotasResponse, usageResponse] = await Promise.all([
      apiClient.get<Record<string, unknown>>("/api/v1/billing/periods/current"),
      apiClient.get<{ quotas: Record<string, unknown>[] }>(
        "/api/v1/billing/quotas"
      ),
      billingApi.getUsage(),
    ]);

    const currentPeriod = periodResponse.data;
    const quotas = quotasResponse.data.quotas || [];

    // Determine current plan based on quotas
    const currentTier = determineCurrentTier(quotas);
    const planConfig = PLAN_CONFIGS[currentTier] || PLAN_CONFIGS.free;

    const currentPlan: BillingPlan = {
      id: planConfig?.id || "plan-free",
      name: planConfig?.name || "Free",
      tier: planConfig?.tier || "free",
      description: planConfig?.description || "Basic plan",
      monthlyPrice: planConfig?.monthlyPrice || 0,
      yearlyPrice: planConfig?.yearlyPrice || 0,
      features: planConfig?.features || [],
      limits: planConfig?.limits || {
        agents: 3,
        pipelines: 5,
        executionsPerMonth: 1000,
        teamMembers: 1,
        apiCallsPerMonth: 10000,
        storageGb: 1,
      },
      isPopular: planConfig?.isPopular,
      isCurrent: true,
    };

    return {
      currentPlan,
      billingCycle: "monthly",
      nextBillingDate: currentPeriod.end_date as string,
      currentPeriodEnd: currentPeriod.end_date as string,
      usage: usageResponse,
      upcomingAmount:
        (currentPeriod.total_cost as number) || planConfig?.monthlyPrice || 0,
      currency: "USD",
    };
  },

  /**
   * Get current usage
   */
  getUsage: async (): Promise<BillingUsage> => {
    const response = await apiClient.get<{ quotas: Record<string, unknown>[] }>(
      "/api/v1/billing/quotas"
    );
    const quotas = response.data.quotas || [];

    // Transform quotas to usage metrics
    const starterLimits = PLAN_CONFIGS.starter?.limits || {
      agents: 10,
      pipelines: 25,
      executionsPerMonth: 10000,
      teamMembers: 5,
      apiCallsPerMonth: 100000,
      storageGb: 10,
    };
    const usage: BillingUsage = {
      agents: createUsageMetric(
        quotas,
        "agent_execution",
        "agents",
        starterLimits.agents
      ),
      pipelines: createUsageMetric(
        quotas,
        "pipeline",
        "pipelines",
        starterLimits.pipelines
      ),
      executions: createUsageMetric(
        quotas,
        "agent_execution",
        "executions",
        starterLimits.executionsPerMonth
      ),
      teamMembers: createUsageMetric(
        quotas,
        "team_member",
        "members",
        starterLimits.teamMembers
      ),
      apiCalls: createUsageMetric(
        quotas,
        "api_call",
        "calls",
        starterLimits.apiCallsPerMonth
      ),
      storage: createUsageMetric(
        quotas,
        "storage",
        "GB",
        starterLimits.storageGb
      ),
    };

    return usage;
  },

  /**
   * Get quotas
   */
  getQuotas: async (): Promise<Quota[]> => {
    const response = await apiClient.get<{ quotas: Record<string, unknown>[] }>(
      "/api/v1/billing/quotas"
    );
    return (response.data.quotas || []).map(transformQuota);
  },

  /**
   * Get invoices (billing periods)
   */
  getInvoices: async (): Promise<InvoicesResponse> => {
    const response = await apiClient.get<{
      records: Record<string, unknown>[];
      total: number;
    }>("/api/v1/billing/periods");
    const invoices = (response.data.records || []).map(
      transformBillingPeriodToInvoice
    );
    return { records: invoices, total: response.data.total || invoices.length };
  },

  /**
   * Get single invoice
   */
  getInvoice: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get<Record<string, unknown>>(
      `/api/v1/billing/periods/${id}`
    );
    return transformBillingPeriodToInvoice(response.data);
  },

  /**
   * Upgrade subscription (placeholder - needs payment integration)
   */
  upgrade: async (request: UpgradeRequest): Promise<Subscription> => {
    // This would typically integrate with Stripe or similar
    // For now, just return a subscription object
    return {
      id: `sub-${Date.now()}`,
      planId: request.planId,
      status: "active",
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(
        Date.now() +
          (request.billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000
      ).toISOString(),
      cancelAtPeriodEnd: false,
    };
  },

  /**
   * Cancel subscription (placeholder - needs payment integration)
   */
  cancel: async (): Promise<Subscription> => {
    // This would typically integrate with Stripe or similar
    return {
      id: "sub-current",
      planId: "plan-starter",
      status: "active",
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      cancelAtPeriodEnd: true,
    };
  },

  /**
   * Get payment methods (placeholder - needs payment integration)
   */
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    // This would typically integrate with Stripe or similar
    // Return empty array since no payment methods are configured
    return [];
  },

  /**
   * Get pricing information
   */
  getPricing: async (): Promise<Record<string, unknown>> => {
    const response = await apiClient.get<{ pricing: Record<string, unknown> }>(
      "/api/v1/billing/pricing"
    );
    return response.data.pricing;
  },

  /**
   * Get cost estimate
   */
  estimateCost: async (
    resourceType: string,
    quantity: number
  ): Promise<Record<string, unknown>> => {
    const response = await apiClient.post<Record<string, unknown>>(
      "/api/v1/billing/estimate",
      {
        resource_type: resourceType,
        quantity,
      }
    );
    return response.data;
  },
};

/**
 * Create a usage metric from quotas
 */
function createUsageMetric(
  quotas: Record<string, unknown>[],
  resourceType: string,
  unit: string,
  defaultLimit: number
): BillingUsage["agents"] {
  const quota = quotas.find((q) => q.resource_type === resourceType);
  const current = quota ? (quota.current_usage as number) || 0 : 0;
  const limit = quota
    ? (quota.limit_value as number) || defaultLimit
    : defaultLimit;
  const percentUsed = limit > 0 ? (current / limit) * 100 : 0;

  return {
    current,
    limit,
    unit,
    trend: calculateTrend(percentUsed),
    percentUsed,
  };
}

/**
 * Determine current tier based on quotas
 */
function determineCurrentTier(quotas: Record<string, unknown>[]): string {
  // Find the highest limit across all quotas to determine tier
  const agentQuota = quotas.find((q) => q.resource_type === "agent_execution");
  const limit = agentQuota ? (agentQuota.limit_value as number) || 0 : 0;

  if (limit < 0) return "enterprise"; // Unlimited
  if (limit >= 100000) return "pro";
  if (limit >= 10000) return "starter";
  return "free";
}

export default billingApi;
