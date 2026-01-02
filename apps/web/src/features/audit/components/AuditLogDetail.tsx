import type { AuditLog } from "../types";

interface AuditLogDetailProps {
  log: AuditLog;
}

export function AuditLogDetail({ log }: AuditLogDetailProps) {
  return (
    <div className="py-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailItem label="Log ID" value={log.id} />
        <DetailItem label="Resource ID" value={log.resourceId} />
        {log.ipAddress && (
          <DetailItem label="IP Address" value={log.ipAddress} />
        )}
        {log.userAgent && (
          <DetailItem label="User Agent" value={log.userAgent} />
        )}
      </div>

      {Object.keys(log.details).length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Details</h4>
          <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
            {JSON.stringify(log.details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="text-sm font-mono mt-1">{value}</div>
    </div>
  );
}
