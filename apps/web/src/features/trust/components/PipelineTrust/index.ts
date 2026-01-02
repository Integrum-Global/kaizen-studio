/**
 * Pipeline Trust Integration Components
 *
 * Components and hooks for integrating EATP trust validation into pipeline canvas
 *
 * Usage:
 * ```tsx
 * import {
 *   TrustOverlay,
 *   PipelineTrustValidator,
 *   AgentTrustStatus,
 *   TrustValidationResult,
 *   usePipelineTrustValidation,
 * } from '@/features/trust/components/PipelineTrust';
 *
 * // In pipeline canvas
 * <TrustOverlay
 *   pipelineId="pipeline-123"
 *   agentIds={["agent-1", "agent-2"]}
 *   requiredCapabilities={{
 *     "agent-1": ["data_processing", "api_access"],
 *   }}
 *   onViewAgent={(id) => navigate(`/agents/${id}`)}
 *   onEstablishTrust={(id) => openTrustDialog(id)}
 * />
 *
 * // On pipeline node
 * <AgentTrustStatus
 *   agentId="agent-123"
 *   agentName="Data Processor"
 *   trustStatus={TrustStatus.VALID}
 *   requiredCapabilities={["data_processing"]}
 *   availableCapabilities={["data_processing", "api_access"]}
 * />
 *
 * // Validation before execution
 * <PipelineTrustValidator
 *   pipelineId="pipeline-123"
 *   agentIds={["agent-1", "agent-2"]}
 *   blockExecutionOnFailure={true}
 *   onExecute={() => runPipeline()}
 *   onEstablishTrust={(id) => openTrustDialog(id)}
 * />
 * ```
 */

// Export components
export { TrustOverlay } from "./TrustOverlay";
export { PipelineTrustValidator } from "./PipelineTrustValidator";
export { AgentTrustStatus } from "./AgentTrustStatus";
export { TrustValidationResult } from "./TrustValidationResult";

// Export hooks
export {
  usePipelineTrustValidation,
  useAgentPipelineStatus,
  useBatchValidatePipelineAgents,
  useValidationCache,
} from "./usePipelineTrustValidation";

// Export types
export type {
  PipelineAgent,
  TrustValidationResult as TrustValidationResultData,
  PipelineTrustValidation,
} from "./types";
