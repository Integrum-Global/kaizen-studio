/**
 * Tests for select components
 *
 * These tests verify the CategorySelect, AttributeSelect, and OperatorSelect
 * components render correctly and handle user interactions.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategorySelect } from "../selects/CategorySelect";
import { AttributeSelect } from "../selects/AttributeSelect";
import { OperatorSelect } from "../selects/OperatorSelect";
import type { ConditionCategory, ConditionOperator } from "../types";

describe("CategorySelect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders with placeholder when no value", () => {
      render(
        <CategorySelect value="" onChange={vi.fn()} />
      );

      expect(screen.getByText("Select...")).toBeInTheDocument();
    });

    it("renders with selected value", async () => {
      const user = userEvent.setup();
      render(
        <CategorySelect value="user" onChange={vi.fn()} />
      );

      // Click to open the select
      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      // The selected value should show "Who" (user category label)
      expect(screen.getByRole("option", { name: /Who/ })).toBeInTheDocument();
    });

    it("shows all category options when opened", async () => {
      const user = userEvent.setup();
      render(
        <CategorySelect value="" onChange={vi.fn()} />
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      expect(screen.getByRole("option", { name: /Who/ })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /What/ })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /When/ })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /Where/ })).toBeInTheDocument();
    });

    it("renders with icons for each category", async () => {
      const user = userEvent.setup();
      render(
        <CategorySelect value="" onChange={vi.fn()} />
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      // Each option should have an icon (they're rendered as part of the option)
      const options = screen.getAllByRole("option");
      expect(options.length).toBe(4);
    });
  });

  describe("interaction", () => {
    it("calls onChange with selected category", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <CategorySelect value="" onChange={onChange} />
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      const resourceOption = screen.getByRole("option", { name: /What/ });
      await user.click(resourceOption);

      expect(onChange).toHaveBeenCalledWith("resource");
    });

    it("can change from one category to another", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const { rerender } = render(
        <CategorySelect value="user" onChange={onChange} />
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      const timeOption = screen.getByRole("option", { name: /When/ });
      await user.click(timeOption);

      expect(onChange).toHaveBeenCalledWith("time");
    });
  });

  describe("disabled state", () => {
    it("is disabled when disabled prop is true", () => {
      render(
        <CategorySelect value="user" onChange={vi.fn()} disabled />
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveAttribute("data-disabled");
    });

    it("cannot open when disabled", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <CategorySelect value="user" onChange={onChange} disabled />
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      // Options should not be visible
      expect(screen.queryByRole("option")).not.toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});

describe("AttributeSelect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("shows placeholder when no category", () => {
      render(
        <AttributeSelect category="" value="" onChange={vi.fn()} />
      );

      expect(screen.getByText("Select category first")).toBeInTheDocument();
    });

    it("shows placeholder when category selected but no attribute", () => {
      render(
        <AttributeSelect category="user" value="" onChange={vi.fn()} />
      );

      expect(screen.getByText("Select attribute...")).toBeInTheDocument();
    });

    it("shows user attributes when user category selected", async () => {
      const user = userEvent.setup();
      render(
        <AttributeSelect category="user" value="" onChange={vi.fn()} />
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      // Check for presence of user attributes - use getAllByRole to handle multiple matches
      const options = screen.getAllByRole("option");
      const optionTexts = options.map((opt) => opt.textContent);

      // Should have Email, Email Domain, Team, Role, and Specific User
      expect(optionTexts.some((text) => text?.startsWith("Email"))).toBe(true);
      expect(optionTexts.some((text) => text?.includes("Email Domain"))).toBe(true);
      expect(optionTexts.some((text) => text?.includes("Team"))).toBe(true);
      expect(optionTexts.some((text) => text?.includes("Role"))).toBe(true);
    });

    it("shows resource attributes when resource category selected", async () => {
      const user = userEvent.setup();
      render(
        <AttributeSelect category="resource" value="" onChange={vi.fn()} />
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      expect(screen.getByRole("option", { name: /Work Unit/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /Environment/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /Status/i })).toBeInTheDocument();
    });

    it("shows time attributes when time category selected", async () => {
      const user = userEvent.setup();
      render(
        <AttributeSelect category="time" value="" onChange={vi.fn()} />
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      expect(screen.getByRole("option", { name: /Business Hours/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /Days of Week/i })).toBeInTheDocument();
    });

    it("shows context attributes when context category selected", async () => {
      const user = userEvent.setup();
      render(
        <AttributeSelect category="context" value="" onChange={vi.fn()} />
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      expect(screen.getByRole("option", { name: /IP Address/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /User Agent/i })).toBeInTheDocument();
    });

    it("shows attribute description in options", async () => {
      const user = userEvent.setup();
      render(
        <AttributeSelect category="user" value="" onChange={vi.fn()} />
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      // Descriptions should be visible
      expect(screen.getByText(/User's email address/i)).toBeInTheDocument();
    });
  });

  describe("interaction", () => {
    it("calls onChange with selected attribute", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <AttributeSelect category="user" value="" onChange={onChange} />
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      // Find Email option - the one with "User's email address" description
      const options = screen.getAllByRole("option");
      const emailOption = options.find((opt) => {
        const text = opt.textContent;
        return text?.startsWith("Email") && text?.includes("User's email address");
      });
      expect(emailOption).toBeDefined();
      await user.click(emailOption!);

      expect(onChange).toHaveBeenCalledWith("user_email");
    });
  });

  describe("disabled state", () => {
    it("is disabled when disabled prop is true", () => {
      render(
        <AttributeSelect category="user" value="" onChange={vi.fn()} disabled />
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveAttribute("data-disabled");
    });

    it("is disabled when no category is selected", () => {
      render(
        <AttributeSelect category="" value="" onChange={vi.fn()} />
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveAttribute("data-disabled");
    });
  });
});

describe("OperatorSelect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("shows placeholder when no attribute", () => {
      render(
        <OperatorSelect attributeId="" value="equals" onChange={vi.fn()} />
      );

      // When disabled, the select shows the placeholder
      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveAttribute("data-disabled");
    });

    it("shows email operators for email attribute", async () => {
      const user = userEvent.setup();
      render(
        <OperatorSelect attributeId="user_email" value="equals" onChange={vi.fn()} />
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      expect(screen.getByRole("option", { name: /equals/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /does not equal/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /contains/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /starts with/i })).toBeInTheDocument();
    });

    it("shows resource_ids operators for agent attribute", async () => {
      const user = userEvent.setup();
      render(
        <OperatorSelect attributeId="resource_agent" value="in" onChange={vi.fn()} />
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      expect(screen.getByRole("option", { name: /is one of/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /is not one of/i })).toBeInTheDocument();
    });

    it("shows number operators for hour attribute", async () => {
      const user = userEvent.setup();
      render(
        <OperatorSelect attributeId="time_hour_simple" value="equals" onChange={vi.fn()} />
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      expect(screen.getByRole("option", { name: /equals/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /is greater than/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /is less than/i })).toBeInTheDocument();
    });

    it("shows between operator for time_range attribute", async () => {
      const user = userEvent.setup();
      render(
        <OperatorSelect attributeId="time_hours" value="between" onChange={vi.fn()} />
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      expect(screen.getByRole("option", { name: /is between/i })).toBeInTheDocument();
    });
  });

  describe("interaction", () => {
    it("calls onChange with selected operator", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <OperatorSelect attributeId="user_email" value="equals" onChange={onChange} />
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      const containsOption = screen.getByRole("option", { name: /contains/i });
      await user.click(containsOption);

      expect(onChange).toHaveBeenCalledWith("contains");
    });
  });

  describe("disabled state", () => {
    it("is disabled when disabled prop is true", () => {
      render(
        <OperatorSelect attributeId="user_email" value="equals" onChange={vi.fn()} disabled />
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveAttribute("data-disabled");
    });

    it("is disabled when no attribute is selected", () => {
      render(
        <OperatorSelect attributeId="" value="equals" onChange={vi.fn()} />
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveAttribute("data-disabled");
    });
  });

  describe("operator filtering by attribute type", () => {
    it("shows only applicable operators for string type", async () => {
      const user = userEvent.setup();
      render(
        <OperatorSelect attributeId="resource_name_pattern" value="equals" onChange={vi.fn()} />
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      // String operators should be available
      expect(screen.getByRole("option", { name: /equals/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /contains/i })).toBeInTheDocument();
    });

    it("shows only applicable operators for days_of_week type", async () => {
      const user = userEvent.setup();
      render(
        <OperatorSelect attributeId="time_days" value="in" onChange={vi.fn()} />
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      // days_of_week should only have in/not_in operators
      expect(screen.getByRole("option", { name: /is one of/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /is not one of/i })).toBeInTheDocument();
    });

    it("shows only applicable operators for environment type", async () => {
      const user = userEvent.setup();
      render(
        <OperatorSelect attributeId="resource_environment" value="equals" onChange={vi.fn()} />
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      // Environment should have equals, not_equals, in, not_in
      expect(screen.getByRole("option", { name: /equals/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /does not equal/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /is one of/i })).toBeInTheDocument();
    });
  });
});
