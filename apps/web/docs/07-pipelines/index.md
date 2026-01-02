# Pipeline Canvas

The Pipeline Canvas provides a visual node-based editor for building Kaizen workflows using React Flow v12.

## Components

### PipelineCanvas

The main canvas component for visual workflow editing.

```tsx
import { PipelineCanvas } from '@/features/pipelines/components/PipelineCanvas';

<PipelineCanvas
  pipelineId="pipeline-123"
  onSave={handleSave}
/>
```

Features:
- Drag-and-drop node placement
- Visual connection drawing
- Zoom and pan controls
- Minimap navigation
- Background grid
- Auto-layout support

### NodePalette

Sidebar component displaying available node types for drag-and-drop.

```tsx
import { NodePalette } from '@/features/pipelines/components/NodePalette';

<NodePalette
  onNodeDragStart={handleDragStart}
  categories={['ai', 'data', 'logic', 'integration']}
/>
```

Node Categories:
- **AI**: LLM, Embedding, Classification nodes
- **Data**: Transform, Filter, Aggregate nodes
- **Logic**: Condition, Switch, Loop nodes
- **Integration**: API, Database, File nodes

### Custom Node Components

Each node type has a custom React Flow component:

```tsx
import { AINode } from '@/features/pipelines/components/nodes/AINode';
import { DataNode } from '@/features/pipelines/components/nodes/DataNode';
import { LogicNode } from '@/features/pipelines/components/nodes/LogicNode';

// Node type mapping for React Flow
const nodeTypes = {
  ai: AINode,
  data: DataNode,
  logic: LogicNode,
  integration: IntegrationNode,
};
```

### Node Configuration Panel

Panel for editing selected node properties.

```tsx
import { NodeConfigPanel } from '@/features/pipelines/components/NodeConfigPanel';

<NodeConfigPanel
  node={selectedNode}
  onUpdate={handleNodeUpdate}
/>
```

## Canvas Store

Zustand store for managing canvas state with undo/redo support.

```tsx
import { useCanvasStore } from '@/store/canvas';

const {
  nodes,
  edges,
  setNodes,
  setEdges,
  addNode,
  removeNode,
  updateNode,
  addEdge,
  removeEdge,
  selectedNodeId,
  selectNode,
  clearSelection,
  canUndo,
  canRedo,
  undo,
  redo,
  resetHistory,
} = useCanvasStore();
```

### Store Actions

```typescript
// Add a new node
addNode({
  type: 'ai',
  position: { x: 100, y: 200 },
  data: { label: 'LLM Node', config: {} },
});

// Update node data
updateNode('node-123', { data: { label: 'Updated' } });

// Connect nodes
addEdge({
  source: 'node-1',
  target: 'node-2',
  sourceHandle: 'output',
  targetHandle: 'input',
});

// Undo/Redo
undo();
redo();
```

## Hooks

### usePipelines

Fetches list of pipelines.

```tsx
import { usePipelines } from '@/features/pipelines/hooks';

const { data, isLoading, error } = usePipelines({
  search: 'workflow',
  status: 'active',
});
```

### usePipeline

Fetches a single pipeline with its nodes and edges.

```tsx
import { usePipeline } from '@/features/pipelines/hooks';

const { data: pipeline, isLoading } = usePipeline('pipeline-123');
```

### useCreatePipeline / useUpdatePipeline / useDeletePipeline

Mutation hooks for pipeline CRUD.

```tsx
import { useCreatePipeline, useUpdatePipeline } from '@/features/pipelines/hooks';

const createPipeline = useCreatePipeline();
const updatePipeline = useUpdatePipeline();

// Create with nodes and edges
await createPipeline.mutateAsync({
  name: 'New Pipeline',
  nodes: [...],
  edges: [...],
});

// Update existing
await updatePipeline.mutateAsync({
  id: 'pipeline-123',
  input: { nodes: [...], edges: [...] },
});
```

## Types

```typescript
interface Pipeline {
  id: string;
  name: string;
  description?: string;
  status: PipelineStatus;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface PipelineNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
}

interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

type NodeType = 'ai' | 'data' | 'logic' | 'integration';
type PipelineStatus = 'draft' | 'active' | 'archived';
```

## React Flow Integration

The canvas uses @xyflow/react v12 with custom configurations:

```tsx
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  nodeTypes={nodeTypes}
  fitView
>
  <Background variant="dots" gap={12} size={1} />
  <Controls />
  <MiniMap zoomable pannable />
</ReactFlow>
```

### Connection Validation

```tsx
const isValidConnection = (connection: Connection) => {
  // Prevent self-connections
  if (connection.source === connection.target) return false;

  // Validate handle types
  const sourceNode = nodes.find(n => n.id === connection.source);
  const targetNode = nodes.find(n => n.id === connection.target);

  return validateNodeConnection(sourceNode, targetNode, connection);
};
```

## Testing

Tests are located in `src/store/__tests__/canvas.test.ts` and `src/features/pipelines/components/__tests__/`.

```bash
# Run pipeline tests
npm run test -- --grep "Pipeline|Canvas"
```

Test coverage includes:
- Node CRUD operations
- Edge connections
- Undo/redo functionality
- Drag and drop
- Node configuration
- Serialization
