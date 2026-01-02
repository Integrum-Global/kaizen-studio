/**
 * TrustOverlay Component
 *
 * Overlay panel for pipeline canvas showing trust status for all agent nodes
 * Can be positioned as a right panel or floating overlay
 * Includes collapse/expand functionality
 */

import { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Shield,
  X,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PipelineTrustSummary } from "./PipelineTrustSummary";
import { TrustValidationResult } from "./TrustValidationResult";
import { usePipelineTrustValidation } from "../../hooks";
import { cn } from "@/lib/utils";

interface TrustOverlayProps {
  pipelineId: string;
  agentIds: string[];
  requiredCapabilities?: Record<string, string[]>;
  position?: "right" | "floating";
  defaultExpanded?: boolean;
  onViewTrustChain?: (agentId: string) => void;
  onEstablishTrust?: (agentId: string) => void;
  onClose?: () => void;
  className?: string;
}

export function TrustOverlay({
  pipelineId,
  agentIds,
  requiredCapabilities = {},
  position = "right",
  defaultExpanded = true,
  onViewTrustChain,
  onEstablishTrust,
  onClose,
  className,
}: TrustOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { data: validation, isPending } = usePipelineTrustValidation(
    pipelineId,
    agentIds,
    requiredCapabilities
  );

  const isFloating = position === "floating";

  // Collapsed state
  if (!isExpanded) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-background p-3 shadow-md",
          isFloating && "fixed bottom-4 right-4 z-50",
          !isFloating && "h-full",
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
        <div className="flex flex-col items-center gap-1">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs font-medium">Trust</span>
        </div>
      </div>
    );
  }

  // Expanded state
  return (
    <Card
      className={cn(
        "flex flex-col border-l-4 shadow-lg",
        validation?.isReady ? "border-l-green-500" : "border-l-yellow-500",
        isFloating &&
          "fixed bottom-4 right-4 z-50 h-[600px] w-[400px] animate-in slide-in-from-right-5",
        !isFloating && "h-full w-full",
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

            {/* Summary */}
            {validation && <PipelineTrustSummary status={validation} />}

            {/* Agent Statuses */}
            {validation && validation.agentStatuses.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Agent Status</h3>
                  <span className="text-xs text-muted-foreground">
                    {validation.agentStatuses.length} agent(s)
                  </span>
                </div>

                {/* Failed agents first */}
                {validation.agentStatuses
                  .filter((s) => !s.isValid)
                  .map((status) => (
                    <TrustValidationResult
                      key={status.agentId}
                      status={status}
                      onViewTrustChain={onViewTrustChain}
                      onEstablishTrust={onEstablishTrust}
                    />
                  ))}

                {/* Successful agents */}
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
            )}

            {/* Empty State */}
            {validation && validation.agentStatuses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Shield className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm font-medium">
                  No agents to validate
                </p>
                <p className="text-xs text-muted-foreground">
                  Add agents to the pipeline to see their trust status
                </p>
              </div>
            )}

            {/* Help Text */}
            {validation && !validation.isReady && (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
                <p className="text-xs font-medium text-yellow-800">
                  Action Required
                </p>
                <p className="mt-1 text-xs text-yellow-700">
                  Establish trust for all agents before executing the pipeline.
                  Click "Establish Trust" on agents that need attention.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Footer with Quick Actions */}
      {validation &&
        !validation.isReady &&
        onEstablishTrust &&
        (() => {
          const currentValidation = validation;
          return (
            <>
              <Separator />
              <div className="flex-shrink-0 p-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Open trust management for all failed agents
                    const failedAgents = currentValidation.agentStatuses.filter(
                      (s) => !s.isValid
                    );
                    const firstFailedAgent = failedAgents[0];
                    if (firstFailedAgent) {
                      onEstablishTrust(firstFailedAgent.agentId);
                    }
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Establish Trust for All
                </Button>
              </div>
            </>
          );
        })()}
    </Card>
  );
}
