/**
 * ConstraintsStep Component
 *
 * Step 4: Configure constraints and delegation limits
 *
 * Enhanced with constraint tightening validation (EATP Phase 2):
 * - Shows delegator's limits for comparison
 * - Validates that child constraints don't exceed parent limits
 * - Displays warnings when approaching or exceeding limits
 *
 * @see docs/plans/eatp-ontology/04-workspaces.md
 */

import { useMemo } from "react";
import { Info, AlertTriangle, CheckCircle2, Shield } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConstraintEditor } from "../../ConstraintEditor";
import { cn } from "@/lib/utils";

/**
 * Parsed constraint for comparison
 */
interface ParsedConstraint {
  type: string;
  field: string;
  value: string | number;
  raw: string;
}

/**
 * Constraint tightening violation
 */
export interface ConstraintViolation {
  constraintType: string;
  parentValue: string | number;
  childValue: string | number;
  message: string;
}

interface ConstraintsStepProps {
  constraints: string[];
  maxDepth: number;
  allowFurtherDelegation: boolean;
  onConstraintsChange: (constraints: string[]) => void;
  onMaxDepthChange: (depth: number) => void;
  onAllowFurtherDelegationChange: (allow: boolean) => void;
  /** Delegator's constraints (parent limits) */
  delegatorConstraints?: string[];
  /** Delegator's max delegation depth */
  delegatorMaxDepth?: number;
  /** Delegator name for display */
  delegatorName?: string;
  /** Callback when violations are detected */
  onViolationsChange?: (violations: ConstraintViolation[]) => void;
}

/**
 * Parse a constraint string into structured format
 * Format: "constraint_type:field:value"
 */
function parseConstraint(constraint: string): ParsedConstraint | null {
  const parts = constraint.split(":");
  if (parts.length < 3) return null;

  const type = parts[0] || "";
  const field = parts[1] || "";
  const valueStr = parts.slice(2).join(":");

  // Try to parse as number
  const numValue = parseFloat(valueStr);
  const value = isNaN(numValue) ? valueStr : numValue;

  return { type, field, value, raw: constraint };
}

/**
 * Extract numeric value from constraint for comparison
 * Handles formats like "500", "500/day", "$500", etc.
 */
function extractNumericValue(value: string | number): number | null {
  if (typeof value === "number") return value;

  // Remove currency symbols and common suffixes
  const cleaned = value.replace(/[$€£¥]/g, "").replace(/\/day|\/hour|\/week/gi, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Validate constraint tightening rule
 * Returns violations if child constraint exceeds parent limit
 */
function validateConstraintTightening(
  parentConstraints: string[],
  childConstraints: string[]
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];

  const parentParsed = parentConstraints
    .map(parseConstraint)
    .filter((c): c is ParsedConstraint => c !== null);

  const childParsed = childConstraints
    .map(parseConstraint)
    .filter((c): c is ParsedConstraint => c !== null);

  // Check each child constraint against parent constraints of same type
  for (const child of childParsed) {
    const parentMatch = parentParsed.find(
      (p) => p.type === child.type && p.field === child.field
    );

    if (parentMatch) {
      const parentNum = extractNumericValue(parentMatch.value);
      const childNum = extractNumericValue(child.value);

      if (parentNum !== null && childNum !== null) {
        // For resource limits, child must be <= parent
        if (child.type === "resource_limit" && childNum > parentNum) {
          violations.push({
            constraintType: `${child.type}:${child.field}`,
            parentValue: parentMatch.value,
            childValue: child.value,
            message: `Cannot exceed your limit of ${parentMatch.value}. You set ${child.value}.`,
          });
        }
        // For rate limits, child must be <= parent
        if (child.type === "rate_limit" && childNum > parentNum) {
          violations.push({
            constraintType: `${child.type}:${child.field}`,
            parentValue: parentMatch.value,
            childValue: child.value,
            message: `Rate limit ${child.value} exceeds your limit of ${parentMatch.value}.`,
          });
        }
      }
    }
  }

  return violations;
}

export function ConstraintsStep({
  constraints,
  maxDepth,
  allowFurtherDelegation,
  onConstraintsChange,
  onMaxDepthChange,
  onAllowFurtherDelegationChange,
  delegatorConstraints = [],
  delegatorMaxDepth,
  delegatorName = "Your",
  onViolationsChange,
}: ConstraintsStepProps) {
  // Validate constraint tightening
  const violations = useMemo(() => {
    const result = validateConstraintTightening(delegatorConstraints, constraints);
    onViolationsChange?.(result);
    return result;
  }, [constraints, delegatorConstraints, onViolationsChange]);

  // Check if max depth exceeds delegator's depth
  const depthViolation = useMemo(() => {
    if (delegatorMaxDepth !== undefined && maxDepth > delegatorMaxDepth) {
      return {
        message: `Cannot exceed your delegation depth of ${delegatorMaxDepth}. You set ${maxDepth}.`,
      };
    }
    return null;
  }, [maxDepth, delegatorMaxDepth]);

  const hasViolations = violations.length > 0 || depthViolation !== null;
  const effectiveMaxDepth = delegatorMaxDepth ?? 10;

  return (
    <div className="space-y-6" data-testid="constraints-step">
      <div>
        <Label className="text-base font-semibold">
          Configure Constraints and Limits
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          Set restrictions on how the delegated capabilities can be used.
          <strong className="text-foreground"> Constraints can only be tightened, never loosened.</strong>
        </p>
      </div>

      {/* Delegator's Limits (if provided) */}
      {delegatorConstraints.length > 0 && (
        <Card className="p-4 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="font-medium text-sm">{delegatorName} Limits</p>
              <p className="text-xs text-muted-foreground">
                These are the limits you have received. You can only delegate equal or stricter limits.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {delegatorConstraints.map((constraint, idx) => (
                  <Badge key={idx} variant="secondary" className="font-mono text-xs">
                    {constraint}
                  </Badge>
                ))}
              </div>
              {delegatorMaxDepth !== undefined && (
                <p className="text-xs text-muted-foreground mt-1">
                  Max delegation depth: <span className="font-mono">{delegatorMaxDepth}</span>
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Constraint Violations Warning */}
      {hasViolations && (
        <Alert variant="destructive" data-testid="constraint-violations">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Constraint Tightening Violation</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
              {violations.map((v, idx) => (
                <li key={idx}>{v.message}</li>
              ))}
              {depthViolation && <li>{depthViolation.message}</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* No Violations Indicator */}
      {!hasViolations && constraints.length > 0 && delegatorConstraints.length > 0 && (
        <Alert className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700 dark:text-green-400">Valid Constraints</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-500">
            All constraints comply with the tightening rule.
          </AlertDescription>
        </Alert>
      )}

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
              <span
                className={cn(
                  "text-sm font-mono px-2 py-1 rounded",
                  depthViolation
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted"
                )}
              >
                {maxDepth}
                {delegatorMaxDepth !== undefined && (
                  <span className="text-muted-foreground"> / {delegatorMaxDepth}</span>
                )}
              </span>
            </div>
            <Slider
              value={[maxDepth]}
              onValueChange={([value]) => onMaxDepthChange(value ?? 1)}
              min={1}
              max={effectiveMaxDepth}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 (Most restricted)</span>
              <span>{effectiveMaxDepth} (Maximum allowed)</span>
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
