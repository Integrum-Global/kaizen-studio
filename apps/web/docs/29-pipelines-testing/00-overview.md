# Pipelines Feature Testing

Comprehensive tests for the pipelines feature canvas and node components.

## Test Files

```
src/features/pipelines/components/
├── canvas/__tests__/
│   ├── NodePalette.test.tsx       # 27 tests
│   └── NodeConfigPanel.test.tsx   # 22 tests
└── nodes/__tests__/
    ├── BaseNode.test.tsx          # 34 tests
    ├── AgentNode.test.tsx         # 27 tests
    └── RouterNode.test.tsx        # 30 tests
```

## NodePalette Tests (27 tests)

### Rendering Tests
- Renders palette title
- Renders all 7 node types (Input, Agent, Supervisor, Router, Synthesizer, Connector, Output)
- Shows correct icons for each node type
- Shows descriptions for each node type

### Drag Functionality Tests
- Makes nodes draggable
- Sets correct drag data type
- Sets correct node type in drag data

### Styling Tests
- Applies correct color classes per node type
- Shows hover states
- Supports dark mode

### Layout Tests
- Renders templates section
- Groups nodes correctly

## NodeConfigPanel Tests (22 tests)

### Empty State Tests
- Shows "No node selected" when no selection
- Shows selection instructions

### Node Selection Tests
- Displays selected node label
- Shows node type
- Shows node-specific configuration fields

### Configuration Tests
- Agent node shows agent ID field
- Router node shows conditions list
- Synthesizer node shows strategy selector
- Connector node shows connector type

### Interaction Tests
- Updates label on edit
- Calls save on form submit
- Integrates with canvas store

## BaseNode Tests (34 tests)

### Rendering Tests
- Renders node label
- Renders icon
- Applies color class

### State Tests
- Shows selected styling when selected
- Shows default styling when not selected
- Changes border color when selected

### Handle Tests
- Renders input handle
- Renders output handle
- Handles are visible on hover

### Delete Tests
- Shows delete button
- Calls onDelete when clicked
- Stops propagation on delete click

### Styling Tests
- Applies rounded corners
- Shows shadow
- Supports dark mode theme

## AgentNode Tests (27 tests)

### Rendering Tests
- Renders "Agent Node" label
- Shows Bot icon
- Applies blue color theme
- Shows agent ID when provided

### State Tests
- Updates on data change
- Shows selected state

### Handle Tests
- Has input and output handles

## RouterNode Tests (30 tests)

### Rendering Tests
- Renders "Router Node" label
- Shows GitBranch icon
- Applies orange color theme
- Shows routing conditions count

### Conditions Tests
- Shows "0 routing conditions" when empty
- Shows "1 routing condition" for single
- Shows "N routing conditions" for multiple
- Handles 100 conditions

### Handle Tests
- Has input handle
- Has multiple output handles based on conditions

## Running Tests

```bash
# Run all pipeline tests
npm test -- src/features/pipelines

# Run canvas tests only
npm test -- src/features/pipelines/components/canvas/__tests__

# Run node tests only
npm test -- src/features/pipelines/components/nodes/__tests__

# Run with coverage
npm test -- --coverage src/features/pipelines
```

## Test Setup

```tsx
import { ReactFlowProvider } from "@xyflow/react";

// Wrapper for ReactFlow context
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
);

// Render with wrapper
render(
  <Wrapper>
    <AgentNode id="node-1" data={{ label: "Test" }} selected={false} />
  </Wrapper>
);
```

## Mock Canvas Store

```tsx
vi.mock("@/store/canvas", () => ({
  useCanvasStore: vi.fn(() => ({
    selectedNodeId: null,
    nodes: [],
    updateNode: vi.fn(),
    deleteNode: vi.fn(),
  })),
}));
```

## Example Test

```tsx
it("should show routing conditions count", () => {
  render(
    <Wrapper>
      <RouterNode
        id="router-1"
        data={{
          label: "My Router",
          conditions: ["condition1", "condition2", "condition3"],
        }}
        selected={false}
      />
    </Wrapper>
  );

  expect(screen.getByText("3 routing conditions")).toBeInTheDocument();
});
```
