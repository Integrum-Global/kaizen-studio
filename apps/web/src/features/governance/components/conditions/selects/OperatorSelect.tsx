/**
 * Operator selector for condition builder
 * Shows operators available for the selected attribute type
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConditionOperator } from "../types";
import { getAttributeById } from "../data/attributes";
import { getOperatorsForType } from "../data/operators";

interface OperatorSelectProps {
  attributeId: string;
  value: ConditionOperator;
  onChange: (operator: ConditionOperator) => void;
  disabled?: boolean;
}

export function OperatorSelect({
  attributeId,
  value,
  onChange,
  disabled,
}: OperatorSelectProps) {
  const attribute = getAttributeById(attributeId);
  const operators = attribute ? getOperatorsForType(attribute.valueType) : [];

  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as ConditionOperator)}
      disabled={disabled || !attributeId}
    >
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder={attributeId ? "Select..." : "Select attribute first"} />
      </SelectTrigger>
      <SelectContent>
        {operators.map((op) => (
          <SelectItem key={op.id} value={op.id}>
            <div className="flex flex-col">
              <span>{op.label}</span>
            </div>
          </SelectItem>
        ))}
        {operators.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No operators available
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
