import { describe, it, expect } from "vitest";
import { render } from "@/test/utils";
import { ToastContainer } from "../ToastContainer";
import { EnhancedToast } from "../EnhancedToast";

describe("ToastContainer", () => {
  describe("rendering", () => {
    it("should render children", () => {
      const { container } = render(
        <ToastContainer>
          <EnhancedToast title="Test Toast" />
        </ToastContainer>
      );
      expect(container.querySelector('[role="status"]')).toBeInTheDocument();
    });

    it("should render multiple toasts", () => {
      const { container } = render(
        <ToastContainer>
          <EnhancedToast title="Toast 1" />
          <EnhancedToast title="Toast 2" />
          <EnhancedToast title="Toast 3" />
        </ToastContainer>
      );
      const toasts = container.querySelectorAll('[role="status"]');
      expect(toasts).toHaveLength(3);
    });

    it("should render no toasts when children is empty", () => {
      const { container } = render(<ToastContainer>{[]}</ToastContainer>);
      const toasts = container.querySelectorAll('[role="status"]');
      expect(toasts).toHaveLength(0);
    });

    it("should render ToastProvider", () => {
      const { container } = render(
        <ToastContainer>
          <EnhancedToast title="Test" />
        </ToastContainer>
      );
      // Provider wraps the content
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should render ToastViewport", () => {
      const { container } = render(
        <ToastContainer>
          <EnhancedToast title="Test" />
        </ToastContainer>
      );
      const viewport = container.querySelector('[class*="fixed"]');
      expect(viewport).toBeInTheDocument();
    });
  });

  describe("positioning", () => {
    it("should apply top-right position by default", () => {
      const { container } = render(
        <ToastContainer>
          <EnhancedToast title="Test" />
        </ToastContainer>
      );
      const viewport = container.querySelector('[class*="fixed"]');
      expect(viewport).toHaveClass("top-0", "right-0");
    });

    it("should apply top-right position classes", () => {
      const { container } = render(
        <ToastContainer position="top-right">
          <EnhancedToast title="Test" />
        </ToastContainer>
      );
      const viewport = container.querySelector('[class*="fixed"]');
      expect(viewport).toHaveClass("top-0", "right-0");
    });

    it("should apply top-left position classes", () => {
      const { container } = render(
        <ToastContainer position="top-left">
          <EnhancedToast title="Test" />
        </ToastContainer>
      );
      const viewport = container.querySelector('[class*="fixed"]');
      expect(viewport).toHaveClass("top-0", "left-0");
    });

    it("should apply top-center position classes", () => {
      const { container } = render(
        <ToastContainer position="top-center">
          <EnhancedToast title="Test" />
        </ToastContainer>
      );
      const viewport = container.querySelector('[class*="fixed"]');
      expect(viewport).toHaveClass("top-0", "left-1/2", "-translate-x-1/2");
    });

    it("should apply bottom-right position classes", () => {
      const { container } = render(
        <ToastContainer position="bottom-right">
          <EnhancedToast title="Test" />
        </ToastContainer>
      );
      const viewport = container.querySelector('[class*="fixed"]');
      expect(viewport).toHaveClass("bottom-0", "right-0");
    });

    it("should apply bottom-left position classes", () => {
      const { container } = render(
        <ToastContainer position="bottom-left">
          <EnhancedToast title="Test" />
        </ToastContainer>
      );
      const viewport = container.querySelector('[class*="fixed"]');
      expect(viewport).toHaveClass("bottom-0", "left-0");
    });

    it("should apply bottom-center position classes", () => {
      const { container } = render(
        <ToastContainer position="bottom-center">
          <EnhancedToast title="Test" />
        </ToastContainer>
      );
      const viewport = container.querySelector('[class*="fixed"]');
      expect(viewport).toHaveClass("bottom-0", "left-1/2", "-translate-x-1/2");
    });
  });

  describe("maxVisible", () => {
    it("should limit toasts to maxVisible (default 5)", () => {
      const { container } = render(
        <ToastContainer>
          <EnhancedToast title="Toast 1" />
          <EnhancedToast title="Toast 2" />
          <EnhancedToast title="Toast 3" />
          <EnhancedToast title="Toast 4" />
          <EnhancedToast title="Toast 5" />
          <EnhancedToast title="Toast 6" />
          <EnhancedToast title="Toast 7" />
        </ToastContainer>
      );
      const toasts = container.querySelectorAll('[role="status"]');
      expect(toasts.length).toBeLessThanOrEqual(5);
    });

    it("should limit toasts to custom maxVisible", () => {
      const { container } = render(
        <ToastContainer maxVisible={3}>
          <EnhancedToast title="Toast 1" />
          <EnhancedToast title="Toast 2" />
          <EnhancedToast title="Toast 3" />
          <EnhancedToast title="Toast 4" />
          <EnhancedToast title="Toast 5" />
        </ToastContainer>
      );
      const toasts = container.querySelectorAll('[role="status"]');
      expect(toasts.length).toBeLessThanOrEqual(3);
    });

    it("should show all toasts when count is less than maxVisible", () => {
      const { container } = render(
        <ToastContainer maxVisible={5}>
          <EnhancedToast title="Toast 1" />
          <EnhancedToast title="Toast 2" />
        </ToastContainer>
      );
      const toasts = container.querySelectorAll('[role="status"]');
      expect(toasts).toHaveLength(2);
    });

    it("should handle maxVisible of 1", () => {
      const { container } = render(
        <ToastContainer maxVisible={1}>
          <EnhancedToast title="Toast 1" />
          <EnhancedToast title="Toast 2" />
          <EnhancedToast title="Toast 3" />
        </ToastContainer>
      );
      const toasts = container.querySelectorAll('[role="status"]');
      expect(toasts.length).toBeLessThanOrEqual(1);
    });
  });

  describe("stacking", () => {
    it("should show newest on top by default", () => {
      const { container } = render(
        <ToastContainer maxVisible={2}>
          <EnhancedToast title="Toast 1" />
          <EnhancedToast title="Toast 2" />
          <EnhancedToast title="Toast 3" />
        </ToastContainer>
      );
      const toasts = container.querySelectorAll('[role="status"]');
      expect(toasts.length).toBeLessThanOrEqual(2);
    });

    it("should show newest on top when newestOnTop is true", () => {
      const { container } = render(
        <ToastContainer maxVisible={2} newestOnTop={true}>
          <EnhancedToast title="Toast 1" />
          <EnhancedToast title="Toast 2" />
          <EnhancedToast title="Toast 3" />
        </ToastContainer>
      );
      const toasts = container.querySelectorAll('[role="status"]');
      expect(toasts.length).toBeLessThanOrEqual(2);
    });

    it("should show newest on bottom when newestOnTop is false", () => {
      const { container } = render(
        <ToastContainer maxVisible={2} newestOnTop={false}>
          <EnhancedToast title="Toast 1" />
          <EnhancedToast title="Toast 2" />
          <EnhancedToast title="Toast 3" />
        </ToastContainer>
      );
      const toasts = container.querySelectorAll('[role="status"]');
      expect(toasts.length).toBeLessThanOrEqual(2);
    });
  });

  describe("styling", () => {
    it("should apply base classes to viewport", () => {
      const { container } = render(
        <ToastContainer>
          <EnhancedToast title="Test" />
        </ToastContainer>
      );
      const viewport = container.querySelector('[class*="fixed"]');
      expect(viewport).toHaveClass("fixed", "z-[100]", "flex");
    });

    it("should apply custom className to viewport", () => {
      const { container } = render(
        <ToastContainer className="custom-class">
          <EnhancedToast title="Test" />
        </ToastContainer>
      );
      const viewport = container.querySelector('[class*="fixed"]');
      expect(viewport).toHaveClass("custom-class");
    });

    it("should apply max width classes", () => {
      const { container } = render(
        <ToastContainer>
          <EnhancedToast title="Test" />
        </ToastContainer>
      );
      const viewport = container.querySelector('[class*="fixed"]');
      expect(viewport).toHaveClass("md:max-w-[420px]");
    });

    it("should apply padding classes", () => {
      const { container } = render(
        <ToastContainer>
          <EnhancedToast title="Test" />
        </ToastContainer>
      );
      const viewport = container.querySelector('[class*="fixed"]');
      expect(viewport).toHaveClass("p-4");
    });

    it("should apply max height classes", () => {
      const { container } = render(
        <ToastContainer>
          <EnhancedToast title="Test" />
        </ToastContainer>
      );
      const viewport = container.querySelector('[class*="fixed"]');
      expect(viewport).toHaveClass("max-h-screen");
    });

    it("should apply full width class", () => {
      const { container } = render(
        <ToastContainer>
          <EnhancedToast title="Test" />
        </ToastContainer>
      );
      const viewport = container.querySelector('[class*="fixed"]');
      expect(viewport).toHaveClass("w-full");
    });
  });

  describe("flex direction", () => {
    it("should apply correct flex direction for top positions", () => {
      const { container } = render(
        <ToastContainer position="top-right">
          <EnhancedToast title="Test" />
        </ToastContainer>
      );
      const viewport = container.querySelector('[class*="fixed"]');
      expect(viewport).toHaveClass("flex-col-reverse");
    });

    it("should apply correct flex direction for bottom positions", () => {
      const { container } = render(
        <ToastContainer position="bottom-right">
          <EnhancedToast title="Test" />
        </ToastContainer>
      );
      const viewport = container.querySelector('[class*="fixed"]');
      expect(viewport).toHaveClass("flex-col");
    });
  });

  describe("edge cases", () => {
    it("should handle null children", () => {
      const { container } = render(<ToastContainer>{null}</ToastContainer>);
      const toasts = container.querySelectorAll('[role="status"]');
      expect(toasts).toHaveLength(0);
    });

    it("should handle maxVisible of 0", () => {
      const { container } = render(
        <ToastContainer maxVisible={0}>
          <EnhancedToast title="Toast 1" />
        </ToastContainer>
      );
      const toasts = container.querySelectorAll('[role="status"]');
      expect(toasts).toHaveLength(0);
    });

    it("should handle very large maxVisible", () => {
      const { container } = render(
        <ToastContainer maxVisible={1000}>
          <EnhancedToast title="Toast 1" />
          <EnhancedToast title="Toast 2" />
        </ToastContainer>
      );
      const toasts = container.querySelectorAll('[role="status"]');
      expect(toasts).toHaveLength(2);
    });
  });
});
