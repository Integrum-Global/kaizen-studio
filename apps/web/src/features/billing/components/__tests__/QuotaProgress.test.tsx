import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuotaProgress } from "../QuotaProgress";
import type { Quota } from "../../types";

const mockQuota: Quota = {
  id: "quota-1",
  name: "API Calls",
  description: "Monthly API call limit",
  current: 7500,
  limit: 10000,
  unit: "calls",
  resetDate: "2024-02-01T00:00:00Z",
  warningThreshold: 80,
  criticalThreshold: 95,
};

describe("QuotaProgress", () => {
  it("renders quota name and percentage", () => {
    render(<QuotaProgress quota={mockQuota} />);

    expect(screen.getByText("API Calls")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<QuotaProgress quota={mockQuota} />);

    expect(screen.getByText("Monthly API call limit")).toBeInTheDocument();
  });

  it("formats large numbers", () => {
    render(<QuotaProgress quota={mockQuota} />);

    expect(screen.getByText("7.5K calls used")).toBeInTheDocument();
    expect(screen.getByText("10.0K calls limit")).toBeInTheDocument();
  });

  it("shows reset date when showDetails is true", () => {
    render(<QuotaProgress quota={mockQuota} showDetails />);

    expect(screen.getByText(/Resets on/)).toBeInTheDocument();
  });

  it("renders compact version", () => {
    render(<QuotaProgress quota={mockQuota} compact />);

    expect(screen.getByText("API Calls")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    // Should not show description in compact mode
    expect(
      screen.queryByText("Monthly API call limit")
    ).not.toBeInTheDocument();
  });

  it("shows warning styling at warning threshold", () => {
    const warningQuota: Quota = {
      ...mockQuota,
      current: 8500,
      limit: 10000,
    };

    render(<QuotaProgress quota={warningQuota} />);

    // 85% usage should trigger warning color
    expect(screen.getByText("85%")).toBeInTheDocument();
  });

  it("shows critical styling at critical threshold", () => {
    const criticalQuota: Quota = {
      ...mockQuota,
      current: 9600,
      limit: 10000,
    };

    render(<QuotaProgress quota={criticalQuota} />);

    // 96% usage should trigger critical color
    expect(screen.getByText("96%")).toBeInTheDocument();
  });

  it("handles unlimited quotas", () => {
    const unlimitedQuota: Quota = {
      ...mockQuota,
      limit: 0,
    };

    render(<QuotaProgress quota={unlimitedQuota} />);

    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});
