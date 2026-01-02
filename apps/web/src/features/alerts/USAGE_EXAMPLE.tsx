/**
 * Example usage of the Alerts Management feature
 *
 * This file demonstrates how to integrate the alerts feature
 * into your application. Copy and adapt as needed.
 */

import { useState } from "react";
import {
  AlertList,
  AlertDialog,
  AlertHistory as AlertHistoryComponent,
  useAlertRules,
  useDeleteAlertRule,
  useToggleAlertRule,
  type AlertRule,
} from "@/features/alerts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Switch,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { Plus, MoreVertical, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Main Alerts Page
 *
 * Features:
 * - Alert list with filtering
 * - Alert rule management
 * - Alert history viewing
 * - Create/edit dialog
 */
export function AlertsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleCreateRule = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEditRule = (rule: AlertRule) => {
    setSelectedRule(rule);
    setIsEditDialogOpen(true);
  };

  const handleViewHistory = (alertId: string) => {
    setSelectedAlertId(alertId);
    setShowHistory(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage system alerts and rules
          </p>
        </div>
      </div>

      {/* Alert Rules Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alert Rules</CardTitle>
              <CardDescription>
                Configure rules to trigger alerts when conditions are met
              </CardDescription>
            </div>
            <Button onClick={handleCreateRule}>
              <Plus className="mr-2 h-4 w-4" />
              Create Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <AlertRulesTable onEdit={handleEditRule} />
        </CardContent>
      </Card>

      {/* Active Alerts Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Active Alerts</h2>
        <AlertList
          onCreateRule={handleCreateRule}
          onViewHistory={handleViewHistory}
        />
      </div>

      {/* Alert History Section */}
      {showHistory && selectedAlertId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Alert History</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(false)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AlertHistoryComponent alertId={selectedAlertId} />
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <AlertDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {/* Edit Dialog */}
      {selectedRule && (
        <AlertDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          rule={selectedRule}
        />
      )}
    </div>
  );
}

/**
 * Alert Rules Table Component
 *
 * Displays all alert rules with actions
 */
interface AlertRulesTableProps {
  onEdit: (rule: AlertRule) => void;
}

function AlertRulesTable({ onEdit }: AlertRulesTableProps) {
  const { data, isPending } = useAlertRules();
  const deleteRule = useDeleteAlertRule();
  const toggleRule = useToggleAlertRule();
  const { toast } = useToast();

  const handleToggle = async (rule: AlertRule) => {
    try {
      await toggleRule.mutateAsync(rule.id);
      toast({
        title: "Success",
        description: `Rule ${rule.enabled ? "disabled" : "enabled"} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle rule",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) {
      return;
    }

    try {
      await deleteRule.mutateAsync(id);
      toast({
        title: "Success",
        description: "Rule deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete rule",
        variant: "destructive",
      });
    }
  };

  if (isPending) {
    return <div className="text-center py-8">Loading rules...</div>;
  }

  if (!data || data.records.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No alert rules configured yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.records.map((rule) => (
        <div
          key={rule.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">{rule.name}</h3>
              <Badge
                variant={
                  rule.severity === "critical"
                    ? "destructive"
                    : rule.severity === "warning"
                      ? "outline"
                      : "secondary"
                }
              >
                {rule.severity}
              </Badge>
              <Badge variant={rule.enabled ? "default" : "outline"}>
                {rule.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            {rule.description && (
              <p className="text-sm text-muted-foreground">
                {rule.description}
              </p>
            )}
            <p className="text-sm">
              <span className="text-muted-foreground">Condition:</span>{" "}
              <code className="bg-muted px-2 py-1 rounded">
                {rule.metric} {rule.operator} {rule.threshold} for{" "}
                {rule.duration}s
              </code>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Switch
              checked={rule.enabled}
              onCheckedChange={() => handleToggle(rule)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(rule)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(rule.id)}
                  className="text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Simplified Alerts Widget
 *
 * A compact version for dashboards
 */
export function AlertsWidget() {
  const { data, isPending } = useAlertRules({ enabled: true });
  const [showAll, setShowAll] = useState(false);

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const activeCount = data?.records.filter((r) => r.enabled).length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Active Alerts</CardTitle>
          <Badge variant="default">{activeCount}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data?.records.slice(0, showAll ? undefined : 3).map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between text-sm p-2 rounded border"
            >
              <span className="font-medium">{rule.name}</span>
              <Badge variant="outline">{rule.severity}</Badge>
            </div>
          ))}
          {data && data.records.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="w-full"
            >
              {showAll ? "Show Less" : `Show ${data.records.length - 3} More`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Alert History Modal
 *
 * Standalone modal for viewing alert history
 */
interface AlertHistoryModalProps {
  alertId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlertHistoryModal({
  alertId,
  open,
  onOpenChange,
}: AlertHistoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Alert History
          </DialogTitle>
        </DialogHeader>
        <AlertHistoryComponent alertId={alertId} />
      </DialogContent>
    </Dialog>
  );
}

// Import Dialog components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
