/**
 * TrustCapabilityList Component
 *
 * Displays agent's capabilities from trust chain with:
 * - Capability type badges (ACCESS, ACTION, DELEGATION)
 * - Constraint indicators per capability
 * - Collapsible view for more than 5 capabilities
 * - Expired capability indicators
 */

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Shield,
  Lock,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgentCapabilitySummary } from "../../hooks";
import { CapabilityType } from "../../types";
import { cn } from "@/lib/utils";

interface TrustCapabilityListProps {
  agentId: string;
  maxVisible?: number;
  className?: string;
}

const capabilityTypeConfig = {
  [CapabilityType.ACCESS]: {
    label: "Access",
    icon: Shield,
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  [CapabilityType.ACTION]: {
    label: "Action",
    icon: Shield,
    className: "bg-green-100 text-green-800 border-green-200",
  },
  [CapabilityType.DELEGATION]: {
    label: "Delegation",
    icon: Shield,
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
};

export function TrustCapabilityList({
  agentId,
  maxVisible = 5,
  className,
}: TrustCapabilityListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    data: capabilities,
    isPending,
    error,
  } = useAgentCapabilitySummary(agentId);

  if (isPending) {
    return (
      <TrustCapabilityListSkeleton
        maxVisible={maxVisible}
        className={className}
      />
    );
  }

  if (error || !capabilities) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-sm text-destructive",
          className
        )}
      >
        <AlertCircle className="h-4 w-4" />
        <span>Failed to load capabilities</span>
      </div>
    );
  }

  if (capabilities.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        No capabilities available
      </div>
    );
  }

  const visibleCapabilities = isOpen
    ? capabilities
    : capabilities.slice(0, maxVisible);
  const hasMore = capabilities.length > maxVisible;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Capabilities</h4>
        <Badge variant="secondary" className="text-xs">
          {capabilities.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {visibleCapabilities.map((capability, index) => (
          <CapabilityItem key={index} capability={capability} />
        ))}
      </div>

      {hasMore && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full">
              {isOpen ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show {capabilities.length - maxVisible} More
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {capabilities.slice(maxVisible).map((capability, index) => (
              <CapabilityItem
                key={maxVisible + index}
                capability={capability}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

interface CapabilityItemProps {
  capability: {
    type: CapabilityType;
    name: string;
    constraintCount: number;
    isExpired: boolean;
  };
}

function CapabilityItem({ capability }: CapabilityItemProps) {
  const config = capabilityTypeConfig[capability.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-2 rounded-md border",
        capability.isExpired
          ? "bg-destructive/5 border-destructive/30"
          : "bg-muted/50"
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-medium truncate",
              capability.isExpired && "text-muted-foreground line-through"
            )}
          >
            {capability.name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="outline"
              className={cn("text-xs", config.className)}
            >
              {config.label}
            </Badge>
            {capability.constraintCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>{capability.constraintCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {capability.isExpired && (
        <Badge variant="destructive" className="text-xs ml-2">
          Expired
        </Badge>
      )}
    </div>
  );
}

function TrustCapabilityListSkeleton({
  maxVisible,
  className,
}: {
  maxVisible: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-8" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: Math.min(maxVisible, 3) }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 rounded-md border bg-muted/50"
          >
            <div className="flex items-center gap-2 flex-1">
              <Skeleton className="h-4 w-4" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
