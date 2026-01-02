import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PageSkeleton } from "../components/PageSkeleton";

describe("PageSkeleton", () => {
  describe("dashboard variant", () => {
    it("renders dashboard layout", () => {
      render(<PageSkeleton variant="dashboard" />);
      const skeletons = screen.getAllByRole("status");
      // Dashboard has header, stats, and charts
      expect(skeletons.length).toBeGreaterThan(10);
    });

    it("has stats grid", () => {
      const { container } = render(<PageSkeleton variant="dashboard" />);
      const grid = container.querySelector('[class*="grid-cols"]');
      expect(grid).toBeInTheDocument();
    });

    it("disables animation when animate is false", () => {
      render(<PageSkeleton variant="dashboard" animate={false} />);
      const skeletons = screen.getAllByRole("status");
      skeletons.forEach((skeleton) => {
        expect(skeleton).not.toHaveClass("animate-pulse");
      });
    });
  });

  describe("list variant", () => {
    it("renders list layout", () => {
      render(<PageSkeleton variant="list" />);
      const skeletons = screen.getAllByRole("status");
      // List has header, filters, and table
      expect(skeletons.length).toBeGreaterThan(15);
    });

    it("has header with actions", () => {
      const { container } = render(<PageSkeleton variant="list" />);
      const header = container.querySelector('[class*="justify-between"]');
      expect(header).toBeInTheDocument();
    });

    it("has filters section", () => {
      const { container } = render(<PageSkeleton variant="list" />);
      const filters = container.querySelector('[class*="gap-2"]');
      expect(filters).toBeInTheDocument();
    });

    it("includes table skeleton", () => {
      const { container } = render(<PageSkeleton variant="list" />);
      const table = container.querySelector("table");
      expect(table).toBeInTheDocument();
    });
  });

  describe("detail variant", () => {
    it("renders detail layout", () => {
      render(<PageSkeleton variant="detail" />);
      const skeletons = screen.getAllByRole("status");
      // Detail has breadcrumb, header, and content grid
      expect(skeletons.length).toBeGreaterThan(10);
    });

    it("has breadcrumb section", () => {
      const { container } = render(<PageSkeleton variant="detail" />);
      const breadcrumb = container.querySelector('[class*="items-center"]');
      expect(breadcrumb).toBeInTheDocument();
    });

    it("has content grid with two columns", () => {
      const { container } = render(<PageSkeleton variant="detail" />);
      const grid = container.querySelector('[class*="lg:col-span-2"]');
      expect(grid).toBeInTheDocument();
    });
  });

  describe("form variant", () => {
    it("renders form layout", () => {
      render(<PageSkeleton variant="form" />);
      const skeletons = screen.getAllByRole("status");
      // Form has header and form fields
      expect(skeletons.length).toBeGreaterThan(8);
    });

    it("has form header", () => {
      render(<PageSkeleton variant="form" />);
      const skeletons = screen.getAllByRole("status");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("has bordered form card", () => {
      const { container } = render(<PageSkeleton variant="form" />);
      const card = container.querySelector('[class*="border"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe("common functionality", () => {
    it("merges custom className", () => {
      const { container } = render(<PageSkeleton className="custom-page" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("custom-page");
    });

    it("renders full width by default", () => {
      const { container } = render(<PageSkeleton />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("w-full");
    });

    it("enables animation by default", () => {
      render(<PageSkeleton />);
      const skeletons = screen.getAllByRole("status");
      skeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass("animate-pulse");
      });
    });

    it("can disable animation for all variants", () => {
      const variants: Array<"dashboard" | "list" | "detail" | "form"> = [
        "dashboard",
        "list",
        "detail",
        "form",
      ];

      variants.forEach((variant) => {
        const { unmount } = render(
          <PageSkeleton variant={variant} animate={false} />
        );
        const skeletons = screen.getAllByRole("status");
        skeletons.forEach((skeleton) => {
          expect(skeleton).not.toHaveClass("animate-pulse");
        });
        unmount();
      });
    });
  });

  describe("responsive behavior", () => {
    it("has responsive grid classes in dashboard", () => {
      const { container } = render(<PageSkeleton variant="dashboard" />);
      const grid = container.querySelector(
        '[class*="md:grid-cols-2"][class*="lg:grid-cols-4"]'
      );
      expect(grid).toBeInTheDocument();
    });

    it("has responsive grid classes in detail", () => {
      const { container } = render(<PageSkeleton variant="detail" />);
      const grid = container.querySelector('[class*="lg:grid-cols-3"]');
      expect(grid).toBeInTheDocument();
    });
  });
});
