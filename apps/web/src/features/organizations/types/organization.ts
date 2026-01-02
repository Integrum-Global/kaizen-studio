/**
 * Organization types and interfaces
 */

export type OrganizationStatus = "active" | "suspended";
export type PlanTier = "free" | "pro" | "enterprise";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  plan_tier: PlanTier;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationWithStats extends Organization {
  user_count?: number;
  agent_count?: number;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  plan_tier?: PlanTier;
}

export interface UpdateOrganizationInput {
  name?: string;
  slug?: string;
  plan_tier?: PlanTier;
  status?: OrganizationStatus;
}

export interface OrganizationFilters {
  status?: OrganizationStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface OrganizationResponse {
  records: Organization[];
  total: number;
}
