import apiClient from "@/api";
import type { Pipeline, PipelinePattern } from "../types";

export interface PipelineFilters {
  organization_id?: string;
  workspace_id?: string;
  status?: "draft" | "active" | "archived";
  pattern?: PipelinePattern;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreatePipelineInput {
  organization_id: string;
  workspace_id: string;
  name: string;
  description?: string;
  pattern: PipelinePattern;
}

export interface UpdatePipelineInput {
  name?: string;
  description?: string;
  pattern?: PipelinePattern;
  status?: "draft" | "active" | "archived";
}

/**
 * Backend node format for saving graph
 */
export interface BackendNodeCreate {
  id?: string;
  node_type: string;
  agent_id?: string;
  label: string;
  position_x: number;
  position_y: number;
  config?: Record<string, unknown>;
}

/**
 * Backend connection format for saving graph
 */
export interface BackendConnectionCreate {
  id?: string;
  source_node_id: string;
  target_node_id: string;
  source_handle?: string;
  target_handle?: string;
  condition?: Record<string, unknown>;
}

/**
 * Input for saving graph (nodes and connections)
 */
export interface SaveGraphInput {
  nodes: BackendNodeCreate[];
  connections: BackendConnectionCreate[];
}

/**
 * Backend node type (from API)
 */
interface BackendNode {
  id: string;
  node_type: string;
  agent_id?: string;
  label: string;
  position_x: number;
  position_y: number;
  config?: Record<string, unknown>;
}

/**
 * Backend connection type (from API)
 */
interface BackendConnection {
  id: string;
  source_node_id: string;
  target_node_id: string;
  source_handle?: string;
  target_handle?: string;
  condition?: Record<string, unknown>;
}

/**
 * Transform backend node to frontend PipelineNode type
 */
function transformNode(backendNode: BackendNode): Pipeline["nodes"][0] {
  return {
    id: backendNode.id,
    type: backendNode.node_type as Pipeline["nodes"][0]["type"],
    position: {
      x: backendNode.position_x,
      y: backendNode.position_y,
    },
    data: {
      label: backendNode.label,
      agentId: backendNode.agent_id,
      config: backendNode.config,
    },
  };
}

/**
 * Transform backend connection to frontend PipelineEdge type
 */
function transformConnection(
  backendConnection: BackendConnection
): Pipeline["edges"][0] {
  return {
    id: backendConnection.id,
    source: backendConnection.source_node_id,
    target: backendConnection.target_node_id,
    sourceHandle: backendConnection.source_handle,
    targetHandle: backendConnection.target_handle,
    condition: backendConnection.condition?.expression as string | undefined,
  };
}

/**
 * Transform backend pipeline to frontend Pipeline type
 */
function transformPipeline(backendPipeline: Record<string, unknown>): Pipeline {
  // Backend uses 'connections' but frontend expects 'edges'
  const backendNodes = (backendPipeline.nodes as BackendNode[]) || [];
  const backendConnections =
    (backendPipeline.connections as BackendConnection[]) ||
    (backendPipeline.edges as BackendConnection[]) ||
    [];

  // Transform nodes from backend format to frontend format
  const nodes = backendNodes.map(transformNode);

  // Transform connections from backend format to frontend edges format
  const edges = backendConnections.map(transformConnection);

  return {
    id: backendPipeline.id as string,
    name: (backendPipeline.name as string) || "Untitled Pipeline",
    description: (backendPipeline.description as string) || "",
    pattern: (backendPipeline.pattern as PipelinePattern) || "sequential",
    nodes,
    edges,
    status: (backendPipeline.status as Pipeline["status"]) || "draft",
    organization_id: (backendPipeline.organization_id as string) || "",
    created_by: (backendPipeline.created_by as string) || "",
    created_at: backendPipeline.created_at as string,
    updated_at: backendPipeline.updated_at as string,
  };
}

export interface PipelinesListResponse {
  items: Pipeline[];
  total: number;
}

export const pipelinesApi = {
  /**
   * Get all pipelines with optional filters
   */
  getAll: async (filters?: PipelineFilters): Promise<PipelinesListResponse> => {
    const response = await apiClient.get<
      | {
          data: Record<string, unknown>[];
          records: Record<string, unknown>[];
          total: number;
        }
      | Record<string, unknown>[]
    >("/api/v1/pipelines", { params: filters });

    // Handle both array and paginated response formats
    if (Array.isArray(response.data)) {
      const pipelines = response.data.map(transformPipeline);
      return { items: pipelines, total: pipelines.length };
    }

    // Backend returns 'data' array, but handle 'records' for compatibility
    const pipelinesArray = response.data.data || response.data.records || [];
    const pipelines = pipelinesArray.map(transformPipeline);
    return { items: pipelines, total: response.data.total || pipelines.length };
  },

  /**
   * Get a single pipeline by ID
   */
  getById: async (id: string): Promise<Pipeline> => {
    const response = await apiClient.get<
      { data: Record<string, unknown> } | Record<string, unknown>
    >(`/api/v1/pipelines/${id}`);
    // Backend wraps response in 'data' field
    const pipelineData =
      (response.data as { data: Record<string, unknown> }).data ||
      response.data;
    return transformPipeline(pipelineData as Record<string, unknown>);
  },

  /**
   * Create a new pipeline
   */
  create: async (data: CreatePipelineInput): Promise<Pipeline> => {
    const response = await apiClient.post<Record<string, unknown>>(
      "/api/v1/pipelines",
      data
    );
    return transformPipeline(response.data);
  },

  /**
   * Update an existing pipeline
   */
  update: async (id: string, data: UpdatePipelineInput): Promise<Pipeline> => {
    const response = await apiClient.put<Record<string, unknown>>(
      `/api/v1/pipelines/${id}`,
      data
    );
    return transformPipeline(response.data);
  },

  /**
   * Delete a pipeline
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/pipelines/${id}`);
  },

  /**
   * Duplicate a pipeline
   */
  duplicate: async (id: string): Promise<Pipeline> => {
    const response = await apiClient.post<Record<string, unknown>>(
      `/api/v1/pipelines/${id}/duplicate`
    );
    return transformPipeline(response.data);
  },

  /**
   * Save pipeline graph (nodes and connections)
   * This is separate from update() because the backend uses different endpoints
   */
  saveGraph: async (
    id: string,
    nodes: Pipeline["nodes"],
    edges: Pipeline["edges"]
  ): Promise<{ nodes_saved: number; connections_saved: number }> => {
    // Transform frontend format to backend format
    const backendNodes: BackendNodeCreate[] = nodes.map((node) => ({
      id: node.id,
      node_type: node.type,
      agent_id: node.data.agentId || "",
      label: node.data.label,
      position_x: node.position.x,
      position_y: node.position.y,
      config: node.data.config,
    }));

    const backendConnections: BackendConnectionCreate[] = edges.map((edge) => ({
      id: edge.id,
      source_node_id: edge.source,
      target_node_id: edge.target,
      source_handle: edge.sourceHandle || "output",
      target_handle: edge.targetHandle || "input",
      condition: edge.condition ? { expression: edge.condition } : undefined,
    }));

    const response = await apiClient.put<{ data: Record<string, unknown> }>(
      `/api/v1/pipelines/${id}/graph`,
      {
        nodes: backendNodes,
        connections: backendConnections,
      }
    );

    // Backend returns the full pipeline - extract counts from the returned data
    const pipelineData = response.data.data || response.data;
    const returnedNodes = (pipelineData.nodes as BackendNode[]) || [];
    const returnedConnections =
      (pipelineData.connections as BackendConnection[]) || [];

    return {
      nodes_saved: returnedNodes.length,
      connections_saved: returnedConnections.length,
    };
  },

  /**
   * Validate a pipeline's graph structure
   */
  validate: async (
    id: string
  ): Promise<{ valid: boolean; errors?: string[] }> => {
    const response = await apiClient.post<{
      data: { valid: boolean; errors?: string[] };
    }>(`/api/v1/pipelines/${id}/validate`);
    return response.data.data;
  },
};

export default pipelinesApi;
