import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
} from "@/components/ui";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useTestConnector } from "../hooks";
import type { Connector, TestResultResponse } from "../types";

interface ConnectorTestButtonProps {
  connector: Connector;
  onClose: () => void;
}

export function ConnectorTestButton({
  connector,
  onClose,
}: ConnectorTestButtonProps) {
  const [testResult, setTestResult] = useState<TestResultResponse | null>(null);
  const testConnector = useTestConnector();

  const handleTest = async () => {
    setTestResult(null);
    try {
      const result = await testConnector.mutateAsync(connector.id);
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        message:
          error?.response?.data?.detail || error.message || "Test failed",
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Test Connection</DialogTitle>
          <DialogDescription>
            Test the connection to {connector.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connector Info */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">{connector.name}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {connector.connector_type} connector
              </p>
            </div>
            <Badge
              variant={
                connector.status === "connected"
                  ? "default"
                  : connector.status === "error"
                    ? "destructive"
                    : "secondary"
              }
            >
              {connector.status}
            </Badge>
          </div>

          {/* Test Button */}
          {!testResult && !testConnector.isPending && (
            <Button
              onClick={handleTest}
              className="w-full"
              disabled={testConnector.isPending}
            >
              Run Connection Test
            </Button>
          )}

          {/* Testing State */}
          {testConnector.isPending && (
            <div className="flex items-center justify-center gap-2 p-6 border rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Testing connection...
              </p>
            </div>
          )}

          {/* Test Result */}
          {testResult && (
            <div
              className={`p-4 border rounded-lg space-y-3 ${
                testResult.success
                  ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
              }`}
            >
              <div className="flex items-start gap-3">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <p
                    className={`font-medium ${
                      testResult.success
                        ? "text-green-900 dark:text-green-100"
                        : "text-red-900 dark:text-red-100"
                    }`}
                  >
                    {testResult.success
                      ? "Connection Successful"
                      : "Connection Failed"}
                  </p>
                  <p
                    className={`text-sm ${
                      testResult.success
                        ? "text-green-700 dark:text-green-300"
                        : "text-red-700 dark:text-red-300"
                    }`}
                  >
                    {testResult.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Tested at {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            {testResult && (
              <Button variant="outline" onClick={() => setTestResult(null)}>
                Test Again
              </Button>
            )}
            <Button
              variant={testResult ? "default" : "outline"}
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
