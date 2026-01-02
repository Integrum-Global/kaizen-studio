/**
 * Attribute definitions for the condition builder
 */

import type { AttributeDefinition, ConditionCategory } from "../types";

/**
 * User-related attributes (WHO)
 */
const userAttributes: AttributeDefinition[] = [
  {
    id: "user_email",
    path: "user.email",
    label: "Email",
    description: "User's email address",
    category: "user",
    valueType: "email",
    operators: ["equals", "not_equals", "contains", "starts_with", "ends_with"],
    placeholder: "john@company.com",
    validation: {
      pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
      message: "Enter a valid email address",
    },
  },
  {
    id: "user_email_domain",
    path: "user.email_domain",
    label: "Email Domain",
    description: "User's email domain (e.g., @company.com)",
    category: "user",
    valueType: "email_domain",
    operators: ["equals", "not_equals", "in", "not_in"],
    placeholder: "@company.com",
    validation: {
      pattern: "^@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      message: "Domain must start with @ (e.g., @company.com)",
    },
  },
  {
    id: "user_team",
    path: "user.team_id",
    label: "Team",
    description: "User's team membership",
    category: "user",
    valueType: "team_ids",
    resourceType: "team",
    operators: ["in", "not_in"],
    placeholder: "Select teams...",
  },
  {
    id: "user_role",
    path: "user.role",
    label: "Role",
    description: "User's assigned role",
    category: "user",
    valueType: "role",
    operators: ["equals", "not_equals", "in", "not_in"],
    enumValues: [
      { value: "org_owner", label: "Organization Owner" },
      { value: "org_admin", label: "Organization Admin" },
      { value: "developer", label: "Developer" },
      { value: "viewer", label: "Viewer" },
    ],
  },
  {
    id: "user_id",
    path: "user.id",
    label: "Specific User",
    description: "Specific user by ID",
    category: "user",
    valueType: "resource_ids",
    resourceType: "user",
    operators: ["in", "not_in"],
    placeholder: "Select users...",
  },
];

/**
 * Resource-related attributes (WHAT)
 */
const resourceAttributes: AttributeDefinition[] = [
  {
    id: "resource_agent",
    path: "resource.agent_id",
    label: "Agent",
    description: "Select specific agents from the registry",
    category: "resource",
    valueType: "resource_ids",
    resourceType: "agent",
    operators: ["in", "not_in"],
    placeholder: "Select agents...",
  },
  {
    id: "resource_deployment",
    path: "resource.deployment_id",
    label: "Deployment",
    description: "Select specific deployments",
    category: "resource",
    valueType: "resource_ids",
    resourceType: "deployment",
    operators: ["in", "not_in"],
    placeholder: "Select deployments...",
  },
  {
    id: "resource_gateway",
    path: "resource.gateway_id",
    label: "Gateway",
    description: "Select specific gateways",
    category: "resource",
    valueType: "resource_ids",
    resourceType: "gateway",
    operators: ["in", "not_in"],
    placeholder: "Select gateways...",
  },
  {
    id: "resource_pipeline",
    path: "resource.pipeline_id",
    label: "Pipeline",
    description: "Select specific pipelines",
    category: "resource",
    valueType: "resource_ids",
    resourceType: "pipeline",
    operators: ["in", "not_in"],
    placeholder: "Select pipelines...",
  },
  {
    id: "resource_environment",
    path: "resource.environment",
    label: "Environment",
    description: "Resource environment (production, staging, development)",
    category: "resource",
    valueType: "environment",
    operators: ["equals", "not_equals", "in", "not_in"],
    enumValues: [
      { value: "production", label: "Production" },
      { value: "staging", label: "Staging" },
      { value: "development", label: "Development" },
    ],
  },
  {
    id: "resource_status",
    path: "resource.status",
    label: "Status",
    description: "Resource status",
    category: "resource",
    valueType: "status",
    operators: ["equals", "not_equals", "in", "not_in"],
    enumValues: [
      { value: "active", label: "Active" },
      { value: "draft", label: "Draft" },
      { value: "inactive", label: "Inactive" },
      { value: "archived", label: "Archived" },
    ],
  },
  {
    id: "resource_workspace",
    path: "resource.workspace_id",
    label: "Workspace",
    description: "Workspace containing the resource",
    category: "resource",
    valueType: "resource_id",
    resourceType: "workspace",
    operators: ["equals", "not_equals", "in", "not_in"],
    placeholder: "Select workspace...",
  },
  {
    id: "resource_created_by",
    path: "resource.created_by",
    label: "Created By",
    description: "User who created the resource",
    category: "resource",
    valueType: "resource_id",
    resourceType: "user",
    operators: ["equals", "not_equals"],
    placeholder: "Select user...",
  },
  {
    id: "resource_name_pattern",
    path: "resource.name",
    label: "Name Pattern (Advanced)",
    description: "Match resources by name pattern (e.g., 'HR-*' or contains 'prod')",
    category: "resource",
    valueType: "string",
    operators: ["equals", "not_equals", "contains", "starts_with", "ends_with"],
    placeholder: "e.g., HR-* or production",
  },
];

/**
 * Time-related attributes (WHEN)
 */
const timeAttributes: AttributeDefinition[] = [
  {
    id: "time_hours",
    path: "context.time.hour",
    label: "Business Hours",
    description: "Time of day restrictions",
    category: "time",
    valueType: "time_range",
    operators: ["between"],
  },
  {
    id: "time_days",
    path: "context.time.day_of_week",
    label: "Days of Week",
    description: "Specific days allowed",
    category: "time",
    valueType: "days_of_week",
    operators: ["in", "not_in"],
    enumValues: [
      { value: "0", label: "Sunday" },
      { value: "1", label: "Monday" },
      { value: "2", label: "Tuesday" },
      { value: "3", label: "Wednesday" },
      { value: "4", label: "Thursday" },
      { value: "5", label: "Friday" },
      { value: "6", label: "Saturday" },
    ],
  },
  {
    id: "time_hour_simple",
    path: "context.time.hour",
    label: "Hour of Day",
    description: "Specific hour (0-23)",
    category: "time",
    valueType: "number",
    operators: ["equals", "greater_than", "greater_than_or_equals", "less_than", "less_than_or_equals"],
    placeholder: "0-23",
    validation: {
      pattern: "^([0-9]|1[0-9]|2[0-3])$",
      message: "Enter an hour between 0 and 23",
    },
  },
];

/**
 * Context-related attributes (WHERE)
 */
const contextAttributes: AttributeDefinition[] = [
  {
    id: "context_ip",
    path: "context.ip",
    label: "IP Address",
    description: "Client IP address or CIDR range",
    category: "context",
    valueType: "ip_range",
    operators: ["equals", "starts_with", "in"],
    placeholder: "192.168.1.0/24",
    validation: {
      pattern: "^(\\d{1,3}\\.){3}\\d{1,3}(\\/\\d{1,2})?$",
      message: "Enter valid IP or CIDR (e.g., 192.168.1.0/24)",
    },
  },
  {
    id: "context_user_agent",
    path: "context.user_agent",
    label: "User Agent",
    description: "Client user agent string",
    category: "context",
    valueType: "string",
    operators: ["contains", "starts_with", "not_contains"],
    placeholder: "e.g., Mozilla",
  },
];

/**
 * All attributes combined
 */
export const attributes: AttributeDefinition[] = [
  ...userAttributes,
  ...resourceAttributes,
  ...timeAttributes,
  ...contextAttributes,
];

/**
 * Get attributes by category
 */
export function getAttributesByCategory(category: ConditionCategory): AttributeDefinition[] {
  return attributes.filter((a) => a.category === category);
}

/**
 * Get attribute by ID
 */
export function getAttributeById(id: string): AttributeDefinition | undefined {
  return attributes.find((a) => a.id === id);
}

/**
 * Get attribute by path
 */
export function getAttributeByPath(path: string): AttributeDefinition | undefined {
  return attributes.find((a) => a.path === path);
}

/**
 * Attribute map for quick lookup
 */
export const attributeMap = new Map(attributes.map((a) => [a.id, a]));
export const attributePathMap = new Map(attributes.map((a) => [a.path, a]));
