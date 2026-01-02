import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Play, Square, FileText } from "lucide-react";
import { ExecutionStatus } from "./ExecutionStatus";
import { InputEditor } from "./InputEditor";
import { LogViewer } from "./LogViewer";
import { useExecutionStore } from "../../../store/execution";
import {
  useStartExecution,
  useStopExecution,
  useExecutionStatus,
} from "../hooks";
import type { ExecutionLog } from "../types";
import { cn } from "@/lib/utils";

interface TestPanelProps {
  pipelineId: string;
  onLogClick?: (log: ExecutionLog) => void;
  className?: string;
}

export function TestPanel({
  pipelineId,
  onLogClick,
  className,
}: TestPanelProps) {
  const [activeTab, setActiveTab] = useState("inputs");
  const [inputs, setInputs] = useState<Record<string, unknown>>({});

  const {
    executionId,
    status,
    logs,
    nodeExecutions,
    outputs,
    startTime,
    endTime,
  } = useExecutionStore();

  const startMutation = useStartExecution();
  const stopMutation = useStopExecution();

  // Poll execution status when running
  useExecutionStatus(executionId);

  const duration = startTime
    ? (endTime || new Date()).getTime() - startTime.getTime()
    : undefined;

  const completedNodes = Array.from(nodeExecutions.values()).filter(
    (node) => node.status === "completed"
  ).length;
  const totalNodes = nodeExecutions.size;

  const handleStart = () => {
    startMutation.mutate({ pipelineId, inputs });
    setActiveTab("logs");
  };

  const handleStop = () => {
    if (executionId) {
      stopMutation.mutate(executionId);
    }
  };

  // Auto-switch to output tab when execution completes
  useEffect(() => {
    if (status === "completed") {
      setActiveTab("output");
    }
  }, [status]);

  const isRunning = status === "running";
  const canStart =
    status === "idle" || status === "completed" || status === "failed";

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Test Panel</h2>
          <div className="flex items-center gap-2">
            {canStart && (
              <Button
                onClick={handleStart}
                disabled={startMutation.isPending}
                size="sm"
              >
                <Play className="h-4 w-4" />
                {startMutation.isPending ? "Starting..." : "Run"}
              </Button>
            )}
            {isRunning && (
              <Button
                onClick={handleStop}
                disabled={stopMutation.isPending}
                variant="destructive"
                size="sm"
              >
                <Square className="h-4 w-4" />
                {stopMutation.isPending ? "Stopping..." : "Stop"}
              </Button>
            )}
          </div>
        </div>

        <ExecutionStatus
          status={status}
          completedNodes={completedNodes}
          totalNodes={totalNodes}
          duration={duration}
        />
      </div>

      <Separator />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="inputs">
            <FileText className="h-4 w-4 mr-1.5" />
            Inputs
          </TabsTrigger>
          <TabsTrigger value="logs">
            Logs
            {logs.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-primary/20">
                {logs.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="output">
            Output
            {Object.keys(outputs).length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-primary/20">
                {Object.keys(outputs).length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inputs" className="flex-1 px-4 pb-4 overflow-auto">
          <InputEditor value={inputs} onChange={setInputs} />
        </TabsContent>

        <TabsContent value="logs" className="flex-1 px-4 pb-4 overflow-hidden">
          <LogViewer logs={logs} onLogClick={onLogClick} className="h-full" />
        </TabsContent>

        <TabsContent value="output" className="flex-1 px-4 pb-4 overflow-auto">
          {Object.keys(outputs).length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No output yet. Run the pipeline to see results.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm font-medium">Pipeline Outputs</div>
              <pre className="p-4 bg-muted/50 rounded-md border text-xs font-mono overflow-x-auto">
                {JSON.stringify(outputs, null, 2)}
              </pre>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
