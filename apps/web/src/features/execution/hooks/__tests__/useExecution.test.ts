import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useStartExecution,
  useStopExecution,
  useExecutionStatus,
  useExecutionHistory,
} from "../useExecution";
import { useExecutionStore } from "../../../../store/execution";
import { executionApi } from "../../api";
import type { PipelineExecution, ExecutionHistoryResponse } from "../../types";

vi.mock("../../api");

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe("Execution Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useExecutionStore.getState().reset();
  });

  describe("useStartExecution", () => {
    it("should start execution successfully", async () => {
      const mockResponse = { executionId: "exec-123" };
      vi.mocked(executionApi.start).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useStartExecution(), {
        wrapper: createWrapper(),
      });

      const inputs = { query: "test" };
      result.current.mutate({ pipelineId: "pipeline-1", inputs });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(executionApi.start).toHaveBeenCalledWith("pipeline-1", inputs);
      expect(useExecutionStore.getState().executionId).toBe("exec-123");
      expect(useExecutionStore.getState().status).toBe("running");
      expect(useExecutionStore.getState().inputs).toEqual(inputs);
    });

    it("should handle start execution error", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.mocked(executionApi.start).mockRejectedValue(new Error("Failed"));

      const { result } = renderHook(() => useStartExecution(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ pipelineId: "pipeline-1", inputs: {} });

      await waitFor(() => expect(result.current.isError).toBe(true));

      consoleErrorSpy.mockRestore();
    });
  });

  describe("useStopExecution", () => {
    it("should stop execution successfully", async () => {
      vi.mocked(executionApi.stop).mockResolvedValue(undefined);

      useExecutionStore.getState().startExecution("exec-123", {});

      const { result } = renderHook(() => useStopExecution(), {
        wrapper: createWrapper(),
      });

      result.current.mutate("exec-123");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(executionApi.stop).toHaveBeenCalledWith("exec-123");
      expect(useExecutionStore.getState().status).toBe("failed");
    });

    it("should handle stop execution error", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.mocked(executionApi.stop).mockRejectedValue(new Error("Failed"));

      const { result } = renderHook(() => useStopExecution(), {
        wrapper: createWrapper(),
      });

      result.current.mutate("exec-123");

      await waitFor(() => expect(result.current.isError).toBe(true));

      consoleErrorSpy.mockRestore();
    });
  });

  describe("useExecutionStatus", () => {
    it("should fetch and update execution status", async () => {
      const mockExecution: PipelineExecution = {
        id: "exec-123",
        pipelineId: "pipeline-1",
        status: "running",
        inputs: { query: "test" },
        outputs: {},
        logs: [],
        nodeExecutions: [
          {
            nodeId: "node-1",
            status: "running",
            startTime: new Date(),
          },
        ],
        startTime: new Date(),
      };

      vi.mocked(executionApi.getStatus).mockResolvedValue(mockExecution);

      const { result } = renderHook(() => useExecutionStatus("exec-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(executionApi.getStatus).toHaveBeenCalledWith("exec-123");
      expect(useExecutionStore.getState().status).toBe("running");
      expect(useExecutionStore.getState().nodeExecutions.size).toBe(1);
    });

    it("should complete execution when status is completed", async () => {
      const outputs = { result: "success" };
      const mockExecution: PipelineExecution = {
        id: "exec-123",
        pipelineId: "pipeline-1",
        status: "completed",
        inputs: {},
        outputs,
        logs: [],
        nodeExecutions: [],
        startTime: new Date(),
        endTime: new Date(),
      };

      vi.mocked(executionApi.getStatus).mockResolvedValue(mockExecution);

      const { result } = renderHook(() => useExecutionStatus("exec-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(useExecutionStore.getState().status).toBe("completed");
      expect(useExecutionStore.getState().outputs).toEqual(outputs);
      expect(useExecutionStore.getState().endTime).toBeInstanceOf(Date);
    });

    it("should not fetch when executionId is null", () => {
      const { result } = renderHook(() => useExecutionStatus(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(executionApi.getStatus).not.toHaveBeenCalled();
    });
  });

  describe("useExecutionHistory", () => {
    it("should fetch execution history", async () => {
      const mockHistory: ExecutionHistoryResponse = {
        executions: [
          {
            id: "exec-1",
            pipelineId: "pipeline-1",
            status: "completed",
            inputs: {},
            outputs: {},
            logs: [],
            nodeExecutions: [],
            startTime: new Date(),
            endTime: new Date(),
          },
          {
            id: "exec-2",
            pipelineId: "pipeline-1",
            status: "failed",
            inputs: {},
            outputs: {},
            logs: [],
            nodeExecutions: [],
            startTime: new Date(),
            endTime: new Date(),
            error: "Execution failed",
          },
        ],
        total: 2,
        page: 1,
        page_size: 10,
      };

      vi.mocked(executionApi.getHistory).mockResolvedValue(mockHistory);

      const { result } = renderHook(
        () => useExecutionHistory("pipeline-1", 1, 10),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(executionApi.getHistory).toHaveBeenCalledWith("pipeline-1", 1, 10);
      expect(result.current.data?.executions).toHaveLength(2);
      expect(result.current.data?.total).toBe(2);
    });

    it("should handle pagination", async () => {
      const mockHistory: ExecutionHistoryResponse = {
        executions: [],
        total: 50,
        page: 2,
        page_size: 20,
      };

      vi.mocked(executionApi.getHistory).mockResolvedValue(mockHistory);

      const { result } = renderHook(
        () => useExecutionHistory("pipeline-1", 2, 20),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(executionApi.getHistory).toHaveBeenCalledWith("pipeline-1", 2, 20);
      expect(result.current.data?.page).toBe(2);
      expect(result.current.data?.page_size).toBe(20);
    });
  });
});
