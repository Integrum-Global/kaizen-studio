import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  useCreatePolicy,
  useUpdatePolicy,
  useAvailablePermissions,
} from "../hooks";
import { ConditionsSection } from "./conditions";
import type { PolicyCondition, ConditionGroup } from "./conditions/types";
import type {
  Policy,
  CreatePolicyRequest,
  ResourceType,
  ActionType,
  PolicyEffect,
} from "../types";

interface PolicyEditorProps {
  policy?: Policy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const effectOptions: { value: PolicyEffect; label: string }[] = [
  { value: "allow", label: "Allow" },
  { value: "deny", label: "Deny" },
];

const resourceLabels: Record<ResourceType, string> = {
  agent: "Agents",
  pipeline: "Pipelines",
  deployment: "Deployments",
  gateway: "Gateways",
  team: "Teams",
  user: "Users",
  settings: "Settings",
  billing: "Billing",
  audit: "Audit",
};

export function PolicyEditor({
  policy,
  open,
  onOpenChange,
  onSuccess,
}: PolicyEditorProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [effect, setEffect] = useState<PolicyEffect>("deny");
  const [resource, setResource] = useState<ResourceType>("agent");
  const [selectedActions, setSelectedActions] = useState<Set<ActionType>>(
    new Set()
  );
  const [conditionGroup, setConditionGroup] = useState<ConditionGroup>({
    logic: "all",
    conditions: [],
  });
  const [priority, setPriority] = useState(50);

  const { data: availablePermissions } = useAvailablePermissions();
  const createPolicy = useCreatePolicy();
  const updatePolicy = useUpdatePolicy();

  const isEditing = !!policy;
  const isPending = createPolicy.isPending || updatePolicy.isPending;

  const availableActions =
    availablePermissions?.find((p) => p.resource === resource)?.actions || [];

  useEffect(() => {
    if (policy) {
      setName(policy.name);
      setDescription(policy.description || "");
      setEffect(policy.effect);
      setResource(policy.resource);
      setSelectedActions(new Set(policy.actions));
      // Convert old conditions to new format
      const convertedConditions: PolicyCondition[] = policy.conditions.map((c, i) => ({
        id: `cond_${i}_${Date.now()}`,
        category: "user" as const, // Default category
        attribute: c.attribute,
        operator: c.operator,
        value: c.value,
      }));
      setConditionGroup({
        logic: "all",
        conditions: convertedConditions,
      });
      setPriority(policy.priority);
    } else {
      setName("");
      setDescription("");
      setEffect("deny");
      setResource("agent");
      setSelectedActions(new Set());
      setConditionGroup({ logic: "all", conditions: [] });
      setPriority(50);
    }
  }, [policy, open]);

  const toggleAction = (action: ActionType) => {
    setSelectedActions((prev) => {
      const next = new Set(prev);
      if (next.has(action)) {
        next.delete(action);
      } else {
        next.add(action);
      }
      return next;
    });
  };

  const handleConditionGroupChange = useCallback((group: ConditionGroup) => {
    setConditionGroup(group);
  }, []);

  const handleSubmit = async () => {
    // Convert new condition format to API format
    // The API expects simple values (string | string[] | number | boolean)
    const apiConditions = conditionGroup.conditions
      .filter((c) => c.attribute && c.value !== "")
      .map((c) => {
        // Convert complex values to API-compatible format
        let apiValue: string | string[] | number | boolean = "";
        const val = c.value;

        if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
          apiValue = val;
        } else if (Array.isArray(val)) {
          // Handle string[] or number[] - convert to string[]
          apiValue = val.map(String);
        } else if (typeof val === "object" && val !== null) {
          // For ResourceReference or TimeRangeValue, serialize to JSON for now
          // This will be properly handled when the backend supports these types
          apiValue = JSON.stringify(val);
        }

        return {
          attribute: c.attribute,
          operator: c.operator,
          value: apiValue,
        };
      });

    const request: CreatePolicyRequest = {
      name,
      description: description || undefined,
      effect,
      resource,
      actions: Array.from(selectedActions),
      conditions: apiConditions,
      priority,
    };

    try {
      if (isEditing && policy) {
        await updatePolicy.mutateAsync({ id: policy.id, updates: request });
      } else {
        await createPolicy.mutateAsync(request);
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save policy:", error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName("");
      setDescription("");
      setEffect("deny");
      setResource("agent");
      setSelectedActions(new Set());
      setConditionGroup({ logic: "all", conditions: [] });
      setPriority(50);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Policy" : "Create Policy"}
          </DialogTitle>
          <DialogDescription>
            Configure attribute-based access control (ABAC) rules.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Policy Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Production Access Control"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="effect">Effect</Label>
              <Select
                value={effect}
                onValueChange={(v) => setEffect(v as PolicyEffect)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {effectOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this policy controls..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Resource</Label>
              <Select
                value={resource}
                onValueChange={(v) => {
                  setResource(v as ResourceType);
                  setSelectedActions(new Set());
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(resourceLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                min={0}
                max={1000}
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Higher priority policies are evaluated first
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Actions</Label>
            <div className="flex flex-wrap gap-4 p-4 border rounded-lg">
              {availableActions.map((action) => (
                <div key={action} className="flex items-center gap-2">
                  <Checkbox
                    id={`action-${action}`}
                    checked={selectedActions.has(action)}
                    onCheckedChange={() => toggleAction(action)}
                  />
                  <Label htmlFor={`action-${action}`} className="capitalize">
                    {action}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* New Guided Condition Builder */}
          <ConditionsSection
            initialConditions={conditionGroup.conditions}
            initialLogic={conditionGroup.logic}
            onChange={handleConditionGroupChange}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name || selectedActions.size === 0 || isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Policy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
