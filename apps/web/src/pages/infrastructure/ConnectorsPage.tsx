import { ConnectorList } from "@/features/connectors";
import { ResponsiveContainer } from "@/components/layout";

export function ConnectorsPage() {
  return (
    <ResponsiveContainer maxWidth="full" className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Connectors
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Configure external service connections for your agents and pipelines
        </p>
      </div>

      <ConnectorList />
    </ResponsiveContainer>
  );
}
