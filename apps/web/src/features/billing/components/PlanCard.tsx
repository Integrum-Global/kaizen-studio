import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import type { BillingPlan, BillingCycle } from "../types";

interface PlanCardProps {
  plan: BillingPlan;
  billingCycle: BillingCycle;
  onSelect?: (plan: BillingPlan) => void;
  isSelected?: boolean;
}

function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return `$${price}`;
}

export function PlanCard({
  plan,
  billingCycle,
  onSelect,
  isSelected,
}: PlanCardProps) {
  const price =
    billingCycle === "yearly" ? plan.yearlyPrice / 12 : plan.monthlyPrice;
  const totalPrice =
    billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

  return (
    <Card
      className={`relative ${
        isSelected ? "border-primary border-2" : ""
      } ${plan.isPopular ? "border-primary" : ""}`}
    >
      {plan.isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          Most Popular
        </Badge>
      )}
      {plan.isCurrent && (
        <Badge variant="secondary" className="absolute -top-3 right-4">
          Current Plan
        </Badge>
      )}

      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-center">
          <span className="text-4xl font-bold">{formatPrice(price)}</span>
          {price > 0 && <span className="text-muted-foreground">/month</span>}
          {billingCycle === "yearly" && price > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              ${totalPrice} billed annually
            </p>
          )}
        </div>

        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className="w-full"
          variant={plan.isCurrent ? "outline" : "default"}
          onClick={() => onSelect?.(plan)}
          disabled={plan.isCurrent}
        >
          {plan.isCurrent ? "Current Plan" : "Select Plan"}
        </Button>
      </CardContent>
    </Card>
  );
}
