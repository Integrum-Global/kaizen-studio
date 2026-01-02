import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Calendar } from "lucide-react";
import { PlanCard } from "./PlanCard";
import { QuotaList } from "./QuotaList";
import { InvoiceList } from "./InvoiceList";
import { UpgradePrompt } from "./UpgradePrompt";
import { useBillingSummary, usePlans, useUpgrade } from "../hooks";
import type { BillingPlan, BillingCycle } from "../types";

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function BillingDashboard() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan | null>(null);

  const { data: summary, isLoading: loadingSummary } = useBillingSummary();
  const { data: plansData, isLoading: loadingPlans } = usePlans();
  const upgrade = useUpgrade();

  const handleSelectPlan = (plan: BillingPlan) => {
    if (plan.isCurrent) return;
    setSelectedPlan(plan);
    setUpgradeOpen(true);
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) return;
    try {
      await upgrade.mutateAsync({
        planId: selectedPlan.id,
        billingCycle,
      });
      setUpgradeOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error("Failed to upgrade:", error);
    }
  };

  if (loadingSummary) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>
                  {summary.currentPlan.description}
                </CardDescription>
              </div>
              <Badge variant="default" className="text-lg px-4 py-1">
                {summary.currentPlan.name}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Payment</p>
                  <p className="font-medium">
                    {formatCurrency(summary.upcomingAmount, summary.currency)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Billing Date</p>
                  <p className="font-medium">
                    {formatDate(summary.nextBillingDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Period Ends</p>
                  <p className="font-medium">
                    {formatDate(summary.currentPeriodEnd)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="usage">
        <TabsList>
          <TabsTrigger value="usage">Usage & Quotas</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="mt-6">
          <QuotaList showDetails />
        </TabsContent>

        <TabsContent value="plans" className="mt-6 space-y-6">
          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Label
              htmlFor="billing-cycle"
              className={
                billingCycle === "monthly"
                  ? "font-medium"
                  : "text-muted-foreground"
              }
            >
              Monthly
            </Label>
            <Switch
              id="billing-cycle"
              checked={billingCycle === "yearly"}
              onCheckedChange={(checked) =>
                setBillingCycle(checked ? "yearly" : "monthly")
              }
            />
            <Label
              htmlFor="billing-cycle"
              className={
                billingCycle === "yearly"
                  ? "font-medium"
                  : "text-muted-foreground"
              }
            >
              Yearly
              <Badge variant="secondary" className="ml-2">
                Save 17%
              </Badge>
            </Label>
          </div>

          {/* Plans Grid */}
          {loadingPlans ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-[400px]" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {plansData?.plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  billingCycle={billingCycle}
                  onSelect={handleSelectPlan}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <InvoiceList />
        </TabsContent>
      </Tabs>

      {/* Upgrade Dialog */}
      <UpgradePrompt
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        suggestedPlan={selectedPlan || undefined}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
}
