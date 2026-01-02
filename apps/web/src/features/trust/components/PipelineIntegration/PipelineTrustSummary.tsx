/**
 * PipelineTrustSummary Component
 *
 * Summary of trust status across all agents in a pipeline
 * Shows quick stats with color-coded indicators
 */

import { CheckCircle, XCircle, Clock, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PipelineTrustStatus } from "../../types";
import { cn } from "@/lib/utils";

interface PipelineTrustSummaryProps {
  status: PipelineTrustStatus;
  className?: string;
}

export function PipelineTrustSummary({
  status,
  className,
}: PipelineTrustSummaryProps) {
  const stats = [
    {
      label: "Total Agents",
      value: status.totalAgents,
      icon: Shield,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Trusted",
      value: status.trustedAgents,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Untrusted",
      value: status.untrustedAgents,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      label: "Expired",
      value: status.expiredAgents,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            Pipeline Trust Status
          </CardTitle>
          <Badge
            variant={status.isReady ? "default" : "destructive"}
            className={cn(
              status.isReady && "bg-green-600 hover:bg-green-700",
              !status.isReady && "bg-red-600 hover:bg-red-700"
            )}
          >
            {status.isReady ? "Ready" : "Not Ready"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border p-4",
                  stat.bgColor
                )}
              >
                <Icon className={cn("h-5 w-5 mb-2", stat.color)} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Overall Status Message */}
        <div className="mt-4 rounded-md border p-3">
          {status.isReady ? (
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-600">
                  All agents are trusted
                </p>
                <p className="text-xs text-muted-foreground">
                  Pipeline is ready for execution
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-600">
                  Trust validation required
                </p>
                <p className="text-xs text-muted-foreground">
                  {status.untrustedAgents > 0 &&
                    `${status.untrustedAgents} agent(s) need trust established. `}
                  {status.expiredAgents > 0 &&
                    `${status.expiredAgents} agent(s) have expired trust.`}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
