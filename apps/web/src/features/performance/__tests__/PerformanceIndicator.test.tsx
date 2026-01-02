import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import {
  PerformanceIndicator,
  PerformanceScore,
  PerformancePanel,
} from "../components/PerformanceIndicator";
import type { PerformanceMetric } from "../types";

describe("PerformanceIndicator", () => {
  const createMetric = (
    name: "LCP" | "INP" | "CLS",
    value: number,
    rating: "good" | "needs-improvement" | "poor"
  ): PerformanceMetric => ({
    name,
    value,
    rating,
    delta: 0,
    id: `${name}-123`,
    navigationType: "navigate",
    entries: [],
  });

  describe("rendering", () => {
    it("should render metric name and value", () => {
      const metric = createMetric("LCP", 2500, "good");
      render(<PerformanceIndicator metric={metric} />);

      expect(screen.getByText("LCP")).toBeInTheDocument();
      expect(screen.getByText("2500ms")).toBeInTheDocument();
    });

    it("should render CLS value without ms suffix", () => {
      const metric = createMetric("CLS", 0.1, "good");
      render(<PerformanceIndicator metric={metric} />);

      expect(screen.getByText("0.100")).toBeInTheDocument();
    });

    it("should render description when showDescription is true", () => {
      const metric = createMetric("LCP", 2500, "good");
      render(<PerformanceIndicator metric={metric} showDescription />);

      expect(screen.getByText(/loading performance/i)).toBeInTheDocument();
    });

    it("should not render description when showDescription is false", () => {
      const metric = createMetric("LCP", 2500, "good");
      render(<PerformanceIndicator metric={metric} showDescription={false} />);

      expect(
        screen.queryByText(/loading performance/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("compact mode", () => {
    it("should render in compact mode", () => {
      const metric = createMetric("LCP", 2500, "good");
      const { container } = render(
        <PerformanceIndicator metric={metric} compact />
      );

      // Compact mode should have smaller elements
      expect(container.querySelector(".text-xs")).toBeInTheDocument();
    });

    it("should show metric name in compact mode", () => {
      const metric = createMetric("INP", 150, "good");
      render(<PerformanceIndicator metric={metric} compact />);

      expect(screen.getByText("INP")).toBeInTheDocument();
    });

    it("should have title attribute in compact mode", () => {
      const metric = createMetric("LCP", 2500, "good");
      const { container } = render(
        <PerformanceIndicator metric={metric} compact />
      );

      const element = container.firstChild as HTMLElement;
      expect(element.getAttribute("title")).toContain("LCP");
      expect(element.getAttribute("title")).toContain("2500ms");
    });
  });

  describe("rating colors", () => {
    it("should show green color for good rating", () => {
      const metric = createMetric("LCP", 2000, "good");
      const { container } = render(<PerformanceIndicator metric={metric} />);

      expect(container.querySelector(".bg-green-500")).toBeInTheDocument();
    });

    it("should show amber color for needs-improvement rating", () => {
      const metric = createMetric("LCP", 3000, "needs-improvement");
      const { container } = render(<PerformanceIndicator metric={metric} />);

      expect(container.querySelector(".bg-amber-500")).toBeInTheDocument();
    });

    it("should show red color for poor rating", () => {
      const metric = createMetric("LCP", 5000, "poor");
      const { container } = render(<PerformanceIndicator metric={metric} />);

      expect(container.querySelector(".bg-red-500")).toBeInTheDocument();
    });
  });

  describe("progress bar", () => {
    it("should render progress bar", () => {
      const metric = createMetric("LCP", 2500, "good");
      const { container } = render(<PerformanceIndicator metric={metric} />);

      expect(container.querySelector(".bg-muted")).toBeInTheDocument();
    });

    it("should have full width for good rating", () => {
      const metric = createMetric("LCP", 2000, "good");
      const { container } = render(<PerformanceIndicator metric={metric} />);

      const progressBar = container.querySelector(
        ".bg-green-500"
      ) as HTMLElement;
      expect(progressBar?.style.width).toBe("100%");
    });

    it("should have partial width for needs-improvement rating", () => {
      const metric = createMetric("LCP", 3000, "needs-improvement");
      const { container } = render(<PerformanceIndicator metric={metric} />);

      const progressBar = container.querySelector(
        ".bg-amber-500"
      ) as HTMLElement;
      expect(progressBar?.style.width).toBe("60%");
    });

    it("should have minimal width for poor rating", () => {
      const metric = createMetric("LCP", 5000, "poor");
      const { container } = render(<PerformanceIndicator metric={metric} />);

      const progressBar = container.querySelector(".bg-red-500") as HTMLElement;
      expect(progressBar?.style.width).toBe("30%");
    });
  });

  describe("className prop", () => {
    it("should apply custom className", () => {
      const metric = createMetric("LCP", 2500, "good");
      const { container } = render(
        <PerformanceIndicator metric={metric} className="custom-class" />
      );

      expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });
  });
});

describe("PerformanceScore", () => {
  describe("rendering", () => {
    it("should render score value", () => {
      render(<PerformanceScore score={85} />);

      expect(screen.getByText("85")).toBeInTheDocument();
    });

    it("should have meter role for accessibility", () => {
      render(<PerformanceScore score={85} />);

      expect(screen.getByRole("meter")).toBeInTheDocument();
    });

    it("should have correct aria attributes", () => {
      render(<PerformanceScore score={75} />);

      const meter = screen.getByRole("meter");
      expect(meter).toHaveAttribute("aria-valuenow", "75");
      expect(meter).toHaveAttribute("aria-valuemin", "0");
      expect(meter).toHaveAttribute("aria-valuemax", "100");
    });

    it("should have accessible label", () => {
      render(<PerformanceScore score={90} />);

      const meter = screen.getByRole("meter");
      expect(meter).toHaveAttribute("aria-label", "Performance score: 90");
    });
  });

  describe("size variants", () => {
    it("should render small size", () => {
      const { container } = render(<PerformanceScore score={85} size="sm" />);

      expect(container.querySelector(".h-12")).toBeInTheDocument();
    });

    it("should render medium size by default", () => {
      const { container } = render(<PerformanceScore score={85} />);

      expect(container.querySelector(".h-20")).toBeInTheDocument();
    });

    it("should render large size", () => {
      const { container } = render(<PerformanceScore score={85} size="lg" />);

      expect(container.querySelector(".h-32")).toBeInTheDocument();
    });
  });

  describe("rating colors", () => {
    it("should show green for score >= 90", () => {
      const { container } = render(<PerformanceScore score={90} />);

      expect(container.querySelector(".border-green-500")).toBeInTheDocument();
    });

    it("should show amber for score >= 50 and < 90", () => {
      const { container } = render(<PerformanceScore score={75} />);

      expect(container.querySelector(".border-amber-500")).toBeInTheDocument();
    });

    it("should show red for score < 50", () => {
      const { container } = render(<PerformanceScore score={30} />);

      expect(container.querySelector(".border-red-500")).toBeInTheDocument();
    });

    it("should handle edge case at 90", () => {
      const { container } = render(<PerformanceScore score={90} />);

      expect(container.querySelector(".border-green-500")).toBeInTheDocument();
    });

    it("should handle edge case at 50", () => {
      const { container } = render(<PerformanceScore score={50} />);

      expect(container.querySelector(".border-amber-500")).toBeInTheDocument();
    });
  });

  describe("className prop", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <PerformanceScore score={85} className="custom-class" />
      );

      expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });
  });
});

describe("PerformancePanel", () => {
  const createMetrics = () => ({
    LCP: {
      name: "LCP" as const,
      value: 2500,
      rating: "good" as const,
      delta: 0,
      id: "LCP-123",
      navigationType: "navigate" as const,
      entries: [],
    },
    INP: {
      name: "INP" as const,
      value: 150,
      rating: "good" as const,
      delta: 0,
      id: "INP-123",
      navigationType: "navigate" as const,
      entries: [],
    },
    CLS: {
      name: "CLS" as const,
      value: 0.05,
      rating: "good" as const,
      delta: 0,
      id: "CLS-123",
      navigationType: "navigate" as const,
      entries: [],
    },
  });

  describe("rendering", () => {
    it("should render performance title", () => {
      render(<PerformancePanel metrics={createMetrics()} score={100} />);

      expect(screen.getByText("Performance")).toBeInTheDocument();
    });

    it("should render score", () => {
      render(<PerformancePanel metrics={createMetrics()} score={95} />);

      expect(screen.getByText("95")).toBeInTheDocument();
    });

    it("should render all metrics", () => {
      render(<PerformancePanel metrics={createMetrics()} score={100} />);

      expect(screen.getByText("LCP")).toBeInTheDocument();
      expect(screen.getByText("INP")).toBeInTheDocument();
      expect(screen.getByText("CLS")).toBeInTheDocument();
    });

    it("should show metrics count", () => {
      render(<PerformancePanel metrics={createMetrics()} score={100} />);

      expect(screen.getByText("3 metrics measured")).toBeInTheDocument();
    });
  });

  describe("isCollecting state", () => {
    it("should show collecting message when isCollecting is true", () => {
      render(
        <PerformancePanel metrics={createMetrics()} score={100} isCollecting />
      );

      expect(screen.getByText("Collecting metrics...")).toBeInTheDocument();
    });

    it("should not show collecting message when isCollecting is false", () => {
      render(
        <PerformancePanel
          metrics={createMetrics()}
          score={100}
          isCollecting={false}
        />
      );

      expect(
        screen.queryByText("Collecting metrics...")
      ).not.toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("should handle empty metrics", () => {
      render(<PerformancePanel metrics={{}} score={0} />);

      expect(screen.getByText("Performance")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("should have card styling", () => {
      const { container } = render(
        <PerformancePanel metrics={createMetrics()} score={100} />
      );

      expect(container.querySelector(".rounded-lg")).toBeInTheDocument();
      expect(container.querySelector(".border")).toBeInTheDocument();
      expect(container.querySelector(".bg-card")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <PerformancePanel
          metrics={createMetrics()}
          score={100}
          className="custom-class"
        />
      );

      expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });
  });

  describe("metric ordering", () => {
    it("should render metrics in a consistent order", () => {
      const { container } = render(
        <PerformancePanel metrics={createMetrics()} score={100} />
      );

      const metricNames = container.querySelectorAll(".text-sm.font-medium");
      const names = Array.from(metricNames).map((el) => el.textContent);

      // LCP should come before INP, INP before CLS based on metricOrder
      const lcpIndex = names.indexOf("LCP");
      const inpIndex = names.indexOf("INP");
      const clsIndex = names.indexOf("CLS");

      expect(lcpIndex).toBeLessThan(inpIndex);
      expect(inpIndex).toBeLessThan(clsIndex);
    });
  });
});
