/**
 * Tests for TimePicker component
 *
 * These tests verify the TimePicker component's behavior for selecting
 * business hours and time ranges with day-of-week selection.
 *
 * Note: This is Tier 1 unit testing.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TimePicker } from "../inputs/TimePicker";
import type { TimeRangeValue } from "../types";

// Default business hours value
const businessHours: TimeRangeValue = {
  startHour: 9,
  startMinute: 0,
  endHour: 17,
  endMinute: 0,
  days: [1, 2, 3, 4, 5],
};

// Helper to render with user event setup
function setup(overrides: Partial<Parameters<typeof TimePicker>[0]> = {}) {
  const user = userEvent.setup();
  const defaultProps = {
    value: null,
    onChange: vi.fn(),
    disabled: false,
  };
  const mergedProps = { ...defaultProps, ...overrides };
  const result = render(<TimePicker {...mergedProps} />);
  return { user, ...result, ...mergedProps };
}

describe("TimePicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders Quick Select label", () => {
      setup();

      expect(screen.getByText("Quick Select")).toBeInTheDocument();
    });

    it("renders Start Time label", () => {
      setup();

      expect(screen.getByText("Start Time")).toBeInTheDocument();
    });

    it("renders End Time label", () => {
      setup();

      expect(screen.getByText("End Time")).toBeInTheDocument();
    });

    it("renders Days label", () => {
      setup();

      expect(screen.getByText("Days")).toBeInTheDocument();
    });

    it("renders all day buttons", () => {
      setup();

      // Day buttons use title attribute for accessibility
      expect(screen.getByTitle("Sunday")).toBeInTheDocument();
      expect(screen.getByTitle("Monday")).toBeInTheDocument();
      expect(screen.getByTitle("Tuesday")).toBeInTheDocument();
      expect(screen.getByTitle("Wednesday")).toBeInTheDocument();
      expect(screen.getByTitle("Thursday")).toBeInTheDocument();
      expect(screen.getByTitle("Friday")).toBeInTheDocument();
      expect(screen.getByTitle("Saturday")).toBeInTheDocument();
    });

    it("renders short day names on buttons", () => {
      setup();

      expect(screen.getByText("Sun")).toBeInTheDocument();
      expect(screen.getByText("Mon")).toBeInTheDocument();
      expect(screen.getByText("Tue")).toBeInTheDocument();
      expect(screen.getByText("Wed")).toBeInTheDocument();
      expect(screen.getByText("Thu")).toBeInTheDocument();
      expect(screen.getByText("Fri")).toBeInTheDocument();
      expect(screen.getByText("Sat")).toBeInTheDocument();
    });

    it("renders preview section", () => {
      setup({ value: businessHours });

      expect(screen.getByText(/Access allowed from/)).toBeInTheDocument();
    });
  });

  describe("default values", () => {
    it("uses default business hours when value is null", () => {
      setup({ value: null });

      // Should show business hours preset as default
      const preview = screen.getByText(/Access allowed from/);
      expect(preview).toHaveTextContent("9:00 AM to 5:00 PM");
      expect(preview).toHaveTextContent("weekdays");
    });

    it("displays selected days as active", () => {
      setup({ value: businessHours });

      // Weekdays should be active (have bg-primary class)
      const mondayButton = screen.getByTitle("Monday");
      expect(mondayButton).toHaveClass("bg-primary");

      // Weekend should not be active
      const sundayButton = screen.getByTitle("Sunday");
      expect(sundayButton).not.toHaveClass("bg-primary");
    });
  });

  describe("preset selection", () => {
    it("has Business Hours preset option", async () => {
      const { user } = setup();

      // Open the preset dropdown
      const triggers = screen.getAllByRole("combobox");
      const presetTrigger = triggers[0];
      await user.click(presetTrigger);

      expect(screen.getByText("Business Hours (9-5 Mon-Fri)")).toBeInTheDocument();
    });

    it("has Extended Hours preset option", async () => {
      const { user } = setup();

      const triggers = screen.getAllByRole("combobox");
      const presetTrigger = triggers[0];
      await user.click(presetTrigger);

      expect(screen.getByText("Extended Hours (8-8 Mon-Fri)")).toBeInTheDocument();
    });

    it("has Weekdays preset option", async () => {
      const { user } = setup();

      const triggers = screen.getAllByRole("combobox");
      const presetTrigger = triggers[0];
      await user.click(presetTrigger);

      expect(screen.getByText("Weekdays (All Day)")).toBeInTheDocument();
    });

    it("has Weekends Only preset option", async () => {
      const { user } = setup();

      const triggers = screen.getAllByRole("combobox");
      const presetTrigger = triggers[0];
      await user.click(presetTrigger);

      expect(screen.getByText("Weekends Only")).toBeInTheDocument();
    });

    it("has Custom preset option", async () => {
      const { user } = setup();

      const triggers = screen.getAllByRole("combobox");
      const presetTrigger = triggers[0];
      await user.click(presetTrigger);

      // The Custom option is rendered in the dropdown
      // Use a more specific selector to find the exact "Custom..." option
      const customOption = screen.getByRole("option", { name: /Custom/i });
      expect(customOption).toBeInTheDocument();
    });

    it("selects Business Hours preset on click", async () => {
      const { user, onChange } = setup();

      const triggers = screen.getAllByRole("combobox");
      const presetTrigger = triggers[0];
      await user.click(presetTrigger);

      await user.click(screen.getByText("Business Hours (9-5 Mon-Fri)"));

      expect(onChange).toHaveBeenCalledWith({
        startHour: 9,
        startMinute: 0,
        endHour: 17,
        endMinute: 0,
        days: [1, 2, 3, 4, 5],
      });
    });

    it("selects Extended Hours preset on click", async () => {
      const { user, onChange } = setup();

      const triggers = screen.getAllByRole("combobox");
      const presetTrigger = triggers[0];
      await user.click(presetTrigger);

      await user.click(screen.getByText("Extended Hours (8-8 Mon-Fri)"));

      expect(onChange).toHaveBeenCalledWith({
        startHour: 8,
        startMinute: 0,
        endHour: 20,
        endMinute: 0,
        days: [1, 2, 3, 4, 5],
      });
    });

    it("selects Weekends Only preset on click", async () => {
      const { user, onChange } = setup();

      const triggers = screen.getAllByRole("combobox");
      const presetTrigger = triggers[0];
      await user.click(presetTrigger);

      await user.click(screen.getByText("Weekends Only"));

      expect(onChange).toHaveBeenCalledWith({
        startHour: 0,
        startMinute: 0,
        endHour: 23,
        endMinute: 59,
        days: [0, 6],
      });
    });

    it("detects matched preset from value", () => {
      setup({ value: businessHours });

      // The preset dropdown should show Business Hours as selected
      const triggers = screen.getAllByRole("combobox");
      const presetTrigger = triggers[0];
      expect(presetTrigger).toHaveTextContent("Business Hours (9-5 Mon-Fri)");
    });

    it("shows Custom for non-preset value", () => {
      const customValue: TimeRangeValue = {
        startHour: 10,
        startMinute: 0,
        endHour: 16,
        endMinute: 0,
        days: [1, 2, 3],
      };

      setup({ value: customValue });

      const triggers = screen.getAllByRole("combobox");
      const presetTrigger = triggers[0];
      expect(presetTrigger).toHaveTextContent("Custom...");
    });
  });

  describe("start time selector", () => {
    it("displays current start hour", () => {
      setup({ value: businessHours });

      // The start time selector should show 9:00 AM
      const triggers = screen.getAllByRole("combobox");
      const startTrigger = triggers[1];
      expect(startTrigger).toHaveTextContent("9:00 AM");
    });

    it("calls onChange with new start hour", async () => {
      const { user, onChange } = setup({ value: businessHours });

      const triggers = screen.getAllByRole("combobox");
      const startTrigger = triggers[1];
      await user.click(startTrigger);

      // Select 8:00 AM
      await user.click(screen.getByText("8:00 AM"));

      expect(onChange).toHaveBeenCalledWith({
        ...businessHours,
        startHour: 8,
      });
    });

    it("shows all 24 hour options", async () => {
      const { user } = setup({ value: businessHours });

      const triggers = screen.getAllByRole("combobox");
      const startTrigger = triggers[1];
      await user.click(startTrigger);

      // Check for midnight and noon
      expect(screen.getByText("12:00 AM")).toBeInTheDocument();
      expect(screen.getByText("12:00 PM")).toBeInTheDocument();
    });
  });

  describe("end time selector", () => {
    it("displays current end hour", () => {
      setup({ value: businessHours });

      // The end time selector should show 5:00 PM
      const triggers = screen.getAllByRole("combobox");
      const endTrigger = triggers[2];
      expect(endTrigger).toHaveTextContent("5:00 PM");
    });

    it("calls onChange with new end hour", async () => {
      const { user, onChange } = setup({ value: businessHours });

      const triggers = screen.getAllByRole("combobox");
      const endTrigger = triggers[2];
      await user.click(endTrigger);

      // Select 6:00 PM
      await user.click(screen.getByText("6:00 PM"));

      expect(onChange).toHaveBeenCalledWith({
        ...businessHours,
        endHour: 18,
      });
    });
  });

  describe("day of week toggles", () => {
    it("toggles day on when clicked", async () => {
      const { user, onChange } = setup({ value: businessHours });

      // Click Saturday to add it
      const saturdayButton = screen.getByTitle("Saturday");
      await user.click(saturdayButton);

      expect(onChange).toHaveBeenCalledWith({
        ...businessHours,
        days: [1, 2, 3, 4, 5, 6],
      });
    });

    it("toggles day off when clicked", async () => {
      const { user, onChange } = setup({ value: businessHours });

      // Click Friday to remove it
      const fridayButton = screen.getByTitle("Friday");
      await user.click(fridayButton);

      expect(onChange).toHaveBeenCalledWith({
        ...businessHours,
        days: [1, 2, 3, 4],
      });
    });

    it("keeps days sorted after toggle", async () => {
      const { user, onChange } = setup({ value: businessHours });

      // Add Sunday (0)
      const sundayButton = screen.getByTitle("Sunday");
      await user.click(sundayButton);

      expect(onChange).toHaveBeenCalledWith({
        ...businessHours,
        days: [0, 1, 2, 3, 4, 5], // Should be sorted
      });
    });

    it("can remove all days", async () => {
      const singleDay: TimeRangeValue = {
        ...businessHours,
        days: [1],
      };

      const { user, onChange } = setup({ value: singleDay });

      const mondayButton = screen.getByTitle("Monday");
      await user.click(mondayButton);

      expect(onChange).toHaveBeenCalledWith({
        ...singleDay,
        days: [],
      });
    });
  });

  describe("preview text formatting", () => {
    it("shows weekdays for Mon-Fri selection", () => {
      setup({ value: businessHours });

      expect(screen.getByText(/on weekdays/)).toBeInTheDocument();
    });

    it("shows weekends for Sat-Sun selection", () => {
      const weekends: TimeRangeValue = {
        ...businessHours,
        days: [0, 6],
      };

      setup({ value: weekends });

      expect(screen.getByText(/on weekends/)).toBeInTheDocument();
    });

    it("shows every day for all days selection", () => {
      const allDays: TimeRangeValue = {
        ...businessHours,
        days: [0, 1, 2, 3, 4, 5, 6],
      };

      setup({ value: allDays });

      expect(screen.getByText(/on every day/)).toBeInTheDocument();
    });

    it("shows no days when none selected", () => {
      const noDays: TimeRangeValue = {
        ...businessHours,
        days: [],
      };

      setup({ value: noDays });

      expect(screen.getByText(/on no days/)).toBeInTheDocument();
    });

    it("lists individual days for partial selection", () => {
      const someDays: TimeRangeValue = {
        ...businessHours,
        days: [1, 3, 5], // Mon, Wed, Fri
      };

      setup({ value: someDays });

      expect(screen.getByText(/Mon, Wed, Fri/)).toBeInTheDocument();
    });

    it("formats morning times correctly", () => {
      const morningHours: TimeRangeValue = {
        startHour: 6,
        startMinute: 0,
        endHour: 12,
        endMinute: 0,
        days: [1, 2, 3, 4, 5],
      };

      setup({ value: morningHours });

      expect(screen.getByText(/6:00 AM to 12:00 PM/)).toBeInTheDocument();
    });

    it("formats afternoon times correctly", () => {
      const afternoonHours: TimeRangeValue = {
        startHour: 13,
        startMinute: 0,
        endHour: 17,
        endMinute: 0,
        days: [1, 2, 3, 4, 5],
      };

      setup({ value: afternoonHours });

      expect(screen.getByText(/1:00 PM to 5:00 PM/)).toBeInTheDocument();
    });

    it("formats midnight correctly", () => {
      const midnightStart: TimeRangeValue = {
        startHour: 0,
        startMinute: 0,
        endHour: 8,
        endMinute: 0,
        days: [1],
      };

      setup({ value: midnightStart });

      expect(screen.getByText(/12:00 AM to 8:00 AM/)).toBeInTheDocument();
    });

    it("formats noon correctly", () => {
      const noonEnd: TimeRangeValue = {
        startHour: 8,
        startMinute: 0,
        endHour: 12,
        endMinute: 0,
        days: [1],
      };

      setup({ value: noonEnd });

      expect(screen.getByText(/8:00 AM to 12:00 PM/)).toBeInTheDocument();
    });
  });

  describe("disabled state", () => {
    it("disables preset selector when disabled", () => {
      setup({ disabled: true, value: businessHours });

      const triggers = screen.getAllByRole("combobox");
      const presetTrigger = triggers[0];
      expect(presetTrigger).toHaveAttribute("data-disabled");
    });

    it("disables start time selector when disabled", () => {
      setup({ disabled: true, value: businessHours });

      const triggers = screen.getAllByRole("combobox");
      const startTrigger = triggers[1];
      expect(startTrigger).toHaveAttribute("data-disabled");
    });

    it("disables end time selector when disabled", () => {
      setup({ disabled: true, value: businessHours });

      const triggers = screen.getAllByRole("combobox");
      const endTrigger = triggers[2];
      expect(endTrigger).toHaveAttribute("data-disabled");
    });

    it("disables all day buttons when disabled", () => {
      setup({ disabled: true, value: businessHours });

      const sundayButton = screen.getByTitle("Sunday");
      expect(sundayButton).toBeDisabled();

      const mondayButton = screen.getByTitle("Monday");
      expect(mondayButton).toBeDisabled();

      const saturdayButton = screen.getByTitle("Saturday");
      expect(saturdayButton).toBeDisabled();
    });

    it("applies disabled styling to day buttons", () => {
      setup({ disabled: true, value: businessHours });

      const mondayButton = screen.getByTitle("Monday");
      expect(mondayButton).toHaveClass("cursor-not-allowed");
      expect(mondayButton).toHaveClass("opacity-50");
    });
  });

  describe("edge cases", () => {
    it("handles undefined value gracefully", () => {
      setup({ value: undefined as unknown as TimeRangeValue | null });

      // Should not crash and show default values
      expect(screen.getByText(/Access allowed from/)).toBeInTheDocument();
    });

    it("handles overnight time range in preview", () => {
      const overnight: TimeRangeValue = {
        startHour: 22,
        startMinute: 0,
        endHour: 6,
        endMinute: 0,
        days: [1, 2, 3, 4, 5],
      };

      setup({ value: overnight });

      expect(screen.getByText(/10:00 PM to 6:00 AM/)).toBeInTheDocument();
    });
  });
});
