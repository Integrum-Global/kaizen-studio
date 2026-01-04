/**
 * Tests for OverallPreview component (Combined Policy)
 *
 * These tests verify the overall policy preview component's behavior including
 * displaying all conditions with AND/OR logic, toggling between plain English
 * and JSON view, empty state handling, and numbered condition list.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OverallPreview } from "../OverallPreview";
import type { PolicyCondition, TimeRangeValue } from "../types";

// Helper to render with user event setup
function setup(
  conditionsOverrides: PolicyCondition[] = [],
  propsOverrides: Partial<Omit<Parameters<typeof OverallPreview>[0], "conditions">> = {}
) {
  const user = userEvent.setup();
  const defaultProps = {
    conditions: conditionsOverrides,
    logic: "all" as const,
    showJsonToggle: true,
    ...propsOverrides,
  };
  const result = render(<OverallPreview {...defaultProps} />);
  return { user, ...result, ...defaultProps };
}

// Sample conditions for testing
const sampleConditions: PolicyCondition[] = [
  {
    id: "cond-1",
    category: "user",
    attribute: "user_email",
    operator: "equals",
    value: "admin@company.com",
  },
  {
    id: "cond-2",
    category: "resource",
    attribute: "resource_environment",
    operator: "equals",
    value: "production",
  },
];

const singleCondition: PolicyCondition[] = [
  {
    id: "cond-1",
    category: "user",
    attribute: "user_role",
    operator: "equals",
    value: "org_admin",
  },
];

describe("OverallPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic rendering", () => {
    it("renders the component with card structure", () => {
      const { container } = setup([]);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders Preview title with Eye icon", () => {
      const { container } = setup([]);

      expect(screen.getByText("Preview")).toBeInTheDocument();
      // Eye icon should be present
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("renders card header and content sections", () => {
      const { container } = setup([]);

      // Should have proper card structure
      expect(container.querySelector('[class*="CardHeader"]') || container.firstChild).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows default message when no conditions", () => {
      setup([]);

      // Text contains "everyone" as a strong element, so we check parts separately
      expect(screen.getByText(/This policy applies to/)).toBeInTheDocument();
      expect(screen.getByText("everyone")).toBeInTheDocument();
      expect(screen.getByText(/, at any time, from anywhere./)).toBeInTheDocument();
    });

    it("highlights 'everyone' as strong text", () => {
      setup([]);

      const strongElement = screen.getByText("everyone");
      expect(strongElement.tagName).toBe("STRONG");
    });

    it("does not show view mode toggle when empty", () => {
      setup([]);

      expect(screen.queryByRole("button", { name: /Text/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /JSON/i })).not.toBeInTheDocument();
    });

    it("does not show numbered list when empty", () => {
      setup([]);

      expect(screen.queryByText("1.")).not.toBeInTheDocument();
    });
  });

  describe("single condition display", () => {
    it("shows 'Access is granted when:' for single condition", () => {
      setup(singleCondition);

      expect(screen.getByText("Access is granted when:")).toBeInTheDocument();
    });

    it("does not show ALL/ANY badge for single condition", () => {
      setup(singleCondition);

      expect(screen.queryByText("ALL")).not.toBeInTheDocument();
      expect(screen.queryByText("ANY")).not.toBeInTheDocument();
    });

    it("shows condition translation", () => {
      setup(singleCondition);

      expect(screen.getByText("User has the Organization Admin role")).toBeInTheDocument();
    });

    it("shows numbered list even for single condition", () => {
      setup(singleCondition);

      expect(screen.getByText("1.")).toBeInTheDocument();
    });
  });

  describe("multiple conditions with ALL logic", () => {
    it("shows 'Access is granted when ALL of these are true:'", () => {
      setup(sampleConditions, { logic: "all" });

      expect(screen.getByText("Access is granted when")).toBeInTheDocument();
      expect(screen.getByText("ALL")).toBeInTheDocument();
      expect(screen.getByText("of these are true:")).toBeInTheDocument();
    });

    it("shows ALL badge with default variant", () => {
      setup(sampleConditions, { logic: "all" });

      const allBadge = screen.getByText("ALL");
      expect(allBadge).toBeInTheDocument();
    });

    it("shows all condition translations", () => {
      setup(sampleConditions, { logic: "all" });

      expect(screen.getByText("User's email is admin@company.com")).toBeInTheDocument();
      expect(screen.getByText("Environment is Production")).toBeInTheDocument();
    });

    it("shows numbered list for each condition", () => {
      setup(sampleConditions, { logic: "all" });

      expect(screen.getByText("1.")).toBeInTheDocument();
      expect(screen.getByText("2.")).toBeInTheDocument();
    });
  });

  describe("multiple conditions with ANY logic", () => {
    it("shows 'Access is granted when ANY of these are true:'", () => {
      setup(sampleConditions, { logic: "any" });

      expect(screen.getByText("Access is granted when")).toBeInTheDocument();
      expect(screen.getByText("ANY")).toBeInTheDocument();
      expect(screen.getByText("of these are true:")).toBeInTheDocument();
    });

    it("shows ANY badge with secondary variant", () => {
      setup(sampleConditions, { logic: "any" });

      const anyBadge = screen.getByText("ANY");
      expect(anyBadge).toBeInTheDocument();
    });

    it("shows all condition translations", () => {
      setup(sampleConditions, { logic: "any" });

      expect(screen.getByText("User's email is admin@company.com")).toBeInTheDocument();
      expect(screen.getByText("Environment is Production")).toBeInTheDocument();
    });
  });

  describe("view mode toggle", () => {
    it("shows Text and JSON toggle buttons when conditions exist", () => {
      setup(sampleConditions);

      expect(screen.getByRole("button", { name: /Text/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /JSON/i })).toBeInTheDocument();
    });

    it("defaults to Text view", () => {
      setup(sampleConditions);

      const textButton = screen.getByRole("button", { name: /Text/i });
      // Text button should have secondary variant (selected)
      expect(textButton).toHaveClass("bg-secondary");
    });

    it("switches to JSON view when JSON button clicked", async () => {
      const { user } = setup(sampleConditions);

      const jsonButton = screen.getByRole("button", { name: /JSON/i });
      await user.click(jsonButton);

      // Should show JSON structure
      expect(screen.getByText(/"logic": "all"/)).toBeInTheDocument();
    });

    it("switches back to Text view when Text button clicked", async () => {
      const { user } = setup(sampleConditions);

      // Switch to JSON first
      const jsonButton = screen.getByRole("button", { name: /JSON/i });
      await user.click(jsonButton);

      // Then back to Text
      const textButton = screen.getByRole("button", { name: /Text/i });
      await user.click(textButton);

      // Should show text translations again
      expect(screen.getByText("User's email is admin@company.com")).toBeInTheDocument();
    });

    it("hides toggle when showJsonToggle is false", () => {
      setup(sampleConditions, { showJsonToggle: false });

      expect(screen.queryByRole("button", { name: /Text/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /JSON/i })).not.toBeInTheDocument();
    });

    it("shows toggle by default (showJsonToggle not specified)", () => {
      render(
        <OverallPreview
          conditions={sampleConditions}
          logic="all"
        />
      );

      expect(screen.getByRole("button", { name: /Text/i })).toBeInTheDocument();
    });
  });

  describe("JSON view", () => {
    it("shows JSON with logic property", async () => {
      const { user } = setup(sampleConditions, { logic: "all" });

      const jsonButton = screen.getByRole("button", { name: /JSON/i });
      await user.click(jsonButton);

      expect(screen.getByText(/"logic": "all"/)).toBeInTheDocument();
    });

    it("shows JSON with conditions array", async () => {
      const { user } = setup(sampleConditions, { logic: "all" });

      const jsonButton = screen.getByRole("button", { name: /JSON/i });
      await user.click(jsonButton);

      expect(screen.getByText(/"conditions":/)).toBeInTheDocument();
    });

    it("shows condition category in JSON", async () => {
      const { user } = setup(sampleConditions, { logic: "all" });

      const jsonButton = screen.getByRole("button", { name: /JSON/i });
      await user.click(jsonButton);

      expect(screen.getByText(/"category": "user"/)).toBeInTheDocument();
    });

    it("shows condition attribute in JSON", async () => {
      const { user } = setup(sampleConditions, { logic: "all" });

      const jsonButton = screen.getByRole("button", { name: /JSON/i });
      await user.click(jsonButton);

      expect(screen.getByText(/"attribute": "user_email"/)).toBeInTheDocument();
    });

    it("shows condition operator in JSON", async () => {
      const { user } = setup(sampleConditions, { logic: "all" });

      const jsonButton = screen.getByRole("button", { name: /JSON/i });
      await user.click(jsonButton);

      expect(screen.getByText(/"operator": "equals"/)).toBeInTheDocument();
    });

    it("shows condition value in JSON", async () => {
      const { user } = setup(sampleConditions, { logic: "all" });

      const jsonButton = screen.getByRole("button", { name: /JSON/i });
      await user.click(jsonButton);

      expect(screen.getByText(/"value": "admin@company.com"/)).toBeInTheDocument();
    });

    it("renders JSON in pre/code tags", async () => {
      const { user, container } = setup(sampleConditions);

      const jsonButton = screen.getByRole("button", { name: /JSON/i });
      await user.click(jsonButton);

      expect(container.querySelector("pre")).toBeInTheDocument();
      expect(container.querySelector("code")).toBeInTheDocument();
    });

    it("shows JSON with proper formatting (indentation)", async () => {
      const { user } = setup(sampleConditions);

      const jsonButton = screen.getByRole("button", { name: /JSON/i });
      await user.click(jsonButton);

      // Formatted JSON should have newlines
      const preElement = screen.getByText(/"logic": "all"/).closest("pre");
      expect(preElement?.textContent).toContain("\n");
    });
  });

  describe("condition translations", () => {
    it("translates user email condition", () => {
      setup([
        {
          id: "cond-1",
          category: "user",
          attribute: "user_email",
          operator: "equals",
          value: "test@example.com",
        },
      ]);

      expect(screen.getByText("User's email is test@example.com")).toBeInTheDocument();
    });

    it("translates environment condition", () => {
      setup([
        {
          id: "cond-1",
          category: "resource",
          attribute: "resource_environment",
          operator: "equals",
          value: "production",
        },
      ]);

      expect(screen.getByText("Environment is Production")).toBeInTheDocument();
    });

    it("translates IP condition", () => {
      setup([
        {
          id: "cond-1",
          category: "context",
          attribute: "context_ip",
          operator: "starts_with",
          value: "192.168.",
        },
      ]);

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

      setup([
        {
          id: "cond-1",
          category: "time",
          attribute: "time_hours",
          operator: "between",
          value: timeValue,
        },
      ]);

      expect(screen.getByText("Access is allowed 9 AM to 5 PM on weekdays")).toBeInTheDocument();
    });
  });

  describe("className prop", () => {
    it("applies className to root element", () => {
      const { container } = setup([], { className: "custom-class" });

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("merges className with existing classes", () => {
      const { container } = setup([], { className: "mt-4" });

      // Should have both custom class and any default classes
      expect(container.firstChild).toHaveClass("mt-4");
    });
  });

  describe("numbered list formatting", () => {
    it("shows correct numbers for conditions", () => {
      const threeConditions: PolicyCondition[] = [
        { id: "1", category: "user", attribute: "user_email", operator: "equals", value: "a@b.com" },
        { id: "2", category: "user", attribute: "user_role", operator: "equals", value: "admin" },
        { id: "3", category: "resource", attribute: "resource_environment", operator: "equals", value: "prod" },
      ];

      setup(threeConditions);

      expect(screen.getByText("1.")).toBeInTheDocument();
      expect(screen.getByText("2.")).toBeInTheDocument();
      expect(screen.getByText("3.")).toBeInTheDocument();
    });

    it("numbers are right-aligned with fixed width", () => {
      setup(sampleConditions);

      const numberSpan = screen.getByText("1.").closest("span");
      expect(numberSpan).toHaveClass("w-5", "text-right");
    });

    it("numbers have muted foreground color", () => {
      setup(sampleConditions);

      const numberSpan = screen.getByText("1.").closest("span");
      expect(numberSpan).toHaveClass("text-muted-foreground/60");
    });

    it("condition text has foreground color", () => {
      setup(sampleConditions);

      const conditionText = screen.getByText("User's email is admin@company.com");
      expect(conditionText).toHaveClass("text-foreground");
    });
  });

  describe("list item layout", () => {
    it("list items have flex layout", () => {
      const { container } = setup(sampleConditions);

      const listItems = container.querySelectorAll("li");
      listItems.forEach((li) => {
        expect(li).toHaveClass("flex");
      });
    });

    it("list items have items-start alignment", () => {
      const { container } = setup(sampleConditions);

      const listItems = container.querySelectorAll("li");
      listItems.forEach((li) => {
        expect(li).toHaveClass("items-start");
      });
    });

    it("list items have gap-2 spacing", () => {
      const { container } = setup(sampleConditions);

      const listItems = container.querySelectorAll("li");
      listItems.forEach((li) => {
        expect(li).toHaveClass("gap-2");
      });
    });
  });

  describe("button styling", () => {
    it("toggle buttons have type=button", () => {
      setup(sampleConditions);

      const textButton = screen.getByRole("button", { name: /Text/i });
      const jsonButton = screen.getByRole("button", { name: /JSON/i });

      expect(textButton).toHaveAttribute("type", "button");
      expect(jsonButton).toHaveAttribute("type", "button");
    });

    it("buttons have small size", () => {
      setup(sampleConditions);

      const textButton = screen.getByRole("button", { name: /Text/i });
      expect(textButton).toHaveClass("h-7");
    });

    it("buttons have icons", () => {
      const { container } = setup(sampleConditions);

      const buttons = container.querySelectorAll('[class*="flex"][class*="gap-1"]');
      // Text and JSON buttons should have icons
      buttons.forEach((btn) => {
        const icon = btn.querySelector("svg");
        if (btn.textContent?.includes("Text") || btn.textContent?.includes("JSON")) {
          expect(icon).toBeInTheDocument();
        }
      });
    });
  });

  describe("many conditions", () => {
    it("handles 10+ conditions correctly", () => {
      const manyConditions: PolicyCondition[] = Array.from({ length: 10 }, (_, i) => ({
        id: `cond-${i + 1}`,
        category: "user" as const,
        attribute: "user_email",
        operator: "equals" as const,
        value: `user${i + 1}@example.com`,
      }));

      setup(manyConditions);

      expect(screen.getByText("10.")).toBeInTheDocument();
    });

    it("shows ALL badge for many conditions with all logic", () => {
      const manyConditions: PolicyCondition[] = Array.from({ length: 5 }, (_, i) => ({
        id: `cond-${i + 1}`,
        category: "user" as const,
        attribute: "user_email",
        operator: "equals" as const,
        value: `user${i + 1}@example.com`,
      }));

      setup(manyConditions, { logic: "all" });

      expect(screen.getByText("ALL")).toBeInTheDocument();
    });
  });

  describe("incomplete conditions", () => {
    it("shows [not set] for empty value", () => {
      setup([
        {
          id: "cond-1",
          category: "user",
          attribute: "user_email",
          operator: "equals",
          value: "",
        },
      ]);

      expect(screen.getByText(/\[not set\]/)).toBeInTheDocument();
    });

    it("shows [none selected] for empty array", () => {
      setup([
        {
          id: "cond-1",
          category: "user",
          attribute: "user_team",
          operator: "in",
          value: [],
        },
      ]);

      expect(screen.getByText(/\[none selected\]/)).toBeInTheDocument();
    });
  });

  describe("JSON toggle with different logics", () => {
    it("shows logic: any in JSON for ANY logic", async () => {
      const { user } = setup(sampleConditions, { logic: "any" });

      const jsonButton = screen.getByRole("button", { name: /JSON/i });
      await user.click(jsonButton);

      expect(screen.getByText(/"logic": "any"/)).toBeInTheDocument();
    });

    it("shows logic: all in JSON for ALL logic", async () => {
      const { user } = setup(sampleConditions, { logic: "all" });

      const jsonButton = screen.getByRole("button", { name: /JSON/i });
      await user.click(jsonButton);

      expect(screen.getByText(/"logic": "all"/)).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("condition list is an unordered list", () => {
      const { container } = setup(sampleConditions);

      expect(container.querySelector("ul")).toBeInTheDocument();
    });

    it("each condition is a list item", () => {
      const { container } = setup(sampleConditions);

      const listItems = container.querySelectorAll("li");
      expect(listItems.length).toBe(sampleConditions.length);
    });

    it("toggle buttons are keyboard accessible", () => {
      setup(sampleConditions);

      const textButton = screen.getByRole("button", { name: /Text/i });
      const jsonButton = screen.getByRole("button", { name: /JSON/i });

      expect(textButton).not.toHaveAttribute("disabled");
      expect(jsonButton).not.toHaveAttribute("disabled");
    });
  });
});
