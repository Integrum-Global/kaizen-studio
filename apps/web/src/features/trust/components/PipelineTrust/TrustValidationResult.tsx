/**
 * TrustValidationResult Component
 *
 * Displays validation result for a single agent
 * Features:
 * - List of validated agents
 * - Pass/fail status for each
 * - Detailed error messages
 * - Suggestions for fixing issues
 * - Export validation report
 */

import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TrustStatusBadge } from "../TrustStatusBadge";
import type { AgentPipelineStatus } from "../../types";
import { cn } from "@/lib/utils";

interface TrustValidationResultProps {
  status: AgentPipelineStatus;
  onViewTrustChain?: (agentId: string) => void;
  onEstablishTrust?: (agentId: string) => void;
  onExportReport?: (agentId: string) => void;
  showDetails?: boolean;
  className?: string;
}

export function TrustValidationResult({
  status,
  onViewTrustChain,
  onEstablishTrust,
  onExportReport,
  showDetails = true,
  className,
}: TrustValidationResultProps) {
  // Generate suggestions based on issues
  const suggestions: string[] = [];
  if (status.missingCapabilities.length > 0) {
    suggestions.push(
      `Establish trust with capabilities: ${status.missingCapabilities.join(", ")}`
    );
  }
  if (status.constraintViolations.length > 0) {
    suggestions.push(
      "Review and resolve constraint violations before proceeding"
    );
  }
  if (
    status.trustStatus === "expired" ||
    status.trustStatus === "revoked" ||
    status.trustStatus === "invalid"
  ) {
    suggestions.push("Re-establish trust for this agent");
  }

  return (
    <Card
      className={cn(
        "border-l-4",
        status.isValid ? "border-l-green-500" : "border-l-red-500",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-base font-medium truncate">
              {status.agentName}
            </CardTitle>
            <p className="text-sm text-muted-foreground truncate">
              {status.agentId}
            </p>
          </div>
          <TrustStatusBadge status={status.trustStatus} size="sm" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pass/Fail Status */}
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

        {showDetails && (
          <>
            {/* Required vs Available Capabilities */}
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

            {/* Missing Capabilities - Detailed Error Messages */}
            {status.missingCapabilities.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm font-medium text-yellow-600">
                    Missing Capabilities
                  </p>
                </div>
                <div className="rounded-md bg-yellow-50 p-3">
                  <ul className="space-y-1 text-sm text-yellow-800">
                    {status.missingCapabilities.map((capability) => (
                      <li key={capability} className="flex items-start gap-2">
                        <span className="text-yellow-600">•</span>
                        <span>
                          <strong>{capability}</strong> - This capability is
                          required for pipeline execution but not available in the
                          agent's trust chain.
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Constraint Violations - Detailed Error Messages */}
            {status.constraintViolations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <p className="text-sm font-medium text-red-600">
                    Constraint Violations
                  </p>
                </div>
                <div className="rounded-md bg-red-50 p-3">
                  <ul className="space-y-2 text-sm text-red-800">
                    {status.constraintViolations.map((violation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-600" />
                        <span>{violation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Suggestions for Fixing Issues */}
            {!status.isValid && suggestions.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-600">
                      Suggested Actions
                    </p>
                  </div>
                  <div className="rounded-md bg-blue-50 p-3">
                    <ul className="space-y-2 text-sm text-blue-800">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Actions */}
        <Separator />
        <div className="flex flex-wrap gap-2">
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
          {onExportReport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onExportReport(status.agentId)}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
