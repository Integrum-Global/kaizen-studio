/**
 * EstablishTrustForm Tests
 *
 * Tests for the trust management form components
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CapabilityEditor } from "../components/TrustManagement/CapabilityEditor";
import { ConstraintEditor } from "../components/TrustManagement/ConstraintEditor";
import { CapabilityType } from "../types";

describe("CapabilityEditor", () => {
  const defaultProps = {
    capabilities: [],
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders capability templates section", () => {
    render(<CapabilityEditor {...defaultProps} />);

    expect(screen.getByText(/capability templates/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add custom capability/i })
    ).toBeInTheDocument();
  });

  it("shows custom capability form when button clicked", async () => {
    const user = userEvent.setup();
    render(<CapabilityEditor {...defaultProps} />);

    const addCustomButton = screen.getByRole("button", {
      name: /add custom capability/i,
    });
    await user.click(addCustomButton);

    expect(
      screen.getByPlaceholderText(/access:read:resource_type/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/capability uri/i)).toBeInTheDocument();
  });

  it("displays active capabilities count", () => {
    const capabilities = [
      {
        capability: "access:read:*",
        capability_type: CapabilityType.ACCESS,
        constraints: [],
      },
      {
        capability: "action:execute:*",
        capability_type: CapabilityType.ACTION,
        constraints: ["audit_requirement:level:high"],
      },
    ];

    render(<CapabilityEditor capabilities={capabilities} onChange={vi.fn()} />);

    expect(screen.getByText(/active capabilities \(2\)/i)).toBeInTheDocument();
  });

  it("shows constraint badge for capabilities with constraints", () => {
    const capabilities = [
      {
        capability: "action:execute:*",
        capability_type: CapabilityType.ACTION,
        constraints: ["audit_requirement:level:high"],
      },
    ];

    render(<CapabilityEditor capabilities={capabilities} onChange={vi.fn()} />);

    expect(screen.getByText(/1 constraint/i)).toBeInTheDocument();
  });

  it("displays error message when provided", () => {
    render(
      <CapabilityEditor
        capabilities={[]}
        onChange={vi.fn()}
        error="At least one capability is required"
      />
    );

    expect(
      screen.getByText(/at least one capability is required/i)
    ).toBeInTheDocument();
  });

  it("calls onChange when template is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CapabilityEditor capabilities={[]} onChange={onChange} />);

    // Click on a template card
    const templateCards = document.querySelectorAll(
      "[class*='cursor-pointer']"
    );
    if (templateCards.length > 0) {
      await user.click(templateCards[0] as HTMLElement);
      expect(onChange).toHaveBeenCalled();
    }
  });
});

describe("ConstraintEditor", () => {
  const defaultProps = {
    constraints: [],
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders constraint templates dropdown", () => {
    render(<ConstraintEditor {...defaultProps} />);

    expect(screen.getByText(/add from template/i)).toBeInTheDocument();
    expect(screen.getByText(/select constraint template/i)).toBeInTheDocument();
  });

  it("renders custom constraint input", () => {
    render(<ConstraintEditor {...defaultProps} />);

    expect(screen.getByText(/add custom constraint/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/custom_constraint:field:value/i)
    ).toBeInTheDocument();
  });

  it("allows adding custom constraints via enter key", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ConstraintEditor constraints={[]} onChange={onChange} />);

    const customInput = screen.getByPlaceholderText(
      /custom_constraint:field:value/i
    );
    await user.type(customInput, "my_constraint:field:value{enter}");

    expect(onChange).toHaveBeenCalledWith(["my_constraint:field:value"]);
  });

  it("displays active constraints with priority indicators", () => {
    const constraints = [
      "resource_limit:max_tokens:10000",
      "time_window:start:09:00,end:17:00",
    ];

    render(<ConstraintEditor constraints={constraints} onChange={vi.fn()} />);

    expect(screen.getByText(/active constraints \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.getByText("P2")).toBeInTheDocument();
  });

  it("shows constraint values in code elements", () => {
    const constraints = ["resource_limit:max_tokens:10000"];

    render(<ConstraintEditor constraints={constraints} onChange={vi.fn()} />);

    expect(
      screen.getByText("resource_limit:max_tokens:10000")
    ).toBeInTheDocument();
  });

  it("shows format hint for custom constraints", () => {
    render(<ConstraintEditor {...defaultProps} />);

    expect(
      screen.getByText(/format: constraint_type:field:value/i)
    ).toBeInTheDocument();
  });
});
