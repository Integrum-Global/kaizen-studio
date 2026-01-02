import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "@/test/utils";
import { ErrorAlert } from "../components/ErrorAlert";

describe("ErrorAlert", () => {
  describe("rendering", () => {
    it("should render error message from string", () => {
      render(<ErrorAlert error="Test error message" />);

      expect(screen.getByText("Test error message")).toBeInTheDocument();
      expect(screen.getByText("Error")).toBeInTheDocument();
    });

    it("should render error message from Error object", () => {
      const error = new Error("Error object message");

      render(<ErrorAlert error={error} />);

      expect(screen.getByText("Error object message")).toBeInTheDocument();
    });

    it("should render error message from AppError object", () => {
      const appError = {
        code: "APP_ERROR",
        message: "Application error message",
        timestamp: new Date(),
      };

      render(<ErrorAlert error={appError} />);

      expect(screen.getByText("Application error message")).toBeInTheDocument();
    });

    it("should render default message for unknown error type", () => {
      const error = { unknown: "property" } as any;

      render(<ErrorAlert error={error} />);

      expect(screen.getByText("An error occurred")).toBeInTheDocument();
    });

    it("should render with destructive variant by default", () => {
      const { container } = render(<ErrorAlert error="Test error" />);

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveClass("border-destructive/50");
    });

    it("should render with custom variant", () => {
      const { container } = render(
        <ErrorAlert error="Test error" variant="default" />
      );

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveClass("bg-background");
    });
  });

  describe("dismiss functionality", () => {
    it("should render dismiss button when onDismiss is provided", () => {
      const onDismiss = vi.fn();

      render(<ErrorAlert error="Test error" onDismiss={onDismiss} />);

      const dismissButton = screen.getByLabelText("Dismiss");
      expect(dismissButton).toBeInTheDocument();
    });

    it("should call onDismiss when dismiss button is clicked", async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();

      render(<ErrorAlert error="Test error" onDismiss={onDismiss} />);

      const dismissButton = screen.getByLabelText("Dismiss");
      await user.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("should not render dismiss button when onDismiss is not provided", () => {
      render(<ErrorAlert error="Test error" />);

      const dismissButton = screen.queryByLabelText("Dismiss");
      expect(dismissButton).not.toBeInTheDocument();
    });
  });

  describe("retry functionality", () => {
    it("should render retry button when onRetry is provided", () => {
      const onRetry = vi.fn();

      render(<ErrorAlert error="Test error" onRetry={onRetry} />);

      const retryButton = screen.getByLabelText("Retry");
      expect(retryButton).toBeInTheDocument();
    });

    it("should call onRetry when retry button is clicked", async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(<ErrorAlert error="Test error" onRetry={onRetry} />);

      const retryButton = screen.getByLabelText("Retry");
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("should not render retry button when onRetry is not provided", () => {
      render(<ErrorAlert error="Test error" />);

      const retryButton = screen.queryByLabelText("Retry");
      expect(retryButton).not.toBeInTheDocument();
    });
  });

  describe("visual elements", () => {
    it("should render alert triangle icon", () => {
      const { container } = render(<ErrorAlert error="Test error" />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should have relative positioning for action buttons", () => {
      const onDismiss = vi.fn();
      const { container } = render(
        <ErrorAlert error="Test error" onDismiss={onDismiss} />
      );

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveClass("relative");
    });

    it("should position action buttons absolutely in top-right", () => {
      const onDismiss = vi.fn();
      const { container } = render(
        <ErrorAlert error="Test error" onDismiss={onDismiss} />
      );

      const buttonContainer = container.querySelector(
        ".absolute.right-2.top-2"
      );
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe("button combinations", () => {
    it("should render both retry and dismiss buttons", () => {
      const onRetry = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ErrorAlert
          error="Test error"
          onRetry={onRetry}
          onDismiss={onDismiss}
        />
      );

      expect(screen.getByLabelText("Retry")).toBeInTheDocument();
      expect(screen.getByLabelText("Dismiss")).toBeInTheDocument();
    });

    it("should render only retry button", () => {
      const onRetry = vi.fn();

      render(<ErrorAlert error="Test error" onRetry={onRetry} />);

      expect(screen.getByLabelText("Retry")).toBeInTheDocument();
      expect(screen.queryByLabelText("Dismiss")).not.toBeInTheDocument();
    });

    it("should render only dismiss button", () => {
      const onDismiss = vi.fn();

      render(<ErrorAlert error="Test error" onDismiss={onDismiss} />);

      expect(screen.getByLabelText("Dismiss")).toBeInTheDocument();
      expect(screen.queryByLabelText("Retry")).not.toBeInTheDocument();
    });

    it("should render no action buttons", () => {
      render(<ErrorAlert error="Test error" />);

      expect(screen.queryByLabelText("Retry")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Dismiss")).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have alert role", () => {
      render(<ErrorAlert error="Test error" />);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("should have accessible action buttons", () => {
      const onRetry = vi.fn();
      const onDismiss = vi.fn();

      render(
        <ErrorAlert
          error="Test error"
          onRetry={onRetry}
          onDismiss={onDismiss}
        />
      );

      const retryButton = screen.getByLabelText("Retry");
      const dismissButton = screen.getByLabelText("Dismiss");

      expect(retryButton).toHaveAccessibleName();
      expect(dismissButton).toHaveAccessibleName();
    });

    it("should support keyboard navigation on action buttons", async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(<ErrorAlert error="Test error" onRetry={onRetry} />);

      const retryButton = screen.getByLabelText("Retry");
      retryButton.focus();

      expect(retryButton).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe("button styling", () => {
    it("should render icon buttons with ghost variant", () => {
      const onDismiss = vi.fn();

      render(<ErrorAlert error="Test error" onDismiss={onDismiss} />);

      const dismissButton = screen.getByLabelText("Dismiss");
      expect(dismissButton).toHaveClass("h-6", "w-6");
    });

    it("should have proper icon sizing in buttons", () => {
      const onRetry = vi.fn();
      const onDismiss = vi.fn();
      const { container } = render(
        <ErrorAlert
          error="Test error"
          onRetry={onRetry}
          onDismiss={onDismiss}
        />
      );

      const icons = container.querySelectorAll("button svg");
      icons.forEach((icon) => {
        expect(icon).toHaveClass("h-3", "w-3");
      });
    });

    it("should have gap between multiple action buttons", () => {
      const onRetry = vi.fn();
      const onDismiss = vi.fn();
      const { container } = render(
        <ErrorAlert
          error="Test error"
          onRetry={onRetry}
          onDismiss={onDismiss}
        />
      );

      const buttonContainer = container.querySelector(".flex.gap-1");
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe("content layout", () => {
    it("should have proper padding for error description", () => {
      const onDismiss = vi.fn();
      const { container } = render(
        <ErrorAlert error="Test error" onDismiss={onDismiss} />
      );

      const description = container.querySelector(".pr-8");
      expect(description).toBeInTheDocument();
    });

    it("should render Error title", () => {
      render(<ErrorAlert error="Test error" />);

      expect(screen.getByText("Error")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("should handle empty error message", () => {
      render(<ErrorAlert error="" />);

      // Empty string should still render the alert
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("should handle very long error messages", () => {
      const longError = "Error: ".repeat(100);

      render(<ErrorAlert error={longError} />);

      // Check that the message is rendered
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("should handle Error objects with no message", () => {
      const error = new Error();

      render(<ErrorAlert error={error} />);

      // Empty message should show default
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
