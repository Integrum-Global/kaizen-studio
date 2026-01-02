/**
 * External Agent types and interfaces
 */

export type ExternalAgentProvider =
  | "teams"
  | "discord"
  | "slack"
  | "telegram"
  | "notion";

export type ExternalAgentStatus = "active" | "inactive" | "deleted";

export type AuthType = "api_key" | "oauth2" | "custom";

export type InvocationStatus = "pending" | "success" | "failed";

/**
 * Authentication configuration
 */
export interface ApiKeyAuthConfig {
  type: "api_key";
  key: string;
  header_name: string;
}

export interface OAuth2AuthConfig {
  type: "oauth2";
  client_id: string;
  client_secret: string;
  token_url: string;
  scope?: string;
}

export interface CustomAuthConfig {
  type: "custom";
  config: Record<string, any>;
}

export type AuthConfig =
  | ApiKeyAuthConfig
  | OAuth2AuthConfig
  | CustomAuthConfig;

/**
 * Platform-specific configurations
 */
export interface TeamsPlatformConfig {
  tenant_id: string;
  channel_id: string;
}

export interface DiscordPlatformConfig {
  webhook_url: string;
  username?: string;
}

export interface SlackPlatformConfig {
  webhook_url: string;
  channel: string;
}

export interface TelegramPlatformConfig {
  bot_token: string;
  chat_id: string;
}

export interface NotionPlatformConfig {
  token: string;
  database_id: string;
}

export type PlatformConfig =
  | TeamsPlatformConfig
  | DiscordPlatformConfig
  | SlackPlatformConfig
  | TelegramPlatformConfig
  | NotionPlatformConfig;

/**
 * Governance configuration
 */
export interface GovernanceConfig {
  max_cost_per_invocation?: number;
  max_monthly_cost?: number;
  currency?: string;
  requests_per_minute?: number;
  requests_per_hour?: number;
  requests_per_day?: number;
}

/**
 * Main External Agent interface
 */
export interface ExternalAgent {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  provider: ExternalAgentProvider;
  status: ExternalAgentStatus;
  auth_config: AuthConfig;
  platform_config: PlatformConfig;
  governance_config: GovernanceConfig;
  tags?: string[];
  last_invocation_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * External Agent Invocation
 */
export interface ExternalAgentInvocation {
  id: string;
  agent_id: string;
  workflow_id?: string;
  request_payload: Record<string, any>;
  response_payload?: Record<string, any>;
  status: InvocationStatus;
  execution_time_ms?: number;
  response_code?: number;
  error_message?: string;
  cost?: number;
  created_at: string;
}

/**
 * Governance Status
 */
export interface GovernanceStatus {
  budget_usage: {
    current_month_cost: number;
    max_monthly_cost?: number;
    percentage_used: number;
  };
  rate_limits: {
    per_minute: {
      current: number;
      limit?: number;
      remaining: number;
    };
    per_hour: {
      current: number;
      limit?: number;
      remaining: number;
    };
    per_day: {
      current: number;
      limit?: number;
      remaining: number;
    };
  };
  policy_evaluations: {
    policy_name: string;
    decision: "allow" | "deny";
    timestamp: string;
  }[];
}

/**
 * Lineage Node
 */
export interface LineageNode {
  id: string;
  type: "workflow" | "external_agent" | "webhook";
  label: string;
  provider?: ExternalAgentProvider;
  metadata?: Record<string, any>;
}

/**
 * Lineage Edge
 */
export interface LineageEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

/**
 * Lineage Graph
 */
export interface LineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
}

/**
 * Create External Agent Request
 */
export interface CreateExternalAgentRequest {
  name: string;
  description?: string;
  provider: ExternalAgentProvider;
  auth_config: AuthConfig;
  platform_config: PlatformConfig;
  governance_config?: GovernanceConfig;
  tags?: string[];
}

/**
 * Update External Agent Request
 */
export interface UpdateExternalAgentRequest {
  name?: string;
  description?: string;
  status?: ExternalAgentStatus;
  auth_config?: AuthConfig;
  platform_config?: PlatformConfig;
  governance_config?: GovernanceConfig;
  tags?: string[];
}

/**
 * Invoke External Agent Request
 */
export interface InvokeExternalAgentRequest {
  payload: Record<string, any>;
  workflow_id?: string;
}

/**
 * Filters for listing external agents
 */
export interface ExternalAgentFilters {
  status?: ExternalAgentStatus;
  provider?: ExternalAgentProvider;
  search?: string;
  page?: number;
  page_size?: number;
}

/**
 * External Agent list response with pagination
 */
export interface ExternalAgentListResponse {
  records: ExternalAgent[];
  total: number;
}
