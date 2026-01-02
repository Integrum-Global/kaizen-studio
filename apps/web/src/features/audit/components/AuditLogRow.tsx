import { useState } from "react";
import { TableCell, TableRow, Badge, Button } from "@/components/ui";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AuditLog, AuditStatus, AuditAction } from "../types";
import { AuditLogDetail } from "./AuditLogDetail";

interface AuditLogRowProps {
  log: AuditLog;
}

export function AuditLogRow({ log }: AuditLogRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50">
        <TableCell className="w-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell className="font-mono text-xs">
          {new Date(log.timestamp).toLocaleString()}
        </TableCell>
        <TableCell>
          <div>
            <div className="font-medium">{log.actor.name}</div>
            <div className="text-xs text-muted-foreground">
              {log.actor.email}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <ActionBadge action={log.action} />
        </TableCell>
        <TableCell>
          <div>
            <div className="font-medium">{log.resource}</div>
            {log.resourceName && (
              <div className="text-xs text-muted-foreground">
                {log.resourceName}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>
          <StatusBadge status={log.status} />
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/30">
            <AuditLogDetail log={log} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function ActionBadge({ action }: { action: AuditAction }) {
  const variants: Record<
    AuditAction,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    create: "default",
    update: "secondary",
    delete: "destructive",
    login: "outline",
    logout: "outline",
    access: "outline",
    export: "secondary",
    deploy: "default",
    execute: "default",
  };

  return (
    <Badge variant={variants[action]} className="capitalize">
      {action}
    </Badge>
  );
}

function StatusBadge({ status }: { status: AuditStatus }) {
  return (
    <Badge variant={status === "success" ? "default" : "destructive"}>
      {status}
    </Badge>
  );
}
