/**
 * Execution type definitions for pipeline testing
 */

export type ExecutionStatus = "idle" | "running" | "completed" | "failed";
export type NodeStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";
export type LogLevel = "info" | "warn" | "error" | "debug";

export interface ExecutionLog {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  nodeId?: string;
  data?: Record<string, unknown>;
}

export interface NodeExecution {
  nodeId: string;
  status: NodeStatus;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  output?: unknown;
}

export interface PipelineExecution {
  id: string;
  pipelineId: string;
  status: ExecutionStatus;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  logs: ExecutionLog[];
  nodeExecutions: NodeExecution[];
  startTime: Date;
  endTime?: Date;
  error?: string;
}

export interface StartExecutionRequest {
  pipelineId: string;
  inputs: Record<string, unknown>;
}

export interface StartExecutionResponse {
  executionId: string;
}

export interface ExecutionStatusResponse extends PipelineExecution {}

export interface ExecutionHistoryResponse {
  executions: PipelineExecution[];
  total: number;
  page: number;
  page_size: number;
}
