import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { HelpButton } from "../components/HelpButton";

// Mock lucide-react icons - include ALL icons used in dependencies
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    HelpCircle: ({ className }: { className?: string }) => (
      <span data-testid="help-circle-icon" className={className}>
        HelpCircle
      </span>
    ),
    BookOpen: ({ className }: { className?: string }) => (
      <span data-testid="book-open-icon" className={className}>
        BookOpen
      </span>
    ),
    MessageCircle: ({ className }: { className?: string }) => (
      <span data-testid="message-circle-icon" className={className}>
        MessageCircle
      </span>
    ),
    Keyboard: ({ className }: { className?: string }) => (
      <span data-testid="keyboard-icon" className={className}>
        Keyboard
      </span>
    ),
    ExternalLink: ({ className }: { className?: string }) => (
      <span data-testid="external-link-icon" className={className}>
        ExternalLink
      </span>
    ),
    Lightbulb: ({ className }: { className?: string }) => (
      <span data-testid="lightbulb-icon" className={className}>
        Lightbulb
      </span>
    ),
    Video: ({ className }: { className?: string }) => (
      <span data-testid="video-icon" className={className}>
        Video
      </span>
    ),
  };
});

describe("HelpButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render help button", () => {
      render(<HelpButton />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should render help icon", () => {
      render(<HelpButton />);

      expect(screen.getByTestId("help-circle-icon")).toBeInTheDocument();
    });

    it("should have accessible label", () => {
      render(<HelpButton />);

      expect(screen.getByText("Open help panel")).toBeInTheDocument();
    });
  });

  describe("floating variant", () => {
    it("should render as floating button by default", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("fixed");
      expect(button).toHaveClass("bottom-6");
      expect(button).toHaveClass("right-6");
    });

    it("should be rounded for floating variant", () => {
      render(<HelpButton variant="floating" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("rounded-full");
    });

    it("should have shadow for floating variant", () => {
      render(<HelpButton variant="floating" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("shadow-lg");
    });

    it("should have z-50 for floating variant", () => {
      render(<HelpButton variant="floating" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("z-50");
    });

    it("should not show Help text for floating variant", () => {
      render(<HelpButton variant="floating" />);

      const button = screen.getByRole("button");
      expect(within(button).queryByText("Help")).not.toBeInTheDocument();
    });
  });

  describe("inline variant", () => {
    it("should render as inline button", () => {
      render(<HelpButton variant="inline" />);

      const button = screen.getByRole("button");
      expect(button).not.toHaveClass("fixed");
    });

    it("should show Help text for inline variant", () => {
      render(<HelpButton variant="inline" />);

      expect(screen.getByText("Help")).toBeInTheDocument();
    });

    it("should apply custom className for inline variant", () => {
      render(<HelpButton variant="inline" className="custom-class" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });
  });

  describe("sheet interaction", () => {
    it("should open sheet when clicked", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should show Help & Resources title", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(screen.getByText("Help & Resources")).toBeInTheDocument();
    });

    it("should show description", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(
        screen.getByText("Find answers, learn new features, and get support")
      ).toBeInTheDocument();
    });

    it("should close when clicked again", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(screen.getByRole("dialog")).toBeInTheDocument();

      // Click close button in sheet
      const closeButton = screen.getByRole("button", { name: /close/i });
      fireEvent.click(closeButton);

      // Dialog should be closed
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("help links", () => {
    it("should render Documentation link", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(screen.getByText("Documentation")).toBeInTheDocument();
    });

    it("should render Quick Start Guide link", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(screen.getByText("Quick Start Guide")).toBeInTheDocument();
    });

    it("should render Video Tutorials link", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(screen.getByText("Video Tutorials")).toBeInTheDocument();
    });

    it("should render Keyboard Shortcuts link", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    });

    it("should render Contact Support link", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Should appear twice: once in links, once in bottom section
      const supportLinks = screen.getAllByText("Contact Support");
      expect(supportLinks.length).toBeGreaterThanOrEqual(1);
    });

    it("should render Community Forum link", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(screen.getByText("Community Forum")).toBeInTheDocument();
    });
  });

  describe("external links", () => {
    it("should mark external links with target blank", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Community Forum is external
      const forumLink = screen.getByText("Community Forum").closest("a");
      expect(forumLink).toHaveAttribute("target", "_blank");
    });

    it("should have noopener noreferrer for external links", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      const forumLink = screen.getByText("Community Forum").closest("a");
      expect(forumLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("should show external link icon for external links", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Should have external link icons
      expect(
        screen.getAllByTestId("external-link-icon").length
      ).toBeGreaterThan(0);
    });
  });

  describe("link descriptions", () => {
    it("should show Documentation description", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(
        screen.getByText("Complete guides and API reference")
      ).toBeInTheDocument();
    });

    it("should show Quick Start description", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(screen.getByText("Get started in 5 minutes")).toBeInTheDocument();
    });

    it("should show Video Tutorials description", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(
        screen.getByText("Learn by watching step-by-step videos")
      ).toBeInTheDocument();
    });
  });

  describe("support section", () => {
    it("should show Need More Help section", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(screen.getByText("Need More Help?")).toBeInTheDocument();
    });

    it("should show support availability message", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(
        screen.getByText(/Monday-Friday, 9am-5pm EST/i)
      ).toBeInTheDocument();
    });

    it("should show response time message", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(screen.getByText(/under 2 hours/i)).toBeInTheDocument();
    });

    it("should have support email link", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      const mailtoLinks = screen.getAllByRole("link", {
        name: /Contact Support/i,
      });
      const bottomButton = mailtoLinks[mailtoLinks.length - 1];
      expect(bottomButton).toHaveAttribute("href", "mailto:support@kaizen.ai");
    });
  });

  describe("sections", () => {
    it("should show Quick Links section", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(screen.getByText("Quick Links")).toBeInTheDocument();
    });

    it("should have separator between sections", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Check for separator element (hr or div with separator role)
      const dialog = screen.getByRole("dialog");
      const separator = dialog.querySelector('[data-orientation="horizontal"]');
      expect(separator).toBeInTheDocument();
    });
  });

  describe("icons", () => {
    it("should render BookOpen icon for Documentation", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(screen.getByTestId("book-open-icon")).toBeInTheDocument();
    });

    it("should render Lightbulb icon for Quick Start", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(screen.getByTestId("lightbulb-icon")).toBeInTheDocument();
    });

    it("should render Video icon for Tutorials", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(screen.getByTestId("video-icon")).toBeInTheDocument();
    });

    it("should render Keyboard icon for Shortcuts", () => {
      render(<HelpButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(screen.getByTestId("keyboard-icon")).toBeInTheDocument();
    });
  });
});
