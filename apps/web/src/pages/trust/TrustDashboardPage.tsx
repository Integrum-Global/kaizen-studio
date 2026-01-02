import { TrustDashboard } from "@/features/trust";

export function TrustDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Trust Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage agent trust chains and verification status
          </p>
        </div>
      </div>

      {/* Trust Dashboard */}
      <TrustDashboard />
    </div>
  );
}
