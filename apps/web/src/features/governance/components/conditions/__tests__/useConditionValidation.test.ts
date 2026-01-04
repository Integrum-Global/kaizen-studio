/**
 * Tests for useConditionValidation hook and validation utilities
 *
 * These tests verify the validation logic for various condition types.
 *
 * Note: Validation utilities are tested directly (NO MOCKING) per testing policy.
 * The hooks are tested with renderHook from @testing-library/react.
 */

import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useConditionValidation,
  useConditionsValidation,
  validateEmail,
  validateEmailDomain,
  validateIpRange,
  validateTimeRange,
  validateResourceReference,
  validateNumber,
  validateValueByType,
} from "../hooks/useConditionValidation";
import type {
  PolicyCondition,
  TimeRangeValue,
  ResourceReference,
} from "../types";

describe("Validation Utilities", () => {
  describe("validateEmail", () => {
    it("returns null for valid email", () => {
      expect(validateEmail("user@example.com")).toBeNull();
    });

    it("returns null for email with subdomain", () => {
      expect(validateEmail("user@mail.example.com")).toBeNull();
    });

    it("returns null for email with plus sign", () => {
      expect(validateEmail("user+tag@example.com")).toBeNull();
    });

    it("returns null for email with dots in local part", () => {
      expect(validateEmail("first.last@example.com")).toBeNull();
    });

    it("returns error for email without @", () => {
      expect(validateEmail("userexample.com")).toBe("Invalid email address format");
    });

    it("returns error for email without domain", () => {
      expect(validateEmail("user@")).toBe("Invalid email address format");
    });

    it("returns error for email without local part", () => {
      expect(validateEmail("@example.com")).toBe("Invalid email address format");
    });

    it("returns error for email with spaces", () => {
      expect(validateEmail("user @example.com")).toBe("Invalid email address format");
    });

    it("returns error for email without TLD", () => {
      expect(validateEmail("user@example")).toBe("Invalid email address format");
    });

    it("returns error for empty string", () => {
      expect(validateEmail("")).toBe("Invalid email address format");
    });
  });

  describe("validateEmailDomain", () => {
    it("returns null for valid domain with @", () => {
      expect(validateEmailDomain("@example.com")).toBeNull();
    });

    it("returns null for domain with subdomain", () => {
      expect(validateEmailDomain("@mail.example.com")).toBeNull();
    });

    it("returns null for domain with hyphen", () => {
      expect(validateEmailDomain("@my-company.com")).toBeNull();
    });

    it("returns error for domain without @", () => {
      expect(validateEmailDomain("example.com")).toBe(
        "Domain must start with @ (e.g., @company.com)"
      );
    });

    it("returns error for @ only", () => {
      expect(validateEmailDomain("@")).toBe(
        "Domain must start with @ (e.g., @company.com)"
      );
    });

    it("returns error for domain without TLD", () => {
      expect(validateEmailDomain("@example")).toBe(
        "Domain must start with @ (e.g., @company.com)"
      );
    });

    it("returns error for single-letter TLD", () => {
      expect(validateEmailDomain("@example.c")).toBe(
        "Domain must start with @ (e.g., @company.com)"
      );
    });

    it("returns error for empty string", () => {
      expect(validateEmailDomain("")).toBe(
        "Domain must start with @ (e.g., @company.com)"
      );
    });
  });

  describe("validateIpRange", () => {
    it("returns null for valid single IP", () => {
      expect(validateIpRange("192.168.1.1")).toBeNull();
    });

    it("returns null for valid CIDR", () => {
      expect(validateIpRange("192.168.0.0/24")).toBeNull();
    });

    it("returns null for valid IP array", () => {
      expect(validateIpRange(["192.168.1.1", "10.0.0.1"])).toBeNull();
    });

    it("returns null for valid mixed IP/CIDR array", () => {
      expect(validateIpRange(["192.168.1.1", "10.0.0.0/8"])).toBeNull();
    });

    it("returns error for invalid single IP", () => {
      expect(validateIpRange("999.999.999.999")).toBe(
        "Invalid IP address or CIDR range format"
      );
    });

    it("returns error for array with invalid IP", () => {
      const result = validateIpRange(["192.168.1.1", "invalid", "10.0.0.1"]);
      expect(result).toBe("Invalid IP addresses: invalid");
    });

    it("returns error listing all invalid IPs in array", () => {
      const result = validateIpRange(["bad1", "192.168.1.1", "bad2"]);
      expect(result).toBe("Invalid IP addresses: bad1, bad2");
    });
  });

  describe("validateTimeRange", () => {
    const validTimeRange: TimeRangeValue = {
      startHour: 9,
      startMinute: 0,
      endHour: 17,
      endMinute: 0,
      days: [1, 2, 3, 4, 5],
    };

    it("returns null for valid time range", () => {
      expect(validateTimeRange(validTimeRange)).toBeNull();
    });

    it("returns null for overnight time range", () => {
      const overnight: TimeRangeValue = {
        ...validTimeRange,
        startHour: 22,
        endHour: 6,
      };
      expect(validateTimeRange(overnight)).toBeNull();
    });

    it("returns error for start hour < 0", () => {
      const invalid: TimeRangeValue = { ...validTimeRange, startHour: -1 };
      expect(validateTimeRange(invalid)).toBe("Start hour must be between 0 and 23");
    });

    it("returns error for start hour > 23", () => {
      const invalid: TimeRangeValue = { ...validTimeRange, startHour: 24 };
      expect(validateTimeRange(invalid)).toBe("Start hour must be between 0 and 23");
    });

    it("returns error for end hour < 0", () => {
      const invalid: TimeRangeValue = { ...validTimeRange, endHour: -1 };
      expect(validateTimeRange(invalid)).toBe("End hour must be between 0 and 23");
    });

    it("returns error for end hour > 23", () => {
      const invalid: TimeRangeValue = { ...validTimeRange, endHour: 24 };
      expect(validateTimeRange(invalid)).toBe("End hour must be between 0 and 23");
    });

    it("returns error for start minute < 0", () => {
      const invalid: TimeRangeValue = { ...validTimeRange, startMinute: -1 };
      expect(validateTimeRange(invalid)).toBe("Start minute must be between 0 and 59");
    });

    it("returns error for start minute > 59", () => {
      const invalid: TimeRangeValue = { ...validTimeRange, startMinute: 60 };
      expect(validateTimeRange(invalid)).toBe("Start minute must be between 0 and 59");
    });

    it("returns error for end minute < 0", () => {
      const invalid: TimeRangeValue = { ...validTimeRange, endMinute: -1 };
      expect(validateTimeRange(invalid)).toBe("End minute must be between 0 and 59");
    });

    it("returns error for end minute > 59", () => {
      const invalid: TimeRangeValue = { ...validTimeRange, endMinute: 60 };
      expect(validateTimeRange(invalid)).toBe("End minute must be between 0 and 59");
    });

    it("returns error for empty days array", () => {
      const invalid: TimeRangeValue = { ...validTimeRange, days: [] };
      expect(validateTimeRange(invalid)).toBe("At least one day must be selected");
    });

    it("returns error for invalid day value", () => {
      const invalid: TimeRangeValue = { ...validTimeRange, days: [1, 7, 3] };
      expect(validateTimeRange(invalid)).toBe("Invalid day values (must be 0-6)");
    });

    it("returns error for negative day value", () => {
      const invalid: TimeRangeValue = { ...validTimeRange, days: [-1, 1, 2] };
      expect(validateTimeRange(invalid)).toBe("Invalid day values (must be 0-6)");
    });
  });

  describe("validateResourceReference", () => {
    it("returns no error/warning for valid single resource", () => {
      const ref: ResourceReference = {
        $ref: "resource",
        type: "team",
        selector: { id: "team-1" },
        display: {
          name: "Engineering",
          status: "valid",
          validatedAt: new Date().toISOString(),
        },
      };
      const result = validateResourceReference(ref);
      expect(result.error).toBeNull();
      expect(result.warning).toBeNull();
    });

    it("returns no error/warning for valid multiple resources", () => {
      const ref: ResourceReference = {
        $ref: "resource",
        type: "team",
        selector: { ids: ["team-1", "team-2"] },
        display: {
          name: "Engineering",
          names: ["Engineering", "Product"],
          status: "valid",
          validatedAt: new Date().toISOString(),
        },
      };
      const result = validateResourceReference(ref);
      expect(result.error).toBeNull();
      expect(result.warning).toBeNull();
    });

    it("returns error for reference with no selector", () => {
      const ref: ResourceReference = {
        $ref: "resource",
        type: "team",
        selector: {},
        display: {
          name: "Engineering",
          status: "valid",
          validatedAt: new Date().toISOString(),
        },
      };
      const result = validateResourceReference(ref);
      expect(result.error).toBe("No resource selected");
    });

    it("returns error for reference with empty ids array", () => {
      const ref: ResourceReference = {
        $ref: "resource",
        type: "team",
        selector: { ids: [] },
        display: {
          name: "Engineering",
          status: "valid",
          validatedAt: new Date().toISOString(),
        },
      };
      const result = validateResourceReference(ref);
      expect(result.error).toBe("No resource selected");
    });

    it("returns warning for orphaned resource", () => {
      const ref: ResourceReference = {
        $ref: "resource",
        type: "team",
        selector: { id: "deleted-team" },
        display: {
          name: "Deleted Team",
          status: "orphaned",
          validatedAt: new Date().toISOString(),
        },
      };
      const result = validateResourceReference(ref);
      expect(result.error).toBeNull();
      expect(result.warning).toBe("Referenced resource may have been deleted");
    });

    it("returns warning for changed resource", () => {
      const ref: ResourceReference = {
        $ref: "resource",
        type: "team",
        selector: { id: "team-1" },
        display: {
          name: "Old Name",
          status: "changed",
          validatedAt: new Date().toISOString(),
        },
      };
      const result = validateResourceReference(ref);
      expect(result.error).toBeNull();
      expect(result.warning).toBe("Referenced resource has been modified since selection");
    });
  });

  describe("validateNumber", () => {
    it("returns null for valid number", () => {
      expect(validateNumber(10)).toBeNull();
    });

    it("returns null for zero", () => {
      expect(validateNumber(0)).toBeNull();
    });

    it("returns null for negative number without min", () => {
      expect(validateNumber(-5)).toBeNull();
    });

    it("returns null for number at min boundary", () => {
      expect(validateNumber(0, 0, 23)).toBeNull();
    });

    it("returns null for number at max boundary", () => {
      expect(validateNumber(23, 0, 23)).toBeNull();
    });

    it("returns error for NaN", () => {
      expect(validateNumber(NaN)).toBe("Value must be a number");
    });

    it("returns error for number below min", () => {
      expect(validateNumber(-1, 0, 23)).toBe("Value must be at least 0");
    });

    it("returns error for number above max", () => {
      expect(validateNumber(24, 0, 23)).toBe("Value must be at most 23");
    });
  });

  describe("validateValueByType", () => {
    it("validates email type correctly", () => {
      const result = validateValueByType("invalid-email", "user_email");
      expect(result.errors).toContain("Invalid email address format");
    });

    it("validates email_domain type correctly", () => {
      const result = validateValueByType("example.com", "user_email_domain");
      expect(result.errors).toContain("Domain must start with @ (e.g., @company.com)");
    });

    it("validates ip_range type correctly", () => {
      const result = validateValueByType("999.999.999.999", "context_ip");
      expect(result.errors).toContain("Invalid IP address or CIDR range format");
    });

    it("validates time_range type correctly", () => {
      const invalidTimeRange: TimeRangeValue = {
        startHour: 25,
        startMinute: 0,
        endHour: 17,
        endMinute: 0,
        days: [1, 2, 3],
      };
      const result = validateValueByType(invalidTimeRange, "time_hours");
      expect(result.errors).toContain("Start hour must be between 0 and 23");
    });

    it("validates resource_ids type correctly", () => {
      const invalidRef: ResourceReference = {
        $ref: "resource",
        type: "team",
        selector: {},
        display: {
          name: "",
          status: "valid",
          validatedAt: new Date().toISOString(),
        },
      };
      const result = validateValueByType(invalidRef, "user_team");
      expect(result.errors).toContain("No resource selected");
    });

    it("validates number type with hour boundaries", () => {
      const result = validateValueByType(25, "time_hour_simple");
      expect(result.errors).toContain("Value must be at most 23");
    });

    it("validates days_of_week requires selection", () => {
      const result = validateValueByType([], "time_days");
      expect(result.errors).toContain("At least one day must be selected");
    });

    it("returns empty errors for unknown attribute", () => {
      const result = validateValueByType("anything", "unknown_attribute");
      expect(result.errors).toHaveLength(0);
    });

    it("adds warnings for orphaned resources", () => {
      const orphanedRef: ResourceReference = {
        $ref: "resource",
        type: "team",
        selector: { id: "deleted-team" },
        display: {
          name: "Deleted",
          status: "orphaned",
          validatedAt: new Date().toISOString(),
        },
      };
      const result = validateValueByType(orphanedRef, "user_team");
      expect(result.warnings).toContain("Referenced resource may have been deleted");
    });
  });
});

describe("useConditionValidation Hook", () => {
  describe("attribute validation", () => {
    it("returns error when attribute is not selected", () => {
      const condition: PolicyCondition = {
        id: "cond-1",
        category: "user",
        attribute: "",
        operator: "equals",
        value: "",
      };

      const { result } = renderHook(() => useConditionValidation(condition));

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors).toContain("Please select an attribute");
    });

    it("returns warning for unknown attribute", () => {
      const condition: PolicyCondition = {
        id: "cond-1",
        category: "user",
        attribute: "unknown_attribute",
        operator: "equals",
        value: "test",
      };

      const { result } = renderHook(() => useConditionValidation(condition));

      expect(result.current.warnings).toContain("Unknown attribute type");
    });
  });

  describe("value validation", () => {
    it("returns error when value is empty string", () => {
      const condition: PolicyCondition = {
        id: "cond-1",
        category: "user",
        attribute: "user_email",
        operator: "equals",
        value: "",
      };

      const { result } = renderHook(() => useConditionValidation(condition));

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors).toContain("Please enter a value");
    });

    it("returns error when value is null", () => {
      const condition: PolicyCondition = {
        id: "cond-1",
        category: "user",
        attribute: "user_email",
        operator: "equals",
        value: null as unknown as string,
      };

      const { result } = renderHook(() => useConditionValidation(condition));

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors).toContain("Please enter a value");
    });

    it("returns error when array value is empty", () => {
      const condition: PolicyCondition = {
        id: "cond-1",
        category: "time",
        attribute: "time_days",
        operator: "in",
        value: [],
      };

      const { result } = renderHook(() => useConditionValidation(condition));

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors).toContain("Please select at least one value");
    });

    it("returns error for resource reference with no selection", () => {
      const condition: PolicyCondition = {
        id: "cond-1",
        category: "user",
        attribute: "user_team",
        operator: "in",
        value: {
          $ref: "resource",
          type: "team",
          selector: {},
        } as ResourceReference,
      };

      const { result } = renderHook(() => useConditionValidation(condition));

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors).toContain("Please select a resource");
    });

    it("skips value validation for exists operator", () => {
      const condition: PolicyCondition = {
        id: "cond-1",
        category: "user",
        attribute: "user_email",
        operator: "exists",
        value: "",
      };

      const { result } = renderHook(() => useConditionValidation(condition));

      expect(result.current.isValid).toBe(true);
      expect(result.current.errors).toHaveLength(0);
    });

    it("skips value validation for not_exists operator", () => {
      const condition: PolicyCondition = {
        id: "cond-1",
        category: "user",
        attribute: "user_email",
        operator: "not_exists",
        value: "",
      };

      const { result } = renderHook(() => useConditionValidation(condition));

      expect(result.current.isValid).toBe(true);
      expect(result.current.errors).toHaveLength(0);
    });
  });

  describe("type-specific validation", () => {
    it("validates email format", () => {
      const condition: PolicyCondition = {
        id: "cond-1",
        category: "user",
        attribute: "user_email",
        operator: "equals",
        value: "not-an-email",
      };

      const { result } = renderHook(() => useConditionValidation(condition));

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors).toContain("Invalid email address format");
    });

    it("validates valid email passes", () => {
      const condition: PolicyCondition = {
        id: "cond-1",
        category: "user",
        attribute: "user_email",
        operator: "equals",
        value: "user@example.com",
      };

      const { result } = renderHook(() => useConditionValidation(condition));

      expect(result.current.isValid).toBe(true);
      expect(result.current.errors).toHaveLength(0);
    });

    it("validates IP range format", () => {
      const condition: PolicyCondition = {
        id: "cond-1",
        category: "context",
        attribute: "context_ip",
        operator: "equals",
        value: "invalid-ip",
      };

      const { result } = renderHook(() => useConditionValidation(condition));

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors).toContain("Invalid IP address or CIDR range format");
    });

    it("validates time range", () => {
      const condition: PolicyCondition = {
        id: "cond-1",
        category: "time",
        attribute: "time_hours",
        operator: "between",
        value: {
          startHour: 25,
          startMinute: 0,
          endHour: 17,
          endMinute: 0,
          days: [1, 2, 3],
        },
      };

      const { result } = renderHook(() => useConditionValidation(condition));

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors).toContain("Start hour must be between 0 and 23");
    });
  });

  describe("operator validation", () => {
    it("warns when operator is not suitable for attribute type", () => {
      const condition: PolicyCondition = {
        id: "cond-1",
        category: "user",
        attribute: "user_email",
        operator: "greater_than", // Not suitable for email
        value: "user@example.com",
      };

      const { result } = renderHook(() => useConditionValidation(condition));

      expect(result.current.warnings.some((w) => w.includes("may not be suitable"))).toBe(true);
    });
  });

  describe("valid condition", () => {
    it("returns isValid true for valid condition", () => {
      const condition: PolicyCondition = {
        id: "cond-1",
        category: "user",
        attribute: "user_email",
        operator: "equals",
        value: "user@example.com",
      };

      const { result } = renderHook(() => useConditionValidation(condition));

      expect(result.current.isValid).toBe(true);
      expect(result.current.errors).toHaveLength(0);
    });

    it("returns isValid true for valid resource reference", () => {
      const condition: PolicyCondition = {
        id: "cond-1",
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
        },
      };

      const { result } = renderHook(() => useConditionValidation(condition));

      expect(result.current.isValid).toBe(true);
    });
  });
});

describe("useConditionsValidation Hook", () => {
  it("validates multiple conditions and returns a Map", () => {
    const conditions: PolicyCondition[] = [
      {
        id: "cond-1",
        category: "user",
        attribute: "user_email",
        operator: "equals",
        value: "user@example.com",
      },
      {
        id: "cond-2",
        category: "user",
        attribute: "user_email",
        operator: "equals",
        value: "", // Invalid - empty
      },
    ];

    const { result } = renderHook(() => useConditionsValidation(conditions));

    expect(result.current.size).toBe(2);

    const cond1Result = result.current.get("cond-1");
    expect(cond1Result?.isValid).toBe(true);

    const cond2Result = result.current.get("cond-2");
    expect(cond2Result?.isValid).toBe(false);
    expect(cond2Result?.errors).toContain("Please enter a value");
  });

  it("handles empty conditions array", () => {
    const { result } = renderHook(() => useConditionsValidation([]));

    expect(result.current.size).toBe(0);
  });

  it("validates each condition independently", () => {
    const conditions: PolicyCondition[] = [
      {
        id: "cond-1",
        category: "user",
        attribute: "",
        operator: "equals",
        value: "test",
      },
      {
        id: "cond-2",
        category: "context",
        attribute: "context_ip",
        operator: "equals",
        value: "invalid-ip",
      },
      {
        id: "cond-3",
        category: "user",
        attribute: "user_email",
        operator: "equals",
        value: "valid@email.com",
      },
    ];

    const { result } = renderHook(() => useConditionsValidation(conditions));

    expect(result.current.get("cond-1")?.errors).toContain("Please select an attribute");
    expect(result.current.get("cond-2")?.errors).toContain(
      "Invalid IP address or CIDR range format"
    );
    expect(result.current.get("cond-3")?.isValid).toBe(true);
  });
});
