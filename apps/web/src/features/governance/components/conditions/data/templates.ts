/**
 * Condition templates for quick policy creation
 */

import type { ConditionTemplate } from "../types";

export const templates: ConditionTemplate[] = [
  // Common Templates (shown in quick bar)
  {
    id: "team-access",
    name: "Team Access",
    description: "Restrict to specific teams",
    icon: "Users",
    category: "access",
    isCommon: true,
    conditions: [
      {
        category: "user",
        attribute: "user_team",
        operator: "in",
        value: [], // User selects teams
      },
    ],
  },
  {
    id: "business-hours",
    name: "Business Hours",
    description: "Allow only during work hours",
    icon: "Clock",
    category: "time",
    isCommon: true,
    conditions: [
      {
        category: "time",
        attribute: "time_hours",
        operator: "between",
        value: {
          startHour: 9,
          startMinute: 0,
          endHour: 17,
          endMinute: 0,
          days: [1, 2, 3, 4, 5], // Mon-Fri
        },
      },
    ],
  },
  {
    id: "ip-restriction",
    name: "IP Restriction",
    description: "Limit to specific IP ranges",
    icon: "Shield",
    category: "security",
    isCommon: true,
    conditions: [
      {
        category: "context",
        attribute: "context_ip",
        operator: "in",
        value: [], // User enters IPs
      },
    ],
  },
  {
    id: "specific-agent",
    name: "Specific Agent",
    description: "Control access to selected agents",
    icon: "Bot",
    category: "access",
    isCommon: true,
    conditions: [
      {
        category: "resource",
        attribute: "resource_agent",
        operator: "in",
        value: [], // User selects agents
      },
    ],
  },

  // Extended Access Templates
  {
    id: "admin-only",
    name: "Admin Only",
    description: "Restrict to admin roles",
    icon: "UserCog",
    category: "access",
    isCommon: false,
    conditions: [
      {
        category: "user",
        attribute: "user_role",
        operator: "in",
        value: ["org_admin", "org_owner"],
      },
    ],
  },
  {
    id: "company-email",
    name: "Company Email",
    description: "Require specific email domain",
    icon: "Mail",
    category: "access",
    isCommon: false,
    conditions: [
      {
        category: "user",
        attribute: "user_email_domain",
        operator: "equals",
        value: "", // User enters domain
      },
    ],
  },
  {
    id: "owner-only",
    name: "Resource Owner",
    description: "Only the creator can access",
    icon: "Lock",
    category: "access",
    isCommon: false,
    conditions: [
      {
        category: "resource",
        attribute: "resource_created_by",
        operator: "equals",
        value: "", // Special: context.user_id
      },
    ],
  },

  // Environment Templates
  {
    id: "production-only",
    name: "Production Only",
    description: "Restrict to production environment",
    icon: "Server",
    category: "environment",
    isCommon: false,
    conditions: [
      {
        category: "resource",
        attribute: "resource_environment",
        operator: "equals",
        value: "production",
      },
    ],
  },
  {
    id: "non-production",
    name: "Non-Production",
    description: "Allow only in dev/staging",
    icon: "Beaker",
    category: "environment",
    isCommon: false,
    conditions: [
      {
        category: "resource",
        attribute: "resource_environment",
        operator: "in",
        value: ["development", "staging"],
      },
    ],
  },
  {
    id: "active-only",
    name: "Active Resources",
    description: "Only active resources",
    icon: "CheckCircle",
    category: "environment",
    isCommon: false,
    conditions: [
      {
        category: "resource",
        attribute: "resource_status",
        operator: "equals",
        value: "active",
      },
    ],
  },

  // Time Templates
  {
    id: "weekdays-only",
    name: "Weekdays Only",
    description: "Monday through Friday",
    icon: "Calendar",
    category: "time",
    isCommon: false,
    conditions: [
      {
        category: "time",
        attribute: "time_days",
        operator: "in",
        value: ["1", "2", "3", "4", "5"],
      },
    ],
  },
  {
    id: "weekend-only",
    name: "Weekends Only",
    description: "Saturday and Sunday",
    icon: "CalendarOff",
    category: "time",
    isCommon: false,
    conditions: [
      {
        category: "time",
        attribute: "time_days",
        operator: "in",
        value: ["0", "6"],
      },
    ],
  },

  // Security Templates
  {
    id: "internal-network",
    name: "Internal Network",
    description: "Private IP ranges only",
    icon: "Network",
    category: "security",
    isCommon: false,
    conditions: [
      {
        category: "context",
        attribute: "context_ip",
        operator: "starts_with",
        value: "192.168.",
      },
    ],
  },
];

/**
 * Get common templates for quick bar
 */
export function getCommonTemplates(): ConditionTemplate[] {
  return templates.filter((t) => t.isCommon);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: ConditionTemplate["category"]): ConditionTemplate[] {
  return templates.filter((t) => t.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): ConditionTemplate | undefined {
  return templates.find((t) => t.id === id);
}

/**
 * Template categories with labels
 */
export const templateCategories = [
  { id: "access", label: "Access Control", icon: "Users" },
  { id: "time", label: "Time Restrictions", icon: "Clock" },
  { id: "security", label: "Security", icon: "Shield" },
  { id: "environment", label: "Environment", icon: "Server" },
] as const;
