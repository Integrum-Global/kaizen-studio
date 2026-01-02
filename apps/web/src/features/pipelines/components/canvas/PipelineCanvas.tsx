import { useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCanvasStore } from "../../../../store/canvas";
import { useHistoryStore } from "../../../../store/history";
import {
  AgentNode,
  SupervisorNode,
  RouterNode,
  SynthesizerNode,
  ConnectorNode,
  InputNode,
  OutputNode,
} from "../nodes";
import { NodeType } from "../../types";

const nodeTypes = {
  agent: AgentNode,
  supervisor: SupervisorNode,
  router: RouterNode,
  synthesizer: SynthesizerNode,
  connector: ConnectorNode,
  input: InputNode,
  output: OutputNode,
};

function PipelineCanvasContent() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    removeNode,
    clearSelection,
  } = useCanvasStore();

  const { pushState, undo, redo, canUndo, canRedo } = useHistoryStore();
  const reactFlowInstance = useReactFlow();

  // Handle drop event for adding new nodes
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${type}-${Date.now()}`,
        type: type as NodeType,
        position,
        data: { label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node` },
      };

      useCanvasStore.getState().addNode(newNode);
      pushState({ nodes: [...nodes, newNode], edges });
    },
    [reactFlowInstance, nodes, edges, pushState]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Delete selected nodes
      if (event.key === "Delete" || event.key === "Backspace") {
        const selectedNodes = nodes.filter((node) => node.selected);
        selectedNodes.forEach((node) => removeNode(node.id));
        if (selectedNodes.length > 0) {
          pushState({ nodes: nodes.filter((n) => !n.selected), edges });
        }
      }

      // Undo (Ctrl+Z or Cmd+Z)
      if ((event.ctrlKey || event.metaKey) && event.key === "z" && canUndo) {
        event.preventDefault();
        const previousState = undo();
        if (previousState !== undefined) {
          useCanvasStore.getState().setNodes(previousState.nodes);
          useCanvasStore.getState().setEdges(previousState.edges);
        }
      }

      // Redo (Ctrl+Y or Cmd+Y or Ctrl+Shift+Z)
      if (
        ((event.ctrlKey || event.metaKey) && event.key === "y") ||
        ((event.ctrlKey || event.metaKey) &&
          event.shiftKey &&
          event.key === "z")
      ) {
        if (canRedo) {
          event.preventDefault();
          const nextState = redo();
          if (nextState !== undefined) {
            useCanvasStore.getState().setNodes(nextState.nodes);
            useCanvasStore.getState().setEdges(nextState.edges);
          }
        }
      }

      // Clear selection (Escape)
      if (event.key === "Escape") {
        clearSelection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    nodes,
    edges,
    removeNode,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearSelection,
  ]);

  return (
    <div className="w-full h-full" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50 dark:bg-gray-900"
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="bg-white dark:bg-gray-800"
        />
      </ReactFlow>
    </div>
  );
}

export function PipelineCanvas() {
  return (
    <ReactFlowProvider>
      <PipelineCanvasContent />
    </ReactFlowProvider>
  );
}
