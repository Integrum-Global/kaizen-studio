import { AuditLogList } from "@/features/audit";
import { ResponsiveContainer } from "@/components/layout";

export function AuditPage() {
  return (
    <ResponsiveContainer maxWidth="full" className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Audit Logs
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Track user actions and system events
        </p>
      </div>

      <AuditLogList />
    </ResponsiveContainer>
  );
}

export default AuditPage;
