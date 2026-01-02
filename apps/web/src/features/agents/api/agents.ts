import apiClient from "@/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  Agent,
  CreateAgentInput,
  UpdateAgentInput,
  AgentFilters,
} from "../types";

/**
 * Transform backend agent to frontend Agent type
 * Ensures all fields have safe default values
 */
function transformAgent(backendAgent: Record<string, unknown>): Agent {
  // Ensure tools is always an array
  let tools: Agent["tools"] = [];
  if (Array.isArray(backendAgent.tools)) {
    tools = backendAgent.tools as Agent["tools"];
  }

  // Map backend agent_type to frontend type (backend uses: chat, task, pipeline, custom)
  const agentType =
    (backendAgent.agent_type as string) ||
    (backendAgent.type as string) ||
    "chat";
  const typeMapping: Record<string, Agent["type"]> = {
    chat: "chat",
    task: "completion",
    pipeline: "completion",
    custom: "custom",
  };
  const mappedType = typeMapping[agentType] || "chat";

  // Extract provider from model_id (e.g., "claude-sonnet-4-20250514" -> "anthropic")
  const modelId =
    (backendAgent.model_id as string) || (backendAgent.model as string) || "";
  let provider: Agent["provider"] = "openai";
  if (modelId.includes("claude") || modelId.includes("anthropic")) {
    provider = "anthropic";
  } else if (modelId.includes("gemini") || modelId.includes("google")) {
    provider = "google";
  } else if (modelId.includes("azure")) {
    provider = "azure";
  }

  // Map backend status to frontend status (backend uses: draft, active, archived)
  const backendStatus = (backendAgent.status as string) || "draft";
  const statusMapping: Record<string, Agent["status"]> = {
    draft: "inactive",
    active: "active",
    archived: "inactive",
  };
  const mappedStatus = statusMapping[backendStatus] || "active";

  return {
    id: (backendAgent.id as string) || "",
    name: (backendAgent.name as string) || "Unnamed Agent",
    description: (backendAgent.description as string) || "",
    type: mappedType,
    provider,
    model: modelId,
    system_prompt: (backendAgent.system_prompt as string) || "",
    temperature: (backendAgent.temperature as number) ?? 0.7,
    max_tokens: (backendAgent.max_tokens as number) ?? 1000,
    tools,
    status: mappedStatus,
    organization_id: (backendAgent.organization_id as string) || "",
    created_by: (backendAgent.created_by as string) || "",
    created_at: (backendAgent.created_at as string) || new Date().toISOString(),
    updated_at: (backendAgent.updated_at as string) || new Date().toISOString(),
  };
}

export const agentsApi = {
  /**
   * Get all agents with optional filters
   */
  getAll: async (filters?: AgentFilters): Promise<PaginatedResponse<Agent>> => {
    // Backend requires a status filter to return results
    // If no status specified, default to 'active' to show active agents
    const params = {
      ...filters,
      // Map frontend status to backend status values
      status: filters?.status
        ? filters.status === "inactive"
          ? "draft"
          : filters.status === "error"
            ? "archived"
            : filters.status
        : "active", // Default to active if no status filter
    };

    const response = await apiClient.get<
      | { records: Record<string, unknown>[]; total: number }
      | Record<string, unknown>[]
    >("/api/v1/agents", {
      params,
    });

    // Handle both array and paginated response formats from backend
    if (Array.isArray(response.data)) {
      const agents = response.data.map(transformAgent);
      return {
        items: agents,
        total: agents.length,
        page: filters?.page || 1,
        page_size: filters?.page_size || agents.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      };
    }

    const agents = (response.data.records || []).map(transformAgent);
    const page = filters?.page || 1;
    const pageSize = filters?.page_size || 12;
    const total = response.data.total || agents.length;
    const totalPages = Math.ceil(total / pageSize);

    return {
      items: agents,
      total,
      page,
      page_size: pageSize,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    };
  },

  /**
   * Get a single agent by ID
   */
  getById: async (id: string): Promise<Agent> => {
    const response = await apiClient.get<Record<string, unknown>>(
      `/api/v1/agents/${id}`
    );
    return transformAgent(response.data);
  },

  /**
   * Create a new agent
   */
  create: async (data: CreateAgentInput): Promise<Agent> => {
    const response = await apiClient.post<Record<string, unknown>>(
      "/api/v1/agents",
      data
    );
    return transformAgent(response.data);
  },

  /**
   * Update an existing agent
   */
  update: async (id: string, data: UpdateAgentInput): Promise<Agent> => {
    const response = await apiClient.put<Record<string, unknown>>(
      `/api/v1/agents/${id}`,
      data
    );
    return transformAgent(response.data);
  },

  /**
   * Delete an agent
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/agents/${id}`);
  },

  /**
   * Duplicate an agent
   */
  duplicate: async (id: string): Promise<Agent> => {
    const response = await apiClient.post<Record<string, unknown>>(
      `/api/v1/agents/${id}/duplicate`
    );
    return transformAgent(response.data);
  },

  /**
   * Execute an agent with a message
   */
  execute: async (
    id: string,
    message: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<{
    content: string;
    model: string;
    usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    finish_reason: string;
    thread_id: string;
    timestamp: string;
  }> => {
    const response = await apiClient.post(`/api/v1/agents/${id}/execute`, {
      message,
      conversation_history: conversationHistory,
      stream: false,
    });
    return response.data;
  },

  /**
   * Check if an agent can be executed
   */
  getExecutionStatus: async (
    id: string
  ): Promise<{
    agent_id: string;
    agent_name: string;
    model_id: string;
    provider: string;
    is_configured: boolean;
    status: string;
    can_execute: boolean;
    message: string;
  }> => {
    const response = await apiClient.get(`/api/v1/agents/${id}/execute/status`);
    return response.data;
  },
};

export default agentsApi;
