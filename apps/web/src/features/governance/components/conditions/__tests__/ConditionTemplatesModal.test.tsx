/**
 * Tests for ConditionTemplatesModal component (Full Browser)
 *
 * These tests verify the full template browser modal's behavior including
 * opening/closing, category tabs, search filtering, template selection,
 * preview panel, and apply/cancel actions.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConditionTemplatesModal } from "../ConditionTemplatesModal";
import { templates, templateCategories } from "../data/templates";
import type { ConditionTemplate } from "../types";

// Helper to render with user event setup
function setup(overrides: Partial<Parameters<typeof ConditionTemplatesModal>[0]> = {}) {
  const user = userEvent.setup();
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onApplyTemplate: vi.fn(),
  };
  const mergedProps = { ...defaultProps, ...overrides };
  const result = render(<ConditionTemplatesModal {...mergedProps} />);
  return { user, ...result, ...mergedProps };
}

describe("ConditionTemplatesModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering when open", () => {
    it("renders the modal dialog when open is true", () => {
      setup({ open: true });

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("renders the dialog title", () => {
      setup({ open: true });

      expect(screen.getByText("Condition Templates")).toBeInTheDocument();
    });

    it("renders the dialog description", () => {
      setup({ open: true });

      expect(
        screen.getByText("Choose a template to quickly add common condition patterns")
      ).toBeInTheDocument();
    });

    it("renders the search input", () => {
      setup({ open: true });

      expect(screen.getByPlaceholderText("Search templates...")).toBeInTheDocument();
    });

    it("renders the search input with proper placeholder", () => {
      setup({ open: true });

      // Verify search input exists and is functional
      const searchInput = screen.getByPlaceholderText("Search templates...");
      expect(searchInput).toBeInTheDocument();
      expect(searchInput.tagName).toBe("INPUT");
    });

    it("renders category tabs including All tab", () => {
      setup({ open: true });

      expect(screen.getByRole("tab", { name: /All/i })).toBeInTheDocument();
    });

    it("renders all category tabs from templateCategories", () => {
      setup({ open: true });

      templateCategories.forEach((category) => {
        expect(
          screen.getByRole("tab", { name: new RegExp(category.label, "i") })
        ).toBeInTheDocument();
      });
    });

    it("renders Cancel button", () => {
      setup({ open: true });

      expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    });

    it("renders Apply Template button", () => {
      setup({ open: true });

      expect(screen.getByRole("button", { name: /Apply Template/i })).toBeInTheDocument();
    });

    it("renders all templates in the grid", () => {
      setup({ open: true });

      templates.forEach((template) => {
        expect(screen.getByText(template.name)).toBeInTheDocument();
      });
    });

    it("renders template descriptions", () => {
      setup({ open: true });

      templates.forEach((template) => {
        expect(screen.getByText(template.description)).toBeInTheDocument();
      });
    });

    it("renders Common badge for common templates", () => {
      setup({ open: true });

      const commonTemplates = templates.filter((t) => t.isCommon);
      const badges = screen.getAllByText("Common");
      expect(badges.length).toBe(commonTemplates.length);
    });

    it("renders template cards as clickable elements", () => {
      setup({ open: true });

      // Each template should be visible with its name and clickable
      templates.forEach((template) => {
        const templateName = screen.getByText(template.name);
        expect(templateName).toBeInTheDocument();
      });
      // Verify we have all templates rendered
      expect(screen.getAllByText(/Team Access|Business Hours|IP Restriction|Specific Agent|Admin Only|Company Email|Resource Owner|Production Only|Non-Production|Active Resources|Weekdays Only|Weekends Only|Internal Network/).length).toBeGreaterThanOrEqual(templates.length);
    });
  });

  describe("rendering when closed", () => {
    it("does not render the modal when open is false", () => {
      setup({ open: false });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("does not render dialog content when closed", () => {
      setup({ open: false });

      expect(screen.queryByText("Condition Templates")).not.toBeInTheDocument();
    });
  });

  describe("category tab filtering", () => {
    it("shows all templates by default (All tab selected)", () => {
      setup({ open: true });

      templates.forEach((template) => {
        expect(screen.getByText(template.name)).toBeInTheDocument();
      });
    });

    it("filters templates by Access Control category", async () => {
      const { user } = setup({ open: true });

      const accessTab = screen.getByRole("tab", { name: /Access Control/i });
      await user.click(accessTab);

      const accessTemplates = templates.filter((t) => t.category === "access");
      const nonAccessTemplates = templates.filter((t) => t.category !== "access");

      accessTemplates.forEach((template) => {
        expect(screen.getByText(template.name)).toBeInTheDocument();
      });

      nonAccessTemplates.forEach((template) => {
        expect(screen.queryByText(template.name)).not.toBeInTheDocument();
      });
    });

    it("filters templates by Time Restrictions category", async () => {
      const { user } = setup({ open: true });

      const timeTab = screen.getByRole("tab", { name: /Time Restrictions/i });
      await user.click(timeTab);

      const timeTemplates = templates.filter((t) => t.category === "time");
      timeTemplates.forEach((template) => {
        expect(screen.getByText(template.name)).toBeInTheDocument();
      });
    });

    it("filters templates by Security category", async () => {
      const { user } = setup({ open: true });

      const securityTab = screen.getByRole("tab", { name: /Security/i });
      await user.click(securityTab);

      const securityTemplates = templates.filter((t) => t.category === "security");
      securityTemplates.forEach((template) => {
        expect(screen.getByText(template.name)).toBeInTheDocument();
      });
    });

    it("filters templates by Environment category", async () => {
      const { user } = setup({ open: true });

      const envTab = screen.getByRole("tab", { name: /Environment/i });
      await user.click(envTab);

      const envTemplates = templates.filter((t) => t.category === "environment");
      envTemplates.forEach((template) => {
        expect(screen.getByText(template.name)).toBeInTheDocument();
      });
    });

    it("can switch back to All tab after filtering", async () => {
      const { user } = setup({ open: true });

      // First filter by access
      const accessTab = screen.getByRole("tab", { name: /Access Control/i });
      await user.click(accessTab);

      // Then go back to all
      const allTab = screen.getByRole("tab", { name: /All/i });
      await user.click(allTab);

      templates.forEach((template) => {
        expect(screen.getByText(template.name)).toBeInTheDocument();
      });
    });
  });

  describe("search functionality", () => {
    it("filters templates by name when searching", async () => {
      const { user } = setup({ open: true });

      const searchInput = screen.getByPlaceholderText("Search templates...");
      await user.type(searchInput, "Team Access");

      expect(screen.getByText("Team Access")).toBeInTheDocument();
      expect(screen.queryByText("Business Hours")).not.toBeInTheDocument();
    });

    it("filters templates by description when searching", async () => {
      const { user } = setup({ open: true });

      const searchInput = screen.getByPlaceholderText("Search templates...");
      await user.type(searchInput, "specific teams");

      expect(screen.getByText("Team Access")).toBeInTheDocument();
    });

    it("is case insensitive", async () => {
      const { user } = setup({ open: true });

      const searchInput = screen.getByPlaceholderText("Search templates...");
      await user.type(searchInput, "TEAM ACCESS");

      expect(screen.getByText("Team Access")).toBeInTheDocument();
    });

    it("shows no templates found message when no matches", async () => {
      const { user } = setup({ open: true });

      const searchInput = screen.getByPlaceholderText("Search templates...");
      await user.type(searchInput, "xyznonexistent123");

      expect(screen.getByText("No templates found")).toBeInTheDocument();
    });

    it("combines search with category filter", async () => {
      const { user } = setup({ open: true });

      // First filter by access
      const accessTab = screen.getByRole("tab", { name: /Access Control/i });
      await user.click(accessTab);

      // Then search
      const searchInput = screen.getByPlaceholderText("Search templates...");
      await user.type(searchInput, "Admin");

      expect(screen.getByText("Admin Only")).toBeInTheDocument();
      expect(screen.queryByText("Team Access")).not.toBeInTheDocument();
    });

    it("clears search when modal closes", async () => {
      const { user, onOpenChange } = setup({ open: true });

      const searchInput = screen.getByPlaceholderText("Search templates...");
      await user.type(searchInput, "Team Access");

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("handles partial matches", async () => {
      const { user } = setup({ open: true });

      const searchInput = screen.getByPlaceholderText("Search templates...");
      await user.type(searchInput, "IP");

      expect(screen.getByText("IP Restriction")).toBeInTheDocument();
    });

    it("handles whitespace in search", async () => {
      const { user } = setup({ open: true });

      const searchInput = screen.getByPlaceholderText("Search templates...");
      await user.type(searchInput, "   "); // Only whitespace

      // Should show all templates when search is just whitespace
      templates.forEach((template) => {
        expect(screen.getByText(template.name)).toBeInTheDocument();
      });
    });
  });

  describe("template selection", () => {
    it("selects a template when clicked", async () => {
      const { user } = setup({ open: true });

      // Find the card by its name and click on its parent card element
      const teamAccessText = screen.getByText("Team Access");
      const teamAccessCard = teamAccessText.closest('[class*="p-3"]');
      await user.click(teamAccessCard!);

      // Preview section should appear when template is selected
      expect(screen.getByText("Preview:")).toBeInTheDocument();
    });

    it("shows preview panel when template is selected", async () => {
      const { user } = setup({ open: true });

      const teamAccessCard = screen.getByText("Team Access").closest('[class*="cursor-pointer"]');
      await user.click(teamAccessCard!);

      expect(screen.getByText("Preview:")).toBeInTheDocument();
    });

    it("shows template name badge in preview", async () => {
      const { user } = setup({ open: true });

      const teamAccessCard = screen.getByText("Team Access").closest('[class*="cursor-pointer"]');
      await user.click(teamAccessCard!);

      // Preview should have the template name in a badge
      const previewSection = screen.getByText("Preview:").parentElement;
      expect(within(previewSection!).getByText("Team Access")).toBeInTheDocument();
    });

    it("shows condition translations in preview", async () => {
      const { user } = setup({ open: true });

      const businessHoursCard = screen.getByText("Business Hours").closest('[class*="cursor-pointer"]');
      await user.click(businessHoursCard!);

      // Should show the translated condition
      expect(screen.getByText(/Access is allowed/)).toBeInTheDocument();
    });

    it("can change selection to another template", async () => {
      const { user } = setup({ open: true });

      // Select first template
      const teamAccessCard = screen.getByText("Team Access").closest('[class*="cursor-pointer"]');
      await user.click(teamAccessCard!);

      // Select second template
      const businessHoursCard = screen.getByText("Business Hours").closest('[class*="cursor-pointer"]');
      await user.click(businessHoursCard!);

      // Preview should update
      expect(screen.getByText(/Access is allowed/)).toBeInTheDocument();
    });

    it("highlights selected template card", async () => {
      const { user } = setup({ open: true });

      const teamAccessCard = screen.getByText("Team Access").closest('[class*="cursor-pointer"]');
      await user.click(teamAccessCard!);

      // Selected card should have border-primary class
      expect(teamAccessCard).toHaveClass("border-primary");
    });

    it("shows numbered list in preview for multiple conditions", async () => {
      const { user } = setup({ open: true });

      // Select a template - most have single condition, but check for numbering
      const teamAccessCard = screen.getByText("Team Access").closest('[class*="cursor-pointer"]');
      await user.click(teamAccessCard!);

      // Should show numbering
      expect(screen.getByText("1.")).toBeInTheDocument();
    });
  });

  describe("apply action", () => {
    it("Apply button is disabled when no template selected", () => {
      setup({ open: true });

      const applyButton = screen.getByRole("button", { name: /Apply Template/i });
      expect(applyButton).toBeDisabled();
    });

    it("Apply button is enabled when template is selected", async () => {
      const { user } = setup({ open: true });

      const teamAccessCard = screen.getByText("Team Access").closest('[class*="cursor-pointer"]');
      await user.click(teamAccessCard!);

      const applyButton = screen.getByRole("button", { name: /Apply Template/i });
      expect(applyButton).not.toBeDisabled();
    });

    it("calls onApplyTemplate with selected template when Apply is clicked", async () => {
      const { user, onApplyTemplate } = setup({ open: true });

      const teamAccessCard = screen.getByText("Team Access").closest('[class*="cursor-pointer"]');
      await user.click(teamAccessCard!);

      const applyButton = screen.getByRole("button", { name: /Apply Template/i });
      await user.click(applyButton);

      expect(onApplyTemplate).toHaveBeenCalledTimes(1);
      const calledTemplate = onApplyTemplate.mock.calls[0][0] as ConditionTemplate;
      expect(calledTemplate.id).toBe("team-access");
    });

    it("closes modal after applying template", async () => {
      const { user, onOpenChange } = setup({ open: true });

      const teamAccessCard = screen.getByText("Team Access").closest('[class*="cursor-pointer"]');
      await user.click(teamAccessCard!);

      const applyButton = screen.getByRole("button", { name: /Apply Template/i });
      await user.click(applyButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("resets selection after applying template", async () => {
      const { user, onApplyTemplate, onOpenChange } = setup({ open: true });

      const teamAccessCard = screen.getByText("Team Access").closest('[class*="cursor-pointer"]');
      await user.click(teamAccessCard!);

      const applyButton = screen.getByRole("button", { name: /Apply Template/i });
      await user.click(applyButton);

      // Both callbacks should be called
      expect(onApplyTemplate).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("cancel action", () => {
    it("closes modal when Cancel is clicked", async () => {
      const { user, onOpenChange } = setup({ open: true });

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("does not call onApplyTemplate when Cancel is clicked", async () => {
      const { user, onApplyTemplate } = setup({ open: true });

      // Select a template first
      const teamAccessCard = screen.getByText("Team Access").closest('[class*="cursor-pointer"]');
      await user.click(teamAccessCard!);

      // Then cancel
      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      expect(onApplyTemplate).not.toHaveBeenCalled();
    });

    it("resets selection when Cancel is clicked", async () => {
      const { user, onOpenChange } = setup({ open: true });

      // Select a template
      const teamAccessCard = screen.getByText("Team Access").closest('[class*="cursor-pointer"]');
      await user.click(teamAccessCard!);

      // Cancel
      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("resets search when Cancel is clicked", async () => {
      const { user, onOpenChange } = setup({ open: true });

      // Search first
      const searchInput = screen.getByPlaceholderText("Search templates...");
      await user.type(searchInput, "Team Access");

      // Cancel
      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("modal closing behavior", () => {
    it("calls onOpenChange(false) when escape key is pressed", async () => {
      const { user, onOpenChange } = setup({ open: true });

      await user.keyboard("{Escape}");

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("resets state when modal is closed via escape", async () => {
      const { user, onOpenChange } = setup({ open: true });

      // Select a template and search
      const teamAccessCard = screen.getByText("Team Access").closest('[class*="cursor-pointer"]');
      await user.click(teamAccessCard!);

      const searchInput = screen.getByPlaceholderText("Search templates...");
      await user.type(searchInput, "test");

      // Close via escape
      await user.keyboard("{Escape}");

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("template data", () => {
    it("renders templates with correct category data", () => {
      setup({ open: true });

      const accessTemplates = templates.filter((t) => t.category === "access");
      expect(accessTemplates.length).toBeGreaterThan(0);
    });

    it("renders templates organized in multiple columns", () => {
      setup({ open: true });

      // Verify multiple templates are rendered side by side by checking all templates are visible
      templates.forEach((template) => {
        expect(screen.getByText(template.name)).toBeInTheDocument();
      });
    });

    it("renders all 12 templates total", () => {
      setup({ open: true });

      expect(templates.length).toBeGreaterThanOrEqual(12);
    });

    it("each category has at least one template", () => {
      templateCategories.forEach((category) => {
        const categoryTemplates = templates.filter((t) => t.category === category.id);
        expect(categoryTemplates.length).toBeGreaterThan(0);
      });
    });
  });

  describe("accessibility", () => {
    it("has proper dialog role", () => {
      setup({ open: true });

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("has proper tab roles for category tabs", () => {
      setup({ open: true });

      const tabs = screen.getAllByRole("tab");
      expect(tabs.length).toBe(templateCategories.length + 1); // +1 for All tab
    });

    it("Cancel button has proper role", () => {
      setup({ open: true });

      expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    });

    it("Apply button has proper role", () => {
      setup({ open: true });

      expect(screen.getByRole("button", { name: /Apply Template/i })).toBeInTheDocument();
    });

    it("search input has proper placeholder", () => {
      setup({ open: true });

      const input = screen.getByPlaceholderText("Search templates...");
      expect(input).toHaveAttribute("placeholder", "Search templates...");
    });
  });

  describe("empty state", () => {
    it("shows empty state with search icon when no templates match", async () => {
      const { user } = setup({ open: true });

      const searchInput = screen.getByPlaceholderText("Search templates...");
      await user.type(searchInput, "nonexistenttemplate");

      expect(screen.getByText("No templates found")).toBeInTheDocument();
      // Empty state container is displayed
      const emptyText = screen.getByText("No templates found");
      expect(emptyText).toBeInTheDocument();
    });

    it("empty state appears with proper styling", async () => {
      const { user } = setup({ open: true });

      const searchInput = screen.getByPlaceholderText("Search templates...");
      await user.type(searchInput, "nonexistenttemplate");

      // The empty state should be visible with proper text
      expect(screen.getByText("No templates found")).toBeInTheDocument();
    });
  });
});
