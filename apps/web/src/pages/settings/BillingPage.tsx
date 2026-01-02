import { BillingDashboard } from "@/features/billing";

export function BillingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription, view usage, and update payment methods
        </p>
      </div>

      {/* Billing Dashboard */}
      <BillingDashboard />
    </div>
  );
}
