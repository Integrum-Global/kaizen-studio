/**
 * Enhanced condition types for the ABAC Condition Builder
 */

import type { ResourceType, ConditionOperator as GovernanceConditionOperator } from "../../../types";

// Re-export ConditionOperator from governance types for consistency
export type ConditionOperator = GovernanceConditionOperator;

/**
 * Condition categories for guided selection
 */
export type ConditionCategory = "user" | "resource" | "time" | "context";

/**
 * Value types for attributes
 */
export type AttributeValueType =
  | "string"
  | "number"
  | "boolean"
  | "email"
  | "email_domain"
  | "ip_range"
  | "time_range"
  | "resource_id"
  | "resource_ids"
  | "team_ids"
  | "role"
  | "environment"
  | "status"
  | "days_of_week";

/**
 * Resource reference for dynamic resource selection
 */
export interface ResourceReference {
  $ref: "resource";
  type: ResourceType | "team" | "user" | "workspace";
  selector: {
    id?: string;
    ids?: string[];
    filter?: Record<string, unknown>;
  };
  display?: {
    name: string;
    names?: string[];
    status: "valid" | "orphaned" | "changed";
    validatedAt: string;
  };
}

/**
 * Time range value for business hours conditions
 */
export interface TimeRangeValue {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  days: number[]; // 0-6, Sunday-Saturday
  timezone?: string;
}

/**
 * Possible condition values
 */
export type ConditionValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | TimeRangeValue
  | ResourceReference;

/**
 * Single policy condition
 */
export interface PolicyCondition {
  id: string;
  category: ConditionCategory;
  attribute: string;
  operator: ConditionOperator;
  value: ConditionValue;
}

/**
 * Condition group with logic operator
 */
export interface ConditionGroup {
  logic: "all" | "any";
  conditions: PolicyCondition[];
}

/**
 * Attribute definition for the condition builder
 */
export interface AttributeDefinition {
  id: string;
  path: string; // e.g., "user.email", "resource.status"
  label: string;
  description: string;
  category: ConditionCategory;
  valueType: AttributeValueType;
  operators: ConditionOperator[];
  resourceType?: ResourceType | "team" | "user" | "workspace"; // For resource_id type
  enumValues?: { value: string; label: string }[]; // For enum types
  placeholder?: string;
  validation?: {
    pattern?: string;
    message?: string;
  };
}

/**
 * Category definition for the condition builder
 */
export interface CategoryDefinition {
  id: ConditionCategory;
  label: string;
  description: string;
  icon: string; // Lucide icon name
}

/**
 * Operator definition with display info
 */
export interface OperatorDefinition {
  id: ConditionOperator;
  label: string;
  description: string;
  applicableTypes: AttributeValueType[];
}

/**
 * Template for quick condition creation
 */
export interface ConditionTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "access" | "time" | "security" | "environment";
  isCommon: boolean;
  conditions: Partial<PolicyCondition>[];
}

/**
 * Validation result for a condition
 */
export interface ConditionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Plain English translation of a condition
 */
export interface ConditionTranslation {
  text: string;
  isComplete: boolean;
}

/**
 * Check if a value is a ResourceReference
 */
export function isResourceReference(value: ConditionValue): value is ResourceReference {
  return typeof value === "object" && value !== null && "$ref" in value && value.$ref === "resource";
}

/**
 * Check if a value is a TimeRangeValue
 */
export function isTimeRangeValue(value: ConditionValue): value is TimeRangeValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "startHour" in value &&
    "endHour" in value &&
    "days" in value
  );
}

/**
 * Generate a unique condition ID
 */
export function generateConditionId(): string {
  return `cond_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create an empty condition
 */
export function createEmptyCondition(): PolicyCondition {
  return {
    id: generateConditionId(),
    category: "user",
    attribute: "",
    operator: "equals",
    value: "",
  };
}
