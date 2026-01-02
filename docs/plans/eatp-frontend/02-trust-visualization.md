# EATP Frontend: Trust Visualization

## Document Control
- **Version**: 1.0
- **Date**: 2025-12-15
- **Status**: Planning
- **Author**: Kaizen Studio Team

---

## Overview

This document details the trust visualization components, including the interactive trust chain graph, delegation flow diagrams, and audit timeline views.

---

## Trust Chain Graph

### Implementation with React Flow

```tsx
// src/features/trust/components/TrustChain/TrustChainGraph.tsx

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { AuthorityNode } from './nodes/AuthorityNode';
import { AgentNode } from './nodes/AgentNode';
import { DelegationEdge } from './edges/DelegationEdge';
import { useTrustGraph } from '../../hooks/useTrustGraph';

const nodeTypes = {
  authority: AuthorityNode,
  agent: AgentNode,
};

const edgeTypes = {
  delegation: DelegationEdge,
};

interface TrustChainGraphProps {
  rootAgentId?: string;
  height?: number;
  interactive?: boolean;
  onNodeClick?: (agentId: string) => void;
}

export function TrustChainGraph({
  rootAgentId,
  height = 400,
  interactive = true,
  onNodeClick,
}: TrustChainGraphProps) {
  const { graphData, isLoading } = useTrustGraph(rootAgentId);

  const [nodes, setNodes, onNodesChange] = useNodesState(graphData?.nodes ?? []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphData?.edges ?? []);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'agent' && onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  if (isLoading) {
    return <TrustGraphSkeleton height={height} />;
  }

  return (
    <div style={{ height }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={interactive ? onNodesChange : undefined}
        onEdgesChange={interactive ? onEdgesChange : undefined}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        {interactive && <Controls />}
        <MiniMap
          nodeStrokeColor={(n) => {
            if (n.type === 'authority') return '#6366f1';
            return n.data?.status === 'valid' ? '#22c55e' : '#ef4444';
          }}
          nodeColor={(n) => {
            if (n.type === 'authority') return '#818cf8';
            return n.data?.status === 'valid' ? '#4ade80' : '#f87171';
          }}
        />
      </ReactFlow>
    </div>
  );
}
```

### Authority Node

```tsx
// src/features/trust/components/TrustChain/nodes/AuthorityNode.tsx

import { Handle, Position, NodeProps } from 'reactflow';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthorityNodeData {
  name: string;
  type: 'ORGANIZATION' | 'SYSTEM' | 'HUMAN';
  isActive: boolean;
}

export function AuthorityNode({ data, selected }: NodeProps<AuthorityNodeData>) {
  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[150px]',
        'border-indigo-500 bg-indigo-50',
        selected && 'ring-2 ring-indigo-300'
      )}
    >
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-full bg-indigo-100">
          <Building2 className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <div className="text-sm font-medium text-indigo-900">{data.name}</div>
          <div className="text-xs text-indigo-600">{data.type}</div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="absolute top-1 right-1">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            data.isActive ? 'bg-green-500' : 'bg-gray-400'
          )}
        />
      </div>

      {/* Output handle for delegations */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-indigo-500"
      />
    </div>
  );
}
```

### Agent Node

```tsx
// src/features/trust/components/TrustChain/nodes/AgentNode.tsx

import { Handle, Position, NodeProps } from 'reactflow';
import { Bot, Shield, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AgentNodeData {
  name: string;
  status: 'valid' | 'expired' | 'pending' | 'revoked';
  capabilities: string[];
  constraints: string[];
  delegationCount: number;
}

export function AgentNode({ data, selected }: NodeProps<AgentNodeData>) {
  const statusConfig = {
    valid: { color: 'border-green-500 bg-green-50', icon: Shield, iconColor: 'text-green-600' },
    expired: { color: 'border-amber-500 bg-amber-50', icon: AlertTriangle, iconColor: 'text-amber-600' },
    pending: { color: 'border-gray-400 bg-gray-50', icon: Bot, iconColor: 'text-gray-500' },
    revoked: { color: 'border-red-500 bg-red-50', icon: AlertTriangle, iconColor: 'text-red-600' },
  };

  const config = statusConfig[data.status];
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[180px]',
        config.color,
        selected && 'ring-2 ring-offset-2'
      )}
    >
      {/* Input handle for receiving delegations */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400"
      />

      <div className="flex items-start gap-2">
        <div className={cn('p-2 rounded-full', config.color.replace('border-', 'bg-').split(' ')[0].replace('500', '100'))}>
          <StatusIcon className={cn('w-4 h-4', config.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{data.name}</div>
          <div className="text-xs text-gray-500">
            {data.capabilities.length} capabilities
          </div>
        </div>
      </div>

      {/* Capabilities preview */}
      <div className="mt-2 flex flex-wrap gap-1">
        {data.capabilities.slice(0, 2).map((cap) => (
          <Badge key={cap} variant="secondary" className="text-xs">
            {cap}
          </Badge>
        ))}
        {data.capabilities.length > 2 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="text-xs">
                +{data.capabilities.length - 2}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {data.capabilities.slice(2).join(', ')}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Constraint indicators */}
      {data.constraints.length > 0 && (
        <div className="mt-2 text-xs text-gray-400">
          {data.constraints.length} constraint{data.constraints.length > 1 ? 's' : ''}
        </div>
      )}

      {/* Output handle for delegations */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400"
      />
    </div>
  );
}
```

### Delegation Edge

```tsx
// src/features/trust/components/TrustChain/edges/DelegationEdge.tsx

import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface DelegationEdgeData {
  type: 'establish' | 'delegate';
  capabilities: string[];
  constraints: string[];
  isActive: boolean;
  taskId?: string;
}

export function DelegationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<DelegationEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeColor = data?.type === 'establish' ? '#6366f1' : '#94a3b8';
  const strokeWidth = data?.isActive ? 2 : 1;
  const strokeDasharray = data?.isActive ? undefined : '5,5';

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        fill="none"
        stroke={edgeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        markerEnd={markerEnd}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] bg-white shadow-sm',
              data?.type === 'establish' && 'border-indigo-300 text-indigo-700',
              data?.type === 'delegate' && 'border-gray-300 text-gray-700'
            )}
          >
            {data?.type === 'establish' ? 'ESTABLISH' : 'DELEGATE'}
          </Badge>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
```

---

## Delegation Timeline

### Timeline Component

```tsx
// src/features/trust/components/AuditTrail/DelegationTimeline.tsx

import { useMemo } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { ArrowRight, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DelegationRecord, AuditAnchor } from '../../types';

interface DelegationTimelineProps {
  delegations: DelegationRecord[];
  auditAnchors: AuditAnchor[];
}

interface TimelineEvent {
  id: string;
  type: 'delegation' | 'action' | 'completion' | 'failure';
  timestamp: string;
  title: string;
  description: string;
  agentId: string;
  result?: 'SUCCESS' | 'FAILURE' | 'DENIED';
}

export function DelegationTimeline({ delegations, auditAnchors }: DelegationTimelineProps) {
  const events = useMemo(() => {
    const allEvents: TimelineEvent[] = [];

    // Add delegation events
    delegations.forEach((del) => {
      allEvents.push({
        id: `del-${del.id}`,
        type: 'delegation',
        timestamp: del.delegatedAt,
        title: `Delegation to ${del.delegateeId}`,
        description: `Capabilities: ${del.capabilitiesDelegated.join(', ')}`,
        agentId: del.delegatorId,
      });
    });

    // Add audit events
    auditAnchors.forEach((anchor) => {
      allEvents.push({
        id: `aud-${anchor.id}`,
        type: anchor.result === 'SUCCESS' ? 'action' : 'failure',
        timestamp: anchor.timestamp,
        title: anchor.action,
        description: anchor.resource || 'No resource',
        agentId: anchor.agentId,
        result: anchor.result,
      });
    });

    // Sort by timestamp
    return allEvents.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [delegations, auditAnchors]);

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      {/* Events */}
      <div className="space-y-4">
        {events.map((event, index) => (
          <TimelineEventItem key={event.id} event={event} isLast={index === events.length - 1} />
        ))}
      </div>
    </div>
  );
}

function TimelineEventItem({
  event,
  isLast,
}: {
  event: TimelineEvent;
  isLast: boolean;
}) {
  const iconConfig = {
    delegation: { icon: ArrowRight, color: 'bg-indigo-100 text-indigo-600' },
    action: { icon: CheckCircle, color: 'bg-green-100 text-green-600' },
    completion: { icon: CheckCircle, color: 'bg-blue-100 text-blue-600' },
    failure: { icon: XCircle, color: 'bg-red-100 text-red-600' },
  };

  const config = iconConfig[event.type];
  const Icon = config.icon;

  return (
    <div className="relative pl-10">
      {/* Icon */}
      <div
        className={cn(
          'absolute left-0 w-8 h-8 rounded-full flex items-center justify-center',
          config.color
        )}
      >
        <Icon className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className={cn('pb-4', !isLast && 'border-b border-gray-100')}>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{event.title}</span>
          {event.result && (
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded',
                event.result === 'SUCCESS' && 'bg-green-100 text-green-700',
                event.result === 'FAILURE' && 'bg-red-100 text-red-700',
                event.result === 'DENIED' && 'bg-amber-100 text-amber-700'
              )}
            >
              {event.result}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">{event.description}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>{format(new Date(event.timestamp), 'HH:mm:ss')}</span>
          <span>({formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })})</span>
        </div>
      </div>
    </div>
  );
}
```

---

## Trust Status Indicators

### Trust Status Badge

```tsx
// src/features/trust/components/TrustStatus/TrustStatusBadge.tsx

import { Shield, ShieldAlert, ShieldOff, ShieldQuestion } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { TrustStatus } from '../../types';

interface TrustStatusBadgeProps {
  status: TrustStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<TrustStatus, {
  icon: typeof Shield;
  label: string;
  color: string;
  description: string;
}> = {
  VALID: {
    icon: Shield,
    label: 'Trusted',
    color: 'bg-green-100 text-green-700 border-green-200',
    description: 'Agent has valid trust chain',
  },
  EXPIRED: {
    icon: ShieldAlert,
    label: 'Expired',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    description: 'Trust chain has expired - renewal required',
  },
  REVOKED: {
    icon: ShieldOff,
    label: 'Revoked',
    color: 'bg-red-100 text-red-700 border-red-200',
    description: 'Trust has been revoked',
  },
  PENDING: {
    icon: ShieldQuestion,
    label: 'Pending',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    description: 'Trust establishment pending',
  },
};

const sizeConfig = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5',
};

const iconSize = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function TrustStatusBadge({
  status,
  showLabel = true,
  size = 'md',
}: TrustStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn('gap-1', config.color, sizeConfig[size])}
        >
          <Icon className={iconSize[size]} />
          {showLabel && <span>{config.label}</span>}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
```

### Verification Result Display

```tsx
// src/features/trust/components/TrustStatus/TrustVerificationResult.tsx

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { VerificationResult } from '../../types';

interface TrustVerificationResultProps {
  result: VerificationResult;
  agentId: string;
  action: string;
}

export function TrustVerificationResult({
  result,
  agentId,
  action,
}: TrustVerificationResultProps) {
  return (
    <Card className={cn(result.valid ? 'border-green-200' : 'border-red-200')}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {result.valid ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <CardTitle className="text-base">
            {result.valid ? 'Verification Passed' : 'Verification Failed'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Agent & Action */}
        <div className="text-sm">
          <span className="text-gray-500">Agent:</span>{' '}
          <span className="font-medium">{agentId}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Action:</span>{' '}
          <span className="font-medium">{action}</span>
        </div>

        {/* Capability Used */}
        {result.capabilityUsed && (
          <div className="text-sm">
            <span className="text-gray-500">Capability:</span>{' '}
            <Badge variant="secondary">{result.capabilityUsed}</Badge>
          </div>
        )}

        {/* Effective Constraints */}
        {result.effectiveConstraints.length > 0 && (
          <div>
            <span className="text-sm text-gray-500">Constraints:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {result.effectiveConstraints.map((c) => (
                <Badge key={c} variant="outline" className="text-xs">
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Failure Reason */}
        {!result.valid && result.reason && (
          <div className="p-2 bg-red-50 rounded text-sm text-red-700">
            {result.reason}
          </div>
        )}

        {/* Violations */}
        {result.violations && result.violations.length > 0 && (
          <div className="space-y-1">
            <span className="text-sm text-gray-500">Violations:</span>
            {result.violations.map((v) => (
              <div
                key={v.constraintId}
                className="flex items-start gap-2 p-2 bg-amber-50 rounded text-sm"
              >
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                <span className="text-amber-700">{v.reason}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Constraint Visualization

### Constraint Tags

```tsx
// src/features/trust/components/common/ConstraintTag.tsx

import { LockClosed, Clock, Database, Eye, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ConstraintTagProps {
  constraint: string;
  source?: string;
  removable?: boolean;
  onRemove?: () => void;
}

// Map common constraint types to icons
const constraintIcons: Record<string, typeof LockClosed> = {
  read_only: Eye,
  time_limited: Clock,
  data_scope: Database,
  audit_required: FileText,
};

// Map constraint types to colors
const constraintColors: Record<string, string> = {
  read_only: 'bg-blue-100 text-blue-700 border-blue-200',
  time_limited: 'bg-purple-100 text-purple-700 border-purple-200',
  data_scope: 'bg-amber-100 text-amber-700 border-amber-200',
  audit_required: 'bg-green-100 text-green-700 border-green-200',
};

function getConstraintIcon(constraint: string) {
  const lowerConstraint = constraint.toLowerCase();
  for (const [key, Icon] of Object.entries(constraintIcons)) {
    if (lowerConstraint.includes(key.replace('_', ''))) {
      return Icon;
    }
  }
  return LockClosed;
}

function getConstraintColor(constraint: string) {
  const lowerConstraint = constraint.toLowerCase();
  for (const [key, color] of Object.entries(constraintColors)) {
    if (lowerConstraint.includes(key.replace('_', ''))) {
      return color;
    }
  }
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

export function ConstraintTag({
  constraint,
  source,
  removable,
  onRemove,
}: ConstraintTagProps) {
  const Icon = getConstraintIcon(constraint);
  const color = getConstraintColor(constraint);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn('gap-1 cursor-default', color)}
        >
          <Icon className="w-3 h-3" />
          <span>{constraint}</span>
          {removable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
              className="ml-1 hover:bg-black/10 rounded-full p-0.5"
            >
              ×
            </button>
          )}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {source ? (
          <p>Source: {source}</p>
        ) : (
          <p>Constraint: {constraint}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
```

---

## Usage in Pipeline Editor

### Pipeline Trust Integration

```tsx
// src/features/pipelines/components/PipelineEditor/TrustOverlay.tsx

import { useMemo } from 'react';
import { useNodes } from 'reactflow';
import { TrustStatusBadge } from '@/features/trust/components/TrustStatus/TrustStatusBadge';
import { useTrustVerification } from '@/features/trust/hooks/useTrustVerification';

export function TrustOverlay() {
  const nodes = useNodes();

  // Get all agent nodes
  const agentNodes = useMemo(
    () => nodes.filter((n) => n.type === 'agent' && n.data.agentId),
    [nodes]
  );

  return (
    <div className="absolute top-2 right-2 z-10 space-y-2">
      <div className="bg-white/90 rounded-lg p-3 shadow-lg">
        <h4 className="text-sm font-medium mb-2">Pipeline Trust Status</h4>
        <div className="space-y-1">
          {agentNodes.map((node) => (
            <AgentTrustStatus
              key={node.id}
              nodeId={node.id}
              agentId={node.data.agentId}
              label={node.data.label}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentTrustStatus({
  nodeId,
  agentId,
  label,
}: {
  nodeId: string;
  agentId: string;
  label: string;
}) {
  const { verification, isLoading } = useTrustVerification(agentId);

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      {isLoading ? (
        <div className="w-16 h-5 bg-gray-100 animate-pulse rounded" />
      ) : (
        <TrustStatusBadge
          status={verification?.valid ? 'VALID' : 'PENDING'}
          size="sm"
        />
      )}
    </div>
  );
}
```

---

## Next Steps

1. **Document 03**: Management Interfaces (forms, wizards)
2. **Document 04**: Audit Dashboard
3. Implement React Flow graph components
4. Create Storybook stories for visualization components
