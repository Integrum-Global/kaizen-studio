/**
 * Pipeline Trust Component Types
 *
 * Additional types specific to pipeline trust integration
 */

export interface PipelineAgent {
  node_id: string;
  agent_id: string;
  agent_name: string;
  required_capabilities: string[];
}

export interface TrustValidationResult {
  agent_id: string;
  agent_name: string;
  is_valid: boolean;
  trust_status: import("../../types").TrustStatus;
  missing_capabilities: string[];
  constraint_violations: string[];
  suggestions: string[];
}

export interface PipelineTrustValidation {
  pipeline_id: string;
  is_valid: boolean;
  validated_at: string;
  results: TrustValidationResult[];
  summary: {
    total_agents: number;
    valid_count: number;
    invalid_count: number;
    warning_count: number;
  };
}
