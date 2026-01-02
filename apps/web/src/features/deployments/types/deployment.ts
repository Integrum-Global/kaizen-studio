/**
 * Deployment types and interfaces
 */

export type DeploymentStatus =
  | "pending"
  | "deploying"
  | "active"
  | "failed"
  | "stopped";

export type Environment = "development" | "staging" | "production";

export interface DeploymentConfig {
  replicas: number;
  maxConcurrency: number;
  timeout: number; // seconds
  retries: number;
  environment: Record<string, string>;
}

export interface Deployment {
  id: string;
  pipelineId: string;
  pipelineName: string;
  version: string;
  environment: Environment;
  status: DeploymentStatus;
  endpoint?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  config: DeploymentConfig;
}

export interface CreateDeploymentInput {
  pipelineId: string;
  environment: Environment;
  config: DeploymentConfig;
}

export interface UpdateDeploymentInput {
  config?: Partial<DeploymentConfig>;
}

export interface DeploymentFilters {
  pipelineId?: string;
  environment?: Environment;
  status?: DeploymentStatus;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface DeploymentResponse {
  deployments: Deployment[];
  total: number;
  page: number;
  page_size: number;
}
