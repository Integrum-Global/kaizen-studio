import apiClient from "@/api";
import type {
  Gateway,
  GatewayHealth,
  PromotionRequest,
  ScalingPolicy,
  ScalingEvent,
  GatewayFilter,
  GatewayResponse,
  PromotionHistoryResponse,
  ScalingEventResponse,
  CreatePromotionRequest,
  CreateScalingPolicyRequest,
  ManualScaleRequest,
  GatewayEnvironment,
} from "../types";

/**
 * Transform backend gateway response to frontend Gateway type
 */
function transformGateway(backendGateway: Record<string, unknown>): Gateway {
  return {
    id: backendGateway.id as string,
    name: backendGateway.name as string,
    description: (backendGateway.description as string) || undefined,
    environment:
      (backendGateway.environment as GatewayEnvironment) || "development",
    status: mapBackendStatus(
      backendGateway.status as string,
      backendGateway.last_health_status as string
    ),
    endpoint: backendGateway.api_url as string,
    version: (backendGateway.version as string) || "1.0.0",
    replicas: (backendGateway.replicas as number) || 1,
    minReplicas: (backendGateway.min_replicas as number) || 1,
    maxReplicas: (backendGateway.max_replicas as number) || 10,
    scalingMode: (backendGateway.scaling_mode as "manual" | "auto") || "manual",
    createdAt: backendGateway.created_at as string,
    updatedAt: backendGateway.updated_at as string,
  };
}

/**
 * Map backend status to frontend GatewayStatus
 */
function mapBackendStatus(
  status: string,
  healthStatus?: string
): Gateway["status"] {
  if (healthStatus === "healthy") return "healthy";
  if (healthStatus === "unhealthy") return "degraded";
  if (status === "active") return "healthy";
  if (status === "error") return "degraded";
  if (status === "inactive") return "down";
  return "unknown";
}

/**
 * Gateways API client
 */
export const gatewaysApi = {
  /**
   * Get all gateways with optional filters
   */
  getAll: async (filters?: GatewayFilter): Promise<GatewayResponse> => {
    const params = new URLSearchParams();
    if (filters?.environment) params.append("environment", filters.environment);

    const response = await apiClient.get<unknown[]>(
      `/api/v1/gateways${params.toString() ? `?${params.toString()}` : ""}`
    );

    // Backend returns array directly, wrap in paginated response
    const gateways = Array.isArray(response.data)
      ? response.data.map((g) => transformGateway(g as Record<string, unknown>))
      : [];

    // Apply client-side filtering for status and search (backend doesn't support these)
    let filteredGateways = gateways;
    if (filters?.status) {
      filteredGateways = filteredGateways.filter(
        (g) => g.status === filters.status
      );
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filteredGateways = filteredGateways.filter(
        (g) =>
          g.name.toLowerCase().includes(search) ||
          g.description?.toLowerCase().includes(search)
      );
    }

    return { records: filteredGateways, total: filteredGateways.length };
  },

  /**
   * Get a single gateway by ID
   */
  getById: async (id: string): Promise<Gateway> => {
    const response = await apiClient.get<Record<string, unknown>>(
      `/api/v1/gateways/${id}`
    );
    return transformGateway(response.data);
  },

  /**
   * Create a new gateway
   */
  create: async (data: {
    name: string;
    description?: string;
    api_url: string;
    api_key: string;
    environment?: string;
    health_check_url?: string;
  }): Promise<Gateway> => {
    const response = await apiClient.post<Record<string, unknown>>(
      "/api/v1/gateways",
      data
    );
    return transformGateway(response.data);
  },

  /**
   * Update a gateway
   */
  update: async (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      api_url: string;
      api_key: string;
      environment: string;
      health_check_url: string;
    }>
  ): Promise<Gateway> => {
    const response = await apiClient.put<Record<string, unknown>>(
      `/api/v1/gateways/${id}`,
      data
    );
    return transformGateway(response.data);
  },

  /**
   * Delete a gateway
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/gateways/${id}`);
  },

  /**
   * Get gateway health metrics
   */
  getHealth: async (gatewayId: string): Promise<GatewayHealth> => {
    // Use the scaling metrics endpoint for health data
    try {
      const response = await apiClient.get<Record<string, unknown>>(
        `/api/v1/scaling/gateways/${gatewayId}/metrics`
      );
      const metrics = response.data;

      return {
        gatewayId,
        status: mapBackendStatus("active", metrics.health_status as string),
        latency: (metrics.latency_ms as number) || 0,
        requestsPerSecond: (metrics.requests_per_second as number) || 0,
        errorRate: (metrics.error_rate as number) || 0,
        cpuUsage: (metrics.cpu_percent as number) || 0,
        memoryUsage: (metrics.memory_percent as number) || 0,
        uptime: (metrics.uptime_percent as number) || 99.9,
        lastCheck: (metrics.timestamp as string) || new Date().toISOString(),
      };
    } catch {
      // Return default health if metrics not available
      return {
        gatewayId,
        status: "unknown",
        latency: 0,
        requestsPerSecond: 0,
        errorRate: 0,
        cpuUsage: 0,
        memoryUsage: 0,
        uptime: 0,
        lastCheck: new Date().toISOString(),
      };
    }
  },

  /**
   * Check gateway health (trigger health check)
   */
  checkHealth: async (gatewayId: string): Promise<GatewayHealth> => {
    const response = await apiClient.post<Record<string, unknown>>(
      `/api/v1/gateways/${gatewayId}/health`
    );
    const result = response.data;

    return {
      gatewayId,
      status: result.status === "healthy" ? "healthy" : "degraded",
      latency: (result.response_time_ms as number) || 0,
      requestsPerSecond: 0,
      errorRate: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      uptime: result.status === "healthy" ? 99.9 : 0,
      lastCheck: (result.checked_at as string) || new Date().toISOString(),
    };
  },

  /**
   * Get promotion history
   */
  getPromotions: async (
    gatewayId?: string
  ): Promise<PromotionHistoryResponse> => {
    const params = new URLSearchParams();
    if (gatewayId) params.append("agent_id", gatewayId);

    const response = await apiClient.get<
      | { records: Record<string, unknown>[]; total: number }
      | Record<string, unknown>[]
    >(`/api/v1/promotions${params.toString() ? `?${params.toString()}` : ""}`);

    // Handle both array and paginated response formats
    const promotionsData = Array.isArray(response.data)
      ? response.data
      : response.data.records || [];

    const promotions: PromotionRequest[] = promotionsData.map(
      (p: Record<string, unknown>) => ({
        id: p.id as string,
        gatewayId:
          (p.target_gateway_id as string) || (p.agent_id as string) || "",
        sourceEnvironment:
          (p.source_environment as GatewayEnvironment) || "development",
        targetEnvironment:
          (p.target_environment as GatewayEnvironment) || "staging",
        status: mapPromotionStatus(p.status as string),
        requestedBy: (p.created_by as string) || "",
        approvedBy: p.approved_by as string | undefined,
        version: (p.version as string) || "1.0.0",
        notes: p.notes as string | undefined,
        createdAt: p.created_at as string,
        completedAt: p.completed_at as string | undefined,
      })
    );

    return { records: promotions, total: promotions.length };
  },

  /**
   * Create a promotion request
   */
  createPromotion: async (
    request: CreatePromotionRequest
  ): Promise<PromotionRequest> => {
    // The backend expects different field names
    const response = await apiClient.post<Record<string, unknown>>(
      "/api/v1/promotions",
      {
        agent_id: request.gatewayId,
        source_deployment_id: request.gatewayId, // Use gateway ID as deployment ID
        target_gateway_id: request.gatewayId,
        source_environment: "development", // Will be determined by backend
        target_environment: request.targetEnvironment,
      }
    );

    const p = response.data;
    return {
      id: p.id as string,
      gatewayId: (p.target_gateway_id as string) || request.gatewayId,
      sourceEnvironment:
        (p.source_environment as GatewayEnvironment) || "development",
      targetEnvironment:
        (p.target_environment as GatewayEnvironment) ||
        request.targetEnvironment,
      status: mapPromotionStatus(p.status as string),
      requestedBy: p.created_by as string,
      version: (p.version as string) || "1.0.0",
      notes: request.notes,
      createdAt: p.created_at as string,
    };
  },

  /**
   * Approve or reject a promotion
   */
  updatePromotion: async (
    id: string,
    action: "approve" | "reject"
  ): Promise<PromotionRequest> => {
    const endpoint =
      action === "approve"
        ? `/api/v1/promotions/${id}/approve`
        : `/api/v1/promotions/${id}/reject`;

    const body =
      action === "reject" ? { reason: "Rejected by user" } : undefined;
    const response = await apiClient.post<Record<string, unknown>>(
      endpoint,
      body
    );

    const p = response.data;
    return {
      id: p.id as string,
      gatewayId: (p.target_gateway_id as string) || "",
      sourceEnvironment:
        (p.source_environment as GatewayEnvironment) || "development",
      targetEnvironment:
        (p.target_environment as GatewayEnvironment) || "staging",
      status: mapPromotionStatus(p.status as string),
      requestedBy: p.created_by as string,
      approvedBy: p.approved_by as string | undefined,
      version: (p.version as string) || "1.0.0",
      createdAt: p.created_at as string,
      completedAt: p.completed_at as string | undefined,
    };
  },

  /**
   * Get scaling policies
   */
  getScalingPolicies: async (gatewayId?: string): Promise<ScalingPolicy[]> => {
    // Need organization_id - get it from auth store or pass it
    const params = new URLSearchParams();
    // Use a placeholder organization_id - in production this should come from auth context
    params.append("organization_id", "current"); // Backend should handle 'current' as current user's org
    if (gatewayId) params.append("gateway_id", gatewayId);

    try {
      const response = await apiClient.get<Record<string, unknown>[]>(
        `/api/v1/scaling/policies?${params.toString()}`
      );

      return response.data.map((p: Record<string, unknown>) => ({
        id: p.id as string,
        gatewayId: p.gateway_id as string,
        name: p.name as string,
        enabled: p.status === "active",
        metric: mapScalingMetric(p.target_metric as string),
        targetValue: (p.target_value as number) || 70,
        scaleUpThreshold: (p.scale_up_threshold as number) || 80,
        scaleDownThreshold: (p.scale_down_threshold as number) || 20,
        cooldownSeconds: (p.cooldown_seconds as number) || 300,
        minReplicas: (p.min_instances as number) || 1,
        maxReplicas: (p.max_instances as number) || 10,
        createdAt: p.created_at as string,
        updatedAt: p.updated_at as string,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Create a scaling policy
   */
  createScalingPolicy: async (
    request: CreateScalingPolicyRequest
  ): Promise<ScalingPolicy> => {
    // Get organization_id from somewhere - this should come from auth context
    const response = await apiClient.post<Record<string, unknown>>(
      "/api/v1/scaling/policies",
      {
        organization_id: "current", // Backend should resolve this
        gateway_id: request.gatewayId,
        name: request.name,
        target_metric: request.metric,
        target_value: request.targetValue,
        scale_up_threshold: request.scaleUpThreshold,
        scale_down_threshold: request.scaleDownThreshold,
        cooldown_seconds: request.cooldownSeconds,
        min_instances: request.minReplicas,
        max_instances: request.maxReplicas,
        status: "active",
      }
    );

    const p = response.data;
    return {
      id: p.id as string,
      gatewayId: p.gateway_id as string,
      name: p.name as string,
      enabled: p.status === "active",
      metric: mapScalingMetric(p.target_metric as string),
      targetValue: (p.target_value as number) || request.targetValue,
      scaleUpThreshold:
        (p.scale_up_threshold as number) || request.scaleUpThreshold,
      scaleDownThreshold:
        (p.scale_down_threshold as number) || request.scaleDownThreshold,
      cooldownSeconds:
        (p.cooldown_seconds as number) || request.cooldownSeconds,
      minReplicas: (p.min_instances as number) || request.minReplicas,
      maxReplicas: (p.max_instances as number) || request.maxReplicas,
      createdAt: p.created_at as string,
      updatedAt: p.updated_at as string,
    };
  },

  /**
   * Update a scaling policy
   */
  updateScalingPolicy: async (
    id: string,
    updates: Partial<CreateScalingPolicyRequest> & { enabled?: boolean }
  ): Promise<ScalingPolicy> => {
    const backendUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) backendUpdates.name = updates.name;
    if (updates.metric !== undefined)
      backendUpdates.target_metric = updates.metric;
    if (updates.targetValue !== undefined)
      backendUpdates.target_value = updates.targetValue;
    if (updates.scaleUpThreshold !== undefined)
      backendUpdates.scale_up_threshold = updates.scaleUpThreshold;
    if (updates.scaleDownThreshold !== undefined)
      backendUpdates.scale_down_threshold = updates.scaleDownThreshold;
    if (updates.cooldownSeconds !== undefined)
      backendUpdates.cooldown_seconds = updates.cooldownSeconds;
    if (updates.minReplicas !== undefined)
      backendUpdates.min_instances = updates.minReplicas;
    if (updates.maxReplicas !== undefined)
      backendUpdates.max_instances = updates.maxReplicas;
    if (updates.enabled !== undefined)
      backendUpdates.status = updates.enabled ? "active" : "inactive";

    const response = await apiClient.put<Record<string, unknown>>(
      `/api/v1/scaling/policies/${id}`,
      backendUpdates
    );

    const p = response.data;
    return {
      id: p.id as string,
      gatewayId: p.gateway_id as string,
      name: p.name as string,
      enabled: p.status === "active",
      metric: mapScalingMetric(p.target_metric as string),
      targetValue: p.target_value as number,
      scaleUpThreshold: p.scale_up_threshold as number,
      scaleDownThreshold: p.scale_down_threshold as number,
      cooldownSeconds: p.cooldown_seconds as number,
      minReplicas: p.min_instances as number,
      maxReplicas: p.max_instances as number,
      createdAt: p.created_at as string,
      updatedAt: p.updated_at as string,
    };
  },

  /**
   * Delete a scaling policy
   */
  deleteScalingPolicy: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/scaling/policies/${id}`);
  },

  /**
   * Get scaling events
   */
  getScalingEvents: async (
    gatewayId?: string
  ): Promise<ScalingEventResponse> => {
    if (!gatewayId) {
      return { records: [], total: 0 };
    }

    try {
      const response = await apiClient.get<Record<string, unknown>[]>(
        `/api/v1/scaling/gateways/${gatewayId}/events?limit=50`
      );

      const events: ScalingEvent[] = response.data.map(
        (e: Record<string, unknown>) => ({
          id: e.id as string,
          gatewayId: e.gateway_id as string,
          policyId: e.policy_id as string | undefined,
          type: mapScalingEventType(e.action as string),
          previousReplicas: (e.previous_instances as number) || 0,
          newReplicas: (e.new_instances as number) || 0,
          reason: (e.reason as string) || "Manual scaling",
          triggeredBy: (e.triggered_by as string) || "system",
          createdAt: e.created_at as string,
        })
      );

      return { records: events, total: events.length };
    } catch {
      return { records: [], total: 0 };
    }
  },

  /**
   * Trigger manual scaling
   */
  scale: async (request: ManualScaleRequest): Promise<ScalingEvent> => {
    const response = await apiClient.post<Record<string, unknown>>(
      `/api/v1/scaling/gateways/${request.gatewayId}/scale`,
      { target_instances: request.replicas }
    );

    const e = response.data;
    return {
      id: (e.event_id as string) || `event-${Date.now()}`,
      gatewayId: request.gatewayId,
      type: "manual",
      previousReplicas: (e.previous_instances as number) || 0,
      newReplicas: (e.new_instances as number) || request.replicas,
      reason: request.reason || "Manual scaling",
      triggeredBy: "current-user",
      createdAt: new Date().toISOString(),
    };
  },

  /**
   * Get available target environments for promotion
   */
  getPromotionTargets: async (
    sourceEnvironment: GatewayEnvironment
  ): Promise<GatewayEnvironment[]> => {
    // This is a static mapping - no backend endpoint needed
    const promotionPaths: Record<GatewayEnvironment, GatewayEnvironment[]> = {
      development: ["staging"],
      staging: ["production"],
      production: [],
    };

    return promotionPaths[sourceEnvironment];
  },
};

/**
 * Map backend promotion status to frontend PromotionStatus
 */
function mapPromotionStatus(status: string): PromotionRequest["status"] {
  const statusMap: Record<string, PromotionRequest["status"]> = {
    pending: "pending",
    approved: "in_progress",
    in_progress: "in_progress",
    executing: "in_progress",
    completed: "completed",
    rejected: "failed",
    failed: "failed",
    rolled_back: "rolled_back",
  };
  return statusMap[status] || "pending";
}

/**
 * Map backend scaling metric to frontend metric type
 */
function mapScalingMetric(metric: string): ScalingPolicy["metric"] {
  const metricMap: Record<string, ScalingPolicy["metric"]> = {
    cpu: "cpu",
    cpu_percent: "cpu",
    memory: "memory",
    memory_percent: "memory",
    requests: "requests",
    requests_per_second: "requests",
    latency: "latency",
    latency_ms: "latency",
  };
  return metricMap[metric] || "cpu";
}

/**
 * Map backend scaling event action to frontend event type
 */
function mapScalingEventType(action: string): ScalingEvent["type"] {
  if (action === "scale_up" || action === "scaled_up") return "scale_up";
  if (action === "scale_down" || action === "scaled_down") return "scale_down";
  return "manual";
}

export default gatewaysApi;
