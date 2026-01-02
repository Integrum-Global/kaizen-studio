import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, createTestQueryClient } from "@/test/utils";
import { TestPanel } from "../TestPanel";
import { useExecutionStore } from "../../../../store/execution";
import { executionApi } from "../../api";

vi.mock("../../api");

describe("TestPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useExecutionStore.getState().reset();
  });

  it("should render with initial state", () => {
    renderWithProviders(<TestPanel pipelineId="pipeline-1" />, {
      queryClient: createTestQueryClient(),
    });

    expect(screen.getByText("Test Panel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run/i })).toBeInTheDocument();
    expect(screen.getByText("Idle")).toBeInTheDocument();
  });

  it("should render tabs correctly", () => {
    renderWithProviders(<TestPanel pipelineId="pipeline-1" />, {
      queryClient: createTestQueryClient(),
    });

    expect(screen.getByRole("tab", { name: /inputs/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /logs/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /output/i })).toBeInTheDocument();
  });

  it("should show inputs tab by default", () => {
    renderWithProviders(<TestPanel pipelineId="pipeline-1" />, {
      queryClient: createTestQueryClient(),
    });

    expect(screen.getByText("Pipeline Inputs")).toBeInTheDocument();
    expect(screen.getByPlaceholderText('{"key": "value"}')).toBeInTheDocument();
  });

  it("should switch between tabs", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestPanel pipelineId="pipeline-1" />, {
      queryClient: createTestQueryClient(),
    });

    // Click Logs tab
    await user.click(screen.getByRole("tab", { name: /logs/i }));
    expect(screen.getByText("No logs yet")).toBeInTheDocument();

    // Click Output tab
    await user.click(screen.getByRole("tab", { name: /output/i }));
    expect(
      screen.getByText("No output yet. Run the pipeline to see results.")
    ).toBeInTheDocument();
  });

  it("should start execution when Run button clicked", async () => {
    const user = userEvent.setup();
    vi.mocked(executionApi.start).mockResolvedValue({
      executionId: "exec-123",
    });

    renderWithProviders(<TestPanel pipelineId="pipeline-1" />, {
      queryClient: createTestQueryClient(),
    });

    const runButton = screen.getByRole("button", { name: /run/i });
    await user.click(runButton);

    await waitFor(() => {
      expect(executionApi.start).toHaveBeenCalledWith("pipeline-1", {});
    });

    // Should switch to logs tab
    expect(screen.getByText("No logs yet")).toBeInTheDocument();
  });

  it("should show stop button when running", async () => {
    const user = userEvent.setup();
    vi.mocked(executionApi.start).mockResolvedValue({
      executionId: "exec-123",
    });

    renderWithProviders(<TestPanel pipelineId="pipeline-1" />, {
      queryClient: createTestQueryClient(),
    });

    await user.click(screen.getByRole("button", { name: /run/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: /run/i })
    ).not.toBeInTheDocument();
  });

  it("should stop execution when Stop button clicked", async () => {
    const user = userEvent.setup();
    vi.mocked(executionApi.start).mockResolvedValue({
      executionId: "exec-123",
    });
    vi.mocked(executionApi.stop).mockResolvedValue(undefined);

    renderWithProviders(<TestPanel pipelineId="pipeline-1" />, {
      queryClient: createTestQueryClient(),
    });

    // Start execution
    await user.click(screen.getByRole("button", { name: /run/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
    });

    // Stop execution
    await user.click(screen.getByRole("button", { name: /stop/i }));

    await waitFor(() => {
      expect(executionApi.stop).toHaveBeenCalledWith("exec-123");
    });
  });

  it("should display execution status correctly", () => {
    useExecutionStore.getState().startExecution("exec-123", {});

    renderWithProviders(<TestPanel pipelineId="pipeline-1" />, {
      queryClient: createTestQueryClient(),
    });

    expect(screen.getByText("Running")).toBeInTheDocument();
  });

  it("should display logs when available", () => {
    useExecutionStore.getState().startExecution("exec-123", {});
    useExecutionStore.getState().addLog({
      timestamp: new Date(),
      level: "info",
      message: "Test log message",
    });

    renderWithProviders(<TestPanel pipelineId="pipeline-1" />, {
      queryClient: createTestQueryClient(),
    });

    // Badge shows log count
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("should display outputs when available", () => {
    const outputs = { result: "success", count: 42 };
    useExecutionStore.getState().startExecution("exec-123", {});
    useExecutionStore.getState().setOutputs(outputs);

    renderWithProviders(<TestPanel pipelineId="pipeline-1" />, {
      queryClient: createTestQueryClient(),
    });

    // Badge shows output count
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("should auto-switch to output tab when execution completes", async () => {
    useExecutionStore.getState().startExecution("exec-123", {});

    renderWithProviders(<TestPanel pipelineId="pipeline-1" />, {
      queryClient: createTestQueryClient(),
    });

    // Complete execution
    useExecutionStore
      .getState()
      .completeExecution({ result: "success" }, undefined);

    await waitFor(() => {
      expect(screen.getByText("Pipeline Outputs")).toBeInTheDocument();
    });
  });

  it("should call onLogClick when log is clicked", async () => {
    const user = userEvent.setup();
    const onLogClick = vi.fn();

    useExecutionStore.getState().startExecution("exec-123", {});
    useExecutionStore.getState().addLog({
      timestamp: new Date(),
      level: "info",
      message: "Click me",
    });

    renderWithProviders(
      <TestPanel pipelineId="pipeline-1" onLogClick={onLogClick} />,
      {
        queryClient: createTestQueryClient(),
      }
    );

    // Switch to logs tab
    await user.click(screen.getByRole("tab", { name: /logs/i }));

    // Click the log
    await user.click(screen.getByText("Click me"));

    expect(onLogClick).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Click me",
      })
    );
  });

  it("should show node execution progress", () => {
    useExecutionStore.getState().startExecution("exec-123", {});
    useExecutionStore.getState().updateNodeStatus("node-1", {
      nodeId: "node-1",
      status: "completed",
    });
    useExecutionStore.getState().updateNodeStatus("node-2", {
      nodeId: "node-2",
      status: "running",
    });
    useExecutionStore.getState().updateNodeStatus("node-3", {
      nodeId: "node-3",
      status: "pending",
    });

    renderWithProviders(<TestPanel pipelineId="pipeline-1" />, {
      queryClient: createTestQueryClient(),
    });

    expect(screen.getByText("1")).toBeInTheDocument(); // completed nodes
    expect(screen.getByText("3")).toBeInTheDocument(); // total nodes
    expect(screen.getByText("nodes")).toBeInTheDocument();
  });

  it("should format duration correctly", () => {
    const startTime = new Date("2024-01-01T12:00:00Z");
    const endTime = new Date("2024-01-01T12:02:30Z"); // 2 minutes 30 seconds

    useExecutionStore.setState({
      executionId: "exec-123",
      status: "completed",
      startTime,
      endTime,
      logs: [],
      nodeExecutions: new Map(),
      inputs: {},
      outputs: {},
    });

    renderWithProviders(<TestPanel pipelineId="pipeline-1" />, {
      queryClient: createTestQueryClient(),
    });

    expect(screen.getByText("2:30")).toBeInTheDocument();
  });
});
