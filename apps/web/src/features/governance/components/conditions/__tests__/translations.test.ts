/**
 * Tests for condition translations
 *
 * These tests verify that conditions are translated to accurate, human-readable
 * plain English. This is critical for users to understand what their policies do.
 */

import { describe, it, expect } from "vitest";
import { translateCondition, translateConditions } from "../data/translations";
import type { PolicyCondition, TimeRangeValue, ResourceReference } from "../types";

describe("translateCondition", () => {
  describe("user conditions", () => {
    it("translates user email equals", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "user",
        attribute: "user_email",
        operator: "equals",
        value: "john@company.com",
      };

      expect(translateCondition(condition)).toBe("User's email is john@company.com");
    });

    it("translates user email not equals", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "user",
        attribute: "user_email",
        operator: "not_equals",
        value: "admin@company.com",
      };

      expect(translateCondition(condition)).toBe("User's email is not admin@company.com");
    });

    it("translates user email contains", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "user",
        attribute: "user_email",
        operator: "contains",
        value: "company",
      };

      expect(translateCondition(condition)).toBe("User's email contains 'company'");
    });

    it("translates user email domain equals", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "user",
        attribute: "user_email_domain",
        operator: "equals",
        value: "@acme.com",
      };

      expect(translateCondition(condition)).toBe("User's email domain is @acme.com");
    });

    it("translates user email domain in list", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "user",
        attribute: "user_email_domain",
        operator: "in",
        value: ["@acme.com", "@partner.org"],
      };

      expect(translateCondition(condition)).toBe("User's email domain is one of: @acme.com, @partner.org");
    });

    it("translates user team membership", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "user",
        attribute: "user_team",
        operator: "in",
        value: {
          $ref: "resource",
          type: "team",
          selector: { ids: ["team-1", "team-2"] },
          display: {
            name: "Engineering",
            names: ["Engineering", "Product"],
            status: "valid",
            validatedAt: new Date().toISOString(),
          },
        } as ResourceReference,
      };

      expect(translateCondition(condition)).toBe("User is a member of: Engineering, Product");
    });

    it("translates user team not in", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "user",
        attribute: "user_team",
        operator: "not_in",
        value: {
          $ref: "resource",
          type: "team",
          selector: { ids: ["team-1"] },
          display: {
            name: "External",
            status: "valid",
            validatedAt: new Date().toISOString(),
          },
        } as ResourceReference,
      };

      expect(translateCondition(condition)).toBe("User is not a member of: External");
    });

    it("translates user role equals with enum label", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "user",
        attribute: "user_role",
        operator: "equals",
        value: "org_admin",
      };

      expect(translateCondition(condition)).toBe("User has the Organization Admin role");
    });

    it("translates user role not equals", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "user",
        attribute: "user_role",
        operator: "not_equals",
        value: "viewer",
      };

      expect(translateCondition(condition)).toBe("User does not have the Viewer role");
    });

    it("translates user role in list", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "user",
        attribute: "user_role",
        operator: "in",
        value: ["org_admin", "developer"],
      };

      expect(translateCondition(condition)).toBe("User has one of these roles: Organization Admin, Developer");
    });

    it("translates specific user ID", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "user",
        attribute: "user_id",
        operator: "in",
        value: {
          $ref: "resource",
          type: "user",
          selector: { ids: ["user-123"] },
          display: {
            name: "John Smith",
            status: "valid",
            validatedAt: new Date().toISOString(),
          },
        } as ResourceReference,
      };

      expect(translateCondition(condition)).toBe("User is: John Smith");
    });
  });

  describe("resource conditions", () => {
    it("translates agent selection", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "resource",
        attribute: "resource_agent",
        operator: "in",
        value: {
          $ref: "resource",
          type: "agent",
          selector: { ids: ["agent-1", "agent-2"] },
          display: {
            name: "Customer Support Bot",
            names: ["Customer Support Bot", "Sales Assistant"],
            status: "valid",
            validatedAt: new Date().toISOString(),
          },
        } as ResourceReference,
      };

      expect(translateCondition(condition)).toBe("Agent is: Customer Support Bot, Sales Assistant");
    });

    it("translates agent not in", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "resource",
        attribute: "resource_agent",
        operator: "not_in",
        value: {
          $ref: "resource",
          type: "agent",
          selector: { ids: ["agent-1"] },
          display: {
            name: "Internal Bot",
            status: "valid",
            validatedAt: new Date().toISOString(),
          },
        } as ResourceReference,
      };

      expect(translateCondition(condition)).toBe("Agent is not: Internal Bot");
    });

    it("translates deployment selection", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "resource",
        attribute: "resource_deployment",
        operator: "in",
        value: {
          $ref: "resource",
          type: "deployment",
          selector: { ids: ["deploy-1"] },
          display: {
            name: "Production v2.1",
            status: "valid",
            validatedAt: new Date().toISOString(),
          },
        } as ResourceReference,
      };

      expect(translateCondition(condition)).toBe("Deployment is: Production v2.1");
    });

    it("translates environment equals with enum label", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "resource",
        attribute: "resource_environment",
        operator: "equals",
        value: "production",
      };

      expect(translateCondition(condition)).toBe("Environment is Production");
    });

    it("translates environment in list", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "resource",
        attribute: "resource_environment",
        operator: "in",
        value: ["staging", "development"],
      };

      expect(translateCondition(condition)).toBe("Environment is one of: Staging, Development");
    });

    it("translates environment not equals", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "resource",
        attribute: "resource_environment",
        operator: "not_equals",
        value: "production",
      };

      expect(translateCondition(condition)).toBe("Environment is not Production");
    });

    it("translates resource status equals", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "resource",
        attribute: "resource_status",
        operator: "equals",
        value: "active",
      };

      expect(translateCondition(condition)).toBe("Resource status is Active");
    });

    it("translates resource status in list", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "resource",
        attribute: "resource_status",
        operator: "in",
        value: ["active", "draft"],
      };

      expect(translateCondition(condition)).toBe("Resource status is one of: Active, Draft");
    });

    it("translates created by", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "resource",
        attribute: "resource_created_by",
        operator: "equals",
        value: {
          $ref: "resource",
          type: "user",
          selector: { id: "user-123" },
          display: {
            name: "Jane Doe",
            status: "valid",
            validatedAt: new Date().toISOString(),
          },
        } as ResourceReference,
      };

      expect(translateCondition(condition)).toBe("Resource was created by: Jane Doe");
    });

    it("translates name pattern equals", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "resource",
        attribute: "resource_name_pattern",
        operator: "equals",
        value: "HR-Bot",
      };

      expect(translateCondition(condition)).toBe("Resource name is 'HR-Bot'");
    });

    it("translates name pattern contains", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "resource",
        attribute: "resource_name_pattern",
        operator: "contains",
        value: "prod",
      };

      expect(translateCondition(condition)).toBe("Resource name contains 'prod'");
    });

    it("translates name pattern starts with", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "resource",
        attribute: "resource_name_pattern",
        operator: "starts_with",
        value: "API-",
      };

      expect(translateCondition(condition)).toBe("Resource name starts with 'API-'");
    });
  });

  describe("time conditions", () => {
    it("translates business hours with weekdays", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "time",
        attribute: "time_hours",
        operator: "between",
        value: {
          startHour: 9,
          startMinute: 0,
          endHour: 17,
          endMinute: 0,
          days: [1, 2, 3, 4, 5],
        } as TimeRangeValue,
      };

      expect(translateCondition(condition)).toBe("Access is allowed 9 AM to 5 PM on weekdays");
    });

    it("translates business hours with weekends", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "time",
        attribute: "time_hours",
        operator: "between",
        value: {
          startHour: 10,
          startMinute: 30,
          endHour: 18,
          endMinute: 30,
          days: [0, 6],
        } as TimeRangeValue,
      };

      expect(translateCondition(condition)).toBe("Access is allowed 10:30 AM to 6:30 PM on weekends");
    });

    it("translates business hours with all days", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "time",
        attribute: "time_hours",
        operator: "between",
        value: {
          startHour: 0,
          startMinute: 0,
          endHour: 23,
          endMinute: 59,
          days: [0, 1, 2, 3, 4, 5, 6],
        } as TimeRangeValue,
      };

      expect(translateCondition(condition)).toBe("Access is allowed 12 AM to 11:59 PM on every day");
    });

    it("translates business hours with specific days", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "time",
        attribute: "time_hours",
        operator: "between",
        value: {
          startHour: 8,
          startMinute: 0,
          endHour: 12,
          endMinute: 0,
          days: [1, 3, 5],
        } as TimeRangeValue,
      };

      expect(translateCondition(condition)).toBe("Access is allowed 8 AM to 12 PM on Monday, Wednesday, Friday");
    });

    it("translates days of week in list", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "time",
        attribute: "time_days",
        operator: "in",
        value: ["1", "2", "3", "4", "5"],
      };

      expect(translateCondition(condition)).toBe("Day is: weekdays");
    });

    it("translates days of week not in", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "time",
        attribute: "time_days",
        operator: "not_in",
        value: ["0", "6"],
      };

      expect(translateCondition(condition)).toBe("Day is not: weekends");
    });

    it("translates hour equals", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "time",
        attribute: "time_hour_simple",
        operator: "equals",
        value: "14",
      };

      expect(translateCondition(condition)).toBe("Hour is 14");
    });

    it("translates hour greater than", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "time",
        attribute: "time_hour_simple",
        operator: "greater_than",
        value: "17",
      };

      expect(translateCondition(condition)).toBe("Hour is after 17");
    });

    it("translates hour less than", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "time",
        attribute: "time_hour_simple",
        operator: "less_than",
        value: "9",
      };

      expect(translateCondition(condition)).toBe("Hour is before 9");
    });
  });

  describe("context conditions", () => {
    it("translates IP address equals", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "context",
        attribute: "context_ip",
        operator: "equals",
        value: "192.168.1.100",
      };

      expect(translateCondition(condition)).toBe("IP address is 192.168.1.100");
    });

    it("translates IP address starts with", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "context",
        attribute: "context_ip",
        operator: "starts_with",
        value: "10.0.",
      };

      expect(translateCondition(condition)).toBe("IP address starts with 10.0.");
    });

    it("translates IP address in list", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "context",
        attribute: "context_ip",
        operator: "in",
        value: ["192.168.1.0/24", "10.0.0.0/8"],
      };

      expect(translateCondition(condition)).toBe("IP address is in: 192.168.1.0/24, 10.0.0.0/8");
    });

    it("translates user agent contains", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "context",
        attribute: "context_user_agent",
        operator: "contains",
        value: "Chrome",
      };

      expect(translateCondition(condition)).toBe("User agent contains 'Chrome'");
    });
  });

  describe("edge cases", () => {
    it("handles empty value", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "user",
        attribute: "user_email",
        operator: "equals",
        value: "",
      };

      expect(translateCondition(condition)).toBe("User's email is [not set]");
    });

    it("handles null value", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "user",
        attribute: "user_email",
        operator: "equals",
        value: null as unknown as string,
      };

      expect(translateCondition(condition)).toBe("User's email is [not set]");
    });

    it("handles empty array value", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "user",
        attribute: "user_role",
        operator: "in",
        value: [],
      };

      expect(translateCondition(condition)).toBe("User has one of these roles: [none selected]");
    });

    it("handles resource reference without display name", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "resource",
        attribute: "resource_agent",
        operator: "in",
        value: {
          $ref: "resource",
          type: "agent",
          selector: { ids: ["agent-1", "agent-2"] },
        } as ResourceReference,
      };

      expect(translateCondition(condition)).toBe("Agent is: 2 selected");
    });

    it("handles resource reference with single ID and no display", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "resource",
        attribute: "resource_workspace",
        operator: "equals",
        value: {
          $ref: "resource",
          type: "workspace",
          selector: { id: "ws-123" },
        } as ResourceReference,
      };

      expect(translateCondition(condition)).toBe("Workspace is: ws-123");
    });

    it("falls back to generic translation for unknown template", () => {
      const condition: PolicyCondition = {
        id: "1",
        category: "user",
        attribute: "unknown_attr",
        operator: "equals",
        value: "test",
      };

      // Should fall back to generic: "{label} {operator} {value}"
      const result = translateCondition(condition);
      expect(result).toContain("equals");
      expect(result).toContain("test");
    });
  });
});

describe("translateConditions", () => {
  it("returns default message for empty conditions", () => {
    const result = translateConditions([], "all");
    expect(result).toBe("This policy applies to everyone, at any time, from anywhere.");
  });

  it("formats single condition", () => {
    const conditions: PolicyCondition[] = [
      {
        id: "1",
        category: "user",
        attribute: "user_email",
        operator: "equals",
        value: "admin@company.com",
      },
    ];

    const result = translateConditions(conditions, "all");
    expect(result).toBe("Access is granted when: User's email is admin@company.com");
  });

  it("formats multiple conditions with ALL logic", () => {
    const conditions: PolicyCondition[] = [
      {
        id: "1",
        category: "user",
        attribute: "user_role",
        operator: "equals",
        value: "org_admin",
      },
      {
        id: "2",
        category: "resource",
        attribute: "resource_environment",
        operator: "equals",
        value: "production",
      },
    ];

    const result = translateConditions(conditions, "all");

    expect(result).toContain("Access is granted when ALL of these are true:");
    expect(result).toContain("User has the Organization Admin role");
    expect(result).toContain("Environment is Production");
  });

  it("formats multiple conditions with ANY logic", () => {
    const conditions: PolicyCondition[] = [
      {
        id: "1",
        category: "user",
        attribute: "user_email_domain",
        operator: "equals",
        value: "@company.com",
      },
      {
        id: "2",
        category: "context",
        attribute: "context_ip",
        operator: "starts_with",
        value: "192.168.",
      },
    ];

    const result = translateConditions(conditions, "any");

    expect(result).toContain("Access is granted when ANY of these are true:");
    expect(result).toContain("User's email domain is @company.com");
    expect(result).toContain("IP address starts with 192.168.");
  });

  it("uses bullet points for multiple conditions", () => {
    const conditions: PolicyCondition[] = [
      {
        id: "1",
        category: "user",
        attribute: "user_role",
        operator: "equals",
        value: "developer",
      },
      {
        id: "2",
        category: "time",
        attribute: "time_hours",
        operator: "between",
        value: {
          startHour: 9,
          startMinute: 0,
          endHour: 17,
          endMinute: 0,
          days: [1, 2, 3, 4, 5],
        },
      },
    ];

    const result = translateConditions(conditions, "all");

    // Should contain bullet points for each condition
    const bulletCount = (result.match(/\u2022/g) || []).length;
    expect(bulletCount).toBe(2);
  });
});
