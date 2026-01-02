import { useState } from "react";
import {
  Bot,
  Crown,
  GitBranch,
  Combine,
  Plug,
  ArrowRight,
  ArrowLeft,
  Layers,
  Users,
  MessageSquare,
  ArrowUpDown,
  Zap,
  CheckSquare,
  Swords,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { NodeType, PipelinePattern } from "../../types";
import {
  useCanvasStore,
  pipelineNodeToReactFlowNode,
  pipelineEdgeToReactFlowEdge,
} from "../../../../store/canvas";
import { useHistoryStore } from "../../../../store/history";
import { Button } from "../../../../components/ui/button";

interface NodeDefinition {
  type: NodeType;
  label: string;
  icon: React.ReactNode;
  description: string;
  colorClass: string;
}

interface PatternTemplate {
  id: string;
  name: string;
  pattern: PipelinePattern;
  icon: React.ReactNode;
  description: string;
  colorClass: string;
  a2aEnabled: boolean;
}

const nodeDefinitions: NodeDefinition[] = [
  {
    type: "input",
    label: "Input",
    icon: <ArrowRight className="w-4 h-4" />,
    description: "Entry point for pipeline",
    colorClass: "bg-emerald-500",
  },
  {
    type: "agent",
    label: "Agent",
    icon: <Bot className="w-4 h-4" />,
    description: "AI agent node",
    colorClass: "bg-blue-500",
  },
  {
    type: "supervisor",
    label: "Supervisor",
    icon: <Crown className="w-4 h-4" />,
    description: "Supervises multiple agents",
    colorClass: "bg-purple-500",
  },
  {
    type: "router",
    label: "Router",
    icon: <GitBranch className="w-4 h-4" />,
    description: "Routes based on conditions",
    colorClass: "bg-orange-500",
  },
  {
    type: "synthesizer",
    label: "Synthesizer",
    icon: <Combine className="w-4 h-4" />,
    description: "Combines multiple inputs",
    colorClass: "bg-green-500",
  },
  {
    type: "connector",
    label: "Connector",
    icon: <Plug className="w-4 h-4" />,
    description: "External service connector",
    colorClass: "bg-gray-500",
  },
  {
    type: "output",
    label: "Output",
    icon: <ArrowLeft className="w-4 h-4" />,
    description: "Exit point for pipeline",
    colorClass: "bg-rose-500",
  },
];

const patternTemplates: PatternTemplate[] = [
  {
    id: "sequential",
    name: "Sequential",
    pattern: "sequential",
    icon: <ArrowRight className="w-4 h-4" />,
    description: "Linear step-by-step processing",
    colorClass: "bg-blue-500",
    a2aEnabled: false,
  },
  {
    id: "parallel",
    name: "Parallel",
    pattern: "parallel",
    icon: <Layers className="w-4 h-4" />,
    description: "Concurrent execution with aggregation",
    colorClass: "bg-cyan-500",
    a2aEnabled: false,
  },
  {
    id: "supervisor-worker",
    name: "Supervisor-Worker",
    pattern: "supervisor-worker",
    icon: <Crown className="w-4 h-4" />,
    description: "Hierarchical task coordination",
    colorClass: "bg-purple-500",
    a2aEnabled: true,
  },
  {
    id: "router",
    name: "Router",
    pattern: "router",
    icon: <GitBranch className="w-4 h-4" />,
    description: "Intelligent routing with A2A",
    colorClass: "bg-orange-500",
    a2aEnabled: true,
  },
  {
    id: "ensemble",
    name: "Ensemble",
    pattern: "ensemble",
    icon: <Users className="w-4 h-4" />,
    description: "Multi-perspective collaboration",
    colorClass: "bg-indigo-500",
    a2aEnabled: true,
  },
  {
    id: "blackboard",
    name: "Blackboard",
    pattern: "blackboard",
    icon: <MessageSquare className="w-4 h-4" />,
    description: "Iterative specialist collaboration",
    colorClass: "bg-amber-500",
    a2aEnabled: true,
  },
  {
    id: "consensus",
    name: "Consensus",
    pattern: "pipeline",
    icon: <CheckSquare className="w-4 h-4" />,
    description: "Democratic voting decisions",
    colorClass: "bg-green-500",
    a2aEnabled: false,
  },
  {
    id: "debate",
    name: "Debate",
    pattern: "pipeline",
    icon: <Swords className="w-4 h-4" />,
    description: "Adversarial analysis pattern",
    colorClass: "bg-red-500",
    a2aEnabled: false,
  },
  {
    id: "handoff",
    name: "Handoff",
    pattern: "hierarchical",
    icon: <ArrowUpDown className="w-4 h-4" />,
    description: "Tier escalation pattern",
    colorClass: "bg-teal-500",
    a2aEnabled: false,
  },
];

// Generate nodes and edges for each pattern
function generatePatternNodes(patternId: string) {
  const baseX = 100;
  const baseY = 100;
  const xStep = 200;
  const yStep = 120;

  switch (patternId) {
    case "sequential":
      return {
        nodes: [
          {
            id: "input-1",
            type: "input" as NodeType,
            position: { x: baseX, y: baseY + yStep },
            data: { label: "Input" },
          },
          {
            id: "agent-1",
            type: "agent" as NodeType,
            position: { x: baseX + xStep, y: baseY + yStep },
            data: { label: "Agent 1" },
          },
          {
            id: "agent-2",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 2, y: baseY + yStep },
            data: { label: "Agent 2" },
          },
          {
            id: "agent-3",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 3, y: baseY + yStep },
            data: { label: "Agent 3" },
          },
          {
            id: "output-1",
            type: "output" as NodeType,
            position: { x: baseX + xStep * 4, y: baseY + yStep },
            data: { label: "Output" },
          },
        ],
        edges: [
          { id: "e-input-agent1", source: "input-1", target: "agent-1" },
          { id: "e-agent1-agent2", source: "agent-1", target: "agent-2" },
          { id: "e-agent2-agent3", source: "agent-2", target: "agent-3" },
          { id: "e-agent3-output", source: "agent-3", target: "output-1" },
        ],
      };

    case "parallel":
      return {
        nodes: [
          {
            id: "input-1",
            type: "input" as NodeType,
            position: { x: baseX, y: baseY + yStep },
            data: { label: "Input" },
          },
          {
            id: "agent-1",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 1.5, y: baseY },
            data: { label: "Agent 1" },
          },
          {
            id: "agent-2",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 1.5, y: baseY + yStep },
            data: { label: "Agent 2" },
          },
          {
            id: "agent-3",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 1.5, y: baseY + yStep * 2 },
            data: { label: "Agent 3" },
          },
          {
            id: "synthesizer-1",
            type: "synthesizer" as NodeType,
            position: { x: baseX + xStep * 3, y: baseY + yStep },
            data: { label: "Aggregator" },
          },
          {
            id: "output-1",
            type: "output" as NodeType,
            position: { x: baseX + xStep * 4, y: baseY + yStep },
            data: { label: "Output" },
          },
        ],
        edges: [
          { id: "e-input-agent1", source: "input-1", target: "agent-1" },
          { id: "e-input-agent2", source: "input-1", target: "agent-2" },
          { id: "e-input-agent3", source: "input-1", target: "agent-3" },
          { id: "e-agent1-synth", source: "agent-1", target: "synthesizer-1" },
          { id: "e-agent2-synth", source: "agent-2", target: "synthesizer-1" },
          { id: "e-agent3-synth", source: "agent-3", target: "synthesizer-1" },
          { id: "e-synth-output", source: "synthesizer-1", target: "output-1" },
        ],
      };

    case "supervisor-worker":
      return {
        nodes: [
          {
            id: "input-1",
            type: "input" as NodeType,
            position: { x: baseX, y: baseY + yStep },
            data: { label: "Input" },
          },
          {
            id: "supervisor-1",
            type: "supervisor" as NodeType,
            position: { x: baseX + xStep, y: baseY + yStep },
            data: { label: "Supervisor" },
          },
          {
            id: "agent-1",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 2, y: baseY },
            data: { label: "Worker 1" },
          },
          {
            id: "agent-2",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 2, y: baseY + yStep },
            data: { label: "Worker 2" },
          },
          {
            id: "agent-3",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 2, y: baseY + yStep * 2 },
            data: { label: "Worker 3" },
          },
          {
            id: "synthesizer-1",
            type: "synthesizer" as NodeType,
            position: { x: baseX + xStep * 3, y: baseY + yStep },
            data: { label: "Coordinator" },
          },
          {
            id: "output-1",
            type: "output" as NodeType,
            position: { x: baseX + xStep * 4, y: baseY + yStep },
            data: { label: "Output" },
          },
        ],
        edges: [
          { id: "e-input-super", source: "input-1", target: "supervisor-1" },
          { id: "e-super-worker1", source: "supervisor-1", target: "agent-1" },
          { id: "e-super-worker2", source: "supervisor-1", target: "agent-2" },
          { id: "e-super-worker3", source: "supervisor-1", target: "agent-3" },
          { id: "e-worker1-coord", source: "agent-1", target: "synthesizer-1" },
          { id: "e-worker2-coord", source: "agent-2", target: "synthesizer-1" },
          { id: "e-worker3-coord", source: "agent-3", target: "synthesizer-1" },
          { id: "e-coord-output", source: "synthesizer-1", target: "output-1" },
        ],
      };

    case "router":
      return {
        nodes: [
          {
            id: "input-1",
            type: "input" as NodeType,
            position: { x: baseX, y: baseY + yStep },
            data: { label: "Input" },
          },
          {
            id: "router-1",
            type: "router" as NodeType,
            position: { x: baseX + xStep, y: baseY + yStep },
            data: { label: "Router", routingStrategy: "semantic" },
          },
          {
            id: "agent-1",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 2, y: baseY },
            data: { label: "Code Agent" },
          },
          {
            id: "agent-2",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 2, y: baseY + yStep },
            data: { label: "Data Agent" },
          },
          {
            id: "agent-3",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 2, y: baseY + yStep * 2 },
            data: { label: "Write Agent" },
          },
          {
            id: "output-1",
            type: "output" as NodeType,
            position: { x: baseX + xStep * 3, y: baseY + yStep },
            data: { label: "Output" },
          },
        ],
        edges: [
          { id: "e-input-router", source: "input-1", target: "router-1" },
          {
            id: "e-router-agent1",
            source: "router-1",
            target: "agent-1",
            label: "Code tasks",
          },
          {
            id: "e-router-agent2",
            source: "router-1",
            target: "agent-2",
            label: "Data tasks",
          },
          {
            id: "e-router-agent3",
            source: "router-1",
            target: "agent-3",
            label: "Writing",
          },
          { id: "e-agent1-output", source: "agent-1", target: "output-1" },
          { id: "e-agent2-output", source: "agent-2", target: "output-1" },
          { id: "e-agent3-output", source: "agent-3", target: "output-1" },
        ],
      };

    case "ensemble":
      return {
        nodes: [
          {
            id: "input-1",
            type: "input" as NodeType,
            position: { x: baseX, y: baseY + yStep },
            data: { label: "Input" },
          },
          {
            id: "agent-1",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 1.5, y: baseY },
            data: { label: "Expert 1" },
          },
          {
            id: "agent-2",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 1.5, y: baseY + yStep },
            data: { label: "Expert 2" },
          },
          {
            id: "agent-3",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 1.5, y: baseY + yStep * 2 },
            data: { label: "Expert 3" },
          },
          {
            id: "synthesizer-1",
            type: "synthesizer" as NodeType,
            position: { x: baseX + xStep * 3, y: baseY + yStep },
            data: { label: "Synthesizer", aggregationType: "summarize" },
          },
          {
            id: "output-1",
            type: "output" as NodeType,
            position: { x: baseX + xStep * 4, y: baseY + yStep },
            data: { label: "Output" },
          },
        ],
        edges: [
          { id: "e-input-agent1", source: "input-1", target: "agent-1" },
          { id: "e-input-agent2", source: "input-1", target: "agent-2" },
          { id: "e-input-agent3", source: "input-1", target: "agent-3" },
          { id: "e-agent1-synth", source: "agent-1", target: "synthesizer-1" },
          { id: "e-agent2-synth", source: "agent-2", target: "synthesizer-1" },
          { id: "e-agent3-synth", source: "agent-3", target: "synthesizer-1" },
          { id: "e-synth-output", source: "synthesizer-1", target: "output-1" },
        ],
      };

    case "blackboard":
      return {
        nodes: [
          {
            id: "input-1",
            type: "input" as NodeType,
            position: { x: baseX, y: baseY + yStep },
            data: { label: "Problem" },
          },
          {
            id: "supervisor-1",
            type: "supervisor" as NodeType,
            position: { x: baseX + xStep, y: baseY + yStep },
            data: { label: "Controller" },
          },
          {
            id: "agent-1",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 2, y: baseY },
            data: { label: "Analyst" },
          },
          {
            id: "agent-2",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 2, y: baseY + yStep },
            data: { label: "Validator" },
          },
          {
            id: "agent-3",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 2, y: baseY + yStep * 2 },
            data: { label: "Optimizer" },
          },
          {
            id: "synthesizer-1",
            type: "synthesizer" as NodeType,
            position: { x: baseX + xStep * 3, y: baseY + yStep },
            data: { label: "Blackboard" },
          },
          {
            id: "output-1",
            type: "output" as NodeType,
            position: { x: baseX + xStep * 4, y: baseY + yStep },
            data: { label: "Solution" },
          },
        ],
        edges: [
          {
            id: "e-input-controller",
            source: "input-1",
            target: "supervisor-1",
          },
          {
            id: "e-controller-analyst",
            source: "supervisor-1",
            target: "agent-1",
          },
          {
            id: "e-controller-validator",
            source: "supervisor-1",
            target: "agent-2",
          },
          {
            id: "e-controller-optimizer",
            source: "supervisor-1",
            target: "agent-3",
          },
          { id: "e-analyst-bb", source: "agent-1", target: "synthesizer-1" },
          { id: "e-validator-bb", source: "agent-2", target: "synthesizer-1" },
          { id: "e-optimizer-bb", source: "agent-3", target: "synthesizer-1" },
          { id: "e-bb-output", source: "synthesizer-1", target: "output-1" },
        ],
      };

    case "consensus":
      return {
        nodes: [
          {
            id: "input-1",
            type: "input" as NodeType,
            position: { x: baseX, y: baseY + yStep },
            data: { label: "Proposal" },
          },
          {
            id: "agent-1",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 1.5, y: baseY },
            data: { label: "Voter 1" },
          },
          {
            id: "agent-2",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 1.5, y: baseY + yStep },
            data: { label: "Voter 2" },
          },
          {
            id: "agent-3",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 1.5, y: baseY + yStep * 2 },
            data: { label: "Voter 3" },
          },
          {
            id: "synthesizer-1",
            type: "synthesizer" as NodeType,
            position: { x: baseX + xStep * 3, y: baseY + yStep },
            data: { label: "Aggregator", aggregationType: "vote" },
          },
          {
            id: "output-1",
            type: "output" as NodeType,
            position: { x: baseX + xStep * 4, y: baseY + yStep },
            data: { label: "Decision" },
          },
        ],
        edges: [
          { id: "e-input-voter1", source: "input-1", target: "agent-1" },
          { id: "e-input-voter2", source: "input-1", target: "agent-2" },
          { id: "e-input-voter3", source: "input-1", target: "agent-3" },
          { id: "e-voter1-agg", source: "agent-1", target: "synthesizer-1" },
          { id: "e-voter2-agg", source: "agent-2", target: "synthesizer-1" },
          { id: "e-voter3-agg", source: "agent-3", target: "synthesizer-1" },
          { id: "e-agg-output", source: "synthesizer-1", target: "output-1" },
        ],
      };

    case "debate":
      return {
        nodes: [
          {
            id: "input-1",
            type: "input" as NodeType,
            position: { x: baseX, y: baseY + yStep },
            data: { label: "Topic" },
          },
          {
            id: "agent-1",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 1.5, y: baseY },
            data: { label: "Proponent" },
          },
          {
            id: "agent-2",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 1.5, y: baseY + yStep * 2 },
            data: { label: "Opponent" },
          },
          {
            id: "supervisor-1",
            type: "supervisor" as NodeType,
            position: { x: baseX + xStep * 3, y: baseY + yStep },
            data: { label: "Judge" },
          },
          {
            id: "output-1",
            type: "output" as NodeType,
            position: { x: baseX + xStep * 4, y: baseY + yStep },
            data: { label: "Judgment" },
          },
        ],
        edges: [
          { id: "e-input-proponent", source: "input-1", target: "agent-1" },
          { id: "e-input-opponent", source: "input-1", target: "agent-2" },
          {
            id: "e-proponent-judge",
            source: "agent-1",
            target: "supervisor-1",
          },
          { id: "e-opponent-judge", source: "agent-2", target: "supervisor-1" },
          { id: "e-judge-output", source: "supervisor-1", target: "output-1" },
        ],
      };

    case "handoff":
      return {
        nodes: [
          {
            id: "input-1",
            type: "input" as NodeType,
            position: { x: baseX, y: baseY + yStep },
            data: { label: "Request" },
          },
          {
            id: "agent-1",
            type: "agent" as NodeType,
            position: { x: baseX + xStep, y: baseY + yStep },
            data: { label: "Tier 1" },
          },
          {
            id: "agent-2",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 2, y: baseY + yStep },
            data: { label: "Tier 2" },
          },
          {
            id: "agent-3",
            type: "agent" as NodeType,
            position: { x: baseX + xStep * 3, y: baseY + yStep },
            data: { label: "Tier 3" },
          },
          {
            id: "output-1",
            type: "output" as NodeType,
            position: { x: baseX + xStep * 4, y: baseY + yStep },
            data: { label: "Resolution" },
          },
        ],
        edges: [
          { id: "e-input-tier1", source: "input-1", target: "agent-1" },
          {
            id: "e-tier1-tier2",
            source: "agent-1",
            target: "agent-2",
            label: "Escalate",
          },
          {
            id: "e-tier2-tier3",
            source: "agent-2",
            target: "agent-3",
            label: "Escalate",
          },
          { id: "e-tier1-output", source: "agent-1", target: "output-1" },
          { id: "e-tier2-output", source: "agent-2", target: "output-1" },
          { id: "e-tier3-output", source: "agent-3", target: "output-1" },
        ],
      };

    default:
      return { nodes: [], edges: [] };
  }
}

export function NodePalette() {
  const [showPatterns, setShowPatterns] = useState(true);
  const { nodes, edges, setNodes, setEdges } = useCanvasStore();
  const { pushState } = useHistoryStore();

  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleApplyPattern = (patternId: string) => {
    const pattern = generatePatternNodes(patternId);
    if (pattern.nodes.length > 0) {
      // Save current state to history
      pushState({ nodes, edges });

      // Apply new pattern
      const reactFlowNodes = pattern.nodes.map(pipelineNodeToReactFlowNode);
      const reactFlowEdges = pattern.edges.map(pipelineEdgeToReactFlowEdge);

      setNodes(reactFlowNodes);
      setEdges(reactFlowEdges);
    }
  };

  return (
    <div
      className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 p-4 overflow-y-auto"
      data-testid="node-palette"
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Node Palette
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Drag nodes to canvas
        </p>
      </div>

      <div className="space-y-2">
        {nodeDefinitions.map((node) => (
          <div
            key={node.type}
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
            className="cursor-move p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:shadow-md transition-all bg-white dark:bg-gray-900"
            data-testid={`node-item-${node.type}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${node.colorClass}`}
              >
                {node.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {node.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {node.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pattern Templates Section */}
      <div className="mt-6 pt-6 border-t dark:border-gray-700">
        <button
          onClick={() => setShowPatterns(!showPatterns)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Pattern Templates
          </h3>
          {showPatterns ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Click to apply a pattern
        </p>

        {showPatterns && (
          <div className="mt-3 space-y-2">
            {patternTemplates.map((pattern) => (
              <button
                key={pattern.id}
                onClick={() => handleApplyPattern(pattern.id)}
                className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${pattern.colorClass}`}
                  >
                    {pattern.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-xs text-gray-900 dark:text-gray-100">
                        {pattern.name}
                      </span>
                      {pattern.a2aEnabled && (
                        <span className="text-[10px] px-1 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                          A2A
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                      {pattern.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Quick Actions
        </h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              pushState({ nodes, edges });
              setNodes([]);
              setEdges([]);
            }}
          >
            <Zap className="w-4 h-4 mr-2" />
            Clear Canvas
          </Button>
        </div>
      </div>
    </div>
  );
}
