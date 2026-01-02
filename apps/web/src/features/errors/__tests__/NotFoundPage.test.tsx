import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { NotFoundPage } from "../components/NotFoundPage";

describe("NotFoundPage", () => {
  describe("rendering", () => {
    it("should render the page not found message", () => {
      render(<NotFoundPage />);

      expect(screen.getByText("Page not found")).toBeInTheDocument();
    });

    it("should render descriptive text", () => {
      render(<NotFoundPage />);

      expect(
        screen.getByText(
          /the page you are looking for does not exist or has been moved/i
        )
      ).toBeInTheDocument();
    });

    it("should render back to dashboard button", () => {
      render(<NotFoundPage />);

      const button = screen.getByRole("button", {
        name: /back to dashboard/i,
      });
      expect(button).toBeInTheDocument();
    });

    it("should render within a card component", () => {
      const { container } = render(<NotFoundPage />);

      const card = container.querySelector(".rounded-lg.border.bg-card");
      expect(card).toBeInTheDocument();
    });
  });

  describe("visual elements", () => {
    it("should render file question icon", () => {
      const { container } = render(<NotFoundPage />);

      const iconContainer = container.querySelector(".bg-muted");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should have centered layout", () => {
      const { container } = render(<NotFoundPage />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass(
        "flex",
        "items-center",
        "justify-center",
        "min-h-screen"
      );
    });

    it("should have centered text content", () => {
      const { container } = render(<NotFoundPage />);

      const header = container.querySelector(".text-center");
      expect(header).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should have clickable home button", async () => {
      render(<NotFoundPage />);

      const button = screen.getByRole("button", {
        name: /back to dashboard/i,
      });
      expect(button).toBeEnabled();
    });
  });

  describe("accessibility", () => {
    it("should have proper heading structure", () => {
      render(<NotFoundPage />);

      const heading = screen.getByText("Page not found");
      expect(heading.tagName).toBe("H3");
    });

    it("should have accessible button", () => {
      render(<NotFoundPage />);

      const button = screen.getByRole("button", {
        name: /back to dashboard/i,
      });
      expect(button).toHaveAccessibleName();
    });

    it("should support keyboard navigation", async () => {
      render(<NotFoundPage />);

      const button = screen.getByRole("button", {
        name: /back to dashboard/i,
      });
      button.focus();

      expect(button).toHaveFocus();
    });
  });

  describe("responsive design", () => {
    it("should have responsive padding", () => {
      const { container } = render(<NotFoundPage />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("p-4");
    });

    it("should have max-width constraint on card", () => {
      const { container } = render(<NotFoundPage />);

      const card = container.querySelector(".max-w-md");
      expect(card).toBeInTheDocument();
    });
  });

  describe("button styling", () => {
    it("should have home icon in button", () => {
      render(<NotFoundPage />);

      const button = screen.getByRole("button", {
        name: /back to dashboard/i,
      });
      expect(button.querySelector("svg")).toBeInTheDocument();
    });

    it("should have proper button classes", () => {
      render(<NotFoundPage />);

      const button = screen.getByRole("button", {
        name: /back to dashboard/i,
      });
      expect(button).toHaveClass("inline-flex", "items-center");
    });
  });
});
