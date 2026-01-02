/**
 * Attribute selector for condition builder
 * Shows attributes available for the selected category
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConditionCategory } from "../types";
import { getAttributesByCategory } from "../data/attributes";

interface AttributeSelectProps {
  category: ConditionCategory | "";
  value: string;
  onChange: (attributeId: string) => void;
  disabled?: boolean;
}

export function AttributeSelect({
  category,
  value,
  onChange,
  disabled,
}: AttributeSelectProps) {
  const attributes = category ? getAttributesByCategory(category) : [];

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled || !category}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={category ? "Select attribute..." : "Select category first"} />
      </SelectTrigger>
      <SelectContent>
        {attributes.map((attr) => (
          <SelectItem key={attr.id} value={attr.id}>
            <div className="flex flex-col">
              <span>{attr.label}</span>
              <span className="text-xs text-muted-foreground">{attr.description}</span>
            </div>
          </SelectItem>
        ))}
        {attributes.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No attributes available
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
