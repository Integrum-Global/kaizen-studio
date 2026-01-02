import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { executionApi } from "../api";
import { useExecutionStore } from "../../../store/execution";
import type { PipelineExecution } from "../types";

/**
 * Hook to start a pipeline execution
 */
export function useStartExecution() {
  const queryClient = useQueryClient();
  const { startExecution } = useExecutionStore();

  return useMutation({
    mutationFn: ({
      pipelineId,
      inputs,
    }: {
      pipelineId: string;
      inputs: Record<string, unknown>;
    }) => executionApi.start(pipelineId, inputs),
    onSuccess: (response, variables) => {
      startExecution(response.executionId, variables.inputs);
      queryClient.invalidateQueries({
        queryKey: ["executionHistory", variables.pipelineId],
      });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Execution start error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to stop a running execution
 */
export function useStopExecution() {
  const queryClient = useQueryClient();
  const { setStatus, completeExecution } = useExecutionStore();

  return useMutation({
    mutationFn: (executionId: string) => executionApi.stop(executionId),
    onMutate: () => {
      setStatus("failed");
    },
    onSuccess: (_, executionId) => {
      completeExecution(undefined, "Execution stopped by user");
      queryClient.invalidateQueries({
        queryKey: ["executionStatus", executionId],
      });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Execution stop error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to poll execution status
 */
export function useExecutionStatus(executionId: string | null) {
  const { setStatus, updateNodeStatus, setOutputs, completeExecution } =
    useExecutionStore();

  return useQuery({
    queryKey: ["executionStatus", executionId],
    queryFn: async () => {
      if (!executionId) return null;
      const status = await executionApi.getStatus(executionId);

      // Update store with new status
      setStatus(status.status);

      // Update node executions
      status.nodeExecutions.forEach((nodeExec) => {
        updateNodeStatus(nodeExec.nodeId, nodeExec);
      });

      // Update outputs if available
      if (Object.keys(status.outputs).length > 0) {
        setOutputs(status.outputs);
      }

      // Complete execution if finished
      if (status.status === "completed" || status.status === "failed") {
        completeExecution(status.outputs, status.error);
      }

      return status;
    },
    enabled: !!executionId,
    refetchInterval: (query) => {
      const data = query.state.data as PipelineExecution | null;
      // Poll every 1 second while running, stop when completed or failed
      if (data?.status === "running") {
        return 1000;
      }
      return false;
    },
    retry: 1,
  });
}

/**
 * Hook to get execution history for a pipeline
 */
export function useExecutionHistory(
  pipelineId: string,
  page = 1,
  pageSize = 10
) {
  return useQuery({
    queryKey: ["executionHistory", pipelineId, page, pageSize],
    queryFn: () => executionApi.getHistory(pipelineId, page, pageSize),
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });
}
