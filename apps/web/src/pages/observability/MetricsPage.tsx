import { MetricsDashboard } from "@/features/metrics";
import { ResponsiveContainer } from "@/components/layout";

export function MetricsPage() {
  return (
    <ResponsiveContainer maxWidth="full" className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Metrics
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Monitor system performance and usage metrics
        </p>
      </div>

      <MetricsDashboard />
    </ResponsiveContainer>
  );
}

export default MetricsPage;
