import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BudgetUsageWidget } from "../components/widgets/BudgetUsageWidget";
import type { GovernanceStatus } from "../types";

describe("BudgetUsageWidget", () => {
  it("renders budget usage data correctly", () => {
    const budgetUsage: GovernanceStatus["budget_usage"] = {
      current_month_cost: 50,
      max_monthly_cost: 100,
      percentage_used: 50,
    };

    render(<BudgetUsageWidget budgetUsage={budgetUsage} />);

    expect(screen.getByText("$50.00")).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.getByText("50.0%")).toBeInTheDocument();
  });

  it("displays warning when budget usage is over 90%", () => {
    const budgetUsage: GovernanceStatus["budget_usage"] = {
      current_month_cost: 95,
      max_monthly_cost: 100,
      percentage_used: 95,
    };

    render(<BudgetUsageWidget budgetUsage={budgetUsage} />);

    expect(screen.getByText(/Over 90% used/i)).toBeInTheDocument();
    expect(screen.getByText(/Budget usage is above 90%/i)).toBeInTheDocument();
  });

  it("displays notice when budget usage is between 80-90%", () => {
    const budgetUsage: GovernanceStatus["budget_usage"] = {
      current_month_cost: 85,
      max_monthly_cost: 100,
      percentage_used: 85,
    };

    render(<BudgetUsageWidget budgetUsage={budgetUsage} />);

    expect(screen.getByText(/Budget usage is above 80%/i)).toBeInTheDocument();
  });

  it("shows green text for healthy budget usage", () => {
    const budgetUsage: GovernanceStatus["budget_usage"] = {
      current_month_cost: 30,
      max_monthly_cost: 100,
      percentage_used: 30,
    };

    render(<BudgetUsageWidget budgetUsage={budgetUsage} />);

    const percentageElement = screen.getByText("30.0%");
    expect(percentageElement).toHaveClass("text-green-600");
  });

  it("shows unlimited when no max budget is set", () => {
    const budgetUsage: GovernanceStatus["budget_usage"] = {
      current_month_cost: 50,
      max_monthly_cost: undefined,
      percentage_used: 0,
    };

    render(<BudgetUsageWidget budgetUsage={budgetUsage} />);

    expect(screen.getByText("Unlimited")).toBeInTheDocument();
  });

  it("displays message when no budget configuration is set", () => {
    render(<BudgetUsageWidget budgetUsage={undefined} />);

    expect(screen.getByText(/No budget configuration set/i)).toBeInTheDocument();
  });
});
