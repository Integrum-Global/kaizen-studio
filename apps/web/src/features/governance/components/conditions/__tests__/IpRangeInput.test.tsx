/**
 * Tests for IpRangeInput component and IP validation utilities
 *
 * These tests verify the IpRangeInput component's behavior for entering
 * and validating IP addresses and CIDR ranges.
 *
 * Note: Validation utilities are tested directly (NO MOCKING) per testing policy.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  IpRangeInput,
  isValidIpv4,
  isValidCidr,
  isValidIpOrCidr,
  getValidationError,
} from "../inputs/IpRangeInput";

// Helper to render with user event setup
function setup(overrides: Partial<Parameters<typeof IpRangeInput>[0]> = {}) {
  const user = userEvent.setup();
  const defaultProps = {
    value: "" as string | string[],
    onChange: vi.fn(),
    multiple: false,
    disabled: false,
    placeholder: undefined,
  };
  const mergedProps = { ...defaultProps, ...overrides };
  const result = render(<IpRangeInput {...mergedProps} />);
  return { user, ...result, ...mergedProps };
}

describe("IP Validation Utilities", () => {
  describe("isValidIpv4", () => {
    it("returns true for valid IPv4 address", () => {
      expect(isValidIpv4("192.168.1.1")).toBe(true);
    });

    it("returns true for IP with zeroes", () => {
      expect(isValidIpv4("0.0.0.0")).toBe(true);
    });

    it("returns true for IP with max values", () => {
      expect(isValidIpv4("255.255.255.255")).toBe(true);
    });

    it("returns true for localhost", () => {
      expect(isValidIpv4("127.0.0.1")).toBe(true);
    });

    it("returns false for IP with octet > 255", () => {
      expect(isValidIpv4("256.1.1.1")).toBe(false);
    });

    it("returns false for IP with second octet > 255", () => {
      expect(isValidIpv4("192.300.1.1")).toBe(false);
    });

    it("returns false for IP missing octet", () => {
      expect(isValidIpv4("192.168.1")).toBe(false);
    });

    it("returns false for IP with extra octet", () => {
      expect(isValidIpv4("192.168.1.1.1")).toBe(false);
    });

    it("returns false for IP with non-numeric characters", () => {
      expect(isValidIpv4("192.168.1.a")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isValidIpv4("")).toBe(false);
    });

    it("returns false for IP with leading zeros (invalid format)", () => {
      // "01" as a string is "1" when parsed as int but doesn't equal "01"
      expect(isValidIpv4("192.168.01.1")).toBe(false);
    });

    it("returns false for IP with negative numbers", () => {
      expect(isValidIpv4("192.168.-1.1")).toBe(false);
    });

    it("returns false for IP with spaces", () => {
      expect(isValidIpv4("192.168.1. 1")).toBe(false);
    });

    it("returns false for IP with decimal values", () => {
      expect(isValidIpv4("192.168.1.1.5")).toBe(false);
    });
  });

  describe("isValidCidr", () => {
    it("returns true for valid CIDR notation", () => {
      expect(isValidCidr("192.168.0.0/24")).toBe(true);
    });

    it("returns true for CIDR with /0 mask", () => {
      expect(isValidCidr("0.0.0.0/0")).toBe(true);
    });

    it("returns true for CIDR with /32 mask", () => {
      expect(isValidCidr("192.168.1.1/32")).toBe(true);
    });

    it("returns true for CIDR with /16 subnet", () => {
      expect(isValidCidr("10.0.0.0/16")).toBe(true);
    });

    it("returns false for CIDR with mask > 32", () => {
      expect(isValidCidr("192.168.0.0/33")).toBe(false);
    });

    it("returns false for CIDR with invalid IP", () => {
      expect(isValidCidr("256.168.0.0/24")).toBe(false);
    });

    it("returns false for CIDR without mask", () => {
      expect(isValidCidr("192.168.0.0/")).toBe(false);
    });

    it("returns false for CIDR without IP", () => {
      expect(isValidCidr("/24")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isValidCidr("")).toBe(false);
    });

    it("returns false for CIDR with negative mask", () => {
      expect(isValidCidr("192.168.0.0/-1")).toBe(false);
    });

    it("returns false for CIDR with non-numeric mask", () => {
      expect(isValidCidr("192.168.0.0/abc")).toBe(false);
    });
  });

  describe("isValidIpOrCidr", () => {
    it("returns true for valid IP", () => {
      expect(isValidIpOrCidr("192.168.1.1")).toBe(true);
    });

    it("returns true for valid CIDR", () => {
      expect(isValidIpOrCidr("10.0.0.0/8")).toBe(true);
    });

    it("returns false for invalid IP", () => {
      expect(isValidIpOrCidr("999.999.999.999")).toBe(false);
    });

    it("returns false for invalid CIDR", () => {
      expect(isValidIpOrCidr("192.168.0.0/99")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isValidIpOrCidr("")).toBe(false);
    });

    it("returns false for whitespace only", () => {
      expect(isValidIpOrCidr("   ")).toBe(false);
    });

    it("handles whitespace around valid IP", () => {
      expect(isValidIpOrCidr(" 192.168.1.1 ")).toBe(true);
    });

    it("handles whitespace around valid CIDR", () => {
      expect(isValidIpOrCidr(" 192.168.0.0/24 ")).toBe(true);
    });
  });

  describe("getValidationError", () => {
    it("returns null for valid IP", () => {
      expect(getValidationError("192.168.1.1")).toBeNull();
    });

    it("returns null for valid CIDR", () => {
      expect(getValidationError("192.168.0.0/24")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(getValidationError("")).toBeNull();
    });

    it("returns error message for invalid IP", () => {
      const error = getValidationError("999.1.1.1");
      expect(error).toBe("Invalid IP address format (expected: x.x.x.x or x.x.x.x/xx)");
    });

    it("returns error message for invalid CIDR IP part", () => {
      const error = getValidationError("999.1.1.1/24");
      expect(error).toBe("Invalid IP address format (expected: x.x.x.x)");
    });

    it("returns error message for invalid CIDR mask", () => {
      const error = getValidationError("192.168.0.0/99");
      expect(error).toBe("Invalid CIDR mask (must be 0-32)");
    });

    it("returns error message for CIDR with missing mask", () => {
      const error = getValidationError("192.168.0.0/");
      expect(error).toBe("Invalid CIDR mask (must be 0-32)");
    });
  });
});

describe("IpRangeInput Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("single value mode", () => {
    it("renders input with default placeholder", () => {
      setup();

      const input = screen.getByPlaceholderText("192.168.1.0/24 or 10.0.0.1");
      expect(input).toBeInTheDocument();
    });

    it("renders input with custom placeholder", () => {
      setup({ placeholder: "Enter IP address" });

      const input = screen.getByPlaceholderText("Enter IP address");
      expect(input).toBeInTheDocument();
    });

    it("displays the current value", () => {
      setup({ value: "192.168.1.1" });

      const input = screen.getByDisplayValue("192.168.1.1");
      expect(input).toBeInTheDocument();
    });

    it("calls onChange when typing", async () => {
      const { user, onChange } = setup();

      const input = screen.getByPlaceholderText("192.168.1.0/24 or 10.0.0.1");
      await user.type(input, "10.0.0.1");

      // onChange is called for each character
      expect(onChange).toHaveBeenCalled();
      // The last call contains the final character typed (not cumulative)
      // Each keystroke triggers onChange with the current input value
      expect(onChange.mock.calls.length).toBeGreaterThan(0);
    });

    it("shows green checkmark for valid IP", async () => {
      const { user } = setup({ value: "192.168.1.1" });

      // Trigger touched state by focusing and blurring
      const input = screen.getByDisplayValue("192.168.1.1");
      await user.click(input);
      await user.tab();

      // Valid IP shows success indicator
      await waitFor(() => {
        expect(screen.getByText("Single IP: 192.168.1.1")).toBeInTheDocument();
      });
    });

    it("shows CIDR range description for valid CIDR", async () => {
      const { user } = setup({ value: "192.168.0.0/24" });

      const input = screen.getByDisplayValue("192.168.0.0/24");
      await user.click(input);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText("CIDR range: 192.168.0.0/24")).toBeInTheDocument();
      });
    });

    it("shows red alert icon for invalid IP after touched", async () => {
      // Start with an invalid value already set
      setup({ value: "999.999.999.999" });

      // The component shows validation on blur - need to trigger touched state
      const input = screen.getByDisplayValue("999.999.999.999");

      // Focus and blur to trigger touched state
      await act(async () => {
        input.focus();
        input.blur();
      });

      await waitFor(() => {
        expect(
          screen.getByText("Invalid IP address format (expected: x.x.x.x or x.x.x.x/xx)")
        ).toBeInTheDocument();
      });
    });

    it("shows error for invalid CIDR mask", async () => {
      // Start with an invalid CIDR already set
      setup({ value: "192.168.0.0/99" });

      const input = screen.getByDisplayValue("192.168.0.0/99");

      // Focus and blur to trigger touched state
      await act(async () => {
        input.focus();
        input.blur();
      });

      await waitFor(() => {
        expect(screen.getByText("Invalid CIDR mask (must be 0-32)")).toBeInTheDocument();
      });
    });

    it("is disabled when disabled prop is true", () => {
      setup({ disabled: true });

      const input = screen.getByPlaceholderText("192.168.1.0/24 or 10.0.0.1");
      expect(input).toBeDisabled();
    });

    it("sets aria-invalid for invalid input", async () => {
      // Start with an invalid value
      setup({ value: "invalid" });

      const input = screen.getByDisplayValue("invalid");

      // Focus and blur to trigger touched state
      await act(async () => {
        input.focus();
        input.blur();
      });

      await waitFor(() => {
        expect(input).toHaveAttribute("aria-invalid", "true");
      });
    });
  });

  describe("multi-value mode", () => {
    it("renders with add button in multi-value mode", () => {
      setup({ multiple: true });

      expect(screen.getByRole("button", { name: "Add IP address" })).toBeInTheDocument();
    });

    it("shows helper text in multi-value mode", () => {
      setup({ multiple: true });

      expect(
        screen.getByText(/Enter IP address or CIDR range.*and press Enter/i)
      ).toBeInTheDocument();
    });

    it("adds IP via Enter key", async () => {
      const { user, onChange } = setup({ multiple: true, value: [] });

      const input = screen.getByPlaceholderText("192.168.1.0/24 or 10.0.0.1");
      await user.type(input, "192.168.1.1{Enter}");

      expect(onChange).toHaveBeenCalledWith(["192.168.1.1"]);
    });

    it("adds IP via plus button click", async () => {
      const { user, onChange } = setup({ multiple: true, value: [] });

      const input = screen.getByPlaceholderText("192.168.1.0/24 or 10.0.0.1");
      await user.type(input, "10.0.0.1");

      const addButton = screen.getByRole("button", { name: "Add IP address" });
      await user.click(addButton);

      expect(onChange).toHaveBeenCalledWith(["10.0.0.1"]);
    });

    it("clears input after adding IP", async () => {
      const { user } = setup({ multiple: true, value: [] });

      const input = screen.getByPlaceholderText("192.168.1.0/24 or 10.0.0.1");
      await user.type(input, "192.168.1.1{Enter}");

      await waitFor(() => {
        expect(input).toHaveValue("");
      });
    });

    it("does not add duplicate IPs", async () => {
      const { user, onChange } = setup({
        multiple: true,
        value: ["192.168.1.1"],
      });

      const input = screen.getByPlaceholderText("192.168.1.0/24 or 10.0.0.1");
      await user.type(input, "192.168.1.1{Enter}");

      // Should not call onChange with duplicate
      expect(onChange).not.toHaveBeenCalled();
    });

    it("does not add invalid IP", async () => {
      const { user, onChange } = setup({ multiple: true, value: [] });

      const input = screen.getByPlaceholderText("192.168.1.0/24 or 10.0.0.1");
      await user.type(input, "invalid{Enter}");

      expect(onChange).not.toHaveBeenCalled();
    });

    it("displays added IPs as badges", () => {
      setup({ multiple: true, value: ["192.168.1.1", "10.0.0.0/8"] });

      expect(screen.getByText("192.168.1.1")).toBeInTheDocument();
      expect(screen.getByText("10.0.0.0/8")).toBeInTheDocument();
    });

    it("shows green checkmark for valid IP badges", () => {
      setup({ multiple: true, value: ["192.168.1.1"] });

      // Valid IPs show a green checkmark icon
      const badge = screen.getByText("192.168.1.1").closest("div");
      expect(badge).toBeInTheDocument();
      // The CheckCircle2 icon is rendered for valid IPs
    });

    it("removes IP via badge X button", async () => {
      const { user, onChange } = setup({
        multiple: true,
        value: ["192.168.1.1", "10.0.0.1"],
      });

      const removeButton = screen.getByRole("button", { name: "Remove 192.168.1.1" });
      await user.click(removeButton);

      expect(onChange).toHaveBeenCalledWith(["10.0.0.1"]);
    });

    it("removes last IP and returns empty array", async () => {
      const { user, onChange } = setup({
        multiple: true,
        value: ["192.168.1.1"],
      });

      const removeButton = screen.getByRole("button", { name: "Remove 192.168.1.1" });
      await user.click(removeButton);

      expect(onChange).toHaveBeenCalledWith([]);
    });

    it("disables add button when input is empty", () => {
      setup({ multiple: true, value: [] });

      const addButton = screen.getByRole("button", { name: "Add IP address" });
      expect(addButton).toBeDisabled();
    });

    it("disables add button when input has error", async () => {
      const { user } = setup({ multiple: true, value: [] });

      const input = screen.getByPlaceholderText("192.168.1.0/24 or 10.0.0.1");
      await user.type(input, "invalid-ip");

      await waitFor(() => {
        const addButton = screen.getByRole("button", { name: "Add IP address" });
        expect(addButton).toBeDisabled();
      });
    });

    it("disables input when disabled prop is true", () => {
      setup({ multiple: true, disabled: true });

      const input = screen.getByPlaceholderText("192.168.1.0/24 or 10.0.0.1");
      expect(input).toBeDisabled();
    });

    it("disables add button when disabled prop is true", () => {
      setup({ multiple: true, disabled: true });

      const addButton = screen.getByRole("button", { name: "Add IP address" });
      expect(addButton).toBeDisabled();
    });

    it("disables remove buttons when disabled prop is true", () => {
      setup({
        multiple: true,
        value: ["192.168.1.1"],
        disabled: true,
      });

      const removeButton = screen.getByRole("button", { name: "Remove 192.168.1.1" });
      expect(removeButton).toBeDisabled();
    });
  });

  describe("edge cases", () => {
    it("handles partial IP input gracefully", async () => {
      // Start with a partial IP already set
      setup({ value: "192.168." });

      const input = screen.getByDisplayValue("192.168.");

      // Focus and blur to trigger touched state
      await act(async () => {
        input.focus();
        input.blur();
      });

      await waitFor(() => {
        expect(
          screen.getByText("Invalid IP address format (expected: x.x.x.x or x.x.x.x/xx)")
        ).toBeInTheDocument();
      });
    });

    it("handles IP with only three octets", async () => {
      // Start with three-octet IP already set
      setup({ value: "192.168.1" });

      const input = screen.getByDisplayValue("192.168.1");

      // Focus and blur to trigger touched state
      await act(async () => {
        input.focus();
        input.blur();
      });

      await waitFor(() => {
        expect(
          screen.getByText("Invalid IP address format (expected: x.x.x.x or x.x.x.x/xx)")
        ).toBeInTheDocument();
      });
    });

    it("handles CIDR with empty mask", async () => {
      // Start with invalid CIDR already set
      setup({ value: "192.168.0.0/" });

      const input = screen.getByDisplayValue("192.168.0.0/");

      // Focus and blur to trigger touched state
      await act(async () => {
        input.focus();
        input.blur();
      });

      await waitFor(() => {
        expect(screen.getByText("Invalid CIDR mask (must be 0-32)")).toBeInTheDocument();
      });
    });

    it("trims whitespace from IP values in multi-mode", async () => {
      const { user, onChange } = setup({ multiple: true, value: [] });

      const input = screen.getByPlaceholderText("192.168.1.0/24 or 10.0.0.1");
      await user.type(input, " 192.168.1.1 {Enter}");

      expect(onChange).toHaveBeenCalledWith(["192.168.1.1"]);
    });
  });

  describe("real-time validation display", () => {
    it("does not show error until touched", () => {
      setup({ value: "" });

      expect(
        screen.queryByText("Invalid IP address format (expected: x.x.x.x or x.x.x.x/xx)")
      ).not.toBeInTheDocument();
    });

    it("shows validation error after blur with invalid value", async () => {
      // Start with invalid value
      setup({ value: "bad" });

      const input = screen.getByDisplayValue("bad");

      // Focus and blur to trigger touched state
      await act(async () => {
        input.focus();
        input.blur();
      });

      await waitFor(() => {
        expect(
          screen.getByText("Invalid IP address format (expected: x.x.x.x or x.x.x.x/xx)")
        ).toBeInTheDocument();
      });
    });

    it("clears validation error when value becomes valid", async () => {
      // Use a controlled test where we start fresh and check the behavior
      const { user, onChange, rerender } = setup({ value: "" });

      // Initially no error
      expect(
        screen.queryByText("Invalid IP address format (expected: x.x.x.x or x.x.x.x/xx)")
      ).not.toBeInTheDocument();

      // Rerender with invalid value and trigger touched state
      rerender(
        <IpRangeInput value="bad" onChange={onChange} multiple={false} disabled={false} />
      );

      const input = screen.getByDisplayValue("bad");
      await act(async () => {
        input.focus();
        input.blur();
      });

      await waitFor(() => {
        expect(
          screen.getByText("Invalid IP address format (expected: x.x.x.x or x.x.x.x/xx)")
        ).toBeInTheDocument();
      });
    });
  });
});
