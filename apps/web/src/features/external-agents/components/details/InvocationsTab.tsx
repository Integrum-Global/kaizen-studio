import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useExternalAgentInvocations } from "../../hooks";
import { formatDistanceToNow } from "date-fns";
import type { ExternalAgentInvocation, InvocationStatus } from "../../types";

interface InvocationsTabProps {
  agentId: string;
}

export function InvocationsTab({ agentId }: InvocationsTabProps) {
  const { data: invocations, isPending, error } =
    useExternalAgentInvocations(agentId);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isPending) {
    return <InvocationsTableSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load invocations</p>
      </div>
    );
  }

  if (!invocations || invocations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-2">
        <p className="text-muted-foreground text-lg">No invocations yet</p>
        <p className="text-sm text-muted-foreground">
          Invocations will appear here after the agent is invoked
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Execution Time</TableHead>
              <TableHead>Response Code</TableHead>
              <TableHead>Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invocations.map((invocation) => (
              <Collapsible
                key={invocation.id}
                open={expandedRows.has(invocation.id)}
                onOpenChange={() => toggleRow(invocation.id)}
                asChild
              >
                <>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleRow(invocation.id)}
                  >
                    <TableCell>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          aria-label={
                            expandedRows.has(invocation.id)
                              ? "Collapse row"
                              : "Expand row"
                          }
                        >
                          {expandedRows.has(invocation.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {formatDistanceToNow(
                            new Date(invocation.created_at),
                            {
                              addSuffix: true,
                            }
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(invocation.created_at).toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <InvocationStatusBadge status={invocation.status} />
                    </TableCell>
                    <TableCell>
                      {invocation.execution_time_ms ? (
                        <span className="text-sm">
                          {invocation.execution_time_ms}ms
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {invocation.response_code ? (
                        <Badge
                          variant={
                            invocation.response_code >= 200 &&
                            invocation.response_code < 300
                              ? "default"
                              : "destructive"
                          }
                        >
                          {invocation.response_code}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {invocation.cost ? (
                        <span className="text-sm">
                          ${invocation.cost.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          -
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                  <CollapsibleContent asChild>
                    <tr>
                      <td colSpan={6} className="p-0">
                        <InvocationDetails invocation={invocation} />
                      </td>
                    </tr>
                  </CollapsibleContent>
                </>
              </Collapsible>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function InvocationStatusBadge({ status }: { status: InvocationStatus }) {
  const variants = {
    pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    success:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <Badge variant="outline" className={variants[status]}>
      {status}
    </Badge>
  );
}

function InvocationDetails({
  invocation,
}: {
  invocation: ExternalAgentInvocation;
}) {
  return (
    <div className="bg-muted/50 p-4 space-y-4">
      {invocation.error_message && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-destructive">Error</h4>
          <p className="text-sm bg-destructive/10 p-3 rounded border border-destructive/20">
            {invocation.error_message}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Request Payload</h4>
          <pre className="text-xs bg-background p-3 rounded border overflow-x-auto max-h-64 overflow-y-auto">
            {JSON.stringify(invocation.request_payload, null, 2)}
          </pre>
        </div>

        {invocation.response_payload && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Response Payload</h4>
            <pre className="text-xs bg-background p-3 rounded border overflow-x-auto max-h-64 overflow-y-auto">
              {JSON.stringify(invocation.response_payload, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {invocation.workflow_id && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Associated Workflow</h4>
          <p className="text-sm text-muted-foreground">
            Workflow ID: {invocation.workflow_id}
          </p>
        </div>
      )}
    </div>
  );
}

function InvocationsTableSkeleton() {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Execution Time</TableHead>
            <TableHead>Response Code</TableHead>
            <TableHead>Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-6 w-6" />
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-12" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-12" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-12" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
