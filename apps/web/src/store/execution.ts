import { create } from "zustand";
import type {
  ExecutionStatus,
  NodeStatus,
  ExecutionLog,
  NodeExecution,
} from "../features/execution/types";

interface ExecutionState {
  executionId: string | null;
  status: ExecutionStatus;
  logs: ExecutionLog[];
  nodeExecutions: Map<string, NodeExecution>;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  startTime: Date | null;
  endTime: Date | null;

  // Actions
  startExecution: (
    executionId: string,
    inputs: Record<string, unknown>
  ) => void;
  addLog: (log: Omit<ExecutionLog, "id">) => void;
  updateNodeStatus: (nodeId: string, update: Partial<NodeExecution>) => void;
  setOutputs: (outputs: Record<string, unknown>) => void;
  setStatus: (status: ExecutionStatus) => void;
  completeExecution: (
    outputs?: Record<string, unknown>,
    error?: string
  ) => void;
  reset: () => void;
}

const initialState = {
  executionId: null,
  status: "idle" as ExecutionStatus,
  logs: [],
  nodeExecutions: new Map<string, NodeExecution>(),
  inputs: {},
  outputs: {},
  startTime: null,
  endTime: null,
};

export const useExecutionStore = create<ExecutionState>()((set, get) => ({
  ...initialState,

  startExecution: (executionId: string, inputs: Record<string, unknown>) => {
    set({
      executionId,
      status: "running",
      inputs,
      outputs: {},
      logs: [],
      nodeExecutions: new Map(),
      startTime: new Date(),
      endTime: null,
    });
  },

  addLog: (log: Omit<ExecutionLog, "id">) => {
    const newLog: ExecutionLog = {
      ...log,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    set((state) => ({
      logs: [...state.logs, newLog],
    }));
  },

  updateNodeStatus: (nodeId: string, update: Partial<NodeExecution>) => {
    set((state) => {
      const nodeExecutions = new Map(state.nodeExecutions);
      const existing = nodeExecutions.get(nodeId) || {
        nodeId,
        status: "pending" as NodeStatus,
      };

      nodeExecutions.set(nodeId, {
        ...existing,
        ...update,
      });

      return { nodeExecutions };
    });
  },

  setOutputs: (outputs: Record<string, unknown>) => {
    set({ outputs });
  },

  setStatus: (status: ExecutionStatus) => {
    set({ status });
  },

  completeExecution: (outputs?: Record<string, unknown>, error?: string) => {
    set({
      status: error ? "failed" : "completed",
      outputs: outputs || get().outputs,
      endTime: new Date(),
    });

    if (error) {
      get().addLog({
        timestamp: new Date(),
        level: "error",
        message: error,
      });
    }
  },

  reset: () => {
    set(initialState);
  },
}));

export default useExecutionStore;
