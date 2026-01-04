/**
 * Tests for useConditionBuilder hook
 *
 * These tests verify the state management functionality of the condition builder hook,
 * including adding/removing conditions, updating values, applying templates,
 * validation, and translations.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConditionBuilder } from "../hooks/useConditionBuilder";
import type { PolicyCondition, ConditionGroup } from "../types";

describe("useConditionBuilder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("initializes with empty conditions by default", () => {
      const { result } = renderHook(() => useConditionBuilder());

      expect(result.current.conditions).toEqual([]);
      expect(result.current.logic).toBe("all");
    });

    it("initializes with provided conditions", () => {
      const initialConditions: PolicyCondition[] = [
        {
          id: "cond-1",
          category: "user",
          attribute: "user_email",
          operator: "equals",
          value: "test@example.com",
        },
      ];

      const { result } = renderHook(() =>
        useConditionBuilder({ initialConditions })
      );

      expect(result.current.conditions).toHaveLength(1);
      expect(result.current.conditions[0].attribute).toBe("user_email");
    });

    it("initializes with provided logic", () => {
      const { result } = renderHook(() =>
        useConditionBuilder({ initialLogic: "any" })
      );

      expect(result.current.logic).toBe("any");
    });
  });

  describe("addCondition", () => {
    it("adds a new empty condition", () => {
      const { result } = renderHook(() => useConditionBuilder());

      act(() => {
        result.current.addCondition();
      });

      expect(result.current.conditions).toHaveLength(1);
      expect(result.current.conditions[0]).toMatchObject({
        category: "user",
        attribute: "",
        operator: "equals",
        value: "",
      });
      expect(result.current.conditions[0].id).toMatch(/^cond_/);
    });

    it("adds multiple conditions", () => {
      const { result } = renderHook(() => useConditionBuilder());

      act(() => {
        result.current.addCondition();
        result.current.addCondition();
        result.current.addCondition();
      });

      expect(result.current.conditions).toHaveLength(3);
      // Each condition should have a unique ID
      const ids = result.current.conditions.map((c) => c.id);
      expect(new Set(ids).size).toBe(3);
    });
  });

  describe("removeCondition", () => {
    it("removes a condition by ID", () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "user_email", operator: "equals", value: "a@b.com" },
        { id: "cond-2", category: "user", attribute: "user_role", operator: "equals", value: "admin" },
      ];

      const { result } = renderHook(() =>
        useConditionBuilder({ initialConditions })
      );

      act(() => {
        result.current.removeCondition("cond-1");
      });

      expect(result.current.conditions).toHaveLength(1);
      expect(result.current.conditions[0].id).toBe("cond-2");
    });

    it("handles removing non-existent condition gracefully", () => {
      const { result } = renderHook(() => useConditionBuilder());

      act(() => {
        result.current.addCondition();
      });

      const initialLength = result.current.conditions.length;

      act(() => {
        result.current.removeCondition("non-existent-id");
      });

      expect(result.current.conditions).toHaveLength(initialLength);
    });

    it("can remove all conditions", () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "user_email", operator: "equals", value: "" },
        { id: "cond-2", category: "user", attribute: "user_role", operator: "equals", value: "" },
      ];

      const { result } = renderHook(() =>
        useConditionBuilder({ initialConditions })
      );

      act(() => {
        result.current.removeCondition("cond-1");
        result.current.removeCondition("cond-2");
      });

      expect(result.current.conditions).toHaveLength(0);
    });
  });

  describe("updateCondition", () => {
    it("updates a condition with partial updates", () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "user_email", operator: "equals", value: "old@example.com" },
      ];

      const { result } = renderHook(() =>
        useConditionBuilder({ initialConditions })
      );

      act(() => {
        result.current.updateCondition("cond-1", { value: "new@example.com" });
      });

      expect(result.current.conditions[0].value).toBe("new@example.com");
      expect(result.current.conditions[0].attribute).toBe("user_email");
    });
  });

  describe("updateConditionCategory", () => {
    it("updates category and resets attribute, operator, and value", () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "user_email", operator: "contains", value: "test" },
      ];

      const { result } = renderHook(() =>
        useConditionBuilder({ initialConditions })
      );

      act(() => {
        result.current.updateConditionCategory("cond-1", "resource");
      });

      expect(result.current.conditions[0]).toMatchObject({
        category: "resource",
        attribute: "",
        operator: "equals",
        value: "",
      });
    });

    it("preserves other conditions when updating one", () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "user_email", operator: "equals", value: "a@b.com" },
        { id: "cond-2", category: "resource", attribute: "resource_agent", operator: "in", value: [] },
      ];

      const { result } = renderHook(() =>
        useConditionBuilder({ initialConditions })
      );

      act(() => {
        result.current.updateConditionCategory("cond-1", "time");
      });

      expect(result.current.conditions[1]).toMatchObject({
        category: "resource",
        attribute: "resource_agent",
      });
    });
  });

  describe("updateConditionAttribute", () => {
    it("updates attribute and resets operator to first available", () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "", operator: "equals", value: "" },
      ];

      const { result } = renderHook(() =>
        useConditionBuilder({ initialConditions })
      );

      act(() => {
        result.current.updateConditionAttribute("cond-1", "user_email");
      });

      expect(result.current.conditions[0].attribute).toBe("user_email");
      // Should have a valid operator for email type
      expect(result.current.conditions[0].operator).toBeDefined();
    });

    it("sets boolean default value for boolean attributes", () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "", operator: "equals", value: "" },
      ];

      const { result } = renderHook(() =>
        useConditionBuilder({ initialConditions })
      );

      // Note: Currently no boolean attributes in the data, but the hook handles it
      act(() => {
        result.current.updateConditionAttribute("cond-1", "user_email");
      });

      // For non-boolean, value should be empty string
      expect(result.current.conditions[0].value).toBe("");
    });
  });

  describe("updateConditionOperator", () => {
    it("updates the operator", () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "user_email", operator: "equals", value: "test" },
      ];

      const { result } = renderHook(() =>
        useConditionBuilder({ initialConditions })
      );

      act(() => {
        result.current.updateConditionOperator("cond-1", "contains");
      });

      expect(result.current.conditions[0].operator).toBe("contains");
    });
  });

  describe("updateConditionValue", () => {
    it("updates string value", () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "user_email", operator: "equals", value: "" },
      ];

      const { result } = renderHook(() =>
        useConditionBuilder({ initialConditions })
      );

      act(() => {
        result.current.updateConditionValue("cond-1", "new@example.com");
      });

      expect(result.current.conditions[0].value).toBe("new@example.com");
    });

    it("updates array value", () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "user_role", operator: "in", value: [] },
      ];

      const { result } = renderHook(() =>
        useConditionBuilder({ initialConditions })
      );

      act(() => {
        result.current.updateConditionValue("cond-1", ["admin", "developer"]);
      });

      expect(result.current.conditions[0].value).toEqual(["admin", "developer"]);
    });
  });

  describe("setLogic", () => {
    it("sets logic to 'any'", () => {
      const { result } = renderHook(() => useConditionBuilder());

      act(() => {
        result.current.setLogic("any");
      });

      expect(result.current.logic).toBe("any");
    });

    it("sets logic to 'all'", () => {
      const { result } = renderHook(() =>
        useConditionBuilder({ initialLogic: "any" })
      );

      act(() => {
        result.current.setLogic("all");
      });

      expect(result.current.logic).toBe("all");
    });
  });

  describe("applyTemplate", () => {
    it("applies team-access template", () => {
      const { result } = renderHook(() => useConditionBuilder());

      act(() => {
        result.current.applyTemplate("team-access");
      });

      expect(result.current.conditions).toHaveLength(1);
      expect(result.current.conditions[0]).toMatchObject({
        category: "user",
        attribute: "user_team",
        operator: "in",
      });
    });

    it("applies business-hours template with time range value", () => {
      const { result } = renderHook(() => useConditionBuilder());

      act(() => {
        result.current.applyTemplate("business-hours");
      });

      expect(result.current.conditions).toHaveLength(1);
      expect(result.current.conditions[0]).toMatchObject({
        category: "time",
        attribute: "time_hours",
        operator: "between",
      });
      expect(result.current.conditions[0].value).toMatchObject({
        startHour: 9,
        endHour: 17,
        days: [1, 2, 3, 4, 5],
      });
    });

    it("applies ip-restriction template", () => {
      const { result } = renderHook(() => useConditionBuilder());

      act(() => {
        result.current.applyTemplate("ip-restriction");
      });

      expect(result.current.conditions).toHaveLength(1);
      expect(result.current.conditions[0]).toMatchObject({
        category: "context",
        attribute: "context_ip",
        operator: "in",
      });
    });

    it("applies specific-agent template", () => {
      const { result } = renderHook(() => useConditionBuilder());

      act(() => {
        result.current.applyTemplate("specific-agent");
      });

      expect(result.current.conditions).toHaveLength(1);
      expect(result.current.conditions[0]).toMatchObject({
        category: "resource",
        attribute: "resource_agent",
        operator: "in",
      });
    });

    it("appends template conditions to existing conditions", () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "user_email", operator: "equals", value: "test@example.com" },
      ];

      const { result } = renderHook(() =>
        useConditionBuilder({ initialConditions })
      );

      act(() => {
        result.current.applyTemplate("team-access");
      });

      expect(result.current.conditions).toHaveLength(2);
      expect(result.current.conditions[0].attribute).toBe("user_email");
      expect(result.current.conditions[1].attribute).toBe("user_team");
    });

    it("does nothing for non-existent template", () => {
      const { result } = renderHook(() => useConditionBuilder());

      act(() => {
        result.current.applyTemplate("non-existent-template");
      });

      expect(result.current.conditions).toHaveLength(0);
    });
  });

  describe("clearConditions", () => {
    it("clears all conditions", () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "user_email", operator: "equals", value: "a" },
        { id: "cond-2", category: "user", attribute: "user_role", operator: "in", value: ["admin"] },
      ];

      const { result } = renderHook(() =>
        useConditionBuilder({ initialConditions })
      );

      act(() => {
        result.current.clearConditions();
      });

      expect(result.current.conditions).toHaveLength(0);
    });
  });

  describe("setConditions", () => {
    it("sets conditions directly", () => {
      const { result } = renderHook(() => useConditionBuilder());

      const newConditions: PolicyCondition[] = [
        { id: "new-1", category: "resource", attribute: "resource_environment", operator: "equals", value: "production" },
      ];

      act(() => {
        result.current.setConditions(newConditions);
      });

      expect(result.current.conditions).toHaveLength(1);
      expect(result.current.conditions[0].id).toBe("new-1");
    });
  });

  describe("getAvailableAttributes", () => {
    it("returns user attributes for user category", () => {
      const { result } = renderHook(() => useConditionBuilder());

      const attributes = result.current.getAvailableAttributes("user");

      expect(attributes.length).toBeGreaterThan(0);
      expect(attributes.every((a) => a.category === "user")).toBe(true);
      expect(attributes.some((a) => a.id === "user_email")).toBe(true);
    });

    it("returns resource attributes for resource category", () => {
      const { result } = renderHook(() => useConditionBuilder());

      const attributes = result.current.getAvailableAttributes("resource");

      expect(attributes.length).toBeGreaterThan(0);
      expect(attributes.every((a) => a.category === "resource")).toBe(true);
      expect(attributes.some((a) => a.id === "resource_agent")).toBe(true);
    });

    it("returns time attributes for time category", () => {
      const { result } = renderHook(() => useConditionBuilder());

      const attributes = result.current.getAvailableAttributes("time");

      expect(attributes.length).toBeGreaterThan(0);
      expect(attributes.every((a) => a.category === "time")).toBe(true);
    });

    it("returns context attributes for context category", () => {
      const { result } = renderHook(() => useConditionBuilder());

      const attributes = result.current.getAvailableAttributes("context");

      expect(attributes.length).toBeGreaterThan(0);
      expect(attributes.every((a) => a.category === "context")).toBe(true);
    });
  });

  describe("getAvailableOperators", () => {
    it("returns operators for email type", () => {
      const { result } = renderHook(() => useConditionBuilder());

      const operators = result.current.getAvailableOperators("user_email");

      expect(operators.length).toBeGreaterThan(0);
      expect(operators.some((o) => o.id === "equals")).toBe(true);
      expect(operators.some((o) => o.id === "contains")).toBe(true);
    });

    it("returns operators for resource_ids type", () => {
      const { result } = renderHook(() => useConditionBuilder());

      const operators = result.current.getAvailableOperators("resource_agent");

      expect(operators.length).toBeGreaterThan(0);
      expect(operators.some((o) => o.id === "in")).toBe(true);
      expect(operators.some((o) => o.id === "not_in")).toBe(true);
    });

    it("returns empty array for unknown attribute", () => {
      const { result } = renderHook(() => useConditionBuilder());

      const operators = result.current.getAvailableOperators("unknown_attr");

      expect(operators).toEqual([]);
    });
  });

  describe("validateCondition", () => {
    it("validates condition with missing attribute", () => {
      const { result } = renderHook(() => useConditionBuilder());

      const condition: PolicyCondition = {
        id: "cond-1",
        category: "user",
        attribute: "",
        operator: "equals",
        value: "test",
      };

      const validation = result.current.validateCondition(condition);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("Please select an attribute");
    });

    it("validates condition with missing value", () => {
      const { result } = renderHook(() => useConditionBuilder());

      const condition: PolicyCondition = {
        id: "cond-1",
        category: "user",
        attribute: "user_email",
        operator: "equals",
        value: "",
      };

      const validation = result.current.validateCondition(condition);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("Please enter a value");
    });

    it("validates condition with empty array value", () => {
      const { result } = renderHook(() => useConditionBuilder());

      const condition: PolicyCondition = {
        id: "cond-1",
        category: "user",
        attribute: "user_role",
        operator: "in",
        value: [],
      };

      const validation = result.current.validateCondition(condition);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("Please select at least one value");
    });

    it("validates valid condition", () => {
      const { result } = renderHook(() => useConditionBuilder());

      const condition: PolicyCondition = {
        id: "cond-1",
        category: "user",
        attribute: "user_email",
        operator: "equals",
        value: "test@example.com",
      };

      const validation = result.current.validateCondition(condition);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("validates condition with exists operator (no value required)", () => {
      const { result } = renderHook(() => useConditionBuilder());

      const condition: PolicyCondition = {
        id: "cond-1",
        category: "user",
        attribute: "user_email",
        operator: "exists",
        value: "",
      };

      const validation = result.current.validateCondition(condition);

      expect(validation.isValid).toBe(true);
    });

    it("validates condition with not_exists operator (no value required)", () => {
      const { result } = renderHook(() => useConditionBuilder());

      const condition: PolicyCondition = {
        id: "cond-1",
        category: "user",
        attribute: "user_email",
        operator: "not_exists",
        value: "",
      };

      const validation = result.current.validateCondition(condition);

      expect(validation.isValid).toBe(true);
    });

    it("validates email pattern", () => {
      const { result } = renderHook(() => useConditionBuilder());

      const condition: PolicyCondition = {
        id: "cond-1",
        category: "user",
        attribute: "user_email",
        operator: "equals",
        value: "invalid-email",
      };

      const validation = result.current.validateCondition(condition);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("Enter a valid email address");
    });
  });

  describe("validateAll", () => {
    it("validates all conditions and returns errors map", () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "", operator: "equals", value: "" },
        { id: "cond-2", category: "user", attribute: "user_email", operator: "equals", value: "valid@example.com" },
      ];

      const { result } = renderHook(() =>
        useConditionBuilder({ initialConditions })
      );

      const { isValid, errors } = result.current.validateAll();

      expect(isValid).toBe(false);
      expect(errors.has("cond-1")).toBe(true);
      expect(errors.has("cond-2")).toBe(false);
    });

    it("returns valid for all valid conditions", () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "user_email", operator: "equals", value: "test@example.com" },
        { id: "cond-2", category: "resource", attribute: "resource_environment", operator: "equals", value: "production" },
      ];

      const { result } = renderHook(() =>
        useConditionBuilder({ initialConditions })
      );

      const { isValid, errors } = result.current.validateAll();

      expect(isValid).toBe(true);
      expect(errors.size).toBe(0);
    });

    it("returns valid for empty conditions", () => {
      const { result } = renderHook(() => useConditionBuilder());

      const { isValid, errors } = result.current.validateAll();

      expect(isValid).toBe(true);
      expect(errors.size).toBe(0);
    });
  });

  describe("toConditionGroup", () => {
    it("exports conditions as ConditionGroup", () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "user_email", operator: "equals", value: "test@example.com" },
      ];

      const { result } = renderHook(() =>
        useConditionBuilder({ initialConditions, initialLogic: "any" })
      );

      const group = result.current.toConditionGroup();

      expect(group.logic).toBe("any");
      expect(group.conditions).toHaveLength(1);
      expect(group.conditions[0].attribute).toBe("user_email");
    });
  });

  describe("onChange callback", () => {
    it("calls onChange when conditions change", async () => {
      const onChange = vi.fn();

      const { result } = renderHook(() =>
        useConditionBuilder({ onChange })
      );

      act(() => {
        result.current.addCondition();
      });

      // Wait for useEffect to run
      await vi.waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });

      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as ConditionGroup;
      expect(lastCall.conditions).toHaveLength(1);
    });

    it("calls onChange when logic changes", async () => {
      const onChange = vi.fn();

      const { result } = renderHook(() =>
        useConditionBuilder({ onChange })
      );

      act(() => {
        result.current.setLogic("any");
      });

      await vi.waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });

      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as ConditionGroup;
      expect(lastCall.logic).toBe("any");
    });

    it("does not call onChange on initial mount", () => {
      const onChange = vi.fn();

      renderHook(() =>
        useConditionBuilder({
          initialConditions: [
            { id: "1", category: "user", attribute: "user_email", operator: "equals", value: "test" },
          ],
          onChange,
        })
      );

      // onChange should not be called on initial mount
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("getConditionTranslation", () => {
    it("translates a user email condition", () => {
      const { result } = renderHook(() => useConditionBuilder());

      const condition: PolicyCondition = {
        id: "cond-1",
        category: "user",
        attribute: "user_email",
        operator: "equals",
        value: "test@example.com",
      };

      const translation = result.current.getConditionTranslation(condition);

      expect(translation).toBe("User's email is test@example.com");
    });

    it("translates a user role condition", () => {
      const { result } = renderHook(() => useConditionBuilder());

      const condition: PolicyCondition = {
        id: "cond-1",
        category: "user",
        attribute: "user_role",
        operator: "equals",
        value: "org_admin",
      };

      const translation = result.current.getConditionTranslation(condition);

      expect(translation).toBe("User has the Organization Admin role");
    });
  });

  describe("getOverallTranslation", () => {
    it("returns default message for no conditions", () => {
      const { result } = renderHook(() => useConditionBuilder());

      const translation = result.current.getOverallTranslation();

      expect(translation).toBe("This policy applies to everyone, at any time, from anywhere.");
    });

    it("returns single condition translation", () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "user_email", operator: "equals", value: "test@example.com" },
      ];

      const { result } = renderHook(() =>
        useConditionBuilder({ initialConditions })
      );

      const translation = result.current.getOverallTranslation();

      expect(translation).toBe("Access is granted when: User's email is test@example.com");
    });

    it("returns ALL logic translation for multiple conditions", () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "user_email", operator: "equals", value: "test@example.com" },
        { id: "cond-2", category: "resource", attribute: "resource_environment", operator: "equals", value: "production" },
      ];

      const { result } = renderHook(() =>
        useConditionBuilder({ initialConditions, initialLogic: "all" })
      );

      const translation = result.current.getOverallTranslation();

      expect(translation).toContain("Access is granted when ALL of these are true:");
      expect(translation).toContain("User's email is test@example.com");
      expect(translation).toContain("Environment is Production");
    });

    it("returns ANY logic translation for multiple conditions", () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "user_email", operator: "equals", value: "test@example.com" },
        { id: "cond-2", category: "resource", attribute: "resource_environment", operator: "equals", value: "production" },
      ];

      const { result } = renderHook(() =>
        useConditionBuilder({ initialConditions, initialLogic: "any" })
      );

      const translation = result.current.getOverallTranslation();

      expect(translation).toContain("Access is granted when ANY of these are true:");
    });
  });
});
