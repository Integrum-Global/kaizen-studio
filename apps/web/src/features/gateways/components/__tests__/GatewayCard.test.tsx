import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GatewayCard } from "../GatewayCard";
import type { Gateway } from "../../types";

const mockGateway: Gateway = {
  id: "gw-1",
  name: "Test Gateway",
  description: "A test gateway",
  environment: "development",
  status: "healthy",
  endpoint: "https://api.test.com",
  version: "1.0.0",
  replicas: 2,
  minReplicas: 1,
  maxReplicas: 5,
  scalingMode: "auto",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("GatewayCard", () => {
  it("renders gateway information", () => {
    render(<GatewayCard gateway={mockGateway} />);

    expect(screen.getByText("Test Gateway")).toBeInTheDocument();
    expect(screen.getByText("https://api.test.com")).toBeInTheDocument();
    expect(screen.getByText("A test gateway")).toBeInTheDocument();
    expect(screen.getByText("1.0.0")).toBeInTheDocument();
    expect(screen.getByText("2 / 5")).toBeInTheDocument();
    expect(screen.getByText("auto")).toBeInTheDocument();
  });

  it("renders environment badge", () => {
    render(<GatewayCard gateway={mockGateway} />);
    expect(screen.getByText("development")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<GatewayCard gateway={mockGateway} />);
    expect(screen.getByText("healthy")).toBeInTheDocument();
  });

  it("calls onViewDetails when details button clicked", () => {
    const onViewDetails = vi.fn();
    render(<GatewayCard gateway={mockGateway} onViewDetails={onViewDetails} />);

    fireEvent.click(screen.getByRole("button", { name: /details/i }));
    expect(onViewDetails).toHaveBeenCalledWith(mockGateway);
  });

  it("calls onPromote when promote button clicked", () => {
    const onPromote = vi.fn();
    render(<GatewayCard gateway={mockGateway} onPromote={onPromote} />);

    fireEvent.click(screen.getByRole("button", { name: /promote/i }));
    expect(onPromote).toHaveBeenCalledWith(mockGateway);
  });

  it("calls onScale when scale button clicked", () => {
    const onScale = vi.fn();
    render(<GatewayCard gateway={mockGateway} onScale={onScale} />);

    fireEvent.click(screen.getByRole("button", { name: /scale/i }));
    expect(onScale).toHaveBeenCalledWith(mockGateway);
  });

  it("hides promote button for production gateways", () => {
    const prodGateway: Gateway = { ...mockGateway, environment: "production" };
    render(<GatewayCard gateway={prodGateway} />);

    expect(
      screen.queryByRole("button", { name: /promote/i })
    ).not.toBeInTheDocument();
  });

  it("renders degraded status with correct styling", () => {
    const degradedGateway: Gateway = { ...mockGateway, status: "degraded" };
    render(<GatewayCard gateway={degradedGateway} />);

    expect(screen.getByText("degraded")).toBeInTheDocument();
  });

  it("renders down status with correct styling", () => {
    const downGateway: Gateway = { ...mockGateway, status: "down" };
    render(<GatewayCard gateway={downGateway} />);

    expect(screen.getByText("down")).toBeInTheDocument();
  });
});
