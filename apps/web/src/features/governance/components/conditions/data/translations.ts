/**
 * Plain English translations for conditions
 */

import type { PolicyCondition, ConditionValue, TimeRangeValue } from "../types";
import { isResourceReference, isTimeRangeValue } from "../types";
import { attributeMap } from "./attributes";
import { operatorMap } from "./operators";

/**
 * Day names for display
 */
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Format time for display (12-hour format)
 */
function formatTime(hour: number, minute: number = 0): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  const displayMinute = minute.toString().padStart(2, "0");
  return minute === 0 ? `${displayHour} ${period}` : `${displayHour}:${displayMinute} ${period}`;
}

/**
 * Format days for display
 */
function formatDays(days: number[]): string {
  if (days.length === 0) return "no days";
  if (days.length === 7) return "every day";

  // Check for weekdays (Mon-Fri)
  const weekdays = [1, 2, 3, 4, 5];
  if (
    days.length === 5 &&
    weekdays.every((d) => days.includes(d)) &&
    !days.includes(0) &&
    !days.includes(6)
  ) {
    return "weekdays";
  }

  // Check for weekends
  if (days.length === 2 && days.includes(0) && days.includes(6)) {
    return "weekends";
  }

  // List individual days
  const sortedDays = [...days].sort((a, b) => a - b);
  return sortedDays.map((d) => dayNames[d]).join(", ");
}

/**
 * Format a time range for display
 */
function formatTimeRange(value: TimeRangeValue): string {
  const timeStr = `${formatTime(value.startHour, value.startMinute)} to ${formatTime(value.endHour, value.endMinute)}`;
  const daysStr = formatDays(value.days);
  return `${timeStr} on ${daysStr}`;
}

/**
 * Format a value for display
 */
function formatValue(value: ConditionValue, attributeId: string): string {
  if (value === null || value === undefined || value === "") {
    return "[not set]";
  }

  // Handle resource references
  if (isResourceReference(value)) {
    if (value.display?.name) {
      return value.display.names
        ? value.display.names.join(", ")
        : value.display.name;
    }
    if (value.selector.ids && value.selector.ids.length > 0) {
      return `${value.selector.ids.length} selected`;
    }
    if (value.selector.id) {
      return value.selector.id;
    }
    return "[select resource]";
  }

  // Handle time range
  if (isTimeRangeValue(value)) {
    return formatTimeRange(value);
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return "[none selected]";

    // Check if these are day values
    const attr = attributeMap.get(attributeId);
    if (attr?.valueType === "days_of_week") {
      const dayNumbers = value.map((v) => parseInt(String(v), 10));
      return formatDays(dayNumbers);
    }

    // Check for enum values
    if (attr?.enumValues) {
      const labels = value.map((v) => {
        const enumItem = attr.enumValues?.find((e) => e.value === String(v));
        return enumItem?.label || String(v);
      });
      return labels.join(", ");
    }

    return value.join(", ");
  }

  // Handle enum values
  const attr = attributeMap.get(attributeId);
  if (attr?.enumValues) {
    const enumItem = attr.enumValues.find((e) => e.value === String(value));
    if (enumItem) return enumItem.label;
  }

  return String(value);
}

/**
 * Translation templates for different condition patterns
 */
const translationTemplates: Record<string, string> = {
  // User conditions
  "user_email:equals": "User's email is {value}",
  "user_email:not_equals": "User's email is not {value}",
  "user_email:contains": "User's email contains '{value}'",
  "user_email_domain:equals": "User's email domain is {value}",
  "user_email_domain:in": "User's email domain is one of: {value}",
  "user_team:in": "User is a member of: {value}",
  "user_team:not_in": "User is not a member of: {value}",
  "user_role:equals": "User has the {value} role",
  "user_role:not_equals": "User does not have the {value} role",
  "user_role:in": "User has one of these roles: {value}",
  "user_id:in": "User is: {value}",
  "user_id:not_in": "User is not: {value}",

  // Resource conditions
  "resource_agent:in": "Agent is: {value}",
  "resource_agent:not_in": "Agent is not: {value}",
  "resource_deployment:in": "Deployment is: {value}",
  "resource_deployment:not_in": "Deployment is not: {value}",
  "resource_gateway:in": "Gateway is: {value}",
  "resource_gateway:not_in": "Gateway is not: {value}",
  "resource_pipeline:in": "Pipeline is: {value}",
  "resource_pipeline:not_in": "Pipeline is not: {value}",
  "resource_workspace:equals": "Workspace is: {value}",
  "resource_workspace:in": "Workspace is one of: {value}",
  "resource_environment:equals": "Environment is {value}",
  "resource_environment:in": "Environment is one of: {value}",
  "resource_environment:not_equals": "Environment is not {value}",
  "resource_status:equals": "Resource status is {value}",
  "resource_status:in": "Resource status is one of: {value}",
  "resource_created_by:equals": "Resource was created by: {value}",
  "resource_name_pattern:equals": "Resource name is '{value}'",
  "resource_name_pattern:contains": "Resource name contains '{value}'",
  "resource_name_pattern:starts_with": "Resource name starts with '{value}'",

  // Time conditions
  "time_hours:between": "Access is allowed {value}",
  "time_days:in": "Day is: {value}",
  "time_days:not_in": "Day is not: {value}",
  "time_hour_simple:equals": "Hour is {value}",
  "time_hour_simple:greater_than": "Hour is after {value}",
  "time_hour_simple:less_than": "Hour is before {value}",

  // Context conditions
  "context_ip:equals": "IP address is {value}",
  "context_ip:starts_with": "IP address starts with {value}",
  "context_ip:in": "IP address is in: {value}",
  "context_user_agent:contains": "User agent contains '{value}'",
};

/**
 * Generate a plain English translation for a condition
 */
export function translateCondition(condition: PolicyCondition): string {
  const { attribute, operator, value } = condition;

  // Check for specific template
  const templateKey = `${attribute}:${operator}`;
  const template = translationTemplates[templateKey];

  if (template) {
    const formattedValue = formatValue(value, attribute);
    return template.replace("{value}", formattedValue);
  }

  // Fallback to generic translation
  const attr = attributeMap.get(attribute);
  const op = operatorMap.get(operator);
  const attrLabel = attr?.label || attribute;
  const opLabel = op?.label || operator;
  const formattedValue = formatValue(value, attribute);

  return `${attrLabel} ${opLabel} ${formattedValue}`;
}

/**
 * Generate overall policy preview text
 */
export function translateConditions(
  conditions: PolicyCondition[],
  logic: "all" | "any"
): string {
  if (conditions.length === 0) {
    return "This policy applies to everyone, at any time, from anywhere.";
  }

  const translations = conditions.map(translateCondition);

  if (translations.length === 1) {
    return `Access is granted when: ${translations[0]}`;
  }

  return `Access is granted when ${logic === "all" ? "ALL" : "ANY"} of these are true:\n• ${translations.join(`\n• `)}`;
}
