/**
 * Pipeline type definitions for Kaizen Studio
 */

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  pattern: PipelinePattern;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  status: "draft" | "active" | "archived";
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type PipelinePattern =
  | "sequential"
  | "supervisor-worker"
  | "router"
  | "ensemble"
  | "parallel"
  | "hierarchical"
  | "pipeline"
  | "blackboard"
  | "reactive";

export interface PipelineNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
}

export type NodeType =
  | "agent"
  | "supervisor"
  | "router"
  | "synthesizer"
  | "connector"
  | "input"
  | "output";

export interface NodeData {
  label: string;
  agentId?: string;
  config?: Record<string, unknown>;
}

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  condition?: string;
}

export interface PatternTemplate {
  id: string;
  name: string;
  pattern: PipelinePattern;
  description: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}
