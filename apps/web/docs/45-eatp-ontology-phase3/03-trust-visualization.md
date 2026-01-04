# Cross-Department Trust Visualization

The Cross-Department Trust Visualization provides a React Flow-based graph showing trust relationships across departments. It helps Level 3 users understand the trust topology of their organization.

## What It Is

A visual graph representation where:
- **Departments** appear as grouped headers with custom colors
- **Work Units** appear as nodes within departments
- **Trust Relationships** appear as edges connecting work units
- **Trust Status** is indicated by colors (green=valid, amber=expiring, red=expired, gray=revoked)

## Core Types

```typescript
// Trust relationship between work units
interface TrustRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  status: TrustStatus;  // 'valid' | 'expiring' | 'expired' | 'revoked'
  constraintSummary?: string;
  expiresAt?: string;
}

// Work unit in the trust map
interface TrustMapWorkUnit {
  id: string;
  name: string;
  departmentId: string;
  trustStatus: TrustStatus;
  delegatedBy?: string;
}

// Department in the trust map
interface TrustMapDepartment {
  id: string;
  name: string;
  color: string;  // Hex color code
}
```

## Component Usage

```tsx
import { CrossDepartmentTrustVisualization } from '@/features/value-chains/components';

// Sample data
const departments = [
  { id: 'dept-1', name: 'Engineering', color: '#3B82F6' },
  { id: 'dept-2', name: 'Operations', color: '#10B981' },
];

const workUnits = [
  { id: 'wu-1', name: 'API Service', departmentId: 'dept-1', trustStatus: 'valid' },
  { id: 'wu-2', name: 'Deploy Bot', departmentId: 'dept-2', trustStatus: 'valid', delegatedBy: 'Engineering' },
];

const relationships = [
  { id: 'rel-1', sourceId: 'wu-1', targetId: 'wu-2', status: 'valid', constraintSummary: '100 req/min' },
];

// Render
<CrossDepartmentTrustVisualization
  departments={departments}
  workUnits={workUnits}
  relationships={relationships}
  onNodeClick={(nodeId, nodeType) => {
    if (nodeType === 'workunit') {
      navigate(`/build/work-units/${nodeId}`);
    }
  }}
  className="h-[600px]"
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `departments` | `TrustMapDepartment[]` | Department nodes to display |
| `workUnits` | `TrustMapWorkUnit[]` | Work unit nodes to display |
| `relationships` | `TrustRelationship[]` | Trust relationship edges |
| `onNodeClick` | `(nodeId: string, nodeType: 'department' \| 'workunit') => void` | Callback when node clicked |
| `className` | `string` | Additional CSS classes |

## Visual Elements

### Department Headers
- Colored header bars
- Department name displayed
- Non-draggable position

### Work Unit Nodes
- Bordered cards with trust status color
- Name and optional "via {delegatedBy}" text
- Draggable within canvas
- Source/target positions for edges

### Trust Edges
- Smooth step connections
- Animated when status is 'valid'
- Arrow markers showing direction
- Optional constraint summary labels

### Legend
- Fixed position overlay
- Shows all trust status colors
- Valid (green), Expiring (amber), Expired (red), Revoked (gray)

## Color Scheme

### Edge Colors (Status)
```typescript
const getEdgeColor = (status: TrustStatus): string => {
  switch (status) {
    case 'valid':    return '#22c55e';  // green-500
    case 'expiring': return '#f59e0b';  // amber-500
    case 'expired':  return '#ef4444';  // red-500
    case 'revoked':  return '#6b7280';  // gray-500
  }
};
```

### Node Border Colors
```typescript
const getNodeBorderColor = (status: TrustStatus): string => {
  switch (status) {
    case 'valid':    return '#86efac';  // green-300
    case 'expiring': return '#fcd34d';  // amber-300
    case 'expired':  return '#fca5a5';  // red-300
    case 'revoked':  return '#d1d5db';  // gray-300
  }
};
```

## Empty State

When no data is provided, displays a centered message:

```tsx
<CrossDepartmentTrustVisualization
  departments={[]}
  workUnits={[]}
  relationships={[]}
/>
// Renders: "No trust relationships to display"
```

## React Flow Features

The component uses React Flow with:
- **Background**: Grid pattern
- **Controls**: Zoom in/out, fit view, interactive controls
- **MiniMap**: Overview thumbnail with node colors

## Integration Example

```tsx
import { useTrustMap } from '@/features/value-chains';
import { CrossDepartmentTrustVisualization } from '@/features/value-chains/components';

function TrustMapPage({ valueChainId }: { valueChainId: string }) {
  const { data, isLoading } = useTrustMap(valueChainId);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <h1>Trust Relationships</h1>

      <CrossDepartmentTrustVisualization
        departments={data?.departments ?? []}
        workUnits={data?.workUnits ?? []}
        relationships={data?.relationships ?? []}
        onNodeClick={(id, type) => {
          if (type === 'workunit') {
            // Open work unit details panel
            openWorkUnitPanel(id);
          }
        }}
      />
    </div>
  );
}
```

## Dependencies

The component requires React Flow:

```bash
npm install reactflow
```

Import the styles in your component:

```tsx
import 'reactflow/dist/style.css';
```
