import { GatewayDashboard } from "@/features/gateways";

export function GatewaysPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gateways</h1>
          <p className="text-muted-foreground mt-1">
            Manage API gateways, deployments, and environment promotions
          </p>
        </div>
      </div>

      {/* Gateway Dashboard */}
      <GatewayDashboard />
    </div>
  );
}
