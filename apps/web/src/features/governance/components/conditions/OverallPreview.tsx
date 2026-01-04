/**
 * Overall policy preview component
 * Shows all conditions combined with logic (AND/OR) in plain English or JSON
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Code, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { translateCondition } from "./data/translations";
import type { PolicyCondition } from "./types";

interface OverallPreviewProps {
  conditions: PolicyCondition[];
  logic: "all" | "any";
  showJsonToggle?: boolean;
  className?: string;
}

/**
 * Format conditions as JSON for display
 */
function formatConditionsJson(
  conditions: PolicyCondition[],
  logic: "all" | "any"
): string {
  const output = {
    logic,
    conditions: conditions.map((c) => ({
      category: c.category,
      attribute: c.attribute,
      operator: c.operator,
      value: c.value,
    })),
  };
  return JSON.stringify(output, null, 2);
}

export function OverallPreview({
  conditions,
  logic,
  showJsonToggle = true,
  className,
}: OverallPreviewProps) {
  const [viewMode, setViewMode] = useState<"text" | "json">("text");

  const isEmpty = conditions.length === 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </CardTitle>
          {showJsonToggle && !isEmpty && (
            <div className="flex gap-1">
              <Button
                type="button"
                variant={viewMode === "text" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("text")}
                className="h-7 px-2 gap-1"
              >
                <FileText className="h-3.5 w-3.5" />
                Text
              </Button>
              <Button
                type="button"
                variant={viewMode === "json" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("json")}
                className="h-7 px-2 gap-1"
              >
                <Code className="h-3.5 w-3.5" />
                JSON
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "text" ? (
          <div className="space-y-3">
            {isEmpty ? (
              <p className="text-sm text-muted-foreground">
                This policy applies to <strong>everyone</strong>, at any time,
                from anywhere.
              </p>
            ) : (
              <>
                {conditions.length > 1 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      Access is granted when
                    </span>
                    <Badge variant={logic === "all" ? "default" : "secondary"}>
                      {logic === "all" ? "ALL" : "ANY"}
                    </Badge>
                    <span className="text-muted-foreground">
                      of these are true:
                    </span>
                  </div>
                )}
                {conditions.length === 1 && (
                  <p className="text-sm text-muted-foreground">
                    Access is granted when:
                  </p>
                )}
                <ul className="space-y-1.5">
                  {conditions.map((condition, index) => (
                    <li
                      key={condition.id}
                      className="flex items-start gap-2 text-sm"
                    >
                      <span className="text-muted-foreground/60 shrink-0 w-5 text-right">
                        {index + 1}.
                      </span>
                      <span className="text-foreground">
                        {translateCondition(condition)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ) : (
          <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
            <code>{formatConditionsJson(conditions, logic)}</code>
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
