import { create } from "zustand";
import { applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import type {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Connection,
} from "@xyflow/react";
import { PipelineNode, PipelineEdge } from "../features/pipelines/types";

interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  selectedNodes: string[];
  selectedEdges: string[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, data: Partial<Node["data"]>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: Edge) => void;
  removeEdge: (id: string) => void;
  selectNode: (id: string) => void;
  clearSelection: () => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodes: [],
  selectedEdges: [],

  setNodes: (nodes) => {
    set({ nodes });
  },

  setEdges: (edges) => {
    set({ edges });
  },

  addNode: (node) => {
    set((state) => ({
      nodes: [...state.nodes, node],
    }));
  },

  updateNode: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      ),
    }));
  },

  removeNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      ),
      selectedNodes: state.selectedNodes.filter((nodeId) => nodeId !== id),
    }));
  },

  addEdge: (edge) => {
    set((state) => ({
      edges: [...state.edges, edge],
    }));
  },

  removeEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
      selectedEdges: state.selectedEdges.filter((edgeId) => edgeId !== id),
    }));
  },

  selectNode: (id) => {
    set({ selectedNodes: [id] });
  },

  clearSelection: () => {
    set({ selectedNodes: [], selectedEdges: [] });
  },

  onNodesChange: (changes) => {
    set((state) => {
      const updatedNodes = applyNodeChanges(changes, state.nodes);
      // Sync selectedNodes with React Flow's selection state
      const selectedNodeIds = updatedNodes
        .filter((node) => node.selected)
        .map((node) => node.id);
      return {
        nodes: updatedNodes,
        selectedNodes: selectedNodeIds,
      };
    });
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },

  onConnect: (connection: Connection) => {
    const newEdge: Edge = {
      id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source!,
      target: connection.target!,
      sourceHandle: connection.sourceHandle || "output",
      targetHandle: connection.targetHandle || "input",
    };
    get().addEdge(newEdge);
  },
}));

// Helper to convert PipelineNode to ReactFlow Node
export function pipelineNodeToReactFlowNode(pipelineNode: PipelineNode): Node {
  return {
    id: pipelineNode.id,
    type: pipelineNode.type,
    position: pipelineNode.position,
    data: { ...pipelineNode.data },
  };
}

// Helper to convert PipelineEdge to ReactFlow Edge
export function pipelineEdgeToReactFlowEdge(pipelineEdge: PipelineEdge): Edge {
  return {
    id: pipelineEdge.id,
    source: pipelineEdge.source,
    target: pipelineEdge.target,
    sourceHandle: pipelineEdge.sourceHandle,
    targetHandle: pipelineEdge.targetHandle,
    label: pipelineEdge.label,
  };
}
