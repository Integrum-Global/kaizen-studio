import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "@/test/utils";
import { ServiceStatus, ServiceStatusCompact } from "../ServiceStatus";
import type { ServiceHealth } from "../../types";

const mockService: ServiceHealth = {
  id: "1",
  name: "Test Service",
  description: "A test service",
  status: "healthy",
  latency: 45,
  uptime: 99.9,
  lastCheck: new Date().toISOString(),
  endpoint: "https://api.test.com",
};

describe("ServiceStatus", () => {
  describe("rendering", () => {
    it("should render service name and description", () => {
      render(<ServiceStatus service={mockService} />);

      expect(screen.getByText("Test Service")).toBeInTheDocument();
      expect(screen.getByText("A test service")).toBeInTheDocument();
    });

    it("should render health indicator", () => {
      const { container } = render(<ServiceStatus service={mockService} />);

      const indicator = container.querySelector(".bg-green-500\\/10");
      expect(indicator).toBeInTheDocument();
    });

    it("should render latency", () => {
      render(<ServiceStatus service={mockService} />);

      expect(screen.getByText("45ms")).toBeInTheDocument();
    });

    it("should render uptime percentage", () => {
      render(<ServiceStatus service={mockService} />);

      expect(screen.getByText("99.9%")).toBeInTheDocument();
    });

    it("should render endpoint when provided", () => {
      render(<ServiceStatus service={mockService} />);

      expect(screen.getByText("https://api.test.com")).toBeInTheDocument();
    });

    it("should not render endpoint section when not provided", () => {
      const serviceWithoutEndpoint = { ...mockService, endpoint: undefined };
      render(<ServiceStatus service={serviceWithoutEndpoint} />);

      expect(screen.queryByText(/https:\/\//)).not.toBeInTheDocument();
    });

    it("should render external link icon when endpoint is provided", () => {
      const { container } = render(<ServiceStatus service={mockService} />);

      const externalLinkIcon = container.querySelector("svg");
      expect(externalLinkIcon).toBeInTheDocument();
    });
  });

  describe("status variants", () => {
    it("should render degraded status correctly", () => {
      const degradedService = { ...mockService, status: "degraded" as const };
      const { container } = render(<ServiceStatus service={degradedService} />);

      const indicator = container.querySelector(".bg-yellow-500\\/10");
      expect(indicator).toBeInTheDocument();
    });

    it("should render down status correctly", () => {
      const downService = {
        ...mockService,
        status: "down" as const,
        latency: 0,
      };
      render(<ServiceStatus service={downService} />);

      expect(screen.getByText("N/A")).toBeInTheDocument();
    });

    it("should show N/A for latency when service is down", () => {
      const downService = { ...mockService, status: "down" as const };
      render(<ServiceStatus service={downService} />);

      expect(screen.getByText("N/A")).toBeInTheDocument();
      expect(screen.queryByText(/ms$/)).not.toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should call onClick when card is clicked", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<ServiceStatus service={mockService} onClick={handleClick} />);

      const card = screen
        .getByText("Test Service")
        .closest('div[class*="cursor-pointer"]');
      if (card) {
        await user.click(card);
        expect(handleClick).toHaveBeenCalledTimes(1);
      }
    });

    it("should not call onClick when not provided", async () => {
      const user = userEvent.setup();

      render(<ServiceStatus service={mockService} />);

      const card = screen.getByText("Test Service").closest("div");
      if (card) {
        await user.click(card);
        // Should not throw error
      }
    });
  });

  describe("time formatting", () => {
    it("should format lastCheck time as relative time", () => {
      const recentTime = new Date(Date.now() - 5000).toISOString(); // 5 seconds ago
      const recentService = { ...mockService, lastCheck: recentTime };

      render(<ServiceStatus service={recentService} />);

      expect(screen.getByText(/ago/)).toBeInTheDocument();
    });
  });
});

describe("ServiceStatusCompact", () => {
  describe("rendering", () => {
    it("should render service name", () => {
      render(<ServiceStatusCompact service={mockService} />);

      expect(screen.getByText("Test Service")).toBeInTheDocument();
    });

    it("should render description", () => {
      render(<ServiceStatusCompact service={mockService} />);

      expect(screen.getByText("A test service")).toBeInTheDocument();
    });

    it("should render latency and uptime", () => {
      render(<ServiceStatusCompact service={mockService} />);

      expect(screen.getByText("45ms")).toBeInTheDocument();
      expect(screen.getByText("99.9%")).toBeInTheDocument();
    });

    it("should render health indicator", () => {
      const { container } = render(
        <ServiceStatusCompact service={mockService} />
      );

      const indicator = container.querySelector(".bg-green-500\\/10");
      expect(indicator).toBeInTheDocument();
    });

    it("should use small size indicator", () => {
      const { container } = render(
        <ServiceStatusCompact service={mockService} />
      );

      const indicator = container.querySelector(".px-2");
      expect(indicator).toBeInTheDocument();
    });
  });

  describe("truncation", () => {
    it("should truncate long service names", () => {
      const longNameService = {
        ...mockService,
        name: "Very Long Service Name That Should Be Truncated",
      };
      render(<ServiceStatusCompact service={longNameService} />);

      const nameElement = screen.getByText(longNameService.name);
      expect(nameElement).toHaveClass("truncate");
    });

    it("should truncate long descriptions", () => {
      const longDescService = {
        ...mockService,
        description:
          "A very long description that should be truncated when displayed",
      };
      render(<ServiceStatusCompact service={longDescService} />);

      const descElement = screen.getByText(longDescService.description);
      expect(descElement).toHaveClass("truncate");
    });
  });
});
