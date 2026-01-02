import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlanCard } from "../PlanCard";
import type { BillingPlan } from "../../types";

const mockPlan: BillingPlan = {
  id: "plan-starter",
  name: "Starter",
  tier: "starter",
  description: "Perfect for small teams",
  monthlyPrice: 29,
  yearlyPrice: 290,
  features: ["Up to 10 agents", "25 pipelines", "Email support"],
  limits: {
    agents: 10,
    pipelines: 25,
    executionsPerMonth: 10000,
    teamMembers: 5,
    apiCallsPerMonth: 100000,
    storageGb: 10,
  },
  isCurrent: false,
};

describe("PlanCard", () => {
  it("renders plan information", () => {
    render(<PlanCard plan={mockPlan} billingCycle="monthly" />);

    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("Perfect for small teams")).toBeInTheDocument();
    expect(screen.getByText("$29")).toBeInTheDocument();
    expect(screen.getByText("Up to 10 agents")).toBeInTheDocument();
    expect(screen.getByText("25 pipelines")).toBeInTheDocument();
    expect(screen.getByText("Email support")).toBeInTheDocument();
  });

  it("shows monthly pricing for monthly cycle", () => {
    render(<PlanCard plan={mockPlan} billingCycle="monthly" />);

    expect(screen.getByText("$29")).toBeInTheDocument();
    expect(screen.getByText("/month")).toBeInTheDocument();
  });

  it("shows yearly pricing for yearly cycle", () => {
    render(<PlanCard plan={mockPlan} billingCycle="yearly" />);

    // Monthly equivalent for yearly plan: 290/12 = 24.166...
    expect(screen.getByText(/\$24/)).toBeInTheDocument();
    expect(screen.getByText(/billed annually/)).toBeInTheDocument();
  });

  it("shows free for free plans", () => {
    const freePlan: BillingPlan = {
      ...mockPlan,
      id: "plan-free",
      name: "Free Tier",
      tier: "free",
      monthlyPrice: 0,
      yearlyPrice: 0,
    };

    render(<PlanCard plan={freePlan} billingCycle="monthly" />);

    // Price displays as "Free" and plan name displays as "Free Tier"
    expect(
      screen.getByRole("heading", { name: "Free Tier" })
    ).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.queryByText("/month")).not.toBeInTheDocument();
  });

  it("shows Current Plan badge when plan is current", () => {
    const currentPlan: BillingPlan = { ...mockPlan, isCurrent: true };
    render(<PlanCard plan={currentPlan} billingCycle="monthly" />);

    // Badge and button both show "Current Plan", use getAllByText
    const currentPlanElements = screen.getAllByText("Current Plan");
    expect(currentPlanElements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows Most Popular badge when plan is popular", () => {
    const popularPlan: BillingPlan = { ...mockPlan, isPopular: true };
    render(<PlanCard plan={popularPlan} billingCycle="monthly" />);

    expect(screen.getByText("Most Popular")).toBeInTheDocument();
  });

  it("calls onSelect when select button clicked", () => {
    const onSelect = vi.fn();
    render(
      <PlanCard plan={mockPlan} billingCycle="monthly" onSelect={onSelect} />
    );

    fireEvent.click(screen.getByRole("button", { name: /select plan/i }));
    expect(onSelect).toHaveBeenCalledWith(mockPlan);
  });

  it("disables button for current plan", () => {
    const currentPlan: BillingPlan = { ...mockPlan, isCurrent: true };
    render(<PlanCard plan={currentPlan} billingCycle="monthly" />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Current Plan");
  });
});
