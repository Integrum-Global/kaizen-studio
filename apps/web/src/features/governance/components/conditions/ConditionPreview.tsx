/**
 * Single condition preview component
 * Displays a condition as plain English text with proper styling
 */

import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { translateCondition } from "./data/translations";
import type { PolicyCondition } from "./types";

interface ConditionPreviewProps {
  condition: PolicyCondition;
  className?: string;
  showIcon?: boolean;
  variant?: "default" | "compact" | "inline";
}

/**
 * Check if a condition is complete (has all required values)
 */
function isConditionComplete(condition: PolicyCondition): boolean {
  if (!condition.attribute) return false;

  const value = condition.value;
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;

  return true;
}

export function ConditionPreview({
  condition,
  className,
  showIcon = true,
  variant = "default",
}: ConditionPreviewProps) {
  const translation = translateCondition(condition);
  const isComplete = isConditionComplete(condition);

  if (variant === "inline") {
    return (
      <span
        className={cn(
          "text-sm",
          isComplete ? "text-foreground" : "text-muted-foreground italic",
          className
        )}
      >
        {translation}
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        {translation}
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-2", className)}>
      {showIcon && (
        <>
          {isComplete ? (
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          )}
        </>
      )}
      <span
        className={cn(
          "text-sm",
          isComplete ? "text-muted-foreground" : "text-amber-500"
        )}
      >
        {translation}
      </span>
    </div>
  );
}
