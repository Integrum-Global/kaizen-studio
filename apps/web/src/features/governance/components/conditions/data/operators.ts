/**
 * Operator definitions for the condition builder
 */

import type { OperatorDefinition, AttributeValueType, ConditionOperator } from "../types";

export const operators: OperatorDefinition[] = [
  {
    id: "equals",
    label: "equals",
    description: "Exactly matches the value",
    applicableTypes: ["string", "number", "boolean", "email", "email_domain", "role", "environment", "status", "resource_id"],
  },
  {
    id: "not_equals",
    label: "does not equal",
    description: "Does not match the value",
    applicableTypes: ["string", "number", "boolean", "email", "email_domain", "role", "environment", "status", "resource_id"],
  },
  {
    id: "contains",
    label: "contains",
    description: "Contains the substring",
    applicableTypes: ["string", "email"],
  },
  {
    id: "not_contains",
    label: "does not contain",
    description: "Does not contain the substring",
    applicableTypes: ["string", "email"],
  },
  {
    id: "starts_with",
    label: "starts with",
    description: "Begins with the value",
    applicableTypes: ["string", "email", "ip_range"],
  },
  {
    id: "ends_with",
    label: "ends with",
    description: "Ends with the value",
    applicableTypes: ["string", "email", "email_domain"],
  },
  {
    id: "in",
    label: "is one of",
    description: "Matches any of the selected values",
    applicableTypes: ["string", "number", "role", "environment", "status", "resource_ids", "team_ids", "days_of_week", "ip_range"],
  },
  {
    id: "not_in",
    label: "is not one of",
    description: "Does not match any of the selected values",
    applicableTypes: ["string", "number", "role", "environment", "status", "resource_ids", "team_ids", "days_of_week"],
  },
  {
    id: "greater_than",
    label: "is greater than",
    description: "Numeric comparison (>)",
    applicableTypes: ["number"],
  },
  {
    id: "greater_than_or_equals",
    label: "is at least",
    description: "Numeric comparison (>=)",
    applicableTypes: ["number"],
  },
  {
    id: "less_than",
    label: "is less than",
    description: "Numeric comparison (<)",
    applicableTypes: ["number"],
  },
  {
    id: "less_than_or_equals",
    label: "is at most",
    description: "Numeric comparison (<=)",
    applicableTypes: ["number"],
  },
  {
    id: "between",
    label: "is between",
    description: "Falls within a range",
    applicableTypes: ["number", "time_range"],
  },
  {
    id: "exists",
    label: "exists",
    description: "Field has a value",
    applicableTypes: ["string", "number", "boolean"],
  },
  {
    id: "not_exists",
    label: "does not exist",
    description: "Field has no value",
    applicableTypes: ["string", "number", "boolean"],
  },
];

/**
 * Get operators applicable to a value type
 */
export function getOperatorsForType(valueType: AttributeValueType): OperatorDefinition[] {
  return operators.filter((op) => op.applicableTypes.includes(valueType));
}

/**
 * Get operator by ID
 */
export function getOperatorById(id: ConditionOperator): OperatorDefinition | undefined {
  return operators.find((op) => op.id === id);
}

/**
 * Operator map for quick lookup
 */
export const operatorMap = new Map(operators.map((op) => [op.id, op]));
