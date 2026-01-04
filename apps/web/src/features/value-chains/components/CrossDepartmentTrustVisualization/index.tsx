/**
 * CrossDepartmentTrustVisualization Component
 *
 * React Flow visualization of trust relationships across departments.
 * Shows departments as grouped containers with work units as nodes.
 */

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { cn } from '@/lib/utils';
import type { TrustStatus } from '../../types';

/**
 * Trust relationship between work units
 */
export interface TrustRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  status: TrustStatus;
  constraintSummary?: string;
  expiresAt?: string;
}

/**
 * Work unit in the trust map
 */
export interface TrustMapWorkUnit {
  id: string;
  name: string;
  departmentId: string;
  trustStatus: TrustStatus;
  delegatedBy?: string;
}

/**
 * Department in the trust map
 */
export interface TrustMapDepartment {
  id: string;
  name: string;
  color: string;
}

export interface CrossDepartmentTrustVisualizationProps {
  departments: TrustMapDepartment[];
  workUnits: TrustMapWorkUnit[];
  relationships: TrustRelationship[];
  onNodeClick?: (nodeId: string, nodeType: 'department' | 'workunit') => void;
  className?: string;
}

/**
 * Get edge color based on trust status
 */
function getEdgeColor(status: TrustStatus): string {
  switch (status) {
    case 'valid':
      return '#22c55e'; // green-500
    case 'expiring':
      return '#f59e0b'; // amber-500
    case 'expired':
      return '#ef4444'; // red-500
    case 'revoked':
      return '#6b7280'; // gray-500
  }
}

/**
 * Get node border color based on trust status
 */
function getNodeBorderColor(status: TrustStatus): string {
  switch (status) {
    case 'valid':
      return '#86efac'; // green-300
    case 'expiring':
      return '#fcd34d'; // amber-300
    case 'expired':
      return '#fca5a5'; // red-300
    case 'revoked':
      return '#d1d5db'; // gray-300
  }
}

/**
 * Custom node component for work units
 */
function WorkUnitNode({ data }: { data: { label: string; status: TrustStatus; delegatedBy?: string } }) {
  return (
    <div
      className={cn(
        'px-3 py-2 rounded-lg border-2 bg-white dark:bg-gray-800 shadow-sm',
        'min-w-[120px] text-center'
      )}
      style={{ borderColor: getNodeBorderColor(data.status) }}
    >
      <div className="text-sm font-medium truncate">{data.label}</div>
      {data.delegatedBy && (
        <div className="text-xs text-muted-foreground mt-1">
          via {data.delegatedBy}
        </div>
      )}
    </div>
  );
}

/**
 * Custom node component for departments (group headers)
 */
function DepartmentNode({ data }: { data: { label: string; color: string } }) {
  return (
    <div
      className="px-4 py-2 rounded-t-lg font-semibold text-white text-center min-w-[150px]"
      style={{ backgroundColor: data.color }}
    >
      {data.label}
    </div>
  );
}

const nodeTypes = {
  workunit: WorkUnitNode,
  department: DepartmentNode,
};

/**
 * CrossDepartmentTrustVisualization Component
 */
export function CrossDepartmentTrustVisualization({
  departments,
  workUnits,
  relationships,
  onNodeClick,
  className,
}: CrossDepartmentTrustVisualizationProps) {
  // Build nodes from departments and work units
  const initialNodes = useMemo(() => {
    const nodes: Node[] = [];

    // Layout configuration
    const departmentWidth = 200;
    const departmentGap = 50;
    const nodeHeight = 60;
    const nodeGap = 20;
    const headerHeight = 40;

    // Group work units by department
    const workUnitsByDept: Record<string, TrustMapWorkUnit[]> = {};
    workUnits.forEach((wu) => {
      if (!workUnitsByDept[wu.departmentId]) {
        workUnitsByDept[wu.departmentId] = [];
      }
      workUnitsByDept[wu.departmentId]!.push(wu);
    });

    // Create department and work unit nodes
    let xOffset = 0;

    departments.forEach((dept) => {
      const deptWorkUnits = workUnitsByDept[dept.id] ?? [];

      // Department header node
      nodes.push({
        id: `dept-${dept.id}`,
        type: 'department',
        position: { x: xOffset, y: 0 },
        data: { label: dept.name, color: dept.color },
        draggable: false,
      });

      // Work unit nodes within department
      deptWorkUnits.forEach((wu, index) => {
        nodes.push({
          id: wu.id,
          type: 'workunit',
          position: {
            x: xOffset + 25,
            y: headerHeight + nodeGap + index * (nodeHeight + nodeGap),
          },
          data: {
            label: wu.name,
            status: wu.trustStatus,
            delegatedBy: wu.delegatedBy,
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
      });

      xOffset += departmentWidth + departmentGap;
    });

    return nodes;
  }, [departments, workUnits]);

  // Build edges from relationships
  const initialEdges = useMemo(() => {
    return relationships.map((rel) => ({
      id: rel.id,
      source: rel.sourceId,
      target: rel.targetId,
      type: 'smoothstep',
      animated: rel.status === 'valid',
      style: {
        stroke: getEdgeColor(rel.status),
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: getEdgeColor(rel.status),
      },
      label: rel.constraintSummary,
      labelStyle: { fontSize: 10 },
    }));
  }, [relationships]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        const nodeType = node.id.startsWith('dept-') ? 'department' : 'workunit';
        const nodeId = node.id.startsWith('dept-') ? node.id.replace('dept-', '') : node.id;
        onNodeClick(nodeId, nodeType);
      }
    },
    [onNodeClick]
  );

  // Empty state
  if (departments.length === 0 && workUnits.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-96 bg-muted/50 rounded-lg',
          className
        )}
        data-testid="trust-visualization-empty"
      >
        <p className="text-muted-foreground">No trust relationships to display</p>
      </div>
    );
  }

  return (
    <div
      className={cn('h-[600px] border rounded-lg', className)}
      data-testid="cross-department-trust-visualization"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'department') {
              return node.data.color;
            }
            return getNodeBorderColor(node.data.status);
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border text-xs space-y-2">
        <p className="font-medium">Trust Status</p>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-green-500 rounded" />
          <span>Valid</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-amber-500 rounded" />
          <span>Expiring</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-red-500 rounded" />
          <span>Expired</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-gray-500 rounded" />
          <span>Revoked</span>
        </div>
      </div>
    </div>
  );
}

export default CrossDepartmentTrustVisualization;
