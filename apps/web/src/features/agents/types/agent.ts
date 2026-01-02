/**
 * Agent types and interfaces
 */

export type AgentType = "chat" | "completion" | "embedding" | "custom";
export type AgentProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "azure"
  | "custom";
export type AgentStatus = "active" | "inactive" | "error";

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  provider: AgentProvider;
  model: string;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  tools: AgentTool[];
  status: AgentStatus;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentInput {
  name: string;
  description: string;
  type: AgentType;
  provider: AgentProvider;
  model: string;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  tools?: AgentTool[];
  status?: AgentStatus;
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  type?: AgentType;
  provider?: AgentProvider;
  model?: string;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  tools?: AgentTool[];
  status?: AgentStatus;
}

export interface AgentFilters {
  organization_id?: string;
  search?: string;
  type?: AgentType;
  provider?: AgentProvider;
  status?: AgentStatus;
  page?: number;
  page_size?: number;
}
