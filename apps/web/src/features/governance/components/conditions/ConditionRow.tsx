/**
 * Single condition row in the condition builder
 * Contains category, attribute, operator, and value selectors
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { CategorySelect, AttributeSelect, OperatorSelect } from "./selects";
import { ValueInput } from "./inputs";
import type { PolicyCondition, ConditionCategory, ConditionOperator, ConditionValue } from "./types";
import { translateCondition } from "./data/translations";

interface ConditionRowProps {
  condition: PolicyCondition;
  onUpdateCategory: (category: ConditionCategory) => void;
  onUpdateAttribute: (attributeId: string) => void;
  onUpdateOperator: (operator: ConditionOperator) => void;
  onUpdateValue: (value: ConditionValue) => void;
  onRemove: () => void;
  errors?: string[];
  disabled?: boolean;
}

export function ConditionRow({
  condition,
  onUpdateCategory,
  onUpdateAttribute,
  onUpdateOperator,
  onUpdateValue,
  onRemove,
  errors = [],
  disabled,
}: ConditionRowProps) {
  const translation = translateCondition(condition);
  const isComplete = condition.attribute && condition.value !== "";
  const hasErrors = errors.length > 0;

  return (
    <Card className="p-4 space-y-3">
      {/* Selectors Row */}
      <div className="flex flex-wrap gap-2 items-start">
        <CategorySelect
          value={condition.category}
          onChange={onUpdateCategory}
          disabled={disabled}
        />

        <AttributeSelect
          category={condition.category}
          value={condition.attribute}
          onChange={onUpdateAttribute}
          disabled={disabled}
        />

        <OperatorSelect
          attributeId={condition.attribute}
          value={condition.operator}
          onChange={onUpdateOperator}
          disabled={disabled}
        />

        <div className="flex-1 min-w-[200px]">
          <ValueInput
            attributeId={condition.attribute}
            operator={condition.operator}
            value={condition.value}
            onChange={onUpdateValue}
            disabled={disabled}
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          className="shrink-0"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {/* Translation Preview */}
      <div className="flex items-start gap-2 text-sm">
        {hasErrors ? (
          <>
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <span className="text-destructive">{errors[0]}</span>
          </>
        ) : isComplete ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{translation}</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <span className="text-amber-500">Complete the condition above</span>
          </>
        )}
      </div>
    </Card>
  );
}
