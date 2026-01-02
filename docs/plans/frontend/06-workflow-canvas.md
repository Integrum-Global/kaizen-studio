# Workflow Canvas

**Date**: 2025-12-11
**Status**: Planning

---

## Overview

The Pipeline Canvas is Kaizen Studio's core differentiator - a visual designer for building AI agent workflows. This document defines the @xyflow/react implementation based on patterns from kailash_workflow_studio (547 lines of excellent React Flow integration).

### Key Requirements
- Visual drag-and-drop workflow design
- Support for 9 Kaizen pipeline patterns
- Real-time execution visualization
- Undo/redo (100 steps)
- Auto-save with 2-second debounce
- Format conversion (frontend ↔ backend)

---

## React Flow Setup

### Main Canvas Component

```typescript
// features/pipelines/components/Canvas.tsx
import { useCallback, useRef, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  type Node,
  type Edge,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeTypes,
  type EdgeTypes,
  type DefaultEdgeOptions,
  ConnectionLineType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useCanvasStore } from '@/stores/canvasStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useAutoSave } from '@/hooks/useAutoSave'

// Custom nodes
import { AgentNode } from './nodes/AgentNode'
import { SupervisorNode } from './nodes/SupervisorNode'
import { RouterNode } from './nodes/RouterNode'
import { SynthesizerNode } from './nodes/SynthesizerNode'
import { ConnectorNode } from './nodes/ConnectorNode'

// Custom edges
import { KailashEdge } from './edges/KailashEdge'
import { LoopEdge } from './edges/LoopEdge'

// Panels
import { NodePalette } from './NodePalette'
import { NodeConfigPanel } from './NodeConfigPanel'
import { Toolbar } from './Toolbar'

// Node types registration
const nodeTypes: NodeTypes = {
  agent: AgentNode,
  supervisor: SupervisorNode,
  router: RouterNode,
  synthesizer: SynthesizerNode,
  connector: ConnectorNode,
}

// Edge types registration
const edgeTypes: EdgeTypes = {
  default: KailashEdge,
  loop: LoopEdge,
}

// Default edge options
const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'default',
  animated: false,
  style: { strokeWidth: 2 },
}

export function Canvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { project, getViewport, setViewport } = useReactFlow()

  // Canvas store
  const {
    nodes,
    edges,
    selectedNodeId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelection,
    isDirty,
  } = useCanvasStore()

  // History store
  const { pushState, undo, redo, canUndo, canRedo } = useHistoryStore()

  // Auto-save hook
  const { isSaving } = useAutoSave()

  // Push state to history on significant changes
  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      // Only push to history for position/data changes, not selection
      const significantChange = changes.some(
        (c) => c.type === 'position' || c.type === 'remove'
      )
      if (significantChange) {
        pushState({ nodes, edges })
      }
      onNodesChange(changes)
    },
    [nodes, edges, pushState, onNodesChange]
  )

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      const significantChange = changes.some((c) => c.type === 'remove')
      if (significantChange) {
        pushState({ nodes, edges })
      }
      onEdgesChange(changes)
    },
    [nodes, edges, pushState, onEdgesChange]
  )

  const handleConnect: OnConnect = useCallback(
    (connection) => {
      pushState({ nodes, edges })
      onConnect(connection)
    },
    [nodes, edges, pushState, onConnect]
  )

  // Handle drop from palette
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')
      if (!type || !reactFlowWrapper.current) return

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: `New ${type}` },
      }

      pushState({ nodes, edges })
      addNode(newNode)
    },
    [project, nodes, edges, pushState, addNode]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  // Handle node selection
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelection(node.id)
    },
    [setSelection]
  )

  const onPaneClick = useCallback(() => {
    setSelection(null)
  }, [setSelection])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Z = Undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        if (canUndo()) {
          const state = undo()
          if (state) {
            useCanvasStore.getState().setNodes(state.nodes)
            useCanvasStore.getState().setEdges(state.edges)
          }
        }
      }

      // Ctrl/Cmd + Shift + Z = Redo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) {
        event.preventDefault()
        if (canRedo()) {
          const state = redo()
          if (state) {
            useCanvasStore.getState().setNodes(state.nodes)
            useCanvasStore.getState().setEdges(state.edges)
          }
        }
      }

      // Delete = Remove selected node
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const { selectedNodeId, deleteNode } = useCanvasStore.getState()
        if (selectedNodeId) {
          pushState({ nodes, edges })
          deleteNode(selectedNodeId)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [canUndo, canRedo, undo, redo, nodes, edges, pushState])

  return (
    <div className="flex h-full">
      {/* Node Palette (left sidebar) */}
      <NodePalette />

      {/* Main Canvas */}
      <div ref={reactFlowWrapper} className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          minZoom={0.1}
          maxZoom={4}
          deleteKeyCode={['Delete', 'Backspace']}
          multiSelectionKeyCode="Shift"
        >
          <Background color="#e2e8f0" gap={15} />
          <Controls />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="bg-card border rounded-lg"
          />

          {/* Toolbar Panel */}
          <Panel position="top-center">
            <Toolbar
              onUndo={() => {
                const state = undo()
                if (state) {
                  useCanvasStore.getState().setNodes(state.nodes)
                  useCanvasStore.getState().setEdges(state.edges)
                }
              }}
              onRedo={() => {
                const state = redo()
                if (state) {
                  useCanvasStore.getState().setNodes(state.nodes)
                  useCanvasStore.getState().setEdges(state.edges)
                }
              }}
              canUndo={canUndo()}
              canRedo={canRedo()}
              isDirty={isDirty}
              isSaving={isSaving}
            />
          </Panel>
        </ReactFlow>
      </div>

      {/* Node Config Panel (right sidebar) */}
      {selectedNodeId && <NodeConfigPanel nodeId={selectedNodeId} />}
    </div>
  )
}
```

### Canvas Provider

```typescript
// features/pipelines/components/CanvasProvider.tsx
import { ReactFlowProvider } from '@xyflow/react'
import { Canvas } from './Canvas'

export function CanvasProvider() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  )
}
```

---

## Node Palette

```typescript
// features/pipelines/components/NodePalette.tsx
import { Bot, Users, GitBranch, Combine, Plug } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NodeType {
  type: string
  label: string
  icon: React.ReactNode
  color: string
  description: string
}

const nodeTypes: NodeType[] = [
  {
    type: 'agent',
    label: 'Agent',
    icon: <Bot className="w-5 h-5" />,
    color: 'var(--color-node-agent)',
    description: 'AI agent with LLM backend',
  },
  {
    type: 'supervisor',
    label: 'Supervisor',
    icon: <Users className="w-5 h-5" />,
    color: 'var(--color-node-supervisor)',
    description: 'Orchestrates multiple agents',
  },
  {
    type: 'router',
    label: 'Router',
    icon: <GitBranch className="w-5 h-5" />,
    color: 'var(--color-node-router)',
    description: 'Routes to different paths',
  },
  {
    type: 'synthesizer',
    label: 'Synthesizer',
    icon: <Combine className="w-5 h-5" />,
    color: 'var(--color-node-synthesizer)',
    description: 'Combines multiple outputs',
  },
  {
    type: 'connector',
    label: 'Connector',
    icon: <Plug className="w-5 h-5" />,
    color: 'var(--color-node-connector)',
    description: 'External system connection',
  },
]

export function NodePalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="w-64 border-r bg-card p-4">
      <h3 className="font-semibold mb-4">Node Types</h3>
      <div className="space-y-2">
        {nodeTypes.map((node) => (
          <div
            key={node.type}
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border cursor-grab',
              'hover:bg-accent transition-colors',
              'active:cursor-grabbing'
            )}
          >
            <div
              className="flex items-center justify-center w-8 h-8 rounded"
              style={{ backgroundColor: node.color }}
            >
              <span className="text-white">{node.icon}</span>
            </div>
            <div>
              <p className="font-medium text-sm">{node.label}</p>
              <p className="text-xs text-muted-foreground">{node.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pattern Templates */}
      <div className="mt-6">
        <h3 className="font-semibold mb-4">Pipeline Patterns</h3>
        <div className="space-y-2">
          {[
            { name: 'Sequential', pattern: 'sequential' },
            { name: 'Supervisor-Worker', pattern: 'supervisor_worker' },
            { name: 'Router', pattern: 'router' },
            { name: 'Ensemble', pattern: 'ensemble' },
            { name: 'Parallel', pattern: 'parallel' },
          ].map((template) => (
            <button
              key={template.pattern}
              className="w-full text-left p-2 text-sm rounded hover:bg-accent"
              onClick={() => {
                // Load pattern template
                console.log('Load pattern:', template.pattern)
              }}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

## Node Configuration Panel

```typescript
// features/pipelines/components/NodeConfigPanel.tsx
import { useCallback } from 'react'
import { X } from 'lucide-react'
import { useCanvasStore } from '@/stores/canvasStore'
import { useAgents } from '@/features/agents/hooks/useAgents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface NodeConfigPanelProps {
  nodeId: string
}

export function NodeConfigPanel({ nodeId }: NodeConfigPanelProps) {
  const { nodes, updateNodeData, setSelection } = useCanvasStore()
  const { data: agentsData } = useAgents()

  const node = nodes.find((n) => n.id === nodeId)
  if (!node) return null

  const handleUpdate = useCallback(
    (key: string, value: unknown) => {
      updateNodeData(nodeId, { [key]: value })
    },
    [nodeId, updateNodeData]
  )

  return (
    <div className="w-80 border-l bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Node Configuration</h3>
        <Button variant="ghost" size="icon" onClick={() => setSelection(null)}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Common fields */}
        <div>
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            value={node.data.label || ''}
            onChange={(e) => handleUpdate('label', e.target.value)}
          />
        </div>

        {/* Agent-specific fields */}
        {node.type === 'agent' && (
          <>
            <div>
              <Label htmlFor="agent">Select Agent</Label>
              <Select
                value={node.data.agentId || ''}
                onValueChange={(value) => handleUpdate('agentId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agentsData?.items.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="inputMapping">Input Mapping</Label>
              <Input
                id="inputMapping"
                placeholder="e.g., {{previous.output}}"
                value={node.data.inputMapping || ''}
                onChange={(e) => handleUpdate('inputMapping', e.target.value)}
              />
            </div>
          </>
        )}

        {/* Supervisor-specific fields */}
        {node.type === 'supervisor' && (
          <>
            <div>
              <Label htmlFor="strategy">Strategy</Label>
              <Select
                value={node.data.strategy || 'round-robin'}
                onValueChange={(value) => handleUpdate('strategy', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round-robin">Round Robin</SelectItem>
                  <SelectItem value="load-balanced">Load Balanced</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="maxWorkers">Max Workers</Label>
              <Input
                id="maxWorkers"
                type="number"
                min={1}
                max={10}
                value={node.data.maxWorkers || 3}
                onChange={(e) => handleUpdate('maxWorkers', parseInt(e.target.value))}
              />
            </div>
          </>
        )}

        {/* Router-specific fields */}
        {node.type === 'router' && (
          <div>
            <Label>Routes</Label>
            <div className="mt-2 space-y-2">
              {(node.data.routes || []).map((route: any, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Condition"
                    value={route.condition}
                    onChange={(e) => {
                      const routes = [...(node.data.routes || [])]
                      routes[index] = { ...routes[index], condition: e.target.value }
                      handleUpdate('routes', routes)
                    }}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const routes = [...(node.data.routes || []), { condition: '', target: '' }]
                  handleUpdate('routes', routes)
                }}
              >
                Add Route
              </Button>
            </div>
          </div>
        )}

        {/* Connector-specific fields */}
        {node.type === 'connector' && (
          <>
            <div>
              <Label htmlFor="connectorType">Connector Type</Label>
              <Select
                value={node.data.connectorType || 'database'}
                onValueChange={(value) => handleUpdate('connectorType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="storage">Storage</SelectItem>
                  <SelectItem value="messaging">Messaging</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

---

## Custom Edge Component

```typescript
// features/pipelines/components/edges/KailashEdge.tsx
import { memo } from 'react'
import {
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
} from '@xyflow/react'
import { X } from 'lucide-react'
import { useCanvasStore } from '@/stores/canvasStore'

export const KailashEdge = memo(function KailashEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  markerEnd,
  data,
}: EdgeProps) {
  const { setSelection } = useCanvasStore()

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? 'var(--color-primary-500)' : 'var(--color-neutral-400)',
        }}
      />

      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            <button
              className="flex items-center justify-center w-5 h-5 bg-destructive text-white rounded-full hover:bg-destructive/90"
              onClick={(e) => {
                e.stopPropagation()
                useCanvasStore.getState().setEdges(
                  useCanvasStore.getState().edges.filter((edge) => edge.id !== id)
                )
              }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
})
```

---

## Format Conversion

```typescript
// features/pipelines/utils/formatConversion.ts
import type { Node, Edge } from '@xyflow/react'
import type { PipelineNode, PipelineConnection } from '@/types/models'

// Convert frontend nodes/edges to backend format
export function toBackendFormat(
  nodes: Node[],
  edges: Edge[]
): { nodes: PipelineNode[]; connections: PipelineConnection[] } {
  const backendNodes: PipelineNode[] = nodes.map((node) => ({
    id: node.id,
    pipeline_id: '', // Set by backend
    node_type: node.type as PipelineNode['node_type'],
    agent_id: node.data.agentId || null,
    config: {
      label: node.data.label,
      strategy: node.data.strategy,
      routes: node.data.routes,
      inputMapping: node.data.inputMapping,
      connectorType: node.data.connectorType,
      ...node.data,
    },
    position_x: node.position.x,
    position_y: node.position.y,
  }))

  const connections: PipelineConnection[] = edges.map((edge) => ({
    id: edge.id,
    pipeline_id: '', // Set by backend
    source_node_id: edge.source,
    target_node_id: edge.target,
    source_handle: edge.sourceHandle || null,
    target_handle: edge.targetHandle || null,
  }))

  return { nodes: backendNodes, connections }
}

// Convert backend format to frontend nodes/edges
export function toFrontendFormat(
  pipelineNodes: PipelineNode[],
  connections: PipelineConnection[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = pipelineNodes.map((node) => ({
    id: node.id,
    type: node.node_type,
    position: { x: node.position_x, y: node.position_y },
    data: {
      label: node.config.label || `${node.node_type} Node`,
      agentId: node.agent_id,
      ...node.config,
    },
  }))

  const edges: Edge[] = connections.map((conn) => ({
    id: conn.id,
    source: conn.source_node_id,
    target: conn.target_node_id,
    sourceHandle: conn.source_handle,
    targetHandle: conn.target_handle,
    type: 'default',
  }))

  return { nodes, edges }
}
```

---

## Execution Visualization

```typescript
// features/pipelines/components/ExecutionOverlay.tsx
import { useEffect } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useExecutionStore } from '@/stores/executionStore'
import { useCanvasStore } from '@/stores/canvasStore'

export function ExecutionOverlay() {
  const { setNodes } = useReactFlow()
  const { status, currentNodeId, result } = useExecutionStore()
  const { nodes } = useCanvasStore()

  // Update node styles during execution
  useEffect(() => {
    if (status === 'running' || status === 'completed' || status === 'failed') {
      const updatedNodes = nodes.map((node) => {
        let nodeStatus: 'idle' | 'running' | 'success' | 'error' = 'idle'

        if (status === 'running' && node.id === currentNodeId) {
          nodeStatus = 'running'
        } else if (result?.nodeResults[node.id]) {
          nodeStatus = result.nodeResults[node.id].status === 'success' ? 'success' : 'error'
        }

        return {
          ...node,
          data: {
            ...node.data,
            status: nodeStatus,
          },
        }
      })

      setNodes(updatedNodes)
    }
  }, [status, currentNodeId, result, nodes, setNodes])

  return null // This is an effect-only component
}
```

---

## 9 Pipeline Patterns

The canvas supports all 9 Kaizen pipeline patterns:

```typescript
// features/pipelines/constants/patterns.ts
export const PIPELINE_PATTERNS = {
  // 1. Sequential: Agent → Agent → Agent
  sequential: {
    name: 'Sequential',
    description: 'Agents execute one after another',
    template: {
      nodes: [
        { type: 'agent', position: { x: 250, y: 100 } },
        { type: 'agent', position: { x: 250, y: 250 } },
        { type: 'agent', position: { x: 250, y: 400 } },
      ],
      edges: [
        { source: '0', target: '1' },
        { source: '1', target: '2' },
      ],
    },
  },

  // 2. Supervisor-Worker: Supervisor manages multiple workers
  supervisor_worker: {
    name: 'Supervisor-Worker',
    description: 'Supervisor orchestrates multiple worker agents',
    template: {
      nodes: [
        { type: 'supervisor', position: { x: 250, y: 100 } },
        { type: 'agent', position: { x: 100, y: 300 } },
        { type: 'agent', position: { x: 250, y: 300 } },
        { type: 'agent', position: { x: 400, y: 300 } },
      ],
      edges: [
        { source: '0', target: '1' },
        { source: '0', target: '2' },
        { source: '0', target: '3' },
      ],
    },
  },

  // 3. Router: Routes to different agents based on conditions
  router: {
    name: 'Router',
    description: 'Routes input to different paths based on conditions',
    template: {
      nodes: [
        { type: 'router', position: { x: 250, y: 100 } },
        { type: 'agent', position: { x: 100, y: 300 } },
        { type: 'agent', position: { x: 400, y: 300 } },
      ],
      edges: [
        { source: '0', target: '1', sourceHandle: 'route-0' },
        { source: '0', target: '2', sourceHandle: 'route-1' },
      ],
    },
  },

  // 4. Ensemble: Multiple agents, synthesized output
  ensemble: {
    name: 'Ensemble',
    description: 'Multiple agents with combined output',
    template: {
      nodes: [
        { type: 'agent', position: { x: 100, y: 100 } },
        { type: 'agent', position: { x: 250, y: 100 } },
        { type: 'agent', position: { x: 400, y: 100 } },
        { type: 'synthesizer', position: { x: 250, y: 300 } },
      ],
      edges: [
        { source: '0', target: '3' },
        { source: '1', target: '3' },
        { source: '2', target: '3' },
      ],
    },
  },

  // 5. Parallel: Concurrent execution
  parallel: {
    name: 'Parallel',
    description: 'Agents execute concurrently',
    template: {
      nodes: [
        { type: 'agent', position: { x: 100, y: 100 } },
        { type: 'agent', position: { x: 250, y: 100 } },
        { type: 'agent', position: { x: 400, y: 100 } },
        { type: 'synthesizer', position: { x: 250, y: 300 } },
      ],
      edges: [
        { source: '0', target: '3' },
        { source: '1', target: '3' },
        { source: '2', target: '3' },
      ],
    },
  },

  // 6. Hierarchical: Multi-level supervision
  hierarchical: {
    name: 'Hierarchical',
    description: 'Multi-level supervisor structure',
  },

  // 7. Pipeline: Stage-based processing
  pipeline: {
    name: 'Pipeline',
    description: 'Multi-stage processing pipeline',
  },

  // 8. Blackboard: Shared memory pattern
  blackboard: {
    name: 'Blackboard',
    description: 'Agents share common knowledge base',
  },

  // 9. Reactive: Event-driven pattern
  reactive: {
    name: 'Reactive',
    description: 'Event-driven agent coordination',
  },
} as const
```

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [03-design-system.md](03-design-system.md) | Node component styles |
| [04-state-management.md](04-state-management.md) | Canvas store |
| [05-api-integration.md](05-api-integration.md) | Pipeline API |
