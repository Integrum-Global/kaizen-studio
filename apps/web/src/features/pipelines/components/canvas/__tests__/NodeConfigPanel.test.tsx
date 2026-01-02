import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import { NodeConfigPanel } from "../NodeConfigPanel";
import { useCanvasStore } from "@/store/canvas";
import type { Node } from "@xyflow/react";

// Mock the canvas store
vi.mock("@/store/canvas", () => ({
  useCanvasStore: vi.fn(),
}));

// Mock the agents hook
vi.mock("@/features/agents/hooks", () => ({
  useAgents: vi.fn(() => ({
    data: { items: [] },
    isPending: false,
  })),
}));

// Mock the auth store
vi.mock("@/store/auth", () => ({
  useAuthStore: vi.fn(() => ({
    user: { organization_id: "org-123" },
  })),
}));

describe("NodeConfigPanel", () => {
  const mockUpdateNode = vi.fn();
  const mockClearSelection = vi.fn();

  const createMockNode = (overrides?: Partial<Node>): Node => ({
    id: "node-1",
    type: "agent",
    position: { x: 100, y: 200 },
    data: {
      label: "Test Node",
      agentId: "agent-123",
      config: {},
    },
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [],
      edges: [],
      selectedNodes: [],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });
  });

  it("should render empty state when no node is selected", () => {
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [],
      edges: [],
      selectedNodes: [],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    renderWithProviders(<NodeConfigPanel />);

    expect(screen.getByText("No Node Selected")).toBeInTheDocument();
  });

  it("should render configuration panel when node is selected", () => {
    const node = createMockNode();
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [node],
      edges: [],
      selectedNodes: ["node-1"],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    renderWithProviders(<NodeConfigPanel />);

    expect(screen.getByText("Node Configuration")).toBeInTheDocument();
  });

  it("should display node type", () => {
    const node = createMockNode({ type: "supervisor" });
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [node],
      edges: [],
      selectedNodes: ["node-1"],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    renderWithProviders(<NodeConfigPanel />);

    expect(screen.getByText("supervisor Node")).toBeInTheDocument();
  });

  it("should display node ID", () => {
    const node = createMockNode({ id: "node-123" });
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [node],
      edges: [],
      selectedNodes: ["node-123"],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    renderWithProviders(<NodeConfigPanel />);

    expect(screen.getByText("node-123")).toBeInTheDocument();
  });

  it("should display node label in input field", () => {
    // Use router type to avoid the systemPrompt textarea
    const node = createMockNode({ type: "router" });
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [node],
      edges: [],
      selectedNodes: ["node-1"],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    renderWithProviders(<NodeConfigPanel />);

    const labelInput = document.getElementById("label") as HTMLInputElement;
    expect(labelInput.value).toBe("Test Node");
  });

  it("should display node position", () => {
    const node = createMockNode({
      position: { x: 150, y: 250 },
    });
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [node],
      edges: [],
      selectedNodes: ["node-1"],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    renderWithProviders(<NodeConfigPanel />);

    expect(screen.getByText(/x: 150, y: 250/)).toBeInTheDocument();
  });

  it("should allow editing node label", async () => {
    const user = userEvent.setup();
    // Use router type to avoid the systemPrompt textarea
    const node = createMockNode({ type: "router" });
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [node],
      edges: [],
      selectedNodes: ["node-1"],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    renderWithProviders(<NodeConfigPanel />);

    const labelInput = document.getElementById("label") as HTMLInputElement;
    await user.clear(labelInput);
    await user.type(labelInput, "Updated Node");

    expect(labelInput.value).toBe("Updated Node");
  });

  it("should call updateNode when Save Changes is clicked", async () => {
    const user = userEvent.setup();
    // Use router type to avoid the systemPrompt textarea
    const node = createMockNode({ type: "router" });
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [node],
      edges: [],
      selectedNodes: ["node-1"],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    renderWithProviders(<NodeConfigPanel />);

    const labelInput = document.getElementById("label") as HTMLInputElement;
    await user.clear(labelInput);
    await user.type(labelInput, "New Label");

    const saveButton = screen.getByText("Save Changes");
    await user.click(saveButton);

    expect(mockUpdateNode).toHaveBeenCalledWith("node-1", expect.objectContaining({
      label: "New Label",
    }));
  });

  it("should call clearSelection when close button is clicked", async () => {
    const user = userEvent.setup();
    const node = createMockNode();
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [node],
      edges: [],
      selectedNodes: ["node-1"],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    renderWithProviders(<NodeConfigPanel />);

    const closeButton = screen.getByRole("button", { name: "" });
    await user.click(closeButton);

    expect(mockClearSelection).toHaveBeenCalled();
  });

  it("should show agent-specific configuration for agent nodes", () => {
    const node = createMockNode({ type: "agent" });
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [node],
      edges: [],
      selectedNodes: ["node-1"],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    renderWithProviders(<NodeConfigPanel />);

    expect(screen.getByText("Select Agent")).toBeInTheDocument();
  });

  it("should show router-specific configuration for router nodes", () => {
    const node = createMockNode({ type: "router" });
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [node],
      edges: [],
      selectedNodes: ["node-1"],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    renderWithProviders(<NodeConfigPanel />);

    expect(screen.getByText("Routing Conditions")).toBeInTheDocument();
  });

  it("should show synthesizer-specific configuration for synthesizer nodes", () => {
    const node = createMockNode({ type: "synthesizer" });
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [node],
      edges: [],
      selectedNodes: ["node-1"],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    renderWithProviders(<NodeConfigPanel />);

    expect(screen.getByText("Aggregation Type")).toBeInTheDocument();
  });

  it("should show connector-specific configuration for connector nodes", () => {
    const node = createMockNode({ type: "connector" });
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [node],
      edges: [],
      selectedNodes: ["node-1"],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    renderWithProviders(<NodeConfigPanel />);

    expect(screen.getByText("Connector Type")).toBeInTheDocument();
  });

  it("should show agent select dropdown for agent nodes", () => {
    const node = createMockNode({
      type: "agent",
      data: { label: "Test Node", agentId: "" },
    });
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [node],
      edges: [],
      selectedNodes: ["node-1"],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    renderWithProviders(<NodeConfigPanel />);

    // Agent nodes show a select dropdown for agents
    const agentSelect = screen.getByRole("combobox");
    expect(agentSelect).toBeInTheDocument();
    expect(screen.getByText("Select an agent...")).toBeInTheDocument();
  });

  it("should render with fixed width", () => {
    const node = createMockNode();
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [node],
      edges: [],
      selectedNodes: ["node-1"],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    const { container } = renderWithProviders(<NodeConfigPanel />);

    const panel = container.querySelector('[class*="w-80"]');
    expect(panel).toBeInTheDocument();
  });

  it("should have scrollable content area", () => {
    const node = createMockNode();
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [node],
      edges: [],
      selectedNodes: ["node-1"],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    const { container } = renderWithProviders(<NodeConfigPanel />);

    const panel = container.querySelector('[class*="overflow-y-auto"]');
    expect(panel).toBeInTheDocument();
  });

  it("should have dark mode support", () => {
    const node = createMockNode();
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [node],
      edges: [],
      selectedNodes: ["node-1"],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    const { container } = renderWithProviders(<NodeConfigPanel />);

    const panel = container.querySelector('[class*="dark:bg-gray"]');
    expect(panel).toBeInTheDocument();
  });

  it("should not render configuration when multiple nodes are selected", () => {
    const node1 = createMockNode({ id: "node-1" });
    const node2 = createMockNode({ id: "node-2" });
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [node1, node2],
      edges: [],
      selectedNodes: ["node-1", "node-2"],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    renderWithProviders(<NodeConfigPanel />);

    expect(screen.getByText("No Node Selected")).toBeInTheDocument();
  });

  it("should show aggregation type options for synthesizer nodes", () => {
    const node = createMockNode({ type: "synthesizer" });
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [node],
      edges: [],
      selectedNodes: ["node-1"],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    renderWithProviders(<NodeConfigPanel />);

    expect(screen.getByText("Concatenate")).toBeInTheDocument();
    expect(screen.getByText("Merge (JSON)")).toBeInTheDocument();
    expect(screen.getByText("Average (Numeric)")).toBeInTheDocument();
  });

  it("should show connector type options for connector nodes", () => {
    const node = createMockNode({ type: "connector" });
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [node],
      edges: [],
      selectedNodes: ["node-1"],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    renderWithProviders(<NodeConfigPanel />);

    expect(screen.getByText("REST API")).toBeInTheDocument();
    expect(screen.getByText("Database")).toBeInTheDocument();
    expect(screen.getByText("Webhook")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("should render close button with X icon", () => {
    const node = createMockNode();
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [node],
      edges: [],
      selectedNodes: ["node-1"],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    const { container } = renderWithProviders(<NodeConfigPanel />);

    const closeIcon = container.querySelector("svg");
    expect(closeIcon).toBeInTheDocument();
  });

  it("should update state when node label is changed", async () => {
    const user = userEvent.setup();
    // Use router type to avoid the systemPrompt textarea
    const node = createMockNode({ type: "router" });
    vi.mocked(useCanvasStore).mockReturnValue({
      nodes: [node],
      edges: [],
      selectedNodes: ["node-1"],
      selectedEdges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
      updateNode: mockUpdateNode,
      removeNode: vi.fn(),
      addEdge: vi.fn(),
      removeEdge: vi.fn(),
      selectNode: vi.fn(),
      clearSelection: mockClearSelection,
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
    });

    renderWithProviders(<NodeConfigPanel />);

    const labelInput = document.getElementById("label") as HTMLInputElement;
    await user.clear(labelInput);
    await user.type(labelInput, "Modified Label");

    await waitFor(() => {
      expect(labelInput.value).toBe("Modified Label");
    });
  });
});
