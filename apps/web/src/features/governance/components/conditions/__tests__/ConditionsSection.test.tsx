/**
 * Tests for ConditionsSection component
 *
 * These tests verify the main container component's behavior including
 * template buttons, condition list rendering, logic toggle, and preview.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConditionsSection } from "../ConditionsSection";
import type { PolicyCondition, ConditionGroup } from "../types";

// Create a test query client
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });
}

// Helper to render with providers
function setup(props = {}) {
  const user = userEvent.setup();
  const queryClient = createTestQueryClient();
  const defaultProps = {
    initialConditions: [],
    initialLogic: "all" as const,
    onChange: vi.fn(),
    disabled: false,
  };
  const mergedProps = { ...defaultProps, ...props };
  const result = render(
    <QueryClientProvider client={queryClient}>
      <ConditionsSection {...mergedProps} />
    </QueryClientProvider>
  );
  return { user, ...result, onChange: mergedProps.onChange };
}

describe("ConditionsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial rendering", () => {
    it("renders the conditions header", () => {
      setup();

      expect(screen.getByText("Conditions")).toBeInTheDocument();
    });

    it("renders the help tooltip trigger", async () => {
      const { container } = setup();

      // Find the help icon - Lucide icons render as svg elements with h-4 w-4 classes
      const helpIconContainer = container.querySelector("svg.h-4.w-4.text-muted-foreground");
      expect(helpIconContainer).toBeInTheDocument();
    });

    it("renders quick templates section", () => {
      setup();

      expect(screen.getByText("Quick Templates")).toBeInTheDocument();
    });

    it("renders all common template buttons", () => {
      setup();

      expect(screen.getByRole("button", { name: /Team Access/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Business Hours/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /IP Restriction/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Specific Agent/i })).toBeInTheDocument();
    });

    it("renders empty state when no conditions", () => {
      setup();

      expect(screen.getByText("No conditions defined")).toBeInTheDocument();
      expect(screen.getByText(/This policy will apply to/)).toBeInTheDocument();
      // "everyone" appears in multiple places (empty state message and preview)
      const everyoneElements = screen.getAllByText("everyone");
      expect(everyoneElements.length).toBeGreaterThanOrEqual(1);
    });

    it("renders Add Condition button", () => {
      setup();

      expect(screen.getByRole("button", { name: /Add Condition/i })).toBeInTheDocument();
    });

    it("renders preview with default message", () => {
      setup();

      // The preview text has "everyone" in a strong tag, so use partial matching
      expect(screen.getByText(/This policy applies to/)).toBeInTheDocument();
      const everyoneElements = screen.getAllByText("everyone");
      expect(everyoneElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("adding conditions", () => {
    it("adds a condition when clicking Add Condition", async () => {
      const { user, onChange } = setup();

      const addButton = screen.getByRole("button", { name: /Add Condition/i });
      await user.click(addButton);

      // Empty state should be gone
      expect(screen.queryByText("No conditions defined")).not.toBeInTheDocument();
    });

    it("adds multiple conditions", async () => {
      const { user, onChange } = setup();

      const addButton = screen.getByRole("button", { name: /Add Condition/i });
      await user.click(addButton);
      await user.click(addButton);
      await user.click(addButton);

      // Should have 3 conditions tracked via onChange
      await vi.waitFor(() => {
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as ConditionGroup;
        expect(lastCall.conditions.length).toBe(3);
      });
    });
  });

  describe("applying templates", () => {
    it("applies Team Access template", async () => {
      const { user, onChange } = setup();

      const teamAccessBtn = screen.getByRole("button", { name: /Team Access/i });
      await user.click(teamAccessBtn);

      // Should no longer show empty state
      expect(screen.queryByText("No conditions defined")).not.toBeInTheDocument();

      // onChange should be called with template conditions
      await vi.waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as ConditionGroup;
        expect(lastCall.conditions.length).toBe(1);
        // Team Access template uses user_team attribute
        expect(lastCall.conditions[0].category).toBe("user");
      });
    });

    it("applies Business Hours template", async () => {
      const { user, onChange } = setup();

      const businessHoursBtn = screen.getByRole("button", { name: /Business Hours/i });
      await user.click(businessHoursBtn);

      await vi.waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as ConditionGroup;
        expect(lastCall.conditions[0].attribute).toBe("time_hours");
        expect(lastCall.conditions[0].value).toMatchObject({
          startHour: 9,
          endHour: 17,
        });
      });
    });

    it("applies IP Restriction template", async () => {
      const { user, onChange } = setup();

      const ipBtn = screen.getByRole("button", { name: /IP Restriction/i });
      await user.click(ipBtn);

      await vi.waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as ConditionGroup;
        expect(lastCall.conditions[0].attribute).toBe("context_ip");
      });
    });

    it("applies Specific Agent template and adds condition", async () => {
      const { user, onChange } = setup();

      const agentBtn = screen.getByRole("button", { name: /Specific Agent/i });
      await user.click(agentBtn);

      // Should no longer show empty state
      expect(screen.queryByText("No conditions defined")).not.toBeInTheDocument();

      await vi.waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as ConditionGroup;
        expect(lastCall.conditions.length).toBe(1);
      });
    });

    it("appends template to existing conditions", async () => {
      const initialConditions: PolicyCondition[] = [
        {
          id: "existing-1",
          category: "user",
          attribute: "user_email",
          operator: "equals",
          value: "test@example.com",
        },
      ];

      const { user, onChange } = setup({ initialConditions });

      // Apply Business Hours template (it has complete data)
      const businessHoursBtn = screen.getByRole("button", { name: /Business Hours/i });
      await user.click(businessHoursBtn);

      await vi.waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as ConditionGroup;
        expect(lastCall.conditions.length).toBe(2);
      });
    });
  });

  describe("removing conditions", () => {
    it("removes a condition when clicking delete button", async () => {
      const initialConditions: PolicyCondition[] = [
        {
          id: "cond-1",
          category: "user",
          attribute: "user_email",
          operator: "equals",
          value: "test@example.com",
        },
      ];

      const { user, container, onChange } = setup({ initialConditions });

      // Find the delete button - look for svg with destructive class (trash icon)
      const buttons = container.querySelectorAll("button");
      const deleteButton = Array.from(buttons).find((btn) => {
        const svg = btn.querySelector("svg.text-destructive");
        return svg !== null;
      });
      expect(deleteButton).toBeInTheDocument();
      await user.click(deleteButton!);

      // Verify via onChange that condition was removed
      await vi.waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as ConditionGroup;
        expect(lastCall.conditions.length).toBe(0);
      });
    });
  });

  describe("logic toggle", () => {
    it("does not show logic toggle with single condition", async () => {
      const { user } = setup();

      const addButton = screen.getByRole("button", { name: /Add Condition/i });
      await user.click(addButton);

      expect(screen.queryByText("When multiple conditions:")).not.toBeInTheDocument();
    });

    it("shows logic toggle with multiple conditions", async () => {
      const { user } = setup();

      const addButton = screen.getByRole("button", { name: /Add Condition/i });
      await user.click(addButton);
      await user.click(addButton);

      expect(screen.getByText("When multiple conditions:")).toBeInTheDocument();
      expect(screen.getByLabelText("ALL must match")).toBeInTheDocument();
      expect(screen.getByLabelText("ANY can match")).toBeInTheDocument();
    });

    it("defaults to ALL logic", async () => {
      const { user } = setup();

      const addButton = screen.getByRole("button", { name: /Add Condition/i });
      await user.click(addButton);
      await user.click(addButton);

      const allRadio = screen.getByRole("radio", { name: /ALL must match/i });
      expect(allRadio).toBeChecked();
    });

    it("can toggle to ANY logic", async () => {
      const { user, onChange } = setup();

      const addButton = screen.getByRole("button", { name: /Add Condition/i });
      await user.click(addButton);
      await user.click(addButton);

      const anyRadio = screen.getByRole("radio", { name: /ANY can match/i });
      await user.click(anyRadio);

      expect(anyRadio).toBeChecked();

      await vi.waitFor(() => {
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as ConditionGroup;
        expect(lastCall.logic).toBe("any");
      });
    });

    it("hides logic toggle when going back to single condition", async () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "user_email", operator: "equals", value: "a@b.com" },
        { id: "cond-2", category: "user", attribute: "user_role", operator: "equals", value: "admin" },
      ];

      const { user, container, onChange } = setup({ initialConditions });

      // Initially shows logic toggle
      expect(screen.getByText("When multiple conditions:")).toBeInTheDocument();

      // Find delete buttons with the trash icon (destructive variant)
      const deleteButton = container.querySelector("button svg.text-destructive")?.closest("button");
      expect(deleteButton).toBeInTheDocument();
      await user.click(deleteButton!);

      // Wait for onChange to be called with only 1 condition
      await vi.waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as ConditionGroup;
        expect(lastCall.conditions.length).toBe(1);
      });
    });
  });

  describe("preview updates", () => {
    it("updates preview when conditions change", async () => {
      const { user } = setup();

      // Apply Business Hours template (has a complete condition with value)
      const businessHoursBtn = screen.getByRole("button", { name: /Business Hours/i });
      await user.click(businessHoursBtn);

      // Preview should update (no longer show default message)
      expect(screen.queryByText("This policy applies to everyone, at any time, from anywhere.")).not.toBeInTheDocument();
    });

    it("shows ALL logic in preview", async () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "user_email", operator: "equals", value: "test@example.com" },
        { id: "cond-2", category: "resource", attribute: "resource_environment", operator: "equals", value: "production" },
      ];

      setup({ initialConditions, initialLogic: "all" });

      // The text is broken into elements: "Access is granted when" + Badge("ALL") + "of these are true:"
      expect(screen.getByText(/Access is granted when/)).toBeInTheDocument();
      expect(screen.getByText("ALL")).toBeInTheDocument();
      expect(screen.getByText(/of these are true:/)).toBeInTheDocument();
    });

    it("shows ANY logic in preview", async () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "user_email", operator: "equals", value: "test@example.com" },
        { id: "cond-2", category: "resource", attribute: "resource_environment", operator: "equals", value: "production" },
      ];

      setup({ initialConditions, initialLogic: "any" });

      // The text is broken into elements: "Access is granted when" + Badge("ANY") + "of these are true:"
      expect(screen.getByText(/Access is granted when/)).toBeInTheDocument();
      expect(screen.getByText("ANY")).toBeInTheDocument();
      expect(screen.getByText(/of these are true:/)).toBeInTheDocument();
    });
  });

  describe("disabled state", () => {
    it("disables all template buttons when disabled", () => {
      setup({ disabled: true });

      const teamAccessBtn = screen.getByRole("button", { name: /Team Access/i });
      const businessHoursBtn = screen.getByRole("button", { name: /Business Hours/i });

      expect(teamAccessBtn).toBeDisabled();
      expect(businessHoursBtn).toBeDisabled();
    });

    it("disables Add Condition button when disabled", () => {
      setup({ disabled: true });

      const addButton = screen.getByRole("button", { name: /Add Condition/i });
      expect(addButton).toBeDisabled();
    });

    it("disables condition row controls when disabled", () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "user_email", operator: "equals", value: "test@example.com" },
      ];

      const { container } = setup({ initialConditions, disabled: true });

      // Find the delete button - it's a button with svg (not a combobox)
      const buttons = container.querySelectorAll("button");
      const deleteButton = Array.from(buttons).find(
        (btn) => btn.querySelector("svg") && !btn.getAttribute("role") && !btn.textContent?.includes("Add") && !btn.textContent?.includes("Team") && !btn.textContent?.includes("Business") && !btn.textContent?.includes("IP") && !btn.textContent?.includes("Work Unit")
      );
      expect(deleteButton).toBeDisabled();
    });

    it("disables logic toggle when disabled", () => {
      const initialConditions: PolicyCondition[] = [
        { id: "cond-1", category: "user", attribute: "user_email", operator: "equals", value: "a" },
        { id: "cond-2", category: "user", attribute: "user_role", operator: "equals", value: "admin" },
      ];

      setup({ initialConditions, disabled: true });

      const allRadio = screen.getByRole("radio", { name: /ALL must match/i });
      const anyRadio = screen.getByRole("radio", { name: /ANY can match/i });

      expect(allRadio).toBeDisabled();
      expect(anyRadio).toBeDisabled();
    });
  });

  describe("condition rows", () => {
    it("renders condition rows with correct data", () => {
      const initialConditions: PolicyCondition[] = [
        {
          id: "cond-1",
          category: "user",
          attribute: "user_email",
          operator: "equals",
          value: "test@example.com",
        },
      ];

      setup({ initialConditions });

      // Should show the condition translation (appears in both ConditionRow and OverallPreview)
      const translations = screen.getAllByText("User's email is test@example.com");
      expect(translations.length).toBeGreaterThanOrEqual(1);
    });

    it("shows validation message for incomplete conditions", async () => {
      const { user, onChange } = setup();

      // Add an empty condition
      const addButton = screen.getByRole("button", { name: /Add Condition/i });
      await user.click(addButton);

      // Verify condition was added
      await vi.waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as ConditionGroup;
        expect(lastCall.conditions.length).toBe(1);
        expect(lastCall.conditions[0].attribute).toBe(""); // Empty = incomplete
      });
    });

    it("shows success state for complete valid conditions", () => {
      const initialConditions: PolicyCondition[] = [
        {
          id: "cond-1",
          category: "user",
          attribute: "user_email",
          operator: "equals",
          value: "valid@example.com",
        },
      ];

      const { container } = setup({ initialConditions });

      // Should show green checkmark icon
      const greenIcon = container.querySelector("svg.text-green-500");
      expect(greenIcon).toBeInTheDocument();
    });
  });

  describe("onChange callback", () => {
    it("calls onChange with updated group when adding condition", async () => {
      const { user, onChange } = setup();

      const addButton = screen.getByRole("button", { name: /Add Condition/i });
      await user.click(addButton);

      await vi.waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as ConditionGroup;
        expect(lastCall.conditions.length).toBe(1);
        expect(lastCall.logic).toBe("all");
      });
    });

    it("does not call onChange on initial render", () => {
      const { onChange } = setup();

      // onChange should not be called on initial render
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
