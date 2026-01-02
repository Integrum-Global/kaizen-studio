import apiClient from "../../../api";
import type {
  StartExecutionRequest,
  StartExecutionResponse,
  ExecutionStatusResponse,
  ExecutionHistoryResponse,
} from "../types";

export const executionApi = {
  /**
   * Start a new pipeline execution
   */
  start: async (
    pipelineId: string,
    inputs: Record<string, unknown>
  ): Promise<StartExecutionResponse> => {
    const data: StartExecutionRequest = { pipelineId, inputs };
    const response = await apiClient.post<StartExecutionResponse>(
      "/api/v1/executions/start",
      data
    );
    return response.data;
  },

  /**
   * Get execution status by ID
   */
  getStatus: async (executionId: string): Promise<ExecutionStatusResponse> => {
    const response = await apiClient.get<ExecutionStatusResponse>(
      `/api/v1/executions/${executionId}`
    );
    return response.data;
  },

  /**
   * Stop a running execution
   */
  stop: async (executionId: string): Promise<void> => {
    await apiClient.post(`/api/v1/executions/${executionId}/stop`);
  },

  /**
   * Get execution history for a pipeline
   */
  getHistory: async (
    pipelineId: string,
    page = 1,
    pageSize = 10
  ): Promise<ExecutionHistoryResponse> => {
    const response = await apiClient.get<ExecutionHistoryResponse>(
      `/api/v1/executions/history/${pipelineId}`,
      {
        params: { page, page_size: pageSize },
      }
    );
    return response.data;
  },
};

export default executionApi;
