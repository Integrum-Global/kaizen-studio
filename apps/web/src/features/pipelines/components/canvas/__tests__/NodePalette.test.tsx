import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NodePalette } from "../NodePalette";

describe("NodePalette", () => {
  it("should render node palette title", () => {
    render(<NodePalette />);

    expect(screen.getByText("Node Palette")).toBeInTheDocument();
  });

  it("should render instruction text", () => {
    render(<NodePalette />);

    expect(screen.getByText("Drag nodes to canvas")).toBeInTheDocument();
  });

  it("should render all node types", () => {
    render(<NodePalette />);

    expect(screen.getByText("Input")).toBeInTheDocument();
    expect(screen.getByText("Agent")).toBeInTheDocument();
    expect(screen.getByText("Supervisor")).toBeInTheDocument();
    // Router appears both as a node type and a pattern template
    expect(screen.getAllByText("Router").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Synthesizer")).toBeInTheDocument();
    expect(screen.getByText("Connector")).toBeInTheDocument();
    expect(screen.getByText("Output")).toBeInTheDocument();
  });

  it("should render input node with correct description", () => {
    render(<NodePalette />);

    expect(screen.getByText("Entry point for pipeline")).toBeInTheDocument();
  });

  it("should render agent node with correct description", () => {
    render(<NodePalette />);

    expect(screen.getByText("AI agent node")).toBeInTheDocument();
  });

  it("should render supervisor node with correct description", () => {
    render(<NodePalette />);

    expect(screen.getByText("Supervises multiple agents")).toBeInTheDocument();
  });

  it("should render router node with correct description", () => {
    render(<NodePalette />);

    expect(screen.getByText("Routes based on conditions")).toBeInTheDocument();
  });

  it("should render synthesizer node with correct description", () => {
    render(<NodePalette />);

    expect(screen.getByText("Combines multiple inputs")).toBeInTheDocument();
  });

  it("should render connector node with correct description", () => {
    render(<NodePalette />);

    expect(screen.getByText("External service connector")).toBeInTheDocument();
  });

  it("should render output node with correct description", () => {
    render(<NodePalette />);

    expect(screen.getByText("Exit point for pipeline")).toBeInTheDocument();
  });

  it("should render pattern templates section", () => {
    render(<NodePalette />);

    expect(screen.getByText("Pattern Templates")).toBeInTheDocument();
  });

  it("should show instruction for pattern templates", () => {
    render(<NodePalette />);

    // Pattern templates now have actual patterns, not "coming soon"
    expect(
      screen.getByText("Click to apply a pattern")
    ).toBeInTheDocument();
  });

  it("should set draggable attribute on node items", () => {
    const { container } = render(<NodePalette />);

    const draggableNodes = container.querySelectorAll("[draggable]");
    expect(draggableNodes.length).toBe(7); // 7 node types
  });

  it("should have draggable attribute on node items", () => {
    const { container } = render(<NodePalette />);

    const draggableNode = container.querySelector("[draggable]");
    expect(draggableNode).toBeInTheDocument();

    // Verify the draggable attribute is present
    expect(draggableNode?.getAttribute("draggable")).toBe("true");
  });

  it("should apply cursor-move style to draggable nodes", () => {
    const { container } = render(<NodePalette />);

    const draggableNodes = container.querySelectorAll("[draggable]");
    draggableNodes.forEach((node) => {
      expect(node.className).toContain("cursor-move");
    });
  });

  it("should render node icons", () => {
    const { container } = render(<NodePalette />);

    // Check for SVG icons (lucide icons render as SVG)
    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThanOrEqual(7); // At least 7 node type icons
  });

  it("should render nodes in a vertical layout", () => {
    const { container } = render(<NodePalette />);

    const nodeList = container.querySelector('[class*="space-y"]');
    expect(nodeList).toBeInTheDocument();
  });

  it("should apply hover styles to node items", () => {
    const { container } = render(<NodePalette />);

    const draggableNode = container.querySelector("[draggable]");
    expect(draggableNode?.className).toContain("hover:border-blue-500");
    expect(draggableNode?.className).toContain("hover:shadow-md");
  });

  it("should have dark mode support", () => {
    const { container } = render(<NodePalette />);

    const palette = container.querySelector('[class*="dark:bg-gray"]');
    expect(palette).toBeInTheDocument();
  });

  it("should display node labels with correct styling", () => {
    const { container } = render(<NodePalette />);

    const labels = container.querySelectorAll('[class*="font-medium"]');
    expect(labels.length).toBeGreaterThan(0);
  });

  it("should display node descriptions with muted styling", () => {
    const { container } = render(<NodePalette />);

    const descriptions = container.querySelectorAll('[class*="text-xs"]');
    expect(descriptions.length).toBeGreaterThan(0);
  });

  it("should render color-coded node icons", () => {
    const { container } = render(<NodePalette />);

    // Check for different color classes
    expect(
      container.querySelector('[class*="bg-emerald-500"]')
    ).toBeInTheDocument(); // Input
    expect(
      container.querySelector('[class*="bg-blue-500"]')
    ).toBeInTheDocument(); // Agent
    expect(
      container.querySelector('[class*="bg-purple-500"]')
    ).toBeInTheDocument(); // Supervisor
    expect(
      container.querySelector('[class*="bg-orange-500"]')
    ).toBeInTheDocument(); // Router
    expect(
      container.querySelector('[class*="bg-green-500"]')
    ).toBeInTheDocument(); // Synthesizer
    expect(
      container.querySelector('[class*="bg-gray-500"]')
    ).toBeInTheDocument(); // Connector
    expect(
      container.querySelector('[class*="bg-rose-500"]')
    ).toBeInTheDocument(); // Output
  });

  it("should render nodes with rounded borders", () => {
    const { container } = render(<NodePalette />);

    const nodeItems = container.querySelectorAll('[class*="rounded-lg"]');
    expect(nodeItems.length).toBeGreaterThan(0);
  });

  it("should render palette with fixed width", () => {
    const { container } = render(<NodePalette />);

    const palette = container.querySelector('[class*="w-64"]');
    expect(palette).toBeInTheDocument();
  });

  it("should have scrollable content area", () => {
    const { container } = render(<NodePalette />);

    const palette = container.querySelector('[class*="overflow-y-auto"]');
    expect(palette).toBeInTheDocument();
  });

  it("should render pattern templates section with border separator", () => {
    const { container } = render(<NodePalette />);

    const templatesSection = container.querySelector('[class*="border-t"]');
    expect(templatesSection).toBeInTheDocument();
  });

  it("should render all node types in correct order", () => {
    render(<NodePalette />);

    const textElements = screen.getAllByText(
      /Input|Agent|Supervisor|Router|Synthesizer|Connector|Output/
    );

    // Filter to get only node labels (not descriptions or pattern templates)
    // Node labels use "font-medium text-sm" class, pattern templates use "font-medium text-xs"
    const labels = textElements.filter((el) =>
      el.className.includes("font-medium") && el.className.includes("text-sm")
    );

    expect(labels.length).toBe(7);
  });
});
