import { useEffect, useState } from "react";
import { useCanvasStore } from "../../../../store/canvas";
import { useAgents } from "../../../agents/hooks";
import { useAuthStore } from "../../../../store/auth";
import { Button } from "../../../../components/ui/button";
import { Label } from "../../../../components/ui/label";
import {
  X,
  Bot,
  Crown,
  GitBranch,
  Combine,
  Plug,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";

// Node type configurations
const nodeTypeConfigs: Record<
  string,
  {
    icon: React.ReactNode;
    colorClass: string;
    description: string;
    fields: string[];
  }
> = {
  input: {
    icon: <ArrowRight className="w-4 h-4" />,
    colorClass: "bg-emerald-500",
    description: "Entry point for pipeline data",
    fields: ["label"],
  },
  output: {
    icon: <ArrowLeft className="w-4 h-4" />,
    colorClass: "bg-rose-500",
    description: "Exit point for pipeline results",
    fields: ["label"],
  },
  agent: {
    icon: <Bot className="w-4 h-4" />,
    colorClass: "bg-blue-500",
    description: "AI agent that processes input",
    fields: ["label", "agentId", "systemPrompt", "temperature"],
  },
  supervisor: {
    icon: <Crown className="w-4 h-4" />,
    colorClass: "bg-purple-500",
    description: "Coordinates multiple worker agents",
    fields: ["label", "agentId", "maxWorkers", "selectionMode"],
  },
  router: {
    icon: <GitBranch className="w-4 h-4" />,
    colorClass: "bg-orange-500",
    description: "Routes input based on conditions",
    fields: ["label", "routingStrategy", "conditions"],
  },
  synthesizer: {
    icon: <Combine className="w-4 h-4" />,
    colorClass: "bg-green-500",
    description: "Combines multiple inputs into one output",
    fields: ["label", "aggregationType", "outputFormat"],
  },
  connector: {
    icon: <Plug className="w-4 h-4" />,
    colorClass: "bg-gray-500",
    description: "Connects to external services",
    fields: ["label", "connectorType", "connectionConfig"],
  },
};

export function NodeConfigPanel() {
  const { user } = useAuthStore();
  const { nodes, selectedNodes, updateNode, clearSelection, removeNode } =
    useCanvasStore();
  const [label, setLabel] = useState("");
  const [agentId, setAgentId] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [routingStrategy, setRoutingStrategy] = useState("semantic");
  const [conditions, setConditions] = useState("");
  const [aggregationType, setAggregationType] = useState("concat");
  const [connectorType, setConnectorType] = useState("api");
  const [maxWorkers, setMaxWorkers] = useState(3);
  const [selectionMode, setSelectionMode] = useState("semantic");

  // Fetch available agents
  const { data: agentsData, isPending: isLoadingAgents } = useAgents({
    organization_id: user?.organization_id,
    page_size: 100,
  });

  const selectedNode =
    selectedNodes.length === 1
      ? nodes.find((n) => n.id === selectedNodes[0])
      : null;

  const nodeConfig = selectedNode
    ? nodeTypeConfigs[selectedNode.type || "agent"]
    : null;

  useEffect(() => {
    if (selectedNode) {
      setLabel((selectedNode.data.label as string) || "");
      setAgentId((selectedNode.data.agentId as string) || "");
      setSystemPrompt((selectedNode.data.systemPrompt as string) || "");
      setTemperature((selectedNode.data.temperature as number) || 0.7);
      setRoutingStrategy(
        (selectedNode.data.routingStrategy as string) || "semantic"
      );
      setConditions((selectedNode.data.conditions as string) || "");
      setAggregationType(
        (selectedNode.data.aggregationType as string) || "concat"
      );
      setConnectorType((selectedNode.data.connectorType as string) || "api");
      setMaxWorkers((selectedNode.data.maxWorkers as number) || 3);
      setSelectionMode(
        (selectedNode.data.selectionMode as string) || "semantic"
      );
    } else {
      resetForm();
    }
  }, [selectedNode]);

  const resetForm = () => {
    setLabel("");
    setAgentId("");
    setSystemPrompt("");
    setTemperature(0.7);
    setRoutingStrategy("semantic");
    setConditions("");
    setAggregationType("concat");
    setConnectorType("api");
    setMaxWorkers(3);
    setSelectionMode("semantic");
  };

  const handleSave = () => {
    if (selectedNode) {
      const updates: Record<string, unknown> = { label };

      // Add type-specific fields
      if (selectedNode.type === "agent") {
        updates.agentId = agentId;
        updates.systemPrompt = systemPrompt;
        updates.temperature = temperature;
      } else if (selectedNode.type === "supervisor") {
        updates.agentId = agentId;
        updates.maxWorkers = maxWorkers;
        updates.selectionMode = selectionMode;
      } else if (selectedNode.type === "router") {
        updates.routingStrategy = routingStrategy;
        updates.conditions = conditions;
      } else if (selectedNode.type === "synthesizer") {
        updates.aggregationType = aggregationType;
      } else if (selectedNode.type === "connector") {
        updates.connectorType = connectorType;
      }

      updateNode(selectedNode.id, updates);
    }
  };

  const handleDelete = () => {
    if (selectedNode) {
      removeNode(selectedNode.id);
      clearSelection();
    }
  };

  if (!selectedNode) {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-l dark:border-gray-700 p-4">
        <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium">No Node Selected</p>
          <p className="text-xs mt-1">Click on a node to configure it</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l dark:border-gray-700 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Node Configuration
        </h2>
        <button
          onClick={clearSelection}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Node Type Header */}
        {nodeConfig && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${nodeConfig.colorClass}`}
            >
              {nodeConfig.icon}
            </div>
            <div>
              <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 capitalize">
                {selectedNode.type} Node
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {nodeConfig.description}
              </div>
            </div>
          </div>
        )}

        {/* Node ID */}
        <div>
          <Label className="text-sm text-gray-600 dark:text-gray-400">
            Node ID
          </Label>
          <div className="mt-1 text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded">
            {selectedNode.id}
          </div>
        </div>

        {/* Node Label */}
        <div>
          <Label
            htmlFor="label"
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            Display Label
          </Label>
          <input
            id="label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Agent-specific configuration */}
        {(selectedNode.type === "agent" ||
          selectedNode.type === "supervisor") && (
          <>
            <div>
              <Label
                htmlFor="agentId"
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                Select Agent
              </Label>
              {isLoadingAgents ? (
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading agents...
                </div>
              ) : (
                <select
                  id="agentId"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an agent...</option>
                  {agentsData?.items?.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.type})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedNode.type === "agent" && (
              <>
                <div>
                  <Label
                    htmlFor="systemPrompt"
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    System Prompt (Optional Override)
                  </Label>
                  <textarea
                    id="systemPrompt"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={3}
                    placeholder="Override the agent's default system prompt..."
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="temperature"
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    Temperature: {temperature}
                  </Label>
                  <input
                    id="temperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="mt-1 w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Precise</span>
                    <span>Creative</span>
                  </div>
                </div>
              </>
            )}

            {selectedNode.type === "supervisor" && (
              <>
                <div>
                  <Label
                    htmlFor="maxWorkers"
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    Max Workers
                  </Label>
                  <input
                    id="maxWorkers"
                    type="number"
                    min="1"
                    max="10"
                    value={maxWorkers}
                    onChange={(e) => setMaxWorkers(parseInt(e.target.value))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="selectionMode"
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    Worker Selection Mode
                  </Label>
                  <select
                    id="selectionMode"
                    value={selectionMode}
                    onChange={(e) => setSelectionMode(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="semantic">Semantic (A2A)</option>
                    <option value="round_robin">Round Robin</option>
                    <option value="random">Random</option>
                  </select>
                </div>
              </>
            )}
          </>
        )}

        {/* Router-specific configuration */}
        {selectedNode.type === "router" && (
          <>
            <div>
              <Label
                htmlFor="routingStrategy"
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                Routing Strategy
              </Label>
              <select
                id="routingStrategy"
                value={routingStrategy}
                onChange={(e) => setRoutingStrategy(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="semantic">Semantic (A2A Matching)</option>
                <option value="round_robin">Round Robin</option>
                <option value="random">Random</option>
                <option value="conditional">Conditional Rules</option>
              </select>
            </div>

            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">
                Routing Conditions
              </Label>
              <textarea
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                rows={4}
                placeholder="Enter routing conditions (one per line):&#10;if contains 'code' → agent-1&#10;if contains 'data' → agent-2&#10;default → agent-3"
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              />
            </div>
          </>
        )}

        {/* Synthesizer-specific configuration */}
        {selectedNode.type === "synthesizer" && (
          <div>
            <Label
              htmlFor="aggregationType"
              className="text-sm text-gray-600 dark:text-gray-400"
            >
              Aggregation Type
            </Label>
            <select
              id="aggregationType"
              value={aggregationType}
              onChange={(e) => setAggregationType(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="concat">Concatenate</option>
              <option value="merge">Merge (JSON)</option>
              <option value="summarize">Summarize (AI)</option>
              <option value="vote">Voting</option>
              <option value="average">Average (Numeric)</option>
            </select>
          </div>
        )}

        {/* Connector-specific configuration */}
        {selectedNode.type === "connector" && (
          <div>
            <Label
              htmlFor="connectorType"
              className="text-sm text-gray-600 dark:text-gray-400"
            >
              Connector Type
            </Label>
            <select
              id="connectorType"
              value={connectorType}
              onChange={(e) => setConnectorType(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="api">REST API</option>
              <option value="database">Database</option>
              <option value="webhook">Webhook</option>
              <option value="storage">Storage (S3/GCS)</option>
              <option value="messaging">Messaging (Kafka/SQS)</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        )}

        {/* Position */}
        <div>
          <Label className="text-sm text-gray-600 dark:text-gray-400">
            Position
          </Label>
          <div className="mt-1 text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded">
            x: {Math.round(selectedNode.position.x)}, y:{" "}
            {Math.round(selectedNode.position.y)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-4 border-t dark:border-gray-700">
          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="w-full"
          >
            Delete Node
          </Button>
        </div>
      </div>
    </div>
  );
}
