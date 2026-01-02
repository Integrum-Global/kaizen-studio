import { useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  MessageCircle,
  Slack,
  Send,
  FileText,
  Workflow,
  Webhook,
} from "lucide-react";
import { useExternalAgentLineage } from "../../hooks";
import type { ExternalAgentProvider } from "../../types";

interface LineageViewerProps {
  agentId: string;
}

// Simple horizontal layout
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const layoutedNodes = nodes.map((node, index) => ({
    ...node,
    position: {
      x: (index % 3) * 300,
      y: Math.floor(index / 3) * 150,
    },
  }));

  return { nodes: layoutedNodes, edges };
};

export function LineageViewer({ agentId }: LineageViewerProps) {
  const { data: lineage, isPending, error } = useExternalAgentLineage(agentId);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!lineage) return { nodes: [], edges: [] };

    const nodes: Node[] = lineage.nodes.map((node) => ({
      id: node.id,
      type: node.type === "external_agent" ? "externalAgent" : node.type,
      data: {
        label: node.label,
        provider: node.provider,
        metadata: node.metadata,
      },
      position: { x: 0, y: 0 }, // Will be set by layout
    }));

    const edges: Edge[] = lineage.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      style: { strokeWidth: 2 },
    }));

    return getLayoutedElements(nodes, edges);
  }, [lineage]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const nodeTypes = useMemo(
    () => ({
      externalAgent: ExternalAgentNode,
      workflow: WorkflowNode,
      webhook: WebhookNode,
    }),
    []
  );

  if (isPending) {
    return <LineageViewerSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-destructive">Failed to load lineage graph</p>
      </div>
    );
  }

  if (!lineage || lineage.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-2">
        <p className="text-muted-foreground text-lg">No lineage data</p>
        <p className="text-sm text-muted-foreground">
          Lineage will appear after the agent is invoked
        </p>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full border rounded-lg bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.1}
        maxZoom={2}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === "externalAgent") return "#8B5CF6";
            if (node.type === "workflow") return "#3B82F6";
            return "#6B7280";
          }}
          maskColor="rgb(240, 240, 240, 0.6)"
        />
        <Panel position="top-left" className="bg-background/95 p-2 rounded border">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>External Agent</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Workflow</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              <span>Webhook</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

// Custom node for External Agents with purple border
function ExternalAgentNode({ data }: any) {
  const provider = data.provider as ExternalAgentProvider;
  const Icon = getProviderIcon(provider);

  return (
    <div
      className="border-2 border-purple-500 rounded-lg p-3 bg-white dark:bg-gray-950 shadow-lg min-w-[180px] hover:shadow-xl transition-shadow"
      style={{ borderColor: "#8B5CF6" }}
    >
      <div className="flex items-start gap-2">
        <div className="p-1.5 rounded bg-purple-100 dark:bg-purple-900">
          <Icon className="h-4 w-4 text-purple-600 dark:text-purple-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{data.label}</div>
          <Badge variant="outline" className="text-xs mt-1 capitalize">
            {provider}
          </Badge>
        </div>
      </div>
      {data.metadata?.webhook_url && (
        <div className="mt-2 text-xs text-muted-foreground truncate" title={data.metadata.webhook_url}>
          {data.metadata.webhook_url}
        </div>
      )}
    </div>
  );
}

// Custom node for Workflows
function WorkflowNode({ data }: any) {
  return (
    <div className="border-2 border-blue-500 rounded-lg p-3 bg-white dark:bg-gray-950 shadow-lg min-w-[180px] hover:shadow-xl transition-shadow">
      <div className="flex items-start gap-2">
        <div className="p-1.5 rounded bg-blue-100 dark:bg-blue-900">
          <Workflow className="h-4 w-4 text-blue-600 dark:text-blue-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{data.label}</div>
          <Badge variant="outline" className="text-xs mt-1">
            Workflow
          </Badge>
        </div>
      </div>
    </div>
  );
}

// Custom node for Webhooks
function WebhookNode({ data }: any) {
  return (
    <div className="border-2 border-gray-500 rounded-lg p-3 bg-white dark:bg-gray-950 shadow-lg min-w-[180px] hover:shadow-xl transition-shadow">
      <div className="flex items-start gap-2">
        <div className="p-1.5 rounded bg-gray-100 dark:bg-gray-800">
          <Webhook className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{data.label}</div>
          <Badge variant="outline" className="text-xs mt-1">
            Webhook
          </Badge>
        </div>
      </div>
    </div>
  );
}

function getProviderIcon(provider?: ExternalAgentProvider) {
  switch (provider) {
    case "teams":
      return MessageSquare;
    case "discord":
      return MessageCircle;
    case "slack":
      return Slack;
    case "telegram":
      return Send;
    case "notion":
      return FileText;
    default:
      return Webhook;
  }
}

function LineageViewerSkeleton() {
  return (
    <div className="h-[600px] w-full border rounded-lg bg-background p-8 space-y-4">
      <Skeleton className="h-20 w-48" />
      <div className="flex gap-4">
        <Skeleton className="h-20 w-48" />
        <Skeleton className="h-20 w-48" />
      </div>
      <Skeleton className="h-20 w-48 ml-auto" />
    </div>
  );
}
