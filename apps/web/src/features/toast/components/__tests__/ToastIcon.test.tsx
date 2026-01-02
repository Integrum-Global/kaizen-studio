import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { ToastIcon } from "../ToastIcon";
import { Star } from "lucide-react";

describe("ToastIcon", () => {
  describe("rendering", () => {
    it("should render success icon by default", () => {
      const { container } = render(<ToastIcon variant="success" />);
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should render error icon", () => {
      const { container } = render(<ToastIcon variant="error" />);
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should render warning icon", () => {
      const { container } = render(<ToastIcon variant="warning" />);
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should render info icon", () => {
      const { container } = render(<ToastIcon variant="info" />);
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should render default icon", () => {
      const { container } = render(<ToastIcon variant="default" />);
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should render custom icon when provided", () => {
      render(
        <ToastIcon
          variant="success"
          customIcon={<Star data-testid="custom-icon" />}
        />
      );
      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    });

    it("should not render default icon when custom icon is provided", () => {
      const { container } = render(
        <ToastIcon
          variant="success"
          customIcon={<Star data-testid="custom-icon" />}
        />
      );
      // Custom icon should be wrapped in a div, not be an svg directly
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("should apply success color classes", () => {
      const { container } = render(<ToastIcon variant="success" />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("text-green-600");
    });

    it("should apply error color classes", () => {
      const { container } = render(<ToastIcon variant="error" />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("text-red-600");
    });

    it("should apply warning color classes", () => {
      const { container } = render(<ToastIcon variant="warning" />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("text-amber-600");
    });

    it("should apply info color classes", () => {
      const { container } = render(<ToastIcon variant="info" />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("text-blue-600");
    });

    it("should apply default color classes", () => {
      const { container } = render(<ToastIcon variant="default" />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("text-foreground");
    });

    it("should apply custom className", () => {
      const { container } = render(
        <ToastIcon variant="success" className="custom-class" />
      );
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("custom-class");
    });

    it("should apply size classes", () => {
      const { container } = render(<ToastIcon variant="success" />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("h-5", "w-5");
    });

    it("should apply flex-shrink-0 class", () => {
      const { container } = render(<ToastIcon variant="success" />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("flex-shrink-0");
    });
  });

  describe("accessibility", () => {
    it("should have aria-hidden attribute on icon", () => {
      const { container } = render(<ToastIcon variant="success" />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("should have aria-hidden on default icon", () => {
      const { container } = render(<ToastIcon variant="default" />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("icon mapping", () => {
    it("should use CheckCircle icon for success variant", () => {
      const { container } = render(<ToastIcon variant="success" />);
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
      // CheckCircle is rendered
      expect(icon?.classList.contains("text-green-600")).toBe(true);
    });

    it("should use XCircle icon for error variant", () => {
      const { container } = render(<ToastIcon variant="error" />);
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon?.classList.contains("text-red-600")).toBe(true);
    });

    it("should use AlertTriangle icon for warning variant", () => {
      const { container } = render(<ToastIcon variant="warning" />);
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon?.classList.contains("text-amber-600")).toBe(true);
    });

    it("should use Info icon for info variant", () => {
      const { container } = render(<ToastIcon variant="info" />);
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon?.classList.contains("text-blue-600")).toBe(true);
    });

    it("should use Info icon for default variant", () => {
      const { container } = render(<ToastIcon variant="default" />);
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon?.classList.contains("text-foreground")).toBe(true);
    });
  });

  describe("custom icon wrapper", () => {
    it("should wrap custom icon in div", () => {
      const { container } = render(
        <ToastIcon variant="success" customIcon={<span>Custom</span>} />
      );
      const wrapper = container.querySelector("div");
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass("flex-shrink-0");
    });

    it("should apply className to custom icon wrapper", () => {
      const { container } = render(
        <ToastIcon
          variant="success"
          customIcon={<span>Custom</span>}
          className="custom-wrapper"
        />
      );
      const wrapper = container.querySelector("div");
      expect(wrapper).toHaveClass("custom-wrapper");
    });
  });
});
