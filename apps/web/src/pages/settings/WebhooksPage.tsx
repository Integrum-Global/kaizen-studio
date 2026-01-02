import { WebhookList } from "@/features/webhooks";
import { ResponsiveContainer } from "@/components/layout";

export function WebhooksPage() {
  return (
    <ResponsiveContainer maxWidth="full" className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Webhooks
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Configure webhooks to receive real-time notifications about events in
          your workspace
        </p>
      </div>

      <WebhookList />
    </ResponsiveContainer>
  );
}
