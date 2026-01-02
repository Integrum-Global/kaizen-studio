import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, userEvent } from "@/test/utils";
import { ErrorFallback } from "../components/ErrorFallback";

describe("ErrorFallback", () => {
  const mockResetErrorBoundary = vi.fn();

  beforeEach(() => {
    mockResetErrorBoundary.mockClear();
  });

  describe("rendering", () => {
    it("should render error message for Error object", () => {
      const error = new Error("Test error message");

      render(
        <ErrorFallback
          error={error}
          resetErrorBoundary={mockResetErrorBoundary}
        />
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.getByText("Test error message")).toBeInTheDocument();
    });

    it("should render error message for AppError object", () => {
      const appError = {
        code: "TEST_ERROR",
        message: "Application error occurred",
        timestamp: new Date(),
      };

      render(
        <ErrorFallback
          error={appError}
          resetErrorBoundary={mockResetErrorBoundary}
        />
      );

      expect(
        screen.getByText("Application error occurred")
      ).toBeInTheDocument();
    });

    it("should render default message when no error message available", () => {
      const error = { name: "UnknownError" } as Error;

      render(
        <ErrorFallback
          error={error}
          resetErrorBoundary={mockResetErrorBoundary}
        />
      );

      expect(
        screen.getByText("An unexpected error occurred")
      ).toBeInTheDocument();
    });

    it("should display error in pre-formatted block", () => {
      const error = new Error("Test error");

      render(
        <ErrorFallback
          error={error}
          resetErrorBoundary={mockResetErrorBoundary}
        />
      );

      const pre = screen.getByText("Test error");
      expect(pre.tagName).toBe("PRE");
      expect(pre).toHaveClass("text-xs", "bg-muted", "p-2", "rounded");
    });

    it("should render within a card component", () => {
      const error = new Error("Test error");

      const { container } = render(
        <ErrorFallback
          error={error}
          resetErrorBoundary={mockResetErrorBoundary}
        />
      );

      const card = container.querySelector(".rounded-lg.border.bg-card");
      expect(card).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should call resetErrorBoundary when Try Again button is clicked", async () => {
      const user = userEvent.setup();
      const error = new Error("Test error");

      render(
        <ErrorFallback
          error={error}
          resetErrorBoundary={mockResetErrorBoundary}
        />
      );

      const tryAgainButton = screen.getByRole("button", { name: /try again/i });
      await user.click(tryAgainButton);

      expect(mockResetErrorBoundary).toHaveBeenCalledTimes(1);
    });

    it("should have Go Home button", async () => {
      const error = new Error("Test error");

      render(
        <ErrorFallback
          error={error}
          resetErrorBoundary={mockResetErrorBoundary}
        />
      );

      const goHomeButton = screen.getByRole("button", { name: /go home/i });
      expect(goHomeButton).toBeInTheDocument();
    });
  });

  describe("visual elements", () => {
    it("should render alert triangle icon", () => {
      const error = new Error("Test error");

      const { container } = render(
        <ErrorFallback
          error={error}
          resetErrorBoundary={mockResetErrorBoundary}
        />
      );

      const iconContainer = container.querySelector(".bg-destructive\\/10");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should display helpful message to user", () => {
      const error = new Error("Test error");

      render(
        <ErrorFallback
          error={error}
          resetErrorBoundary={mockResetErrorBoundary}
        />
      );

      expect(
        screen.getByText(
          /an unexpected error occurred\. please try again or contact support/i
        )
      ).toBeInTheDocument();
    });
  });

  describe("layout", () => {
    it("should center content vertically and horizontally", () => {
      const error = new Error("Test error");

      const { container } = render(
        <ErrorFallback
          error={error}
          resetErrorBoundary={mockResetErrorBoundary}
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass(
        "flex",
        "items-center",
        "justify-center",
        "min-h-[400px]"
      );
    });

    it("should have centered card header", () => {
      const error = new Error("Test error");

      const { container } = render(
        <ErrorFallback
          error={error}
          resetErrorBoundary={mockResetErrorBoundary}
        />
      );

      const header = container.querySelector(".text-center");
      expect(header).toBeInTheDocument();
    });

    it("should have buttons in footer with proper spacing", () => {
      const error = new Error("Test error");

      const { container } = render(
        <ErrorFallback
          error={error}
          resetErrorBoundary={mockResetErrorBoundary}
        />
      );

      const footer = container.querySelector(".flex.justify-center.gap-2");
      expect(footer).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper heading structure", () => {
      const error = new Error("Test error");

      render(
        <ErrorFallback
          error={error}
          resetErrorBoundary={mockResetErrorBoundary}
        />
      );

      const heading = screen.getByText("Something went wrong");
      expect(heading.tagName).toBe("H3");
    });

    it("should have accessible buttons", () => {
      const error = new Error("Test error");

      render(
        <ErrorFallback
          error={error}
          resetErrorBoundary={mockResetErrorBoundary}
        />
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(2);
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      const error = new Error("Test error");

      render(
        <ErrorFallback
          error={error}
          resetErrorBoundary={mockResetErrorBoundary}
        />
      );

      const tryAgainButton = screen.getByRole("button", { name: /try again/i });
      tryAgainButton.focus();

      expect(tryAgainButton).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(mockResetErrorBoundary).toHaveBeenCalledTimes(1);
    });
  });

  describe("edge cases", () => {
    it("should handle error with empty message", () => {
      const error = new Error("");

      render(
        <ErrorFallback
          error={error}
          resetErrorBoundary={mockResetErrorBoundary}
        />
      );

      // Empty message is falsy, so default message should be shown
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("should handle very long error messages", () => {
      const longMessage = "Error: ".repeat(100);
      const error = new Error(longMessage);

      const { container } = render(
        <ErrorFallback
          error={error}
          resetErrorBoundary={mockResetErrorBoundary}
        />
      );

      const pre = container.querySelector("pre");
      expect(pre).toHaveClass("overflow-auto", "max-h-32");
    });
  });
});
