/**
 * TrustStatusBadge Component Tests
 */

import { describe, it, expect } from "vitest";
import { screen, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrustStatusBadge } from "../components/TrustStatusBadge";
import { TrustStatus } from "../types";

describe("TrustStatusBadge", () => {
  describe("Status variants", () => {
    it("should render VALID status correctly", () => {
      render(<TrustStatusBadge status={TrustStatus.VALID} />);

      expect(screen.getByText("Valid")).toBeInTheDocument();
      const badge = screen.getByText("Valid").parentElement;
      expect(badge).toHaveClass("bg-green-100", "text-green-800");
    });

    it("should render EXPIRED status correctly", () => {
      render(<TrustStatusBadge status={TrustStatus.EXPIRED} />);

      expect(screen.getByText("Expired")).toBeInTheDocument();
      const badge = screen.getByText("Expired").parentElement;
      expect(badge).toHaveClass("bg-yellow-100", "text-yellow-800");
    });

    it("should render REVOKED status correctly", () => {
      render(<TrustStatusBadge status={TrustStatus.REVOKED} />);

      expect(screen.getByText("Revoked")).toBeInTheDocument();
      const badge = screen.getByText("Revoked").parentElement;
      expect(badge).toHaveClass("bg-red-100", "text-red-800");
    });

    it("should render PENDING status correctly", () => {
      render(<TrustStatusBadge status={TrustStatus.PENDING} />);

      expect(screen.getByText("Pending")).toBeInTheDocument();
      const badge = screen.getByText("Pending").parentElement;
      expect(badge).toHaveClass("bg-gray-100", "text-gray-800");
    });

    it("should render INVALID status correctly", () => {
      render(<TrustStatusBadge status={TrustStatus.INVALID} />);

      expect(screen.getByText("Invalid")).toBeInTheDocument();
      const badge = screen.getByText("Invalid").parentElement;
      expect(badge).toHaveClass("bg-red-100", "text-red-800");
    });
  });

  describe("Size variants", () => {
    it("should render small size correctly", () => {
      render(<TrustStatusBadge status={TrustStatus.VALID} size="sm" />);

      const badge = screen.getByText("Valid").parentElement;
      expect(badge).toHaveClass("text-xs", "px-2", "py-0.5");
    });

    it("should render medium size correctly", () => {
      render(<TrustStatusBadge status={TrustStatus.VALID} size="md" />);

      const badge = screen.getByText("Valid").parentElement;
      expect(badge).toHaveClass("text-sm", "px-2.5", "py-0.5");
    });

    it("should render large size correctly", () => {
      render(<TrustStatusBadge status={TrustStatus.VALID} size="lg" />);

      const badge = screen.getByText("Valid").parentElement;
      expect(badge).toHaveClass("text-base", "px-3", "py-1");
    });

    it("should default to medium size", () => {
      render(<TrustStatusBadge status={TrustStatus.VALID} />);

      const badge = screen.getByText("Valid").parentElement;
      expect(badge).toHaveClass("text-sm", "px-2.5", "py-0.5");
    });
  });

  describe("Icon display", () => {
    it("should show icon by default", () => {
      const { container } = render(
        <TrustStatusBadge status={TrustStatus.VALID} />
      );

      // Check for SVG element (icon)
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should hide icon when showIcon is false", () => {
      const { container } = render(
        <TrustStatusBadge status={TrustStatus.VALID} showIcon={false} />
      );

      // Check for no SVG element
      const svg = container.querySelector("svg");
      expect(svg).not.toBeInTheDocument();
    });

    it("should show correct icon for each status", () => {
      const { container: validContainer } = render(
        <TrustStatusBadge status={TrustStatus.VALID} />
      );
      expect(validContainer.querySelector("svg")).toBeInTheDocument();

      const { container: expiredContainer } = render(
        <TrustStatusBadge status={TrustStatus.EXPIRED} />
      );
      expect(expiredContainer.querySelector("svg")).toBeInTheDocument();

      const { container: revokedContainer } = render(
        <TrustStatusBadge status={TrustStatus.REVOKED} />
      );
      expect(revokedContainer.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Tooltip", () => {
    it("should render with TooltipProvider wrapper", () => {
      const { container } = render(
        <TrustStatusBadge status={TrustStatus.VALID} />
      );

      // Component should render successfully with tooltip wrapper
      expect(screen.getByText("Valid")).toBeInTheDocument();
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should render badge for all status types", () => {
      render(<TrustStatusBadge status={TrustStatus.EXPIRED} />);
      expect(screen.getByText("Expired")).toBeInTheDocument();

      render(<TrustStatusBadge status={TrustStatus.REVOKED} />);
      expect(screen.getByText("Revoked")).toBeInTheDocument();

      render(<TrustStatusBadge status={TrustStatus.PENDING} />);
      expect(screen.getByText("Pending")).toBeInTheDocument();

      render(<TrustStatusBadge status={TrustStatus.INVALID} />);
      expect(screen.getByText("Invalid")).toBeInTheDocument();
    });
  });

  describe("Custom className", () => {
    it("should apply custom className", () => {
      render(
        <TrustStatusBadge status={TrustStatus.VALID} className="custom-class" />
      );

      const badge = screen.getByText("Valid").parentElement;
      expect(badge).toHaveClass("custom-class");
    });

    it("should merge custom className with default classes", () => {
      render(
        <TrustStatusBadge status={TrustStatus.VALID} className="custom-class" />
      );

      const badge = screen.getByText("Valid").parentElement;
      expect(badge).toHaveClass(
        "custom-class",
        "bg-green-100",
        "text-green-800"
      );
    });
  });

  describe("Accessibility", () => {
    it("should have inline-flex display for proper alignment", () => {
      render(<TrustStatusBadge status={TrustStatus.VALID} />);

      const badge = screen.getByText("Valid").parentElement;
      expect(badge).toHaveClass("inline-flex", "items-center");
    });

    it("should render badge element with proper structure", () => {
      render(<TrustStatusBadge status={TrustStatus.VALID} />);

      const badge = screen.getByText("Valid");
      expect(badge).toBeInTheDocument();
      expect(badge.parentElement).toHaveClass("inline-flex");
    });
  });
});
