import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HealthIndicator, HealthDot, HealthPulse } from "../HealthIndicator";

describe("HealthIndicator", () => {
  describe("rendering", () => {
    it("should render healthy status", () => {
      const { container } = render(<HealthIndicator status="healthy" />);

      const indicator = container.firstChild;
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveClass("bg-green-500/10");
    });

    it("should render degraded status", () => {
      const { container } = render(<HealthIndicator status="degraded" />);

      const indicator = container.firstChild;
      expect(indicator).toHaveClass("bg-yellow-500/10");
    });

    it("should render down status", () => {
      const { container } = render(<HealthIndicator status="down" />);

      const indicator = container.firstChild;
      expect(indicator).toHaveClass("bg-red-500/10");
    });

    it("should apply custom className", () => {
      const { container } = render(
        <HealthIndicator status="healthy" className="custom-class" />
      );

      const indicator = container.firstChild;
      expect(indicator).toHaveClass("custom-class");
    });
  });

  describe("sizes", () => {
    it("should apply small size classes", () => {
      const { container } = render(
        <HealthIndicator status="healthy" size="sm" />
      );

      const indicator = container.firstChild;
      expect(indicator).toHaveClass("gap-1");
      expect(indicator).toHaveClass("px-2");
    });

    it("should apply medium size classes (default)", () => {
      const { container } = render(
        <HealthIndicator status="healthy" size="md" />
      );

      const indicator = container.firstChild;
      expect(indicator).toHaveClass("gap-1.5");
      expect(indicator).toHaveClass("px-2.5");
    });

    it("should apply large size classes", () => {
      const { container } = render(
        <HealthIndicator status="healthy" size="lg" />
      );

      const indicator = container.firstChild;
      expect(indicator).toHaveClass("gap-2");
      expect(indicator).toHaveClass("px-3");
    });
  });

  describe("label", () => {
    it("should not show label by default", () => {
      render(<HealthIndicator status="healthy" />);

      expect(screen.queryByText("Healthy")).not.toBeInTheDocument();
    });

    it("should show label when showLabel is true", () => {
      render(<HealthIndicator status="healthy" showLabel />);

      expect(screen.getByText("Healthy")).toBeInTheDocument();
    });

    it("should show correct label for degraded status", () => {
      render(<HealthIndicator status="degraded" showLabel />);

      expect(screen.getByText("Degraded")).toBeInTheDocument();
    });

    it("should show correct label for down status", () => {
      render(<HealthIndicator status="down" showLabel />);

      expect(screen.getByText("Down")).toBeInTheDocument();
    });
  });
});

describe("HealthDot", () => {
  it("should render healthy dot", () => {
    const { container } = render(<HealthDot status="healthy" />);

    const dot = container.firstChild;
    expect(dot).toHaveClass("bg-green-500");
    expect(dot).toHaveClass("h-2");
    expect(dot).toHaveClass("w-2");
  });

  it("should render degraded dot", () => {
    const { container } = render(<HealthDot status="degraded" />);

    const dot = container.firstChild;
    expect(dot).toHaveClass("bg-yellow-500");
  });

  it("should render down dot", () => {
    const { container } = render(<HealthDot status="down" />);

    const dot = container.firstChild;
    expect(dot).toHaveClass("bg-red-500");
  });

  it("should have title attribute for accessibility", () => {
    const { container } = render(<HealthDot status="healthy" />);

    const dot = container.firstChild as HTMLElement;
    expect(dot.getAttribute("title")).toBe("Healthy");
  });

  it("should apply custom className", () => {
    const { container } = render(
      <HealthDot status="healthy" className="custom-class" />
    );

    const dot = container.firstChild;
    expect(dot).toHaveClass("custom-class");
  });
});

describe("HealthPulse", () => {
  it("should render healthy pulse with animation", () => {
    const { container } = render(<HealthPulse status="healthy" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("relative");
    expect(wrapper).toHaveClass("flex");

    // Check for animated ping element
    const pingElement = wrapper.querySelector(".animate-ping");
    expect(pingElement).toBeInTheDocument();
    expect(pingElement).toHaveClass("bg-green-500");
  });

  it("should render degraded pulse", () => {
    const { container } = render(<HealthPulse status="degraded" />);

    const wrapper = container.firstChild as HTMLElement;
    const pingElement = wrapper.querySelector(".animate-ping");
    expect(pingElement).toHaveClass("bg-yellow-500");
  });

  it("should render down pulse", () => {
    const { container } = render(<HealthPulse status="down" />);

    const wrapper = container.firstChild as HTMLElement;
    const pingElement = wrapper.querySelector(".animate-ping");
    expect(pingElement).toHaveClass("bg-red-500");
  });

  it("should apply custom className", () => {
    const { container } = render(
      <HealthPulse status="healthy" className="custom-class" />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("custom-class");
  });
});
