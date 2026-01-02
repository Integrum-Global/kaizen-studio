import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useExternalAgentGovernance } from "../../hooks";
import { BudgetUsageWidget } from "../widgets/BudgetUsageWidget";
import { RateLimitStatusWidget } from "../widgets/RateLimitStatusWidget";
import { formatDistanceToNow } from "date-fns";

interface GovernanceTabProps {
  agentId: string;
}

export function GovernanceTab({ agentId }: GovernanceTabProps) {
  const { data: governance, isPending, error } =
    useExternalAgentGovernance(agentId);

  if (isPending) {
    return <GovernanceTabSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load governance data</p>
      </div>
    );
  }

  if (!governance) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No governance data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Usage */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Budget Usage</h3>
        <BudgetUsageWidget budgetUsage={governance.budget_usage} />
      </div>

      {/* Rate Limits */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Rate Limits</h3>
        <RateLimitStatusWidget rateLimits={governance.rate_limits} />
      </div>

      {/* Policy Evaluations */}
      {governance.policy_evaluations &&
        governance.policy_evaluations.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Recent Policy Evaluations
            </h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy Name</TableHead>
                    <TableHead>Decision</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {governance.policy_evaluations.map((evaluation, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {evaluation.policy_name}
                      </TableCell>
                      <TableCell>
                        <PolicyDecisionBadge decision={evaluation.decision} />
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(evaluation.timestamp), {
                          addSuffix: true,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
    </div>
  );
}

function PolicyDecisionBadge({
  decision,
}: {
  decision: "allow" | "deny";
}) {
  return (
    <Badge
      variant="outline"
      className={
        decision === "allow"
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      }
    >
      {decision}
    </Badge>
  );
}

function GovernanceTabSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
      <div>
        <Skeleton className="h-6 w-24 mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
