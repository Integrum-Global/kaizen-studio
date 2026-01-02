/**
 * Gateway types and interfaces
 */

export type GatewayEnvironment = "development" | "staging" | "production";
export type GatewayStatus = "healthy" | "degraded" | "down" | "unknown";
export type PromotionStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "rolled_back";
export type ScalingMode = "manual" | "auto";

/**
 * Gateway entity representing an API gateway instance
 */
export interface Gateway {
  id: string;
  name: string;
  description?: string;
  environment: GatewayEnvironment;
  status: GatewayStatus;
  endpoint: string;
  version: string;
  replicas: number;
  minReplicas: number;
  maxReplicas: number;
  scalingMode: ScalingMode;
  createdAt: string;
  updatedAt: string;
}

/**
 * Gateway health metrics
 */
export interface GatewayHealth {
  gatewayId: string;
  status: GatewayStatus;
  latency: number;
  requestsPerSecond: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  uptime: number;
  lastCheck: string;
}

/**
 * Promotion request for moving gateway between environments
 */
export interface PromotionRequest {
  id: string;
  gatewayId: string;
  sourceEnvironment: GatewayEnvironment;
  targetEnvironment: GatewayEnvironment;
  status: PromotionStatus;
  requestedBy: string;
  approvedBy?: string;
  version: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Scaling policy for auto-scaling gateways
 */
export interface ScalingPolicy {
  id: string;
  gatewayId: string;
  name: string;
  enabled: boolean;
  metric: "cpu" | "memory" | "requests" | "latency";
  targetValue: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldownSeconds: number;
  minReplicas: number;
  maxReplicas: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Scaling event record
 */
export interface ScalingEvent {
  id: string;
  gatewayId: string;
  policyId?: string;
  type: "scale_up" | "scale_down" | "manual";
  previousReplicas: number;
  newReplicas: number;
  reason: string;
  triggeredBy: string;
  createdAt: string;
}

/**
 * Filters for gateway queries
 */
export interface GatewayFilter {
  environment?: GatewayEnvironment;
  status?: GatewayStatus;
  search?: string;
}

/**
 * Response from gateway list endpoint
 */
export interface GatewayResponse {
  records: Gateway[];
  total: number;
}

/**
 * Response from promotion history endpoint
 */
export interface PromotionHistoryResponse {
  records: PromotionRequest[];
  total: number;
}

/**
 * Response from scaling events endpoint
 */
export interface ScalingEventResponse {
  records: ScalingEvent[];
  total: number;
}

/**
 * Create promotion request payload
 */
export interface CreatePromotionRequest {
  gatewayId: string;
  targetEnvironment: GatewayEnvironment;
  notes?: string;
}

/**
 * Create scaling policy payload
 */
export interface CreateScalingPolicyRequest {
  gatewayId: string;
  name: string;
  metric: ScalingPolicy["metric"];
  targetValue: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldownSeconds: number;
  minReplicas: number;
  maxReplicas: number;
}

/**
 * Manual scale request payload
 */
export interface ManualScaleRequest {
  gatewayId: string;
  replicas: number;
  reason?: string;
}
