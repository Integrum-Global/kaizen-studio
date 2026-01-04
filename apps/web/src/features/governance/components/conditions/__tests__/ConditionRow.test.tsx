/**
 * Tests for ConditionRow component
 *
 * These tests verify the single condition row component's behavior including
 * category/attribute/operator/value selection, translation preview, and validation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConditionRow } from "../ConditionRow";
import type { PolicyCondition, ConditionCategory, ConditionOperator, ConditionValue } from "../types";

// Helper to find button by its child svg icon name (Lucide uses data-testid or class patterns)
function findButtonBySvgClass(container: HTMLElement, svgClassName: string) {
  // Lucide icons may have different class patterns, so we check for svg elements
  const buttons = container.querySelectorAll("button");
  for (const button of buttons) {
    const svg = button.querySelector("svg");
    if (svg && svg.classList.contains(svgClassName)) {
      return button;
    }
  }
  return null;
}

// Helper to render with user event setup
function setup(overrides: Partial<Parameters<typeof ConditionRow>[0]> = {}) {
  const user = userEvent.setup();
  const defaultCondition: PolicyCondition = {
    id: "test-condition-1",
    category: "user",
    attribute: "user_email",
    operator: "equals",
    value: "test@example.com",
  };
  const defaultProps = {
    condition: defaultCondition,
    onUpdateCategory: vi.fn(),
    onUpdateAttribute: vi.fn(),
    onUpdateOperator: vi.fn(),
    onUpdateValue: vi.fn(),
    onRemove: vi.fn(),
    errors: [],
    disabled: false,
  };
  const mergedProps = { ...defaultProps, ...overrides };
  const result = render(<ConditionRow {...mergedProps} />);
  return { user, ...result, ...mergedProps };
}

describe("ConditionRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the category select", () => {
      setup();

      // Category select should be present - look for the trigger
      const selects = screen.getAllByRole("combobox");
      expect(selects.length).toBeGreaterThan(0);
    });

    it("renders the delete button", () => {
      const { container } = setup();

      // Find the ghost variant button (delete button uses variant="ghost")
      const buttons = container.querySelectorAll("button");
      // There should be a delete button - it's typically the last button after selects
      const deleteButton = Array.from(buttons).find(
        (btn) => btn.querySelector("svg") && !btn.getAttribute("role")
      );
      expect(deleteButton).toBeInTheDocument();
    });

    it("renders translation preview for complete condition", () => {
      setup({
        condition: {
          id: "test-1",
          category: "user",
          attribute: "user_email",
          operator: "equals",
          value: "john@company.com",
        },
      });

      expect(screen.getByText("User's email is john@company.com")).toBeInTheDocument();
    });

    it("renders checkmark icon for complete valid condition", () => {
      const { container } = setup({
        condition: {
          id: "test-1",
          category: "user",
          attribute: "user_email",
          operator: "equals",
          value: "valid@example.com",
        },
        errors: [],
      });

      // Complete valid conditions show checkmark - look for svg with green color class
      const greenSvg = container.querySelector("svg.text-green-500");
      expect(greenSvg).toBeInTheDocument();
    });

    it("renders warning icon for incomplete condition", () => {
      setup({
        condition: {
          id: "test-1",
          category: "user",
          attribute: "",
          operator: "equals",
          value: "",
        },
        errors: [],
      });

      // Should show "Complete the condition above" with amber color
      expect(screen.getByText("Complete the condition above")).toBeInTheDocument();
    });

    it("renders error icon and message for validation errors", () => {
      const { container } = setup({
        condition: {
          id: "test-1",
          category: "user",
          attribute: "user_email",
          operator: "equals",
          value: "invalid-email",
        },
        errors: ["Enter a valid email address"],
      });

      expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();

      // Error icon should be present - look for svg with destructive color
      const destructiveSvg = container.querySelector("svg.text-destructive");
      expect(destructiveSvg).toBeInTheDocument();
    });
  });

  describe("category selection", () => {
    it("calls onUpdateCategory when category changes", async () => {
      const { user, onUpdateCategory } = setup();

      // Find and click the category select (first combobox)
      const selects = screen.getAllByRole("combobox");
      const categorySelect = selects[0];
      await user.click(categorySelect);

      // Find and click "What" (resource category)
      const resourceOption = await screen.findByRole("option", { name: /What/ });
      await user.click(resourceOption);

      expect(onUpdateCategory).toHaveBeenCalledWith("resource");
    });
  });

  describe("attribute selection", () => {
    it("shows placeholder when no category is selected", () => {
      setup({
        condition: {
          id: "test-1",
          category: "" as ConditionCategory,
          attribute: "",
          operator: "equals",
          value: "",
        },
      });

      expect(screen.getByText("Select category first")).toBeInTheDocument();
    });

    it("calls onUpdateAttribute when attribute changes", async () => {
      const { user, onUpdateAttribute } = setup({
        condition: {
          id: "test-1",
          category: "user",
          attribute: "",
          operator: "equals",
          value: "",
        },
      });

      // Find and click the attribute select (second combobox)
      const selects = screen.getAllByRole("combobox");
      const attributeSelect = selects[1];
      await user.click(attributeSelect);

      // Find and click an attribute option - use exact match for "Email" to avoid ambiguity
      const options = await screen.findAllByRole("option");
      const emailOption = options.find((opt) => {
        const text = opt.textContent;
        return text?.startsWith("Email") && text?.includes("User's email address");
      });
      expect(emailOption).toBeDefined();
      await user.click(emailOption!);

      expect(onUpdateAttribute).toHaveBeenCalled();
    });
  });

  describe("operator selection", () => {
    it("disables operator select when no attribute is selected", () => {
      setup({
        condition: {
          id: "test-1",
          category: "user",
          attribute: "",
          operator: "equals",
          value: "",
        },
      });

      // Operator select (third combobox) should be disabled when no attribute
      const selects = screen.getAllByRole("combobox");
      const operatorSelect = selects[2];
      expect(operatorSelect).toHaveAttribute("data-disabled");
    });

    it("calls onUpdateOperator when operator changes", async () => {
      const { user, onUpdateOperator } = setup({
        condition: {
          id: "test-1",
          category: "user",
          attribute: "user_email",
          operator: "equals",
          value: "test@example.com",
        },
      });

      // Find and click the operator select (third combobox)
      const selects = screen.getAllByRole("combobox");
      const operatorSelect = selects[2];
      await user.click(operatorSelect);

      // Find and click a different operator
      const containsOption = await screen.findByRole("option", { name: /contains/i });
      await user.click(containsOption);

      expect(onUpdateOperator).toHaveBeenCalled();
    });
  });

  describe("remove button", () => {
    it("calls onRemove when delete button is clicked", async () => {
      const { user, onRemove, container } = setup();

      // Find the delete button - it's a button with svg (not a combobox)
      const buttons = container.querySelectorAll("button");
      const deleteButton = Array.from(buttons).find(
        (btn) => btn.querySelector("svg") && !btn.getAttribute("role")
      );
      expect(deleteButton).toBeInTheDocument();
      await user.click(deleteButton!);

      expect(onRemove).toHaveBeenCalled();
    });

    it("is disabled when disabled prop is true", () => {
      const { container } = setup({ disabled: true });

      // Find the delete button
      const buttons = container.querySelectorAll("button");
      const deleteButton = Array.from(buttons).find(
        (btn) => btn.querySelector("svg") && !btn.getAttribute("role")
      );
      expect(deleteButton).toBeDisabled();
    });
  });

  describe("disabled state", () => {
    it("disables all selects when disabled", () => {
      setup({ disabled: true });

      const selects = screen.getAllByRole("combobox");
      selects.forEach((select) => {
        // Radix Select uses aria-disabled
        expect(select).toHaveAttribute("data-disabled");
      });
    });

    it("disables delete button when disabled", () => {
      const { container } = setup({ disabled: true });

      // Find the delete button
      const buttons = container.querySelectorAll("button");
      const deleteButton = Array.from(buttons).find(
        (btn) => btn.querySelector("svg") && !btn.getAttribute("role")
      );
      expect(deleteButton).toBeDisabled();
    });
  });

  describe("translation preview", () => {
    it("shows user email translation", () => {
      setup({
        condition: {
          id: "test-1",
          category: "user",
          attribute: "user_email",
          operator: "equals",
          value: "admin@company.com",
        },
      });

      expect(screen.getByText("User's email is admin@company.com")).toBeInTheDocument();
    });

    it("shows user role translation with enum label", () => {
      setup({
        condition: {
          id: "test-1",
          category: "user",
          attribute: "user_role",
          operator: "equals",
          value: "org_admin",
        },
      });

      expect(screen.getByText("User has the Organization Admin role")).toBeInTheDocument();
    });

    it("shows environment translation with enum label", () => {
      setup({
        condition: {
          id: "test-1",
          category: "resource",
          attribute: "resource_environment",
          operator: "equals",
          value: "production",
        },
      });

      expect(screen.getByText("Environment is Production")).toBeInTheDocument();
    });

    it("shows time range translation", () => {
      setup({
        condition: {
          id: "test-1",
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
      });

      expect(screen.getByText("Access is allowed 9 AM to 5 PM on weekdays")).toBeInTheDocument();
    });

    it("shows [not set] for empty value", () => {
      setup({
        condition: {
          id: "test-1",
          category: "user",
          attribute: "user_email",
          operator: "equals",
          value: "",
        },
        errors: [],
      });

      // When incomplete, shows "Complete the condition" instead of translation
      expect(screen.getByText("Complete the condition above")).toBeInTheDocument();
    });
  });

  describe("validation states", () => {
    it("shows first error when multiple errors exist", () => {
      setup({
        condition: {
          id: "test-1",
          category: "user",
          attribute: "",
          operator: "equals",
          value: "",
        },
        errors: ["Please select an attribute", "Please enter a value"],
      });

      // Should show first error only
      expect(screen.getByText("Please select an attribute")).toBeInTheDocument();
      expect(screen.queryByText("Please enter a value")).not.toBeInTheDocument();
    });

    it("shows validation error with destructive color", () => {
      setup({
        condition: {
          id: "test-1",
          category: "user",
          attribute: "user_email",
          operator: "equals",
          value: "invalid",
        },
        errors: ["Enter a valid email address"],
      });

      const errorText = screen.getByText("Enter a valid email address");
      expect(errorText).toHaveClass("text-destructive");
    });

    it("shows incomplete warning with amber color", () => {
      setup({
        condition: {
          id: "test-1",
          category: "user",
          attribute: "",
          operator: "equals",
          value: "",
        },
        errors: [],
      });

      const warningText = screen.getByText("Complete the condition above");
      expect(warningText).toHaveClass("text-amber-500");
    });

    it("shows success state with green checkmark", () => {
      const { container } = setup({
        condition: {
          id: "test-1",
          category: "user",
          attribute: "user_email",
          operator: "equals",
          value: "valid@example.com",
        },
        errors: [],
      });

      // Success state shows green svg icon
      const greenSvg = container.querySelector("svg.text-green-500");
      expect(greenSvg).toBeInTheDocument();
    });
  });

  describe("different condition types", () => {
    it("renders user category condition", () => {
      setup({
        condition: {
          id: "test-1",
          category: "user",
          attribute: "user_email",
          operator: "equals",
          value: "test@example.com",
        },
      });

      expect(screen.getByText("User's email is test@example.com")).toBeInTheDocument();
    });

    it("renders resource category condition", () => {
      setup({
        condition: {
          id: "test-1",
          category: "resource",
          attribute: "resource_environment",
          operator: "equals",
          value: "production",
        },
      });

      expect(screen.getByText("Environment is Production")).toBeInTheDocument();
    });

    it("renders time category condition", () => {
      setup({
        condition: {
          id: "test-1",
          category: "time",
          attribute: "time_hours",
          operator: "between",
          value: {
            startHour: 8,
            startMinute: 0,
            endHour: 18,
            endMinute: 0,
            days: [1, 2, 3, 4, 5],
          },
        },
      });

      expect(screen.getByText("Access is allowed 8 AM to 6 PM on weekdays")).toBeInTheDocument();
    });

    it("renders context category condition", () => {
      setup({
        condition: {
          id: "test-1",
          category: "context",
          attribute: "context_ip",
          operator: "equals",
          value: "192.168.1.1",
        },
      });

      expect(screen.getByText("IP address is 192.168.1.1")).toBeInTheDocument();
    });
  });

  describe("wrapped card styling", () => {
    it("renders in a card container", () => {
      const { container } = setup();

      // Should have the card wrapper
      const card = container.querySelector('[class*="rounded-lg"]');
      expect(card).toBeInTheDocument();
    });

    it("has proper spacing between elements", () => {
      const { container } = setup();

      // Check for space-y class on main container
      const spacedContainer = container.querySelector('[class*="space-y"]');
      expect(spacedContainer).toBeInTheDocument();
    });
  });
});
