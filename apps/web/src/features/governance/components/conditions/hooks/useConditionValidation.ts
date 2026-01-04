/**
 * useConditionValidation - Hook for validating conditions based on attribute type
 * Returns validation state including errors and warnings
 */

import { useMemo } from "react";
import type {
  PolicyCondition,
  ConditionValue,
  TimeRangeValue,
  ResourceReference,
} from "../types";
import { isResourceReference, isTimeRangeValue } from "../types";
import { getAttributeById } from "../data/attributes";
import { isValidIpOrCidr } from "../inputs/IpRangeInput";

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate an email address
 */
function validateEmail(email: string): string | null {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return "Invalid email address format";
  }
  return null;
}

/**
 * Validate an email domain
 */
function validateEmailDomain(domain: string): string | null {
  const domainPattern = /^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!domainPattern.test(domain)) {
    return "Domain must start with @ (e.g., @company.com)";
  }
  return null;
}

/**
 * Validate IP address or CIDR range
 */
function validateIpRange(value: string | string[]): string | null {
  if (Array.isArray(value)) {
    const invalidIps = value.filter((ip) => !isValidIpOrCidr(ip));
    if (invalidIps.length > 0) {
      return `Invalid IP addresses: ${invalidIps.join(", ")}`;
    }
    return null;
  }

  if (!isValidIpOrCidr(value)) {
    return "Invalid IP address or CIDR range format";
  }
  return null;
}

/**
 * Validate time range value
 */
function validateTimeRange(value: TimeRangeValue): string | null {
  // Validate hours
  if (value.startHour < 0 || value.startHour > 23) {
    return "Start hour must be between 0 and 23";
  }
  if (value.endHour < 0 || value.endHour > 23) {
    return "End hour must be between 0 and 23";
  }

  // Validate minutes
  if (value.startMinute < 0 || value.startMinute > 59) {
    return "Start minute must be between 0 and 59";
  }
  if (value.endMinute < 0 || value.endMinute > 59) {
    return "End minute must be between 0 and 59";
  }

  // Validate days
  if (!value.days || value.days.length === 0) {
    return "At least one day must be selected";
  }
  const invalidDays = value.days.filter((d) => d < 0 || d > 6);
  if (invalidDays.length > 0) {
    return "Invalid day values (must be 0-6)";
  }

  return null;
}

/**
 * Validate resource reference
 */
function validateResourceReference(
  ref: ResourceReference
): { error: string | null; warning: string | null } {
  // Check if reference has valid selector
  if (!ref.selector.id && (!ref.selector.ids || ref.selector.ids.length === 0)) {
    return {
      error: "No resource selected",
      warning: null,
    };
  }

  // Check for orphaned status
  if (ref.display?.status === "orphaned") {
    return {
      error: null,
      warning: "Referenced resource may have been deleted",
    };
  }

  // Check for changed status
  if (ref.display?.status === "changed") {
    return {
      error: null,
      warning: "Referenced resource has been modified since selection",
    };
  }

  return { error: null, warning: null };
}

/**
 * Validate a number value
 */
function validateNumber(
  value: number,
  min?: number,
  max?: number
): string | null {
  if (typeof value !== "number" || isNaN(value)) {
    return "Value must be a number";
  }
  if (min !== undefined && value < min) {
    return `Value must be at least ${min}`;
  }
  if (max !== undefined && value > max) {
    return `Value must be at most ${max}`;
  }
  return null;
}

/**
 * Validate value based on attribute type
 */
function validateValueByType(
  value: ConditionValue,
  attributeId: string
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const attribute = getAttributeById(attributeId);
  if (!attribute) {
    // Can't validate without attribute definition
    return { errors, warnings };
  }

  switch (attribute.valueType) {
    case "email":
      if (typeof value === "string") {
        const error = validateEmail(value);
        if (error) errors.push(error);
      }
      break;

    case "email_domain":
      if (typeof value === "string") {
        const error = validateEmailDomain(value);
        if (error) errors.push(error);
      }
      break;

    case "ip_range":
      if (typeof value === "string" || Array.isArray(value)) {
        const error = validateIpRange(value as string | string[]);
        if (error) errors.push(error);
      }
      break;

    case "time_range":
      if (isTimeRangeValue(value)) {
        const error = validateTimeRange(value);
        if (error) errors.push(error);
      }
      break;

    case "resource_id":
    case "resource_ids":
    case "team_ids":
      if (isResourceReference(value)) {
        const { error, warning } = validateResourceReference(value);
        if (error) errors.push(error);
        if (warning) warnings.push(warning);
      }
      break;

    case "number":
      if (typeof value === "number") {
        // Check for hour validation (0-23)
        if (attributeId === "time_hour_simple") {
          const error = validateNumber(value, 0, 23);
          if (error) errors.push(error);
        }
      }
      break;

    case "days_of_week":
      if (Array.isArray(value)) {
        if (value.length === 0) {
          errors.push("At least one day must be selected");
        }
      }
      break;

    default:
      // For string, boolean, enum types - use attribute-level validation if defined
      if (attribute.validation && typeof value === "string" && value) {
        const regex = new RegExp(attribute.validation.pattern!);
        if (!regex.test(value)) {
          errors.push(attribute.validation.message || "Invalid format");
        }
      }
      break;
  }

  return { errors, warnings };
}

/**
 * Main validation hook for a single condition
 */
export function useConditionValidation(
  condition: PolicyCondition
): ValidationResult {
  return useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check attribute is selected
    if (!condition.attribute) {
      errors.push("Please select an attribute");
      return { isValid: false, errors, warnings };
    }

    // Get attribute definition
    const attribute = getAttributeById(condition.attribute);
    if (!attribute) {
      warnings.push("Unknown attribute type");
    }

    // Check value is set (except for exists/not_exists operators)
    if (condition.operator !== "exists" && condition.operator !== "not_exists") {
      const value = condition.value;

      // Check for empty values
      if (value === null || value === undefined || value === "") {
        errors.push("Please enter a value");
      } else if (Array.isArray(value) && value.length === 0) {
        errors.push("Please select at least one value");
      } else if (
        isResourceReference(value) &&
        !value.selector.id &&
        (!value.selector.ids || value.selector.ids.length === 0)
      ) {
        errors.push("Please select a resource");
      } else {
        // Validate value by type
        const { errors: typeErrors, warnings: typeWarnings } = validateValueByType(
          value,
          condition.attribute
        );
        errors.push(...typeErrors);
        warnings.push(...typeWarnings);
      }
    }

    // Check operator is valid for attribute type
    if (attribute && !attribute.operators.includes(condition.operator)) {
      warnings.push(
        `Operator "${condition.operator}" may not be suitable for this attribute type`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [condition]);
}

/**
 * Validate multiple conditions at once
 */
export function useConditionsValidation(
  conditions: PolicyCondition[]
): Map<string, ValidationResult> {
  return useMemo(() => {
    const results = new Map<string, ValidationResult>();

    for (const condition of conditions) {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check attribute is selected
      if (!condition.attribute) {
        errors.push("Please select an attribute");
        results.set(condition.id, { isValid: false, errors, warnings });
        continue;
      }

      // Get attribute definition
      const attribute = getAttributeById(condition.attribute);
      if (!attribute) {
        warnings.push("Unknown attribute type");
      }

      // Check value is set (except for exists/not_exists operators)
      if (condition.operator !== "exists" && condition.operator !== "not_exists") {
        const value = condition.value;

        if (value === null || value === undefined || value === "") {
          errors.push("Please enter a value");
        } else if (Array.isArray(value) && value.length === 0) {
          errors.push("Please select at least one value");
        } else if (
          isResourceReference(value) &&
          !value.selector.id &&
          (!value.selector.ids || value.selector.ids.length === 0)
        ) {
          errors.push("Please select a resource");
        } else {
          const { errors: typeErrors, warnings: typeWarnings } = validateValueByType(
            value,
            condition.attribute
          );
          errors.push(...typeErrors);
          warnings.push(...typeWarnings);
        }
      }

      // Check operator is valid for attribute type
      if (attribute && !attribute.operators.includes(condition.operator)) {
        warnings.push(
          `Operator "${condition.operator}" may not be suitable for this attribute type`
        );
      }

      results.set(condition.id, {
        isValid: errors.length === 0,
        errors,
        warnings,
      });
    }

    return results;
  }, [conditions]);
}

/**
 * Export validation utilities for direct use
 */
export {
  validateEmail,
  validateEmailDomain,
  validateIpRange,
  validateTimeRange,
  validateResourceReference,
  validateNumber,
  validateValueByType,
};
