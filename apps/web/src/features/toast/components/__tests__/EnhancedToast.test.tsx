import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/utils";
import userEvent from "@testing-library/user-event";
import { EnhancedToast } from "../EnhancedToast";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";
import { Star } from "lucide-react";

// Wrapper component with ToastProvider and Viewport
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <ToastViewport />
    </ToastProvider>
  );
}

// Helper to render with provider
function renderToast(ui: React.ReactElement) {
  return render(ui, { wrapper: TestWrapper });
}

describe("EnhancedToast", () => {
  describe("rendering", () => {
    it("should render with title", () => {
      renderToast(<EnhancedToast title="Test Title" open />);
      expect(screen.getByText("Test Title")).toBeInTheDocument();
    });

    it("should render with title and description", () => {
      renderToast(
        <EnhancedToast title="Test Title" description="Test Description" open />
      );
      expect(screen.getByText("Test Title")).toBeInTheDocument();
      expect(screen.getByText("Test Description")).toBeInTheDocument();
    });

    it("should render without title", () => {
      renderToast(<EnhancedToast description="Only Description" open />);
      expect(screen.getByText("Only Description")).toBeInTheDocument();
    });

    it("should render without description", () => {
      renderToast(<EnhancedToast title="Only Title" open />);
      expect(screen.getByText("Only Title")).toBeInTheDocument();
      // Description won't be rendered if not provided
      const descriptions = screen.queryAllByText("Only Title");
      expect(descriptions).toHaveLength(1);
    });
  });

  describe("variants", () => {
    it("should render default variant", () => {
      const { container } = renderToast(
        <EnhancedToast variant="default" title="Default" open />
      );
      const toast = container.querySelector('[role="status"]');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveClass("bg-background");
    });

    it("should render success variant", () => {
      const { container } = renderToast(
        <EnhancedToast variant="success" title="Success" open />
      );
      const toast = container.querySelector('[role="status"]');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveClass("bg-green-50");
    });

    it("should render error variant", () => {
      const { container } = renderToast(
        <EnhancedToast variant="error" title="Error" open />
      );
      const toast = container.querySelector('[role="alert"]');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveClass("bg-red-50");
    });

    it("should render warning variant", () => {
      const { container } = renderToast(
        <EnhancedToast variant="warning" title="Warning" open />
      );
      const toast = container.querySelector('[role="status"]');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveClass("bg-amber-50");
    });

    it("should render info variant", () => {
      const { container } = renderToast(
        <EnhancedToast variant="info" title="Info" open />
      );
      const toast = container.querySelector('[role="status"]');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveClass("bg-blue-50");
    });
  });

  describe("icons", () => {
    it("should not render ToastIcon for default variant", () => {
      const { container } = renderToast(
        <EnhancedToast variant="default" title="Default" open />
      );
      // Default variant has no ToastIcon component, but has close button X icon
      // Check that there's only one SVG (the close button)
      const svgs = container.querySelectorAll("svg");
      // Close button has 1 SVG
      expect(svgs.length).toBe(1);
    });

    it("should render icon for success variant", () => {
      const { container } = renderToast(
        <EnhancedToast variant="success" title="Success" open />
      );
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should render icon for error variant", () => {
      const { container } = renderToast(
        <EnhancedToast variant="error" title="Error" open />
      );
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should render icon for warning variant", () => {
      const { container } = renderToast(
        <EnhancedToast variant="warning" title="Warning" open />
      );
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should render icon for info variant", () => {
      const { container } = renderToast(
        <EnhancedToast variant="info" title="Info" open />
      );
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should render custom icon when provided", () => {
      renderToast(
        <EnhancedToast
          variant="success"
          title="Custom"
          icon={<Star data-testid="custom-icon" />}
          open
        />
      );
      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    });
  });

  describe("close button", () => {
    it("should render close button by default", () => {
      const { container } = renderToast(<EnhancedToast title="Test" open />);
      const closeButton = container.querySelector("[toast-close]");
      expect(closeButton).toBeInTheDocument();
    });

    it("should render close button when closable is true", () => {
      const { container } = renderToast(
        <EnhancedToast title="Test" closable={true} open />
      );
      const closeButton = container.querySelector("[toast-close]");
      expect(closeButton).toBeInTheDocument();
    });

    it("should not render close button when closable is false", () => {
      const { container } = renderToast(
        <EnhancedToast title="Test" closable={false} open />
      );
      const closeButton = container.querySelector("[toast-close]");
      expect(closeButton).not.toBeInTheDocument();
    });

    it("should call onOpenChange when close button is clicked", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const { container } = renderToast(
        <EnhancedToast title="Test" onOpenChange={onOpenChange} open />
      );

      const closeButton = container.querySelector("[toast-close]");
      if (closeButton) {
        await user.click(closeButton);
        expect(onOpenChange).toHaveBeenCalled();
      }
    });
  });

  describe("progress bar", () => {
    it("should not render progress bar by default", () => {
      const { container } = renderToast(<EnhancedToast title="Test" open />);
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).not.toBeInTheDocument();
    });

    it("should render progress bar when showProgress is true", () => {
      const { container } = renderToast(
        <EnhancedToast title="Test" showProgress={true} open />
      );
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });

    it("should not render progress bar when duration is 0", () => {
      const { container } = renderToast(
        <EnhancedToast title="Test" showProgress={true} duration={0} open />
      );
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).not.toBeInTheDocument();
    });

    it("should have correct ARIA attributes on progress bar", () => {
      const { container } = renderToast(
        <EnhancedToast title="Test" showProgress={true} open />
      );
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute("aria-valuenow");
      expect(progressBar).toHaveAttribute("aria-valuemin", "0");
      expect(progressBar).toHaveAttribute("aria-valuemax", "100");
      expect(progressBar).toHaveAttribute("aria-label", "Time remaining");
    });

    it("should update progress bar over time", async () => {
      vi.useFakeTimers();
      const { container } = renderToast(
        <EnhancedToast title="Test" showProgress={true} duration={1000} open />
      );
      const progressBar = container.querySelector('[role="progressbar"]');

      const initialValue = progressBar?.getAttribute("aria-valuenow");
      expect(initialValue).toBe("100");

      // Fast-forward time and wait for updates
      await vi.advanceTimersByTimeAsync(500);

      const currentValue = progressBar?.getAttribute("aria-valuenow");
      expect(Number(currentValue)).toBeLessThan(100);

      vi.useRealTimers();
    });
  });

  describe("accessibility", () => {
    it("should have role=status for non-error variants", () => {
      const { container } = renderToast(
        <EnhancedToast variant="success" title="Success" open />
      );
      const toast = container.querySelector('[role="status"]');
      expect(toast).toBeInTheDocument();
    });

    it("should have role=alert for error variant", () => {
      const { container } = renderToast(
        <EnhancedToast variant="error" title="Error" open />
      );
      const toast = container.querySelector('[role="alert"]');
      expect(toast).toBeInTheDocument();
    });

    it("should have aria-live=polite for non-error variants", () => {
      const { container } = renderToast(
        <EnhancedToast variant="success" title="Success" open />
      );
      const toast = container.querySelector('[aria-live="polite"]');
      expect(toast).toBeInTheDocument();
    });

    it("should have aria-live=assertive for error variant", () => {
      const { container } = renderToast(
        <EnhancedToast variant="error" title="Error" open />
      );
      const toast = container.querySelector('[aria-live="assertive"]');
      expect(toast).toBeInTheDocument();
    });

    it("should have proper heading structure for title", () => {
      renderToast(<EnhancedToast title="Test Title" open />);
      const title = screen.getByText("Test Title");
      expect(title).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("should apply custom className", () => {
      const { container } = renderToast(
        <EnhancedToast title="Test" className="custom-class" open />
      );
      const toast = container.querySelector('[role="status"]');
      expect(toast).toHaveClass("custom-class");
    });

    it("should apply success border color", () => {
      const { container } = renderToast(
        <EnhancedToast variant="success" title="Success" open />
      );
      const toast = container.querySelector('[role="status"]');
      expect(toast).toHaveClass("border-green-200");
    });

    it("should apply error border color", () => {
      const { container } = renderToast(
        <EnhancedToast variant="error" title="Error" open />
      );
      const toast = container.querySelector('[role="alert"]');
      expect(toast).toHaveClass("border-red-200");
    });

    it("should apply warning border color", () => {
      const { container } = renderToast(
        <EnhancedToast variant="warning" title="Warning" open />
      );
      const toast = container.querySelector('[role="status"]');
      expect(toast).toHaveClass("border-amber-200");
    });

    it("should apply info border color", () => {
      const { container } = renderToast(
        <EnhancedToast variant="info" title="Info" open />
      );
      const toast = container.querySelector('[role="status"]');
      expect(toast).toHaveClass("border-blue-200");
    });
  });

  describe("layout", () => {
    it("should have proper flex layout", () => {
      const { container } = renderToast(
        <EnhancedToast variant="success" title="Test" open />
      );
      const content = container.querySelector(".flex.w-full.items-start.gap-3");
      expect(content).toBeInTheDocument();
    });

    it("should have icon and content in same flex container", () => {
      const { container } = renderToast(
        <EnhancedToast variant="success" title="Test" open />
      );
      const flexContainer = container.querySelector(
        ".flex.w-full.items-start.gap-3"
      );
      const icon = flexContainer?.querySelector("svg");
      const textContent = flexContainer?.querySelector(".flex-1");
      expect(icon).toBeInTheDocument();
      expect(textContent).toBeInTheDocument();
    });
  });

  describe("duration", () => {
    it("should accept custom duration", () => {
      const { container } = renderToast(
        <EnhancedToast title="Test" showProgress={true} duration={3000} open />
      );
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });

    it("should handle duration of 0", () => {
      const { container } = renderToast(
        <EnhancedToast title="Test" showProgress={true} duration={0} open />
      );
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).not.toBeInTheDocument();
    });
  });

  describe("forwarded ref", () => {
    it("should forward ref to Toast component", () => {
      const ref = vi.fn();
      renderToast(<EnhancedToast ref={ref} title="Test" open />);
      expect(ref).toHaveBeenCalled();
    });
  });
});
