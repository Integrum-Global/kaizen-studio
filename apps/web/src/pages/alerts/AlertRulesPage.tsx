import { useState } from "react";
import { AlertDialog, useAlertRules, useToggleAlertRule, useDeleteAlertRule } from "@/features/alerts";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Switch, Skeleton } from "@/components/ui";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AlertRulesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { data, isPending } = useAlertRules();
  const toggleRule = useToggleAlertRule();
  const deleteRule = useDeleteAlertRule();
  const { toast } = useToast();

  const handleToggle = async (id: string) => {
    try {
      await toggleRule.mutateAsync(id);
      toast({
        title: "Success",
        description: "Alert rule toggled successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle alert rule",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRule.mutateAsync(id);
      toast({
        title: "Success",
        description: "Alert rule deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete alert rule",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alert Rules</h1>
          <p className="text-muted-foreground">
            Configure alert rules and notification conditions
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.records.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{rule.name}</CardTitle>
                    {rule.description && (
                      <CardDescription>{rule.description}</CardDescription>
                    )}
                  </div>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => handleToggle(rule.id)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Metric: </span>
                    {rule.metric}
                  </div>
                  <div>
                    <span className="font-medium">Threshold: </span>
                    {rule.threshold}
                  </div>
                  <div>
                    <span className="font-medium">Severity: </span>
                    {rule.severity}
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(rule.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
