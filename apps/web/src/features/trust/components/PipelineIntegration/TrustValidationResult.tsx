/**
 * TrustValidationResult Component
 *
 * Displays validation result for a single agent in a pipeline
 * Shows trust status, capabilities, and any issues
 */

import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrustStatusBadge } from "../TrustStatusBadge";
import type { AgentPipelineStatus } from "../../types";
import { cn } from "@/lib/utils";

interface TrustValidationResultProps {
  status: AgentPipelineStatus;
  onViewTrustChain?: (agentId: string) => void;
  onEstablishTrust?: (agentId: string) => void;
  className?: string;
}

export function TrustValidationResult({
  status,
  onViewTrustChain,
  onEstablishTrust,
  className,
}: TrustValidationResultProps) {
  return (
    <Card
      className={cn(
        "border-l-4",
        status.isValid && "border-l-green-500",
        !status.isValid && "border-l-red-500",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">
              {status.agentName}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{status.agentId}</p>
          </div>
          <TrustStatusBadge status={status.trustStatus} size="sm" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Validation Status */}
        <div className="flex items-center gap-2">
          {status.isValid ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Validation Passed
              </span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">
                Validation Failed
              </span>
            </>
          )}
        </div>

        {/* Required Capabilities */}
        {status.requiredCapabilities.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Required Capabilities</p>
            <div className="flex flex-wrap gap-2">
              {status.requiredCapabilities.map((capability) => {
                const isAvailable =
                  status.availableCapabilities.includes(capability);
                return (
                  <Badge
                    key={capability}
                    variant={isAvailable ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {isAvailable ? (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <XCircle className="mr-1 h-3 w-3" />
                    )}
                    {capability}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Missing Capabilities */}
        {status.missingCapabilities.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm font-medium text-yellow-600">
                Missing Capabilities
              </p>
            </div>
            <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
              {status.missingCapabilities.map((capability) => (
                <li key={capability}>{capability}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Constraint Violations */}
        {status.constraintViolations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-sm font-medium text-red-600">
                Constraint Violations
              </p>
            </div>
            <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
              {status.constraintViolations.map((violation, index) => (
                <li key={index}>{violation}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onViewTrustChain && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewTrustChain(status.agentId)}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Trust Chain
            </Button>
          )}
          {!status.isValid && onEstablishTrust && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onEstablishTrust(status.agentId)}
            >
              Establish Trust
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
