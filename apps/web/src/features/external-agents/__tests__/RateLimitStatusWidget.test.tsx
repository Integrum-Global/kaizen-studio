import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RateLimitStatusWidget } from "../components/widgets/RateLimitStatusWidget";
import type { GovernanceStatus } from "../types";

describe("RateLimitStatusWidget", () => {
  it("renders rate limit data correctly", () => {
    const rateLimits: GovernanceStatus["rate_limits"] = {
      per_minute: { current: 5, limit: 10, remaining: 5 },
      per_hour: { current: 50, limit: 100, remaining: 50 },
      per_day: { current: 500, limit: 1000, remaining: 500 },
    };

    render(<RateLimitStatusWidget rateLimits={rateLimits} />);

    expect(screen.getByText(/5 \/ 10/i)).toBeInTheDocument();
    expect(screen.getByText(/50 \/ 100/i)).toBeInTheDocument();
    expect(screen.getByText(/500 \/ 1000/i)).toBeInTheDocument();
  });

  it("displays warning when rate limit is over 95%", () => {
    const rateLimits: GovernanceStatus["rate_limits"] = {
      per_minute: { current: 96, limit: 100, remaining: 4 },
      per_hour: { current: 50, limit: 100, remaining: 50 },
      per_day: { current: 500, limit: 1000, remaining: 500 },
    };

    render(<RateLimitStatusWidget rateLimits={rateLimits} />);

    expect(screen.getByText(/Rate limit exceeded - invocations may be throttled/i)).toBeInTheDocument();
  });

  it("displays notice when rate limit is between 80-95%", () => {
    const rateLimits: GovernanceStatus["rate_limits"] = {
      per_minute: { current: 85, limit: 100, remaining: 15 },
      per_hour: { current: 50, limit: 100, remaining: 50 },
      per_day: { current: 500, limit: 1000, remaining: 500 },
    };

    render(<RateLimitStatusWidget rateLimits={rateLimits} />);

    expect(screen.getByText(/Approaching rate limit/i)).toBeInTheDocument();
  });

  it("shows unlimited when no limit is set", () => {
    const rateLimits: GovernanceStatus["rate_limits"] = {
      per_minute: { current: 5, limit: undefined, remaining: Infinity },
      per_hour: { current: 50, limit: undefined, remaining: Infinity },
      per_day: { current: 500, limit: undefined, remaining: Infinity },
    };

    render(<RateLimitStatusWidget rateLimits={rateLimits} />);

    const unlimitedElements = screen.getAllByText(/∞/i);
    expect(unlimitedElements).toHaveLength(3);
  });

  it("displays remaining counts correctly", () => {
    const rateLimits: GovernanceStatus["rate_limits"] = {
      per_minute: { current: 5, limit: 10, remaining: 5 },
      per_hour: { current: 50, limit: 100, remaining: 50 },
      per_day: { current: 500, limit: 1000, remaining: 500 },
    };

    render(<RateLimitStatusWidget rateLimits={rateLimits} />);

    expect(screen.getByText(/5 remaining/i)).toBeInTheDocument();
    expect(screen.getByText(/50 remaining/i)).toBeInTheDocument();
    expect(screen.getByText(/500 remaining/i)).toBeInTheDocument();
  });

  it("displays message when no rate limit configuration is set", () => {
    render(<RateLimitStatusWidget rateLimits={undefined} />);

    expect(screen.getByText(/No rate limit configuration set/i)).toBeInTheDocument();
  });
});
