/**
 * Value input router for condition builder
 * Renders the appropriate input component based on attribute type
 */

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, AlertCircle } from "lucide-react";
import type { ConditionValue, ConditionOperator, ResourceReference } from "../types";
import { isResourceReference } from "../types";
import { getAttributeById } from "../data/attributes";
import { ResourcePicker } from "./ResourcePicker";
import { TimePicker } from "./TimePicker";
import { TeamPicker } from "./TeamPicker";
import { IpRangeInput } from "./IpRangeInput";
import { useConditionValidation } from "../hooks/useConditionValidation";
import type { PolicyCondition } from "../types";

interface ValueInputProps {
  attributeId: string;
  operator: ConditionOperator;
  value: ConditionValue;
  onChange: (value: ConditionValue) => void;
  disabled?: boolean;
  /** Optional condition for validation display */
  condition?: PolicyCondition;
  /** Whether to show inline validation errors */
  showValidation?: boolean;
}

export function ValueInput({
  attributeId,
  operator,
  value,
  onChange,
  disabled,
  condition,
  showValidation = false,
}: ValueInputProps) {
  const attribute = getAttributeById(attributeId);

  // Create a synthetic condition for validation if not provided
  const conditionForValidation: PolicyCondition = condition || {
    id: "temp",
    category: attribute?.category || "user",
    attribute: attributeId,
    operator,
    value,
  };

  // Get validation result
  const validation = useConditionValidation(conditionForValidation);

  // No attribute selected
  if (!attribute) {
    return (
      <Input
        placeholder="Select attribute first"
        disabled
        className="flex-1"
      />
    );
  }

  // Exists/not exists don't need value input
  if (operator === "exists" || operator === "not_exists") {
    return (
      <div className="flex-1 px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md">
        (no value needed)
      </div>
    );
  }

  // Days of week - special checkbox list (before general enum handling)
  if (attribute.valueType === "days_of_week" && attribute.enumValues) {
    const selectedDays = Array.isArray(value) ? value.map(String) : [];
    const dayLabels: Record<string, string> = {
      "0": "Sun",
      "1": "Mon",
      "2": "Tue",
      "3": "Wed",
      "4": "Thu",
      "5": "Fri",
      "6": "Sat",
    };
    const dayOptions = attribute.enumValues;

    return (
      <div className="flex-1 flex gap-2">
        {dayOptions.map((day) => (
          <label
            key={day.value}
            className={`flex items-center justify-center w-10 h-8 text-xs rounded cursor-pointer border transition-colors ${
              selectedDays.includes(day.value)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted"
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={selectedDays.includes(day.value)}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange([...selectedDays, day.value]);
                } else {
                  onChange(selectedDays.filter((d) => d !== day.value));
                }
              }}
              disabled={disabled}
            />
            {dayLabels[day.value] || day.label}
          </label>
        ))}
      </div>
    );
  }

  // Enum values (role, environment, status)
  if (attribute.enumValues) {
    // Multi-select for "in" operators
    if (operator === "in" || operator === "not_in") {
      const selectedValues = Array.isArray(value) ? value.map(String) : [];

      return (
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap gap-1 min-h-[32px] p-1 border rounded-md">
            {selectedValues.map((v) => {
              const enumItem = attribute.enumValues?.find((e) => e.value === v);
              return (
                <Badge key={v} variant="secondary" className="gap-1">
                  {enumItem?.label || v}
                  <button
                    type="button"
                    onClick={() => {
                      onChange(selectedValues.filter((sv) => sv !== v));
                    }}
                    className="hover:bg-muted rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
            {selectedValues.length === 0 && (
              <span className="text-sm text-muted-foreground px-2 py-1">
                Select values...
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {attribute.enumValues.map((enumValue) => (
              <label
                key={enumValue.value}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <Checkbox
                  checked={selectedValues.includes(enumValue.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedValues, enumValue.value]);
                    } else {
                      onChange(selectedValues.filter((v) => v !== enumValue.value));
                    }
                  }}
                  disabled={disabled}
                />
                {enumValue.label}
              </label>
            ))}
          </div>
        </div>
      );
    }

    // Single select for equals
    return (
      <Select
        value={String(value || "")}
        onValueChange={(v) => onChange(v)}
        disabled={disabled}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder={attribute.placeholder || "Select..."} />
        </SelectTrigger>
        <SelectContent>
          {attribute.enumValues.map((enumValue) => (
            <SelectItem key={enumValue.value} value={enumValue.value}>
              {enumValue.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Team picker for team_ids - use dedicated TeamPicker
  if (attribute.valueType === "team_ids") {
    const multiple = operator === "in" || operator === "not_in";

    // Extract ResourceReference from value or create null
    const resourceValue: ResourceReference | null = isResourceReference(value)
      ? value
      : null;

    return (
      <div className="flex-1 space-y-1">
        <TeamPicker
          value={resourceValue}
          onChange={(ref) => onChange(ref as ConditionValue)}
          multiple={multiple}
          disabled={disabled}
          placeholder={attribute.placeholder}
        />
        {showValidation && validation.warnings.length > 0 && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {validation.warnings[0]}
          </p>
        )}
      </div>
    );
  }

  // Resource picker types (agent, deployment, gateway, etc.)
  if (
    attribute.valueType === "resource_id" ||
    attribute.valueType === "resource_ids"
  ) {
    const multiple =
      attribute.valueType === "resource_ids" ||
      operator === "in" ||
      operator === "not_in";

    // Extract ResourceReference from value or create null
    const resourceValue: ResourceReference | null = isResourceReference(value)
      ? value
      : null;

    return (
      <div className="flex-1 space-y-1">
        <ResourcePicker
          resourceType={attribute.resourceType || "agent"}
          value={resourceValue}
          onChange={(ref) => onChange(ref as ConditionValue)}
          multiple={multiple}
          disabled={disabled}
          placeholder={attribute.placeholder}
        />
        {showValidation && validation.warnings.length > 0 && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {validation.warnings[0]}
          </p>
        )}
      </div>
    );
  }

  // Time range - use TimePicker
  if (attribute.valueType === "time_range") {
    // Extract TimeRangeValue from value or use null
    const timeValue = typeof value === "object" &&
      value !== null &&
      "startHour" in value
      ? (value as import("../types").TimeRangeValue)
      : null;

    return (
      <TimePicker
        value={timeValue}
        onChange={(v) => onChange(v)}
        disabled={disabled}
      />
    );
  }

  // IP range - use dedicated IpRangeInput with validation
  if (attribute.valueType === "ip_range") {
    const multiple = operator === "in";
    const ipValue = multiple
      ? (Array.isArray(value) ? value.map(String) : [])
      : (typeof value === "string" ? value : "");

    return (
      <IpRangeInput
        value={ipValue}
        onChange={(v) => onChange(v)}
        multiple={multiple}
        disabled={disabled}
        placeholder={attribute.placeholder}
      />
    );
  }

  // Number input
  if (attribute.valueType === "number") {
    return (
      <Input
        type="number"
        value={String(value || "")}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder={attribute.placeholder}
        disabled={disabled}
        className="flex-1 w-24"
      />
    );
  }

  // Default: text input
  return (
    <Input
      value={String(value || "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder={attribute.placeholder || "Enter value..."}
      disabled={disabled}
      className="flex-1"
    />
  );
}
