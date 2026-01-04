/**
 * Tests for ConditionPreview component (Single Condition)
 *
 * These tests verify the single condition preview component's behavior including
 * plain English translations, three variants (default, compact, inline),
 * completion status, and className handling.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConditionPreview } from "../ConditionPreview";
import type { PolicyCondition, TimeRangeValue, ResourceReference } from "../types";

// Helper to render with default props
function setup(
  conditionOverrides: Partial<PolicyCondition> = {},
  propsOverrides: Partial<Omit<Parameters<typeof ConditionPreview>[0], "condition">> = {}
) {
  const defaultCondition: PolicyCondition = {
    id: "test-condition-1",
    category: "user",
    attribute: "user_email",
    operator: "equals",
    value: "test@example.com",
    ...conditionOverrides,
  };
  const defaultProps = {
    condition: defaultCondition,
    showIcon: true,
    variant: "default" as const,
    ...propsOverrides,
  };
  const result = render(<ConditionPreview {...defaultProps} />);
  return { ...result, condition: defaultCondition };
}

describe("ConditionPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic rendering", () => {
    it("renders the component", () => {
      const { container } = setup();
      expect(container.firstChild).toBeInTheDocument();
    });

    it("shows translation for complete condition", () => {
      setup({
        attribute: "user_email",
        operator: "equals",
        value: "test@example.com",
      });

      expect(screen.getByText("User's email is test@example.com")).toBeInTheDocument();
    });

    it("shows green checkmark icon for complete valid condition", () => {
      const { container } = setup({
        attribute: "user_email",
        operator: "equals",
        value: "valid@example.com",
      });

      const greenIcon = container.querySelector("svg.text-green-500");
      expect(greenIcon).toBeInTheDocument();
    });

    it("shows amber alert icon for incomplete condition", () => {
      const { container } = setup({
        attribute: "user_email",
        operator: "equals",
        value: "",
      });

      const amberIcon = container.querySelector("svg.text-amber-500");
      expect(amberIcon).toBeInTheDocument();
    });
  });

  describe("translation output", () => {
    it("translates user email condition", () => {
      setup({
        category: "user",
        attribute: "user_email",
        operator: "equals",
        value: "admin@company.com",
      });

      expect(screen.getByText("User's email is admin@company.com")).toBeInTheDocument();
    });

    it("translates user email not equals condition", () => {
      setup({
        category: "user",
        attribute: "user_email",
        operator: "not_equals",
        value: "blocked@spam.com",
      });

      expect(screen.getByText("User's email is not blocked@spam.com")).toBeInTheDocument();
    });

    it("translates user email contains condition", () => {
      setup({
        category: "user",
        attribute: "user_email",
        operator: "contains",
        value: "@company.com",
      });

      expect(screen.getByText("User's email contains '@company.com'")).toBeInTheDocument();
    });

    it("translates user role condition", () => {
      setup({
        category: "user",
        attribute: "user_role",
        operator: "equals",
        value: "org_admin",
      });

      expect(screen.getByText("User has the Organization Admin role")).toBeInTheDocument();
    });

    it("translates environment condition", () => {
      setup({
        category: "resource",
        attribute: "resource_environment",
        operator: "equals",
        value: "production",
      });

      expect(screen.getByText("Environment is Production")).toBeInTheDocument();
    });

    it("translates IP address condition", () => {
      setup({
        category: "context",
        attribute: "context_ip",
        operator: "equals",
        value: "192.168.1.1",
      });

      expect(screen.getByText("IP address is 192.168.1.1")).toBeInTheDocument();
    });

    it("translates IP starts_with condition", () => {
      setup({
        category: "context",
        attribute: "context_ip",
        operator: "starts_with",
        value: "192.168.",
      });

      expect(screen.getByText("IP address starts with 192.168.")).toBeInTheDocument();
    });

    it("translates time range condition", () => {
      const timeValue: TimeRangeValue = {
        startHour: 9,
        startMinute: 0,
        endHour: 17,
        endMinute: 0,
        days: [1, 2, 3, 4, 5],
      };

      setup({
        category: "time",
        attribute: "time_hours",
        operator: "between",
        value: timeValue,
      });

      expect(screen.getByText("Access is allowed 9 AM to 5 PM on weekdays")).toBeInTheDocument();
    });

    it("translates day of week condition", () => {
      setup({
        category: "time",
        attribute: "time_days",
        operator: "in",
        value: ["1", "2", "3", "4", "5"],
      });

      expect(screen.getByText("Day is: weekdays")).toBeInTheDocument();
    });

    it("translates weekend days condition", () => {
      setup({
        category: "time",
        attribute: "time_days",
        operator: "in",
        value: ["0", "6"],
      });

      expect(screen.getByText("Day is: weekends")).toBeInTheDocument();
    });

    it("shows [not set] for empty string value", () => {
      setup({
        attribute: "user_email",
        operator: "equals",
        value: "",
      });

      expect(screen.getByText(/\[not set\]/)).toBeInTheDocument();
    });

    it("shows [none selected] for empty array value", () => {
      setup({
        attribute: "user_team",
        operator: "in",
        value: [],
      });

      expect(screen.getByText(/\[none selected\]/)).toBeInTheDocument();
    });

    it("translates resource environment list condition", () => {
      setup({
        category: "resource",
        attribute: "resource_environment",
        operator: "in",
        value: ["development", "staging"],
      });

      expect(screen.getByText(/Development, Staging/)).toBeInTheDocument();
    });
  });

  describe("variant: default", () => {
    it("renders with icon by default", () => {
      const { container } = setup(
        { value: "test@example.com" },
        { variant: "default", showIcon: true }
      );

      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("renders with flex items-start layout", () => {
      const { container } = setup({}, { variant: "default" });

      expect(container.firstChild).toHaveClass("flex", "items-start");
    });

    it("shows green check icon for complete condition", () => {
      const { container } = setup(
        { attribute: "user_email", value: "valid@example.com" },
        { variant: "default" }
      );

      const greenIcon = container.querySelector("svg.text-green-500");
      expect(greenIcon).toBeInTheDocument();
    });

    it("shows amber alert icon for incomplete condition", () => {
      const { container } = setup(
        { attribute: "user_email", value: "" },
        { variant: "default" }
      );

      const amberIcon = container.querySelector("svg.text-amber-500");
      expect(amberIcon).toBeInTheDocument();
    });

    it("applies gap-2 between icon and text", () => {
      const { container } = setup({}, { variant: "default" });

      expect(container.firstChild).toHaveClass("gap-2");
    });
  });

  describe("variant: compact", () => {
    it("renders without icon", () => {
      const { container } = setup(
        { value: "test@example.com" },
        { variant: "compact" }
      );

      const icon = container.querySelector("svg");
      expect(icon).not.toBeInTheDocument();
    });

    it("renders as div with text-sm text-muted-foreground", () => {
      const { container } = setup({}, { variant: "compact" });

      expect(container.firstChild).toHaveClass("text-sm", "text-muted-foreground");
      expect(container.firstChild?.nodeName).toBe("DIV");
    });

    it("shows translation text", () => {
      setup(
        { attribute: "user_email", value: "compact@test.com" },
        { variant: "compact" }
      );

      expect(screen.getByText("User's email is compact@test.com")).toBeInTheDocument();
    });
  });

  describe("variant: inline", () => {
    it("renders as span element", () => {
      const { container } = setup({}, { variant: "inline" });

      expect(container.firstChild?.nodeName).toBe("SPAN");
    });

    it("renders without icon", () => {
      const { container } = setup(
        { value: "test@example.com" },
        { variant: "inline" }
      );

      const icon = container.querySelector("svg");
      expect(icon).not.toBeInTheDocument();
    });

    it("has text-sm class", () => {
      const { container } = setup({}, { variant: "inline" });

      expect(container.firstChild).toHaveClass("text-sm");
    });

    it("shows foreground color for complete condition", () => {
      const { container } = setup(
        { attribute: "user_email", value: "valid@test.com" },
        { variant: "inline" }
      );

      expect(container.firstChild).toHaveClass("text-foreground");
    });

    it("shows muted color and italic for incomplete condition", () => {
      const { container } = setup(
        { attribute: "user_email", value: "" },
        { variant: "inline" }
      );

      expect(container.firstChild).toHaveClass("text-muted-foreground", "italic");
    });
  });

  describe("showIcon prop", () => {
    it("shows icon when showIcon is true (default)", () => {
      const { container } = setup({ value: "test@example.com" }, { showIcon: true });

      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("hides icon when showIcon is false", () => {
      const { container } = setup(
        { value: "test@example.com" },
        { showIcon: false, variant: "default" }
      );

      const icon = container.querySelector("svg");
      expect(icon).not.toBeInTheDocument();
    });

    it("compact variant ignores showIcon prop", () => {
      const { container } = setup(
        { value: "test@example.com" },
        { showIcon: true, variant: "compact" }
      );

      // Compact never shows icon regardless of showIcon
      const icon = container.querySelector("svg");
      expect(icon).not.toBeInTheDocument();
    });

    it("inline variant ignores showIcon prop", () => {
      const { container } = setup(
        { value: "test@example.com" },
        { showIcon: true, variant: "inline" }
      );

      // Inline never shows icon regardless of showIcon
      const icon = container.querySelector("svg");
      expect(icon).not.toBeInTheDocument();
    });
  });

  describe("completion status", () => {
    it("is complete when attribute and value are set", () => {
      const { container } = setup({
        attribute: "user_email",
        value: "test@example.com",
      });

      const greenIcon = container.querySelector("svg.text-green-500");
      expect(greenIcon).toBeInTheDocument();
    });

    it("is incomplete when attribute is empty", () => {
      const { container } = setup({
        attribute: "",
        value: "test@example.com",
      });

      const amberIcon = container.querySelector("svg.text-amber-500");
      expect(amberIcon).toBeInTheDocument();
    });

    it("is incomplete when value is empty string", () => {
      const { container } = setup({
        attribute: "user_email",
        value: "",
      });

      const amberIcon = container.querySelector("svg.text-amber-500");
      expect(amberIcon).toBeInTheDocument();
    });

    it("is incomplete when value is null", () => {
      const { container } = setup({
        attribute: "user_email",
        value: null as unknown as string,
      });

      const amberIcon = container.querySelector("svg.text-amber-500");
      expect(amberIcon).toBeInTheDocument();
    });

    it("is incomplete when value is undefined", () => {
      const { container } = setup({
        attribute: "user_email",
        value: undefined as unknown as string,
      });

      const amberIcon = container.querySelector("svg.text-amber-500");
      expect(amberIcon).toBeInTheDocument();
    });

    it("is incomplete when value is empty array", () => {
      const { container } = setup({
        attribute: "user_team",
        value: [],
      });

      const amberIcon = container.querySelector("svg.text-amber-500");
      expect(amberIcon).toBeInTheDocument();
    });

    it("is complete when value is non-empty array", () => {
      const { container } = setup({
        attribute: "user_team",
        operator: "in",
        value: ["team-1", "team-2"],
      });

      const greenIcon = container.querySelector("svg.text-green-500");
      expect(greenIcon).toBeInTheDocument();
    });

    it("is complete when value is a number", () => {
      const { container } = setup({
        attribute: "time_hour_simple",
        operator: "equals",
        value: 9,
      });

      const greenIcon = container.querySelector("svg.text-green-500");
      expect(greenIcon).toBeInTheDocument();
    });

    it("is complete when value is a boolean", () => {
      const { container } = setup({
        attribute: "some_flag",
        operator: "equals",
        value: true,
      });

      const greenIcon = container.querySelector("svg.text-green-500");
      expect(greenIcon).toBeInTheDocument();
    });

    it("is complete when value is a TimeRangeValue object", () => {
      const timeValue: TimeRangeValue = {
        startHour: 9,
        startMinute: 0,
        endHour: 17,
        endMinute: 0,
        days: [1, 2, 3, 4, 5],
      };

      const { container } = setup({
        attribute: "time_hours",
        operator: "between",
        value: timeValue,
      });

      const greenIcon = container.querySelector("svg.text-green-500");
      expect(greenIcon).toBeInTheDocument();
    });
  });

  describe("className prop", () => {
    it("applies className to default variant", () => {
      const { container } = setup({}, { className: "custom-class" });

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("applies className to compact variant", () => {
      const { container } = setup(
        {},
        { variant: "compact", className: "custom-compact" }
      );

      expect(container.firstChild).toHaveClass("custom-compact");
    });

    it("applies className to inline variant", () => {
      const { container } = setup(
        {},
        { variant: "inline", className: "custom-inline" }
      );

      expect(container.firstChild).toHaveClass("custom-inline");
    });

    it("merges className with existing classes", () => {
      const { container } = setup(
        {},
        { variant: "default", className: "mt-4" }
      );

      expect(container.firstChild).toHaveClass("flex", "items-start", "mt-4");
    });
  });

  describe("text styling based on completion", () => {
    it("complete condition has text-muted-foreground in default variant", () => {
      setup(
        { attribute: "user_email", value: "valid@example.com" },
        { variant: "default" }
      );

      const textSpan = screen.getByText("User's email is valid@example.com");
      expect(textSpan).toHaveClass("text-muted-foreground");
    });

    it("incomplete condition has text-amber-500 in default variant", () => {
      setup(
        { attribute: "user_email", value: "" },
        { variant: "default" }
      );

      const textSpan = screen.getByText(/\[not set\]/);
      expect(textSpan).toHaveClass("text-amber-500");
    });
  });

  describe("icon sizing", () => {
    it("icons have h-4 w-4 class", () => {
      const { container } = setup(
        { attribute: "user_email", value: "test@example.com" },
        { variant: "default" }
      );

      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("h-4", "w-4");
    });

    it("icons have shrink-0 class to prevent shrinking", () => {
      const { container } = setup(
        { attribute: "user_email", value: "test@example.com" },
        { variant: "default" }
      );

      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("shrink-0");
    });

    it("icons have mt-0.5 class for vertical alignment", () => {
      const { container } = setup(
        { attribute: "user_email", value: "test@example.com" },
        { variant: "default" }
      );

      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("mt-0.5");
    });
  });

  describe("resource reference translations", () => {
    it("shows resource name from display property", () => {
      const resourceRef: ResourceReference = {
        $ref: "resource",
        type: "agent",
        selector: { id: "agent-1" },
        display: {
          name: "My AI Agent",
          status: "valid",
          validatedAt: new Date().toISOString(),
        },
      };

      setup({
        category: "resource",
        attribute: "resource_agent",
        operator: "in",
        value: resourceRef,
      });

      expect(screen.getByText(/My AI Agent/)).toBeInTheDocument();
    });

    it("shows count when multiple resources selected", () => {
      const resourceRef: ResourceReference = {
        $ref: "resource",
        type: "agent",
        selector: { ids: ["agent-1", "agent-2", "agent-3"] },
        // No display property means it should fallback to showing count
      };

      setup({
        category: "resource",
        attribute: "resource_agent",
        operator: "in",
        value: resourceRef,
      });

      expect(screen.getByText(/3 selected/)).toBeInTheDocument();
    });

    it("shows [select resource] for empty resource reference", () => {
      const resourceRef: ResourceReference = {
        $ref: "resource",
        type: "agent",
        selector: {},
      };

      setup({
        category: "resource",
        attribute: "resource_agent",
        operator: "in",
        value: resourceRef,
      });

      expect(screen.getByText(/\[select resource\]/)).toBeInTheDocument();
    });
  });

  describe("time formatting", () => {
    it("formats time in 12-hour format with AM", () => {
      const timeValue: TimeRangeValue = {
        startHour: 9,
        startMinute: 0,
        endHour: 11,
        endMinute: 0,
        days: [1, 2, 3, 4, 5],
      };

      setup({
        attribute: "time_hours",
        operator: "between",
        value: timeValue,
      });

      expect(screen.getByText(/9 AM/)).toBeInTheDocument();
      expect(screen.getByText(/11 AM/)).toBeInTheDocument();
    });

    it("formats time in 12-hour format with PM", () => {
      const timeValue: TimeRangeValue = {
        startHour: 13,
        startMinute: 0,
        endHour: 17,
        endMinute: 0,
        days: [1, 2, 3, 4, 5],
      };

      setup({
        attribute: "time_hours",
        operator: "between",
        value: timeValue,
      });

      expect(screen.getByText(/1 PM/)).toBeInTheDocument();
      expect(screen.getByText(/5 PM/)).toBeInTheDocument();
    });

    it("formats time with minutes when not zero", () => {
      const timeValue: TimeRangeValue = {
        startHour: 9,
        startMinute: 30,
        endHour: 17,
        endMinute: 45,
        days: [1, 2, 3, 4, 5],
      };

      setup({
        attribute: "time_hours",
        operator: "between",
        value: timeValue,
      });

      expect(screen.getByText(/9:30 AM/)).toBeInTheDocument();
      expect(screen.getByText(/5:45 PM/)).toBeInTheDocument();
    });

    it("formats 12:00 as 12 PM", () => {
      const timeValue: TimeRangeValue = {
        startHour: 12,
        startMinute: 0,
        endHour: 13,
        endMinute: 0,
        days: [1],
      };

      setup({
        attribute: "time_hours",
        operator: "between",
        value: timeValue,
      });

      expect(screen.getByText(/12 PM/)).toBeInTheDocument();
    });

    it("formats midnight (0:00) as 12 AM", () => {
      const timeValue: TimeRangeValue = {
        startHour: 0,
        startMinute: 0,
        endHour: 6,
        endMinute: 0,
        days: [1],
      };

      setup({
        attribute: "time_hours",
        operator: "between",
        value: timeValue,
      });

      expect(screen.getByText(/12 AM/)).toBeInTheDocument();
    });
  });
});
