/**
 * ESAStatusIndicator Component
 *
 * Displays the current status of the Enterprise Security Authority agent
 */

import { Circle, Activity, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { EnforcementMode, ESAHealthStatus } from "../../types";

interface ESAStatusIndicatorProps {
  isActive: boolean;
  enforcementMode: EnforcementMode;
  healthStatus: ESAHealthStatus;
  lastHealthCheck: string | null;
  className?: string;
  compact?: boolean;
}

const healthStatusConfig = {
  [ESAHealthStatus.HEALTHY]: {
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    icon: CheckCircle,
    label: "Healthy",
  },
  [ESAHealthStatus.DEGRADED]: {
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    icon: AlertCircle,
    label: "Degraded",
  },
  [ESAHealthStatus.OFFLINE]: {
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    icon: XCircle,
    label: "Offline",
  },
};

const enforcementModeConfig = {
  [EnforcementMode.AUDIT_ONLY]: {
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    label: "Audit Only",
    description: "Monitoring actions without enforcement",
  },
  [EnforcementMode.ENFORCE]: {
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
    label: "Enforce",
    description: "Actively enforcing trust policies",
  },
};

export function ESAStatusIndicator({
  isActive,
  enforcementMode,
  healthStatus,
  lastHealthCheck,
  className,
  compact = false,
}: ESAStatusIndicatorProps) {
  const healthConfig = healthStatusConfig[healthStatus];
  const modeConfig = enforcementModeConfig[enforcementMode];
  const HealthIcon = healthConfig.icon;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge
          variant={isActive ? "default" : "secondary"}
          className={cn(
            "flex items-center gap-1",
            isActive ? "bg-green-500 hover:bg-green-600" : ""
          )}
        >
          <Circle
            className={cn(
              "h-2 w-2",
              isActive ? "fill-current" : "fill-gray-400"
            )}
          />
          {isActive ? "Active" : "Inactive"}
        </Badge>
        <Badge variant="outline" className={modeConfig.bgColor}>
          <span className={modeConfig.color}>{modeConfig.label}</span>
        </Badge>
        <div className={cn("flex items-center gap-1", healthConfig.color)}>
          <HealthIcon className="h-4 w-4" />
        </div>
      </div>
    );
  }

  const formatLastCheck = (timestamp: string | null) => {
    if (!timestamp) return "Never";

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className={cn("border-2", healthConfig.borderColor, className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">ESA Status</h3>
            </div>
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={cn(
                "flex items-center gap-1",
                isActive ? "bg-green-500 hover:bg-green-600" : ""
              )}
            >
              <Circle
                className={cn(
                  "h-2 w-2",
                  isActive ? "fill-current" : "fill-gray-400"
                )}
              />
              {isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Enforcement Mode */}
          <div
            className={cn(
              "rounded-lg border p-3",
              modeConfig.bgColor,
              "border-border"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("font-medium", modeConfig.color)}>
                    {modeConfig.label}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Mode
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {modeConfig.description}
                </p>
              </div>
            </div>
          </div>

          {/* Health Status */}
          <div
            className={cn("rounded-lg border p-3", healthConfig.bgColor)}
            style={{ borderColor: `var(--${healthConfig.borderColor})` }}
          >
            <div className="flex items-center gap-3">
              <HealthIcon className={cn("h-5 w-5", healthConfig.color)} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("font-medium", healthConfig.color)}>
                    {healthConfig.label}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Health
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Last check: {formatLastCheck(lastHealthCheck)}
                </p>
              </div>
            </div>
          </div>

          {/* Warning for inactive ESA */}
          {!isActive && (
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  ESA is inactive. Trust operations may not be enforced.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
