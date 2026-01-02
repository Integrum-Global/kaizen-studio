import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "../execution";
import type { NodeStatus } from "../../features/execution/types";

describe("Execution Store", () => {
  beforeEach(() => {
    useExecutionStore.getState().reset();
  });

  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const state = useExecutionStore.getState();

      expect(state.executionId).toBeNull();
      expect(state.status).toBe("idle");
      expect(state.logs).toEqual([]);
      expect(state.nodeExecutions).toBeInstanceOf(Map);
      expect(state.nodeExecutions.size).toBe(0);
      expect(state.inputs).toEqual({});
      expect(state.outputs).toEqual({});
      expect(state.startTime).toBeNull();
      expect(state.endTime).toBeNull();
    });
  });

  describe("startExecution", () => {
    it("should start execution with correct state", () => {
      const executionId = "exec-123";
      const inputs = { query: "test query" };

      useExecutionStore.getState().startExecution(executionId, inputs);
      const state = useExecutionStore.getState();

      expect(state.executionId).toBe(executionId);
      expect(state.status).toBe("running");
      expect(state.inputs).toEqual(inputs);
      expect(state.outputs).toEqual({});
      expect(state.logs).toEqual([]);
      expect(state.nodeExecutions.size).toBe(0);
      expect(state.startTime).toBeInstanceOf(Date);
      expect(state.endTime).toBeNull();
    });

    it("should reset previous execution state", () => {
      // Start first execution
      useExecutionStore.getState().startExecution("exec-1", { test: 1 });
      useExecutionStore.getState().addLog({
        timestamp: new Date(),
        level: "info",
        message: "Test log",
      });

      // Start second execution
      useExecutionStore.getState().startExecution("exec-2", { test: 2 });
      const state = useExecutionStore.getState();

      expect(state.executionId).toBe("exec-2");
      expect(state.inputs).toEqual({ test: 2 });
      expect(state.logs).toEqual([]);
    });
  });

  describe("addLog", () => {
    it("should add log with generated id", () => {
      const log = {
        timestamp: new Date(),
        level: "info" as const,
        message: "Test log message",
      };

      useExecutionStore.getState().addLog(log);
      const state = useExecutionStore.getState();

      expect(state.logs.length).toBe(1);
      expect(state.logs[0]).toMatchObject(log);
      expect(state.logs[0]!.id).toBeDefined();
      expect(typeof state.logs[0]!.id).toBe("string");
    });

    it("should add log with optional fields", () => {
      const log = {
        timestamp: new Date(),
        level: "error" as const,
        message: "Error occurred",
        nodeId: "node-1",
        data: { error: "details" },
      };

      useExecutionStore.getState().addLog(log);
      const state = useExecutionStore.getState();

      expect(state.logs[0]).toMatchObject(log);
      expect(state.logs[0]!.nodeId).toBe("node-1");
      expect(state.logs[0]!.data).toEqual({ error: "details" });
    });

    it("should maintain log order", () => {
      useExecutionStore.getState().addLog({
        timestamp: new Date(),
        level: "info",
        message: "First log",
      });
      useExecutionStore.getState().addLog({
        timestamp: new Date(),
        level: "warn",
        message: "Second log",
      });
      useExecutionStore.getState().addLog({
        timestamp: new Date(),
        level: "error",
        message: "Third log",
      });

      const state = useExecutionStore.getState();
      expect(state.logs.length).toBe(3);
      expect(state.logs[0]!.message).toBe("First log");
      expect(state.logs[1]!.message).toBe("Second log");
      expect(state.logs[2]!.message).toBe("Third log");
    });
  });

  describe("updateNodeStatus", () => {
    it("should create new node execution", () => {
      useExecutionStore.getState().updateNodeStatus("node-1", {
        nodeId: "node-1",
        status: "running" as NodeStatus,
        startTime: new Date(),
      });

      const state = useExecutionStore.getState();
      const nodeExec = state.nodeExecutions.get("node-1");

      expect(nodeExec).toBeDefined();
      expect(nodeExec?.nodeId).toBe("node-1");
      expect(nodeExec?.status).toBe("running");
      expect(nodeExec?.startTime).toBeInstanceOf(Date);
    });

    it("should update existing node execution", () => {
      const startTime = new Date();
      useExecutionStore.getState().updateNodeStatus("node-1", {
        nodeId: "node-1",
        status: "running" as NodeStatus,
        startTime,
      });

      const endTime = new Date();
      useExecutionStore.getState().updateNodeStatus("node-1", {
        status: "completed" as NodeStatus,
        endTime,
      });

      const state = useExecutionStore.getState();
      const nodeExec = state.nodeExecutions.get("node-1");

      expect(nodeExec?.status).toBe("completed");
      expect(nodeExec?.startTime).toBe(startTime);
      expect(nodeExec?.endTime).toBe(endTime);
    });

    it("should handle multiple node executions", () => {
      useExecutionStore.getState().updateNodeStatus("node-1", {
        nodeId: "node-1",
        status: "running",
      });
      useExecutionStore.getState().updateNodeStatus("node-2", {
        nodeId: "node-2",
        status: "pending",
      });
      useExecutionStore.getState().updateNodeStatus("node-3", {
        nodeId: "node-3",
        status: "completed",
      });

      const state = useExecutionStore.getState();
      expect(state.nodeExecutions.size).toBe(3);
      expect(state.nodeExecutions.get("node-1")?.status).toBe("running");
      expect(state.nodeExecutions.get("node-2")?.status).toBe("pending");
      expect(state.nodeExecutions.get("node-3")?.status).toBe("completed");
    });
  });

  describe("setOutputs", () => {
    it("should set outputs", () => {
      const outputs = { result: "test result", count: 42 };
      useExecutionStore.getState().setOutputs(outputs);

      const state = useExecutionStore.getState();
      expect(state.outputs).toEqual(outputs);
    });

    it("should replace previous outputs", () => {
      useExecutionStore.getState().setOutputs({ old: "data" });
      useExecutionStore.getState().setOutputs({ new: "data" });

      const state = useExecutionStore.getState();
      expect(state.outputs).toEqual({ new: "data" });
    });
  });

  describe("setStatus", () => {
    it("should update status", () => {
      useExecutionStore.getState().setStatus("running");
      expect(useExecutionStore.getState().status).toBe("running");

      useExecutionStore.getState().setStatus("completed");
      expect(useExecutionStore.getState().status).toBe("completed");
    });
  });

  describe("completeExecution", () => {
    it("should complete execution successfully", () => {
      const outputs = { result: "success" };
      useExecutionStore.getState().startExecution("exec-1", {});
      useExecutionStore.getState().completeExecution(outputs);

      const state = useExecutionStore.getState();
      expect(state.status).toBe("completed");
      expect(state.outputs).toEqual(outputs);
      expect(state.endTime).toBeInstanceOf(Date);
    });

    it("should complete execution with failure", () => {
      useExecutionStore.getState().startExecution("exec-1", {});
      useExecutionStore
        .getState()
        .completeExecution(undefined, "Execution failed");

      const state = useExecutionStore.getState();
      expect(state.status).toBe("failed");
      expect(state.endTime).toBeInstanceOf(Date);
      expect(state.logs.length).toBe(1);
      expect(state.logs[0]!.level).toBe("error");
      expect(state.logs[0]!.message).toBe("Execution failed");
    });

    it("should use existing outputs if none provided", () => {
      const outputs = { existing: "data" };
      useExecutionStore.getState().startExecution("exec-1", {});
      useExecutionStore.getState().setOutputs(outputs);
      useExecutionStore.getState().completeExecution();

      const state = useExecutionStore.getState();
      expect(state.outputs).toEqual(outputs);
    });
  });

  describe("reset", () => {
    it("should reset to initial state", () => {
      // Setup complex state
      useExecutionStore.getState().startExecution("exec-1", { test: "data" });
      useExecutionStore.getState().addLog({
        timestamp: new Date(),
        level: "info",
        message: "Test",
      });
      useExecutionStore.getState().updateNodeStatus("node-1", {
        nodeId: "node-1",
        status: "running",
      });
      useExecutionStore.getState().setOutputs({ result: "data" });

      // Reset
      useExecutionStore.getState().reset();
      const state = useExecutionStore.getState();

      expect(state.executionId).toBeNull();
      expect(state.status).toBe("idle");
      expect(state.logs).toEqual([]);
      expect(state.nodeExecutions.size).toBe(0);
      expect(state.inputs).toEqual({});
      expect(state.outputs).toEqual({});
      expect(state.startTime).toBeNull();
      expect(state.endTime).toBeNull();
    });
  });
});
