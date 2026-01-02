/**
 * PipelineTrustValidation Component
 *
 * Pre-execution validation panel for pipelines
 * Validates all agents have valid trust before execution
 * Shows which capabilities are needed vs available
 */

import { AlertTriangle, PlayCircle, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrustValidationResult } from "./TrustValidationResult";
import { PipelineTrustSummary } from "./PipelineTrustSummary";
import { usePipelineTrustValidation } from "../../hooks";
import { cn } from "@/lib/utils";

interface PipelineTrustValidationProps {
  pipelineId: string;
  agentIds: string[];
  requiredCapabilities?: Record<string, string[]>;
  onExecute?: () => void;
  onViewTrustChain?: (agentId: string) => void;
  onEstablishTrust?: (agentId: string) => void;
  className?: string;
}

export function PipelineTrustValidation({
  pipelineId,
  agentIds,
  requiredCapabilities = {},
  onExecute,
  onViewTrustChain,
  onEstablishTrust,
  className,
}: PipelineTrustValidationProps) {
  const {
    data: validation,
    isPending,
    error,
  } = usePipelineTrustValidation(pipelineId, agentIds, requiredCapabilities);

  if (isPending) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Trust Validation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Trust Validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to validate trust: {(error as Error).message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!validation) {
    return null;
  }

  const hasFailures = !validation.isReady;
  const failedAgents = validation.agentStatuses.filter((s) => !s.isValid);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary Card */}
      <PipelineTrustSummary status={validation} />

      {/* Validation Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">
              Agent Validation Results
            </CardTitle>
            {hasFailures && (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Show failed agents first */}
          {failedAgents.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-red-600">
                Agents Requiring Attention ({failedAgents.length})
              </p>
              {failedAgents.map((status) => (
                <TrustValidationResult
                  key={status.agentId}
                  status={status}
                  onViewTrustChain={onViewTrustChain}
                  onEstablishTrust={onEstablishTrust}
                />
              ))}
            </div>
          )}

          {/* Show successful agents collapsed */}
          {validation.trustedAgents > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-green-600">
                Trusted Agents ({validation.trustedAgents})
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {validation.agentStatuses
                  .filter((s) => s.isValid)
                  .map((status) => (
                    <TrustValidationResult
                      key={status.agentId}
                      status={status}
                      onViewTrustChain={onViewTrustChain}
                    />
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execute Button */}
      {onExecute && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {validation.isReady
                    ? "Pipeline Ready for Execution"
                    : "Trust Validation Required"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {validation.isReady
                    ? "All agents have valid trust and required capabilities"
                    : "Resolve trust issues before executing pipeline"}
                </p>
              </div>
              <Button
                onClick={onExecute}
                disabled={!validation.isReady}
                size="lg"
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Execute Pipeline
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
