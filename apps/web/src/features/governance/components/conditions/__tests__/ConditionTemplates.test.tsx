/**
 * Tests for ConditionTemplates component (Quick Bar)
 *
 * These tests verify the quick template bar's behavior including
 * rendering common templates, handling clicks, and disabled state.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConditionTemplates } from "../ConditionTemplates";
import { getCommonTemplates, templates } from "../data/templates";
import type { ConditionTemplate } from "../types";

// Helper to render with user event setup
function setup(overrides: Partial<Parameters<typeof ConditionTemplates>[0]> = {}) {
  const user = userEvent.setup();
  const defaultProps = {
    onApplyTemplate: vi.fn(),
    onOpenModal: vi.fn(),
    disabled: false,
  };
  const mergedProps = { ...defaultProps, ...overrides };
  const result = render(<ConditionTemplates {...mergedProps} />);
  return { user, ...result, ...mergedProps };
}

describe("ConditionTemplates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders all common templates as buttons", () => {
      setup();

      const commonTemplates = getCommonTemplates();
      expect(commonTemplates.length).toBe(4);

      commonTemplates.forEach((template) => {
        expect(
          screen.getByRole("button", { name: new RegExp(template.name, "i") })
        ).toBeInTheDocument();
      });
    });

    it("renders Team Access template button", () => {
      setup();

      const button = screen.getByRole("button", { name: /Team Access/i });
      expect(button).toBeInTheDocument();
    });

    it("renders Business Hours template button", () => {
      setup();

      const button = screen.getByRole("button", { name: /Business Hours/i });
      expect(button).toBeInTheDocument();
    });

    it("renders IP Restriction template button", () => {
      setup();

      const button = screen.getByRole("button", { name: /IP Restriction/i });
      expect(button).toBeInTheDocument();
    });

    it("renders Specific Agent template button", () => {
      setup();

      const button = screen.getByRole("button", { name: /Specific Agent/i });
      expect(button).toBeInTheDocument();
    });

    it("renders More Templates button", () => {
      setup();

      const button = screen.getByRole("button", { name: /More Templates/i });
      expect(button).toBeInTheDocument();
    });

    it("renders template buttons with icons", () => {
      const { container } = setup();

      // Each template button should have an icon (svg element)
      const buttons = container.querySelectorAll("button");
      const templateButtons = Array.from(buttons).filter(
        (btn) => !btn.textContent?.includes("More Templates")
      );

      templateButtons.forEach((button) => {
        const icon = button.querySelector("svg");
        expect(icon).toBeInTheDocument();
      });
    });

    it("renders template buttons with correct size (small)", () => {
      setup();

      const teamAccessBtn = screen.getByRole("button", { name: /Team Access/i });
      // Small size buttons have h-9 class from shadcn
      expect(teamAccessBtn).toHaveClass("h-9");
    });

    it("renders template buttons with outline variant", () => {
      setup();

      const teamAccessBtn = screen.getByRole("button", { name: /Team Access/i });
      // Outline variant has border class
      expect(teamAccessBtn).toHaveClass("border");
    });

    it("renders More Templates button with ghost variant", () => {
      setup();

      const moreBtn = screen.getByRole("button", { name: /More Templates/i });
      // Ghost variant should not have border class but should have hover:bg-accent
      expect(moreBtn).not.toHaveClass("border-input");
    });

    it("displays template descriptions as title attributes", () => {
      setup();

      const commonTemplates = getCommonTemplates();
      commonTemplates.forEach((template) => {
        const button = screen.getByRole("button", {
          name: new RegExp(template.name, "i"),
        });
        expect(button).toHaveAttribute("title", template.description);
      });
    });

    it("renders exactly 4 common templates plus More Templates button", () => {
      setup();

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBe(5); // 4 common + 1 more templates
    });

    it("renders container with flex-wrap layout", () => {
      const { container } = setup();

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("flex", "flex-wrap", "gap-2");
    });

    it("renders icons with correct size classes", () => {
      const { container } = setup();

      const icons = container.querySelectorAll("svg.h-4.w-4");
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe("template click handling", () => {
    it("calls onApplyTemplate when Team Access is clicked", async () => {
      const { user, onApplyTemplate } = setup();

      const button = screen.getByRole("button", { name: /Team Access/i });
      await user.click(button);

      expect(onApplyTemplate).toHaveBeenCalledTimes(1);
      const calledTemplate = onApplyTemplate.mock.calls[0][0] as ConditionTemplate;
      expect(calledTemplate.id).toBe("team-access");
    });

    it("calls onApplyTemplate when Business Hours is clicked", async () => {
      const { user, onApplyTemplate } = setup();

      const button = screen.getByRole("button", { name: /Business Hours/i });
      await user.click(button);

      expect(onApplyTemplate).toHaveBeenCalledTimes(1);
      const calledTemplate = onApplyTemplate.mock.calls[0][0] as ConditionTemplate;
      expect(calledTemplate.id).toBe("business-hours");
    });

    it("calls onApplyTemplate when IP Restriction is clicked", async () => {
      const { user, onApplyTemplate } = setup();

      const button = screen.getByRole("button", { name: /IP Restriction/i });
      await user.click(button);

      expect(onApplyTemplate).toHaveBeenCalledTimes(1);
      const calledTemplate = onApplyTemplate.mock.calls[0][0] as ConditionTemplate;
      expect(calledTemplate.id).toBe("ip-restriction");
    });

    it("calls onApplyTemplate when Specific Agent is clicked", async () => {
      const { user, onApplyTemplate } = setup();

      const button = screen.getByRole("button", { name: /Specific Agent/i });
      await user.click(button);

      expect(onApplyTemplate).toHaveBeenCalledTimes(1);
      const calledTemplate = onApplyTemplate.mock.calls[0][0] as ConditionTemplate;
      expect(calledTemplate.id).toBe("specific-agent");
    });

    it("passes complete template object to onApplyTemplate", async () => {
      const { user, onApplyTemplate } = setup();

      const button = screen.getByRole("button", { name: /Team Access/i });
      await user.click(button);

      const calledTemplate = onApplyTemplate.mock.calls[0][0] as ConditionTemplate;
      expect(calledTemplate).toHaveProperty("id");
      expect(calledTemplate).toHaveProperty("name");
      expect(calledTemplate).toHaveProperty("description");
      expect(calledTemplate).toHaveProperty("icon");
      expect(calledTemplate).toHaveProperty("category");
      expect(calledTemplate).toHaveProperty("isCommon", true);
      expect(calledTemplate).toHaveProperty("conditions");
    });

    it("calls onOpenModal when More Templates is clicked", async () => {
      const { user, onOpenModal } = setup();

      const button = screen.getByRole("button", { name: /More Templates/i });
      await user.click(button);

      expect(onOpenModal).toHaveBeenCalledTimes(1);
    });

    it("does not call onOpenModal when template button is clicked", async () => {
      const { user, onOpenModal } = setup();

      const button = screen.getByRole("button", { name: /Team Access/i });
      await user.click(button);

      expect(onOpenModal).not.toHaveBeenCalled();
    });

    it("does not call onApplyTemplate when More Templates is clicked", async () => {
      const { user, onApplyTemplate } = setup();

      const button = screen.getByRole("button", { name: /More Templates/i });
      await user.click(button);

      expect(onApplyTemplate).not.toHaveBeenCalled();
    });
  });

  describe("disabled state", () => {
    it("disables all template buttons when disabled is true", () => {
      setup({ disabled: true });

      const commonTemplates = getCommonTemplates();
      commonTemplates.forEach((template) => {
        const button = screen.getByRole("button", {
          name: new RegExp(template.name, "i"),
        });
        expect(button).toBeDisabled();
      });
    });

    it("disables More Templates button when disabled is true", () => {
      setup({ disabled: true });

      const button = screen.getByRole("button", { name: /More Templates/i });
      expect(button).toBeDisabled();
    });

    it("does not call onApplyTemplate when disabled and button is clicked", async () => {
      const { user, onApplyTemplate } = setup({ disabled: true });

      const button = screen.getByRole("button", { name: /Team Access/i });
      await user.click(button);

      expect(onApplyTemplate).not.toHaveBeenCalled();
    });

    it("does not call onOpenModal when disabled and More Templates is clicked", async () => {
      const { user, onOpenModal } = setup({ disabled: true });

      const button = screen.getByRole("button", { name: /More Templates/i });
      await user.click(button);

      expect(onOpenModal).not.toHaveBeenCalled();
    });

    it("enables all buttons when disabled is false", () => {
      setup({ disabled: false });

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });

    it("enables all buttons by default (no disabled prop)", () => {
      const onApplyTemplate = vi.fn();
      const onOpenModal = vi.fn();
      render(
        <ConditionTemplates
          onApplyTemplate={onApplyTemplate}
          onOpenModal={onOpenModal}
        />
      );

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe("template data integrity", () => {
    it("all common templates have isCommon set to true", () => {
      const commonTemplates = getCommonTemplates();
      commonTemplates.forEach((template) => {
        expect(template.isCommon).toBe(true);
      });
    });

    it("common templates have valid icon names", () => {
      const commonTemplates = getCommonTemplates();
      const validIcons = [
        "Users",
        "Clock",
        "Shield",
        "Bot",
        "UserCog",
        "Mail",
        "Lock",
        "Server",
        "Beaker",
        "CheckCircle",
        "Calendar",
        "CalendarOff",
        "Network",
      ];

      commonTemplates.forEach((template) => {
        expect(validIcons).toContain(template.icon);
      });
    });

    it("common templates have at least one condition", () => {
      const commonTemplates = getCommonTemplates();
      commonTemplates.forEach((template) => {
        expect(template.conditions.length).toBeGreaterThan(0);
      });
    });

    it("common templates have unique IDs", () => {
      const commonTemplates = getCommonTemplates();
      const ids = commonTemplates.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("total templates include both common and extended", () => {
      const commonCount = getCommonTemplates().length;
      const totalCount = templates.length;
      expect(totalCount).toBeGreaterThan(commonCount);
    });
  });

  describe("accessibility", () => {
    it("all buttons have type=button to prevent form submission", () => {
      setup();

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("type", "button");
      });
    });

    it("template buttons have descriptive titles for screen readers", () => {
      setup();

      const teamAccessBtn = screen.getByRole("button", { name: /Team Access/i });
      expect(teamAccessBtn).toHaveAttribute("title");
      expect(teamAccessBtn.getAttribute("title")).toBeTruthy();
    });

    it("More Templates button has MoreHorizontal icon", () => {
      const { container } = setup();

      const moreBtn = screen.getByRole("button", { name: /More Templates/i });
      const icon = moreBtn.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("h-4", "w-4");
    });
  });

  describe("button styling", () => {
    it("template buttons have gap-2 class for icon spacing", () => {
      setup();

      const teamAccessBtn = screen.getByRole("button", { name: /Team Access/i });
      expect(teamAccessBtn).toHaveClass("gap-2");
    });

    it("More Templates button has gap-2 class for icon spacing", () => {
      setup();

      const moreBtn = screen.getByRole("button", { name: /More Templates/i });
      expect(moreBtn).toHaveClass("gap-2");
    });
  });
});
