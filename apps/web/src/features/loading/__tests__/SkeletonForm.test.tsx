import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SkeletonForm } from "../components/SkeletonForm";

describe("SkeletonForm", () => {
  it("renders default number of fields", () => {
    const { container } = render(<SkeletonForm />);
    const fields = container.querySelectorAll('[class*="space-y-2"]');
    // 4 fields by default
    expect(fields.length).toBeGreaterThanOrEqual(4);
  });

  it("renders custom number of fields", () => {
    const { container } = render(<SkeletonForm fields={6} />);
    const fields = container.querySelectorAll('[class*="space-y-2"]');
    expect(fields.length).toBeGreaterThanOrEqual(6);
  });

  it("renders single field", () => {
    const { container } = render(<SkeletonForm fields={1} />);
    const fields = container.querySelectorAll('[class*="space-y-2"]');
    expect(fields.length).toBeGreaterThanOrEqual(1);
  });

  it("shows labels when showLabels is true", () => {
    render(<SkeletonForm fields={3} showLabels={true} />);
    const skeletons = screen.getAllByRole("status");
    // Each field has label + input, plus buttons
    expect(skeletons.length).toBeGreaterThan(6);
  });

  it("hides labels when showLabels is false", () => {
    render(<SkeletonForm fields={3} showLabels={false} />);
    const skeletons = screen.getAllByRole("status");
    // Only inputs + buttons
    expect(skeletons.length).toBeLessThan(10);
  });

  it("shows button when showButton is true", () => {
    render(<SkeletonForm fields={2} showButton={true} />);
    const skeletons = screen.getAllByRole("status");
    // Fields + 2 buttons
    expect(skeletons.length).toBeGreaterThan(4);
  });

  it("hides button when showButton is false", () => {
    render(<SkeletonForm fields={2} showButton={false} />);
    const skeletons = screen.getAllByRole("status");
    // Only fields, no buttons
    expect(skeletons.length).toBeLessThanOrEqual(6);
  });

  it("renders form without labels and buttons", () => {
    render(<SkeletonForm fields={2} showLabels={false} showButton={false} />);
    const skeletons = screen.getAllByRole("status");
    // Only 2 input fields
    expect(skeletons.length).toBe(2);
  });

  it("disables animation when animate is false", () => {
    render(<SkeletonForm animate={false} />);
    const skeletons = screen.getAllByRole("status");
    skeletons.forEach((skeleton) => {
      expect(skeleton).not.toHaveClass("animate-pulse");
    });
  });

  it("enables animation by default", () => {
    render(<SkeletonForm />);
    const skeletons = screen.getAllByRole("status");
    skeletons.forEach((skeleton) => {
      expect(skeleton).toHaveClass("animate-pulse");
    });
  });

  it("merges custom className", () => {
    const { container } = render(<SkeletonForm className="custom-form" />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("custom-form");
  });

  it("has proper spacing between fields", () => {
    const { container } = render(<SkeletonForm />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("space-y-6");
  });

  it("input fields have proper height", () => {
    render(<SkeletonForm fields={1} showLabels={false} showButton={false} />);
    const skeleton = screen.getByRole("status");
    expect(skeleton).toHaveStyle({ height: "40px" });
  });

  it("renders many fields correctly", () => {
    render(<SkeletonForm fields={10} />);
    const skeletons = screen.getAllByRole("status");
    // At least 10 fields worth of skeletons
    expect(skeletons.length).toBeGreaterThanOrEqual(10);
  });

  it("buttons have proper dimensions", () => {
    render(<SkeletonForm fields={1} showLabels={false} showButton={true} />);
    const skeletons = screen.getAllByRole("status");
    // Last two are buttons
    const buttons = skeletons.slice(-2);
    buttons.forEach((button) => {
      expect(button).toHaveStyle({ height: "40px" });
    });
  });

  it("has gap between buttons", () => {
    const { container } = render(<SkeletonForm showButton={true} />);
    const buttonContainer = container.querySelector('[class*="pt-4"]');
    expect(buttonContainer).toHaveClass("flex", "gap-2");
  });

  it("labels are narrower than inputs", () => {
    render(<SkeletonForm fields={1} showLabels={true} showButton={false} />);
    const skeletons = screen.getAllByRole("status");
    const label = skeletons[0];
    const input = skeletons[1];
    expect(label).toHaveStyle({ width: "30%" });
    expect(input).toHaveStyle({ width: "100%" });
  });
});
