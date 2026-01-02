/**
 * PipelineTrustValidator Component
 *
 * Trust validation before execution with progress tracking
 * Features:
 * - Validates all agent trust chains
 * - Shows validation progress
 * - Displays validation errors/warnings
 * - Blocks execution if trust invalid (configurable)
 * - "Establish Trust" suggestions for untrusted agents
 */

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  PlayCircle,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePipelineTrustValidation } from "../../hooks";
import { cn } from "@/lib/utils";

interface PipelineTrustValidatorProps {
  pipelineId: string;
  agentIds: string[];
  requiredCapabilities?: Record<string, string[]>;
  blockExecutionOnFailure?: boolean;
  onExecute?: () => void;
  onEstablishTrust?: (agentId: string) => void;
  className?: string;
}

export function PipelineTrustValidator({
  pipelineId,
  agentIds,
  requiredCapabilities = {},
  blockExecutionOnFailure = true,
  onExecute,
  onEstablishTrust,
  className,
}: PipelineTrustValidatorProps) {
  const [isValidating, setIsValidating] = useState(false);
  const {
    data: validation,
    isPending,
    error,
    refetch,
  } = usePipelineTrustValidation(pipelineId, agentIds, requiredCapabilities);

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      await refetch();
    } finally {
      setIsValidating(false);
    }
  };

  const handleExecute = () => {
    if (!validation?.isReady && blockExecutionOnFailure) {
      return;
    }
    onExecute?.();
  };

  const isLoading = isPending || isValidating;
  const canExecute = validation?.isReady || !blockExecutionOnFailure;

  return (
    <Card className={cn("border-l-4", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle className="text-base font-medium">
              Trust Validation
            </CardTitle>
          </div>
          {validation && (
            <Badge
              variant={validation.isReady ? "default" : "destructive"}
              className={cn(
                validation.isReady && "bg-green-600 hover:bg-green-700"
              )}
            >
              {validation.isReady ? "Valid" : "Invalid"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Validating trust chains...</p>
                  <p className="text-xs text-muted-foreground">
                    Checking {agentIds.length} agent(s)
                  </p>
                </div>
              </div>
              <Progress value={33} className="h-2" />
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">Validation Failed</p>
                <p className="mt-1 text-sm">{(error as Error).message}</p>
              </AlertDescription>
            </Alert>
          )}

          {/* Success State */}
          {validation && !isLoading && validation.isReady && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <p className="font-medium text-green-800">All Agents Trusted</p>
                <p className="mt-1 text-sm text-green-700">
                  {validation.trustedAgents} agent(s) have valid trust and
                  required capabilities. Pipeline is ready for execution.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Errors */}
          {validation && !isLoading && !validation.isReady && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">Trust Validation Failed</p>
                  <p className="mt-1 text-sm">
                    {validation.untrustedAgents} agent(s) do not have valid
                    trust. Establish trust before executing the pipeline.
                  </p>
                </AlertDescription>
              </Alert>

              {/* Failed Agents List */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Agents Requiring Attention</p>
                {validation.agentStatuses
                  .filter((s) => !s.isValid)
                  .map((status) => (
                    <Card
                      key={status.agentId}
                      className="border-l-4 border-l-red-500"
                    >
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">
                                {status.agentName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {status.agentId}
                              </p>
                            </div>
                            <Badge variant="destructive" className="ml-2">
                              {status.trustStatus}
                            </Badge>
                          </div>

                          {/* Missing Capabilities */}
                          {status.missingCapabilities.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-red-600">
                                Missing Capabilities:
                              </p>
                              <ul className="ml-4 list-disc space-y-1">
                                {status.missingCapabilities.map((cap) => (
                                  <li
                                    key={cap}
                                    className="text-xs text-muted-foreground"
                                  >
                                    {cap}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Constraint Violations */}
                          {status.constraintViolations.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-red-600">
                                Constraint Violations:
                              </p>
                              <ul className="ml-4 list-disc space-y-1">
                                {status.constraintViolations.map(
                                  (violation, idx) => (
                                    <li
                                      key={idx}
                                      className="text-xs text-muted-foreground"
                                    >
                                      {violation}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                          {/* Suggestions */}
                          <div className="rounded-md bg-blue-50 p-3">
                            <p className="text-xs font-medium text-blue-800">
                              Suggested Action:
                            </p>
                            <p className="mt-1 text-xs text-blue-700">
                              Establish trust for this agent with the required
                              capabilities before proceeding.
                            </p>
                          </div>

                          {/* Action Button */}
                          {onEstablishTrust && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => onEstablishTrust(status.agentId)}
                              className="w-full"
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Establish Trust
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Validation Progress Summary */}
          {validation && !isLoading && (
            <div className="space-y-4">
              <Separator />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {validation.totalAgents}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Agents
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">
                    {validation.trustedAgents}
                  </div>
                  <div className="text-xs text-muted-foreground">Trusted</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-red-600">
                    {validation.untrustedAgents}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Untrusted
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Progress
                  value={
                    (validation.trustedAgents / validation.totalAgents) * 100
                  }
                  className="h-2"
                />
                <p className="text-xs text-center text-muted-foreground">
                  {Math.round(
                    (validation.trustedAgents / validation.totalAgents) * 100
                  )}
                  % Validated
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleValidate}
              disabled={isLoading}
              className="flex-1"
            >
              {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isValidating && <Shield className="mr-2 h-4 w-4" />}
              Re-validate
            </Button>

            {onExecute && (
              <Button
                variant={canExecute ? "default" : "destructive"}
                onClick={handleExecute}
                disabled={isLoading || (!canExecute && blockExecutionOnFailure)}
                className="flex-1"
              >
                {!canExecute && blockExecutionOnFailure && (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                {canExecute && <PlayCircle className="mr-2 h-4 w-4" />}
                Execute Pipeline
              </Button>
            )}
          </div>

          {/* Execution Blocked Warning */}
          {!canExecute && blockExecutionOnFailure && onExecute && (
            <Alert variant="destructive">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                <p className="text-sm">
                  Pipeline execution is blocked until all agents have valid
                  trust. Resolve the issues above to proceed.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
