/**
 * ConstraintsStep Component
 *
 * Step 4: Configure constraints and delegation limits
 */

import { Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConstraintEditor } from "../../ConstraintEditor";

interface ConstraintsStepProps {
  constraints: string[];
  maxDepth: number;
  allowFurtherDelegation: boolean;
  onConstraintsChange: (constraints: string[]) => void;
  onMaxDepthChange: (depth: number) => void;
  onAllowFurtherDelegationChange: (allow: boolean) => void;
}

export function ConstraintsStep({
  constraints,
  maxDepth,
  allowFurtherDelegation,
  onConstraintsChange,
  onMaxDepthChange,
  onAllowFurtherDelegationChange,
}: ConstraintsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold">
          Configure Constraints and Limits
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          Set restrictions on how the delegated capabilities can be used.
        </p>
      </div>

      {/* Delegation chain settings */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="allow-further" className="font-medium">
              Allow Further Delegation
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    If enabled, the target agent can delegate these capabilities
                    to other agents.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch
            id="allow-further"
            checked={allowFurtherDelegation}
            onCheckedChange={onAllowFurtherDelegationChange}
          />
        </div>

        {allowFurtherDelegation && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="font-medium">Maximum Delegation Depth</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Maximum number of times these capabilities can be
                        re-delegated. Higher values create longer trust chains.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {maxDepth}
              </span>
            </div>
            <Slider
              value={[maxDepth]}
              onValueChange={([value]) => onMaxDepthChange(value ?? 1)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 (Most restricted)</span>
              <span>10 (Most permissive)</span>
            </div>
          </div>
        )}
      </Card>

      {/* Depth explanation */}
      <Card className="p-4 bg-muted/50">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Understanding Delegation Depth</p>
            <p className="text-muted-foreground mt-1">
              Depth 1 means the target agent cannot further delegate. Depth 2
              allows one additional hop, and so on. Each delegation reduces the
              remaining depth by 1.
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              Example: If you set depth to 3:
              <br />
              Agent A → Agent B (depth 2 remaining)
              <br />
              Agent B → Agent C (depth 1 remaining)
              <br />
              Agent C → Agent D (no further delegation)
            </div>
          </div>
        </div>
      </Card>

      {/* Global constraints */}
      <div className="space-y-2">
        <Label className="font-medium">Global Constraints</Label>
        <p className="text-xs text-muted-foreground">
          These constraints apply to all delegated capabilities
        </p>
        <ConstraintEditor
          constraints={constraints}
          onChange={onConstraintsChange}
        />
      </div>
    </div>
  );
}
