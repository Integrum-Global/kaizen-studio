/**
 * TrustChainGraph Component
 *
 * Interactive graph visualization of trust chains using React Flow
 */

import { useMemo, useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  MarkerType,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AuthorityNode, type AuthorityNodeData } from "./AuthorityNode";
import { AgentNode, type AgentNodeData } from "./AgentNode";
import { DelegationEdge, type DelegationEdgeData } from "./DelegationEdge";
import { TrustStatus, AuthorityType } from "../../types";
import type { TrustChain, OrganizationalAuthority } from "../../types";

interface TrustChainGraphProps {
  trustChains: TrustChain[];
  authorities?: OrganizationalAuthority[];
  onNodeClick?: (nodeId: string, nodeType: "authority" | "agent") => void;
  onEdgeClick?: (edgeId: string) => void;
  className?: string;
}

// Cast to any for nodeTypes/edgeTypes to satisfy React Flow generic constraints
const nodeTypes = {
  authority: AuthorityNode,
  agent: AgentNode,
} as NodeTypes;

const edgeTypes = {
  delegation: DelegationEdge,
} as EdgeTypes;

type StatusFilter = TrustStatus | "all";

function calculateStatus(chain: TrustChain): TrustStatus {
  const now = new Date();
  if (chain.genesis.expires_at && new Date(chain.genesis.expires_at) <= now) {
    return TrustStatus.EXPIRED;
  }
  return TrustStatus.VALID;
}

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const now = new Date();
  const expiry = new Date(expiresAt);
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return expiry.getTime() - now.getTime() < sevenDays && expiry > now;
}

export function TrustChainGraph({
  trustChains,
  authorities = [],
  onNodeClick,
  onEdgeClick,
  className,
}: TrustChainGraphProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Transform trust chains into React Flow nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const authorityPositions = new Map<string, { x: number; y: number }>();
    const agentPositions = new Map<string, { x: number; y: number }>();

    // Filter chains by status
    const filteredChains =
      statusFilter === "all"
        ? trustChains
        : trustChains.filter(
            (chain) => calculateStatus(chain) === statusFilter
          );

    // Create authority nodes
    const uniqueAuthorities = new Map<string, OrganizationalAuthority>();
    filteredChains.forEach((chain) => {
      const existing = authorities.find(
        (a) => a.id === chain.genesis.authority_id
      );
      if (existing && !uniqueAuthorities.has(existing.id)) {
        uniqueAuthorities.set(existing.id, existing);
      }
    });

    let authorityIndex = 0;
    uniqueAuthorities.forEach((authority) => {
      const x = authorityIndex * 250;
      const y = 0;
      authorityPositions.set(authority.id, { x, y });

      const agentCount = filteredChains.filter(
        (c) => c.genesis.authority_id === authority.id
      ).length;

      nodes.push({
        id: `authority-${authority.id}`,
        type: "authority",
        position: { x, y },
        data: {
          id: authority.id,
          name: authority.name,
          authorityType: authority.authority_type,
          isActive: authority.is_active,
          agentCount,
        },
      });
      authorityIndex++;
    });

    // If no authorities found, create placeholder based on genesis records
    if (uniqueAuthorities.size === 0) {
      const genesisAuthorities = new Set(
        filteredChains.map((c) => c.genesis.authority_id)
      );
      let index = 0;
      genesisAuthorities.forEach((authorityId) => {
        const x = index * 250;
        const y = 0;
        authorityPositions.set(authorityId, { x, y });

        const agentCount = filteredChains.filter(
          (c) => c.genesis.authority_id === authorityId
        ).length;

        nodes.push({
          id: `authority-${authorityId}`,
          type: "authority",
          position: { x, y },
          data: {
            id: authorityId,
            name: `Authority ${authorityId.slice(0, 8)}`,
            authorityType: AuthorityType.ORGANIZATION,
            isActive: true,
            agentCount,
          } as AuthorityNodeData,
        });
        index++;
      });
    }

    // Create agent nodes and establishment edges
    filteredChains.forEach((chain, chainIndex) => {
      const authorityPos = authorityPositions.get(chain.genesis.authority_id);
      const status = calculateStatus(chain);
      const agentId = chain.genesis.agent_id;

      // Position agents below their authority
      const x = (authorityPos?.x || 0) + ((chainIndex % 3) - 1) * 80;
      const y = 150 + Math.floor(chainIndex / 3) * 120;
      agentPositions.set(agentId, { x, y });

      nodes.push({
        id: `agent-${agentId}`,
        type: "agent",
        position: { x, y },
        data: {
          id: agentId,
          name: `Agent ${agentId.slice(0, 8)}`,
          status,
          capabilityCount: chain.capabilities.length,
          constraintCount:
            chain.constraint_envelope?.active_constraints.length || 0,
          expiresAt: chain.genesis.expires_at,
          isExpiringSoon: isExpiringSoon(chain.genesis.expires_at),
        },
      });

      // Create establishment edge from authority to agent
      edges.push({
        id: `establish-${chain.genesis.authority_id}-${agentId}`,
        source: `authority-${chain.genesis.authority_id}`,
        target: `agent-${agentId}`,
        type: "delegation",
        data: {
          type: "establish",
          capabilityCount: chain.capabilities.length,
          isActive: status === TrustStatus.VALID,
          isExpired: status === TrustStatus.EXPIRED,
        } as DelegationEdgeData,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
      });

      // Create delegation edges
      chain.delegations.forEach((delegation) => {
        const targetPos = agentPositions.get(delegation.delegatee_id);
        if (!targetPos) {
          // Create node for delegatee if not exists
          const delegateeX = x + 150;
          const delegateeY = y + 80;
          agentPositions.set(delegation.delegatee_id, {
            x: delegateeX,
            y: delegateeY,
          });

          nodes.push({
            id: `agent-${delegation.delegatee_id}`,
            type: "agent",
            position: { x: delegateeX, y: delegateeY },
            data: {
              id: delegation.delegatee_id,
              name: `Agent ${delegation.delegatee_id.slice(0, 8)}`,
              status: TrustStatus.VALID,
              capabilityCount: delegation.capabilities_delegated.length,
              constraintCount: delegation.constraint_subset.length,
              expiresAt: delegation.expires_at,
              isExpiringSoon: isExpiringSoon(delegation.expires_at),
            } as AgentNodeData,
          });
        }

        const isExpired =
          delegation.expires_at &&
          new Date(delegation.expires_at) <= new Date();

        edges.push({
          id: `delegate-${delegation.id}`,
          source: `agent-${delegation.delegator_id}`,
          target: `agent-${delegation.delegatee_id}`,
          type: "delegation",
          data: {
            type: "delegate",
            capabilityCount: delegation.capabilities_delegated.length,
            isActive: !isExpired,
            isExpired: !!isExpired,
          } as DelegationEdgeData,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
        });
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [trustChains, authorities, statusFilter]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id.startsWith("authority-")) {
        onNodeClick?.(node.id.replace("authority-", ""), "authority");
      } else if (node.id.startsWith("agent-")) {
        onNodeClick?.(node.id.replace("agent-", ""), "agent");
      }
    },
    [onNodeClick]
  );

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      onEdgeClick?.(edge.id);
    },
    [onEdgeClick]
  );

  const handleExport = useCallback(() => {
    // Export graph as JSON
    const graphData = {
      nodes: nodes.map((n) => ({ id: n.id, type: n.type, data: n.data })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        data: e.data,
      })),
    };
    const blob = new Blob([JSON.stringify(graphData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trust-chain-graph-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  // Update nodes when filter changes
  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className={className} style={{ width: "100%", height: "500px" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === "authority") return "#8b5cf6";
            return "#22c55e";
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        <Panel position="top-right" className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-[130px] bg-background">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="valid">Valid</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleExport}>
            <Download className="h-4 w-4" />
          </Button>
        </Panel>
        <Panel position="bottom-left" className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            Authority
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Agent
          </Badge>
          <Badge variant="secondary" className="gap-1 text-purple-600">
            EST
          </Badge>
          <span className="text-xs text-muted-foreground">Establish</span>
          <Badge variant="outline" className="gap-1">
            DEL
          </Badge>
          <span className="text-xs text-muted-foreground">Delegate</span>
        </Panel>
      </ReactFlow>
    </div>
  );
}
