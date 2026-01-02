import apiClient from "@/api";
import type {
  Deployment,
  CreateDeploymentInput,
  UpdateDeploymentInput,
  DeploymentFilters,
  DeploymentResponse,
} from "../types";

/**
 * Transform backend deployment to frontend format
 */
function transformDeployment(
  backendDeployment: Record<string, unknown>
): Deployment {
  return {
    id: (backendDeployment.id as string) || "",
    pipelineId:
      (backendDeployment.pipeline_id as string) ||
      (backendDeployment.agent_id as string) ||
      "",
    pipelineName:
      (backendDeployment.pipeline_name as string) ||
      (backendDeployment.agent_name as string) ||
      "Unknown",
    version:
      (backendDeployment.version as string) ||
      (backendDeployment.agent_version_id as string) ||
      "1.0.0",
    environment:
      (backendDeployment.environment as Deployment["environment"]) ||
      "development",
    status: (backendDeployment.status as Deployment["status"]) || "pending",
    endpoint:
      (backendDeployment.endpoint_url as string) ||
      (backendDeployment.endpoint as string) ||
      undefined,
    createdAt:
      (backendDeployment.created_at as string) ||
      (backendDeployment.deployed_at as string) ||
      new Date().toISOString(),
    updatedAt:
      (backendDeployment.updated_at as string) || new Date().toISOString(),
    createdBy:
      (backendDeployment.deployed_by as string) ||
      (backendDeployment.created_by as string) ||
      "",
    config: (backendDeployment.config as Deployment["config"]) || {
      replicas: 1,
      maxConcurrency: 10,
      timeout: 30,
      retries: 3,
      environment: {},
    },
  };
}

/**
 * Deployment API client
 */
export const deploymentsApi = {
  /**
   * Get all deployments with optional filters
   */
  getAll: async (filters?: DeploymentFilters): Promise<DeploymentResponse> => {
    const params = new URLSearchParams();
    if (filters?.pipelineId) params.append("pipeline_id", filters.pipelineId);
    if (filters?.environment) params.append("environment", filters.environment);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.search) params.append("search", filters.search);

    const response = await apiClient.get<
      DeploymentResponse | Record<string, unknown>[]
    >(`/api/v1/deployments?${params.toString()}`);

    // Handle both array and paginated response formats from backend
    if (Array.isArray(response.data)) {
      const deployments = response.data.map(transformDeployment);
      const page = filters?.page || 1;
      const pageSize = filters?.page_size || 12;
      return {
        deployments,
        total: deployments.length,
        page,
        page_size: pageSize,
      };
    }

    // Backend returned paginated response
    const data = response.data as DeploymentResponse;
    return {
      deployments: (data.deployments || []).map((d) =>
        transformDeployment(d as unknown as Record<string, unknown>)
      ),
      total: data.total || 0,
      page: data.page || 1,
      page_size: data.page_size || 12,
    };
  },

  /**
   * Get deployment by ID
   */
  getById: async (id: string): Promise<Deployment> => {
    const response = await apiClient.get<Record<string, unknown>>(
      `/api/v1/deployments/${id}`
    );
    return transformDeployment(response.data);
  },

  /**
   * Create a new deployment
   */
  create: async (input: CreateDeploymentInput): Promise<Deployment> => {
    const response = await apiClient.post<Deployment>(
      "/api/v1/deployments",
      input
    );
    return response.data;
  },

  /**
   * Update deployment configuration
   */
  update: async (
    id: string,
    input: UpdateDeploymentInput
  ): Promise<Deployment> => {
    const response = await apiClient.patch<Deployment>(
      `/api/v1/deployments/${id}`,
      input
    );
    return response.data;
  },

  /**
   * Delete a deployment
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/deployments/${id}`);
  },

  /**
   * Start a deployment
   */
  start: async (id: string): Promise<Deployment> => {
    const response = await apiClient.post<Deployment>(
      `/api/v1/deployments/${id}/start`
    );
    return response.data;
  },

  /**
   * Stop a deployment
   */
  stop: async (id: string): Promise<Deployment> => {
    const response = await apiClient.post<Deployment>(
      `/api/v1/deployments/${id}/stop`
    );
    return response.data;
  },
};

export default deploymentsApi;
