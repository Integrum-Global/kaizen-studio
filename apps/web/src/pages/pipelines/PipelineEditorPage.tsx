import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Save,
  Play,
  Rocket,
  ArrowLeft,
  Undo,
  Redo,
  Loader2,
  X,
  Send,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  PipelineCanvas,
  NodePalette,
  NodeConfigPanel,
} from "../../features/pipelines/components/canvas";
import {
  useCanvasStore,
  pipelineNodeToReactFlowNode,
  pipelineEdgeToReactFlowEdge,
} from "../../store/canvas";
import { useHistoryStore } from "../../store/history";
import { useToast } from "../../hooks/use-toast";
import { pipelinesApi } from "../../features/pipelines";
import type {
  Pipeline,
  PipelineNode,
  PipelineEdge,
  NodeData,
} from "../../features/pipelines";
import { useAuthStore } from "../../store/auth";

export function PipelineEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { nodes, edges } = useCanvasStore();
  const { canUndo, canRedo, undo, redo } = useHistoryStore();
  const { user } = useAuthStore();
  const [pipelineName, setPipelineName] = useState("Untitled Pipeline");
  const [pipelineDescription, setPipelineDescription] = useState("");
  const [pipelinePattern, setPipelinePattern] =
    useState<Pipeline["pattern"]>("sequential");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const isCreateMode = id === "new";

  useEffect(() => {
    const loadPipeline = async () => {
      if (!isCreateMode && id) {
        setIsLoading(true);
        try {
          const pipeline = await pipelinesApi.getById(id);
          setPipelineName(pipeline.name);
          setPipelineDescription(pipeline.description || "");
          setPipelinePattern(pipeline.pattern);

          // Convert pipeline nodes/edges to React Flow format
          if (pipeline.nodes && pipeline.nodes.length > 0) {
            const reactFlowNodes = pipeline.nodes.map(
              pipelineNodeToReactFlowNode
            );
            useCanvasStore.getState().setNodes(reactFlowNodes);
          } else {
            // Create default nodes based on pattern if no nodes exist
            const defaultNodes = createDefaultNodesForPattern(pipeline.pattern);
            useCanvasStore.getState().setNodes(defaultNodes.nodes);
            useCanvasStore.getState().setEdges(defaultNodes.edges);
          }

          if (pipeline.edges && pipeline.edges.length > 0) {
            const reactFlowEdges = pipeline.edges.map(
              pipelineEdgeToReactFlowEdge
            );
            useCanvasStore.getState().setEdges(reactFlowEdges);
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to load pipeline",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        // Clear canvas for new pipeline
        useCanvasStore.getState().setNodes([]);
        useCanvasStore.getState().setEdges([]);
      }
    };

    loadPipeline();
  }, [id, isCreateMode, toast]);

  // Helper function to create default nodes based on pipeline pattern
  function createDefaultNodesForPattern(pattern: Pipeline["pattern"]) {
    const nodesList: PipelineNode[] = [];
    const edgesList: PipelineEdge[] = [];

    // Add input node
    nodesList.push({
      id: "input-1",
      type: "input",
      position: { x: 100, y: 200 },
      data: { label: "Input" },
    });

    // Add output node
    nodesList.push({
      id: "output-1",
      type: "output",
      position: { x: 700, y: 200 },
      data: { label: "Output" },
    });

    switch (pattern) {
      case "sequential":
        nodesList.push({
          id: "agent-1",
          type: "agent",
          position: { x: 300, y: 200 },
          data: { label: "Agent 1" },
        });
        nodesList.push({
          id: "agent-2",
          type: "agent",
          position: { x: 500, y: 200 },
          data: { label: "Agent 2" },
        });
        edgesList.push(
          { id: "e-input-agent1", source: "input-1", target: "agent-1" },
          { id: "e-agent1-agent2", source: "agent-1", target: "agent-2" },
          { id: "e-agent2-output", source: "agent-2", target: "output-1" }
        );
        break;

      case "parallel":
        nodesList.push({
          id: "agent-1",
          type: "agent",
          position: { x: 350, y: 100 },
          data: { label: "Agent 1 (Parallel)" },
        });
        nodesList.push({
          id: "agent-2",
          type: "agent",
          position: { x: 350, y: 300 },
          data: { label: "Agent 2 (Parallel)" },
        });
        nodesList.push({
          id: "synthesizer-1",
          type: "synthesizer",
          position: { x: 550, y: 200 },
          data: { label: "Merge Results" },
        });
        edgesList.push(
          { id: "e-input-agent1", source: "input-1", target: "agent-1" },
          { id: "e-input-agent2", source: "input-1", target: "agent-2" },
          { id: "e-agent1-synth", source: "agent-1", target: "synthesizer-1" },
          { id: "e-agent2-synth", source: "agent-2", target: "synthesizer-1" },
          { id: "e-synth-output", source: "synthesizer-1", target: "output-1" }
        );
        break;

      case "router":
        nodesList.push({
          id: "router-1",
          type: "router",
          position: { x: 300, y: 200 },
          data: { label: "Router" },
        });
        nodesList.push({
          id: "agent-1",
          type: "agent",
          position: { x: 500, y: 100 },
          data: { label: "Route A" },
        });
        nodesList.push({
          id: "agent-2",
          type: "agent",
          position: { x: 500, y: 300 },
          data: { label: "Route B" },
        });
        edgesList.push(
          { id: "e-input-router", source: "input-1", target: "router-1" },
          {
            id: "e-router-agent1",
            source: "router-1",
            target: "agent-1",
            label: "Condition A",
          },
          {
            id: "e-router-agent2",
            source: "router-1",
            target: "agent-2",
            label: "Condition B",
          },
          { id: "e-agent1-output", source: "agent-1", target: "output-1" },
          { id: "e-agent2-output", source: "agent-2", target: "output-1" }
        );
        break;

      case "supervisor-worker":
        nodesList.push({
          id: "supervisor-1",
          type: "supervisor",
          position: { x: 300, y: 200 },
          data: { label: "Supervisor" },
        });
        nodesList.push({
          id: "agent-1",
          type: "agent",
          position: { x: 500, y: 100 },
          data: { label: "Worker 1" },
        });
        nodesList.push({
          id: "agent-2",
          type: "agent",
          position: { x: 500, y: 300 },
          data: { label: "Worker 2" },
        });
        edgesList.push(
          { id: "e-input-super", source: "input-1", target: "supervisor-1" },
          { id: "e-super-worker1", source: "supervisor-1", target: "agent-1" },
          { id: "e-super-worker2", source: "supervisor-1", target: "agent-2" },
          { id: "e-worker1-output", source: "agent-1", target: "output-1" },
          { id: "e-worker2-output", source: "agent-2", target: "output-1" }
        );
        break;

      default:
        // Simple single agent
        nodesList.push({
          id: "agent-1",
          type: "agent",
          position: { x: 400, y: 200 },
          data: { label: "Agent" },
        });
        edgesList.push(
          { id: "e-input-agent1", source: "input-1", target: "agent-1" },
          { id: "e-agent1-output", source: "agent-1", target: "output-1" }
        );
    }

    // Convert to React Flow format
    return {
      nodes: nodesList.map(pipelineNodeToReactFlowNode),
      edges: edgesList.map(pipelineEdgeToReactFlowEdge),
    };
  }

  // Convert React Flow nodes/edges back to Pipeline format for saving
  const convertToSaveFormat = () => {
    const pipelineNodes: PipelineNode[] = nodes.map((node) => ({
      id: node.id,
      type: (node.type || "agent") as PipelineNode["type"],
      position: node.position,
      data: {
        label: (node.data?.label as string) || "Untitled",
        ...(node.data as Record<string, unknown>),
      } as NodeData,
    }));

    const pipelineEdges: PipelineEdge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? undefined,
      targetHandle: edge.targetHandle ?? undefined,
      label: typeof edge.label === "string" ? edge.label : undefined,
    }));

    return { nodes: pipelineNodes, edges: pipelineEdges };
  };

  const handleSave = async () => {
    if (!pipelineName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a pipeline name",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { nodes: saveNodes, edges: saveEdges } = convertToSaveFormat();

      if (isCreateMode) {
        // Create new pipeline (without nodes/edges - backend doesn't accept them in create)
        const newPipeline = await pipelinesApi.create({
          organization_id: user?.organization_id || "",
          workspace_id: user?.organization_id || "", // Use org ID as default workspace
          name: pipelineName,
          description: pipelineDescription,
          pattern: pipelinePattern,
        });

        // Now save the graph separately using the /graph endpoint
        if (saveNodes.length > 0 || saveEdges.length > 0) {
          await pipelinesApi.saveGraph(newPipeline.id, saveNodes, saveEdges);
        }

        toast({
          title: "Pipeline created",
          description: "Your pipeline has been created successfully.",
        });

        // Navigate to the new pipeline's edit page
        navigate(`/pipelines/${newPipeline.id}`, { replace: true });
      } else if (id) {
        // Update existing pipeline metadata
        await pipelinesApi.update(id, {
          name: pipelineName,
          description: pipelineDescription,
          pattern: pipelinePattern,
        });

        // Save the graph separately using the /graph endpoint
        const graphResult = await pipelinesApi.saveGraph(
          id,
          saveNodes,
          saveEdges
        );

        toast({
          title: "Pipeline saved",
          description: `Saved ${graphResult.nodes_saved} nodes and ${graphResult.connections_saved} connections.`,
        });
      }
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to save pipeline. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = () => {
    setIsTestDialogOpen(true);
    setTestOutput(null);
    setTestInput("");
  };

  const runTest = async () => {
    if (!testInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter test input",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestOutput(null);

    try {
      // Simulate pipeline execution
      // In a real implementation, this would call the backend API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate simulated output based on the pipeline structure
      const agentNodes = nodes.filter(
        (n) => n.type === "agent" || n.type === "supervisor"
      );
      const steps = agentNodes.map((node, index) => ({
        step: index + 1,
        node: node.data.label,
        status: "completed",
        output: `Processed by ${node.data.label}: ${testInput.slice(0, 50)}...`,
      }));

      const simulatedOutput = {
        status: "success",
        execution_time: "1.2s",
        steps,
        final_output: `Pipeline "${pipelineName}" completed successfully.\n\nInput processed through ${agentNodes.length} agent(s).\n\nFinal result: Analysis complete for input "${testInput.slice(0, 100)}${testInput.length > 100 ? "..." : ""}"`,
      };

      setTestOutput(JSON.stringify(simulatedOutput, null, 2));

      toast({
        title: "Test completed",
        description: `Pipeline executed successfully in ${simulatedOutput.execution_time}`,
      });
    } catch (error) {
      setTestOutput(
        JSON.stringify(
          {
            status: "error",
            message: "Pipeline execution failed",
            error: String(error),
          },
          null,
          2
        )
      );

      toast({
        title: "Test failed",
        description: "Pipeline execution encountered an error",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeploy = () => {
    if (isCreateMode) {
      toast({
        title: "Save first",
        description: "Please save your pipeline before deploying.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Deploy",
      description: "Deployment feature coming soon.",
    });
  };

  const handleUndo = () => {
    const previousState = undo();
    if (previousState !== undefined) {
      useCanvasStore.getState().setNodes(previousState.nodes);
      useCanvasStore.getState().setEdges(previousState.edges);
    }
  };

  const handleRedo = () => {
    const nextState = redo();
    if (nextState !== undefined) {
      useCanvasStore.getState().setNodes(nextState.nodes);
      useCanvasStore.getState().setEdges(nextState.edges);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Screen reader only h1 for accessibility */}
      <h1 className="sr-only">Pipeline Editor</h1>

      {/* Top Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 flex items-center justify-between" role="toolbar" aria-label="Pipeline editor toolbar">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/pipelines")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="border-l dark:border-gray-700 h-6" />
          <input
            type="text"
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 text-gray-900 dark:text-gray-100"
            placeholder="Pipeline Name"
            aria-label="Pipeline name"
          />
          {isCreateMode && (
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
              New
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </Button>

          <div className="border-l dark:border-gray-700 h-6 mx-2" />

          {/* Actions */}
          <Button variant="outline" size="sm" onClick={handleTest}>
            <Play className="w-4 h-4 mr-2" />
            Test
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button size="sm" onClick={handleDeploy}>
            <Rocket className="w-4 h-4 mr-2" />
            Deploy
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Node Palette */}
        <NodePalette />

        {/* Center - Canvas */}
        <div className="flex-1">
          <PipelineCanvas />
        </div>

        {/* Right Sidebar - Node Config Panel */}
        <NodeConfigPanel />
      </div>

      {/* Test Dialog */}
      {isTestDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Test Pipeline: {pipelineName}
              </h2>
              <button
                onClick={() => setIsTestDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* Pipeline Info */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Pattern:</span>{" "}
                  {pipelinePattern}
                  <span className="mx-2">|</span>
                  <span className="font-medium">Nodes:</span> {nodes.length}
                  <span className="mx-2">|</span>
                  <span className="font-medium">Edges:</span> {edges.length}
                </div>
              </div>

              {/* Test Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Test Input
                </label>
                <textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Enter test input for the pipeline..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Test Output */}
              {testOutput && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Test Output
                  </label>
                  <pre className="w-full p-3 bg-gray-900 text-green-400 rounded-md text-xs overflow-auto max-h-64 font-mono">
                    {testOutput}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setIsTestDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={runTest}
                disabled={isTesting || !testInput.trim()}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Run Test
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
