/**
 * TrustOverlay Component
 *
 * Toggleable side panel overlay for pipeline canvas showing trust status
 * Features:
 * - List of all agents in pipeline
 * - Trust status for each agent
 * - Real-time verification indicators
 * - Warnings for untrusted agents
 * - "Validate All" button
 * - Summary stats (trusted/untrusted count)
 */

import { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Shield,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { TrustStatusBadge } from "../TrustStatusBadge";
import { usePipelineTrustValidation } from "../../hooks";
import { cn } from "@/lib/utils";

interface TrustOverlayProps {
  pipelineId: string;
  agentIds: string[];
  requiredCapabilities?: Record<string, string[]>;
  defaultExpanded?: boolean;
  onClose?: () => void;
  onViewAgent?: (agentId: string) => void;
  onEstablishTrust?: (agentId: string) => void;
  className?: string;
}

export function TrustOverlay({
  pipelineId,
  agentIds,
  requiredCapabilities = {},
  defaultExpanded = true,
  onClose,
  onViewAgent,
  onEstablishTrust,
  className,
}: TrustOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const {
    data: validation,
    isPending,
    refetch,
    isRefetching,
  } = usePipelineTrustValidation(pipelineId, agentIds, requiredCapabilities);

  // Collapsed state
  if (!isExpanded) {
    return (
      <div
        className={cn(
          "flex h-full w-12 flex-col items-center gap-2 border-l bg-background p-2",
          className
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(true)}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col items-center gap-1 py-4">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs font-medium writing-mode-vertical">
            Trust
          </span>
        </div>
      </div>
    );
  }

  // Expanded state
  return (
    <Card
      className={cn(
        "flex h-full w-[400px] flex-col border-l-4 shadow-lg",
        validation?.isReady ? "border-l-green-500" : "border-l-yellow-500",
        className
      )}
    >
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle className="text-base font-medium">
              Trust Status
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isPending || isRefetching}
              className="h-8 w-8"
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4",
                  isRefetching && "animate-spin"
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(false)}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="space-y-4 p-4">
            {/* Loading State */}
            {isPending && (
              <div className="space-y-3">
                <div className="h-32 animate-pulse rounded-lg bg-muted" />
                <div className="h-24 animate-pulse rounded-lg bg-muted" />
                <div className="h-24 animate-pulse rounded-lg bg-muted" />
              </div>
            )}

            {/* Summary Stats */}
            {validation && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Pipeline Status
                      </span>
                      <Badge
                        variant={validation.isReady ? "default" : "destructive"}
                        className={cn(
                          validation.isReady &&
                            "bg-green-600 hover:bg-green-700"
                        )}
                      >
                        {validation.isReady ? "Ready" : "Not Ready"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="space-y-1">
                        <div className="text-2xl font-bold">
                          {validation.totalAgents}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-green-600">
                          {validation.trustedAgents}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Trusted
                        </div>
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

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <Progress
                        value={
                          (validation.trustedAgents / validation.totalAgents) *
                          100
                        }
                        className="h-2"
                      />
                      <p className="text-xs text-center text-muted-foreground">
                        {Math.round(
                          (validation.trustedAgents / validation.totalAgents) *
                            100
                        )}
                        % Trusted
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warnings for Untrusted Agents */}
            {validation && !validation.isReady && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">Action Required</p>
                  <p className="mt-1 text-sm">
                    {validation.untrustedAgents} agent(s) require trust
                    establishment before pipeline execution.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Agent List */}
            {validation && validation.agentStatuses.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Agents</h3>
                  <span className="text-xs text-muted-foreground">
                    {validation.agentStatuses.length} total
                  </span>
                </div>

                {/* Failed agents first */}
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
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
                                <p className="font-medium truncate text-sm">
                                  {status.agentName}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {status.agentId}
                              </p>
                            </div>
                            <TrustStatusBadge
                              status={status.trustStatus}
                              size="sm"
                            />
                          </div>

                          {status.missingCapabilities.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-red-600">
                                Missing Capabilities:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {status.missingCapabilities.map((cap) => (
                                  <Badge
                                    key={cap}
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    {cap}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            {onViewAgent && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onViewAgent(status.agentId)}
                                className="flex-1"
                              >
                                View
                              </Button>
                            )}
                            {onEstablishTrust && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() =>
                                  onEstablishTrust(status.agentId)
                                }
                                className="flex-1"
                              >
                                Establish Trust
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                {/* Successful agents - collapsed */}
                {validation.agentStatuses
                  .filter((s) => s.isValid)
                  .map((status) => (
                    <Card
                      key={status.agentId}
                      className="border-l-4 border-l-green-500"
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate text-sm">
                                {status.agentName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {status.agentId}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrustStatusBadge
                              status={status.trustStatus}
                              size="sm"
                            />
                            {onViewAgent && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewAgent(status.agentId)}
                              >
                                View
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}

            {/* Empty State */}
            {validation && validation.agentStatuses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Shield className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm font-medium">No agents to validate</p>
                <p className="text-xs text-muted-foreground">
                  Add agents to the pipeline to see their trust status
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Footer with Validate All Button */}
      {validation && !validation.isReady && (
        <>
          <Separator />
          <div className="flex-shrink-0 p-4">
            <Button
              variant="default"
              className="w-full"
              onClick={() => refetch()}
              disabled={isPending || isRefetching}
            >
              <RefreshCw
                className={cn(
                  "mr-2 h-4 w-4",
                  isRefetching && "animate-spin"
                )}
              />
              Validate All
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
