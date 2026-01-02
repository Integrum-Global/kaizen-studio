/**
 * CapabilitySelectionStep Component
 *
 * Step 3: Select capabilities to delegate from the source agent
 */

import { Check, Shield, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTrustChain } from "../../../../hooks";
import { CapabilityType } from "../../../../types";
import type { DelegatedCapabilityData } from "../schema";
import { cn } from "@/lib/utils";

interface CapabilitySelectionStepProps {
  sourceAgentId: string;
  selectedCapabilities: DelegatedCapabilityData[];
  onChange: (capabilities: DelegatedCapabilityData[]) => void;
  error?: string;
}

const capabilityTypeColors: Record<CapabilityType, string> = {
  [CapabilityType.ACCESS]: "bg-blue-500",
  [CapabilityType.ACTION]: "bg-green-500",
  [CapabilityType.DELEGATION]: "bg-purple-500",
};

export function CapabilitySelectionStep({
  sourceAgentId,
  selectedCapabilities,
  onChange,
  error,
}: CapabilitySelectionStepProps) {
  const {
    data: trustChain,
    isLoading,
    error: fetchError,
  } = useTrustChain(sourceAgentId);

  const isCapabilitySelected = (capability: string) =>
    selectedCapabilities.some((c) => c.capability === capability);

  const toggleCapability = (
    capability: string,
    capabilityType: CapabilityType,
    constraints: string[]
  ) => {
    if (isCapabilitySelected(capability)) {
      onChange(selectedCapabilities.filter((c) => c.capability !== capability));
    } else {
      onChange([
        ...selectedCapabilities,
        {
          capability,
          capability_type: capabilityType,
          constraints: constraints || [],
        },
      ]);
    }
  };

  const selectAll = () => {
    if (!trustChain) return;
    const allCapabilities: DelegatedCapabilityData[] =
      trustChain.capabilities.map((cap) => ({
        capability: cap.capability,
        capability_type: cap.capability_type,
        constraints: cap.constraints || [],
      }));
    onChange(allCapabilities);
  };

  const deselectAll = () => {
    onChange([]);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (fetchError || !trustChain) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load capabilities for the source agent. Please go back and
          select a valid agent.
        </AlertDescription>
      </Alert>
    );
  }

  const availableCapabilities = trustChain.capabilities;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">
            Select Capabilities to Delegate
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Choose which capabilities the target agent will receive. Selected:{" "}
            {selectedCapabilities.length} of {availableCapabilities.length}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-sm text-blue-600 hover:underline"
          >
            Select all
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            type="button"
            onClick={deselectAll}
            className="text-sm text-blue-600 hover:underline"
          >
            Deselect all
          </button>
        </div>
      </div>

      {/* Capabilities list */}
      <div className="space-y-2 max-h-[350px] overflow-y-auto">
        {availableCapabilities.length > 0 ? (
          availableCapabilities.map((capability, index) => {
            const isSelected = isCapabilitySelected(capability.capability);
            return (
              <Card
                key={index}
                className={cn(
                  "p-3 cursor-pointer transition-colors",
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                    : "hover:bg-accent"
                )}
                onClick={() =>
                  toggleCapability(
                    capability.capability,
                    capability.capability_type,
                    capability.constraints || []
                  )
                }
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    className="mt-1"
                    onCheckedChange={() =>
                      toggleCapability(
                        capability.capability,
                        capability.capability_type,
                        capability.constraints || []
                      )
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-white ${
                          capabilityTypeColors[capability.capability_type]
                        }`}
                      >
                        {capability.capability_type}
                      </Badge>
                      <code className="text-sm truncate">
                        {capability.capability}
                      </code>
                    </div>
                    {capability.constraints &&
                      capability.constraints.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {capability.constraints.map((constraint, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs"
                            >
                              {constraint}
                            </Badge>
                          ))}
                        </div>
                      )}
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  )}
                </div>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No capabilities available</p>
            <p className="text-xs mt-1">
              The source agent has no capabilities to delegate
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
