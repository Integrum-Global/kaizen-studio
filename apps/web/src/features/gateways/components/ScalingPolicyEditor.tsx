import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCreateScalingPolicy, useUpdateScalingPolicy } from "../hooks";
import type { ScalingPolicy, CreateScalingPolicyRequest } from "../types";

interface ScalingPolicyEditorProps {
  gatewayId: string;
  policy?: ScalingPolicy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const defaultValues: Omit<CreateScalingPolicyRequest, "gatewayId"> = {
  name: "",
  metric: "cpu",
  targetValue: 70,
  scaleUpThreshold: 80,
  scaleDownThreshold: 50,
  cooldownSeconds: 300,
  minReplicas: 1,
  maxReplicas: 10,
};

const metricOptions: { value: ScalingPolicy["metric"]; label: string }[] = [
  { value: "cpu", label: "CPU Usage" },
  { value: "memory", label: "Memory Usage" },
  { value: "requests", label: "Requests per Second" },
  { value: "latency", label: "Response Latency" },
];

export function ScalingPolicyEditor({
  gatewayId,
  policy,
  open,
  onOpenChange,
  onSuccess,
}: ScalingPolicyEditorProps) {
  const [formData, setFormData] =
    useState<Omit<CreateScalingPolicyRequest, "gatewayId">>(defaultValues);

  const createPolicy = useCreateScalingPolicy();
  const updatePolicy = useUpdateScalingPolicy();

  const isEditing = !!policy;
  const isPending = createPolicy.isPending || updatePolicy.isPending;

  useEffect(() => {
    if (policy) {
      setFormData({
        name: policy.name,
        metric: policy.metric,
        targetValue: policy.targetValue,
        scaleUpThreshold: policy.scaleUpThreshold,
        scaleDownThreshold: policy.scaleDownThreshold,
        cooldownSeconds: policy.cooldownSeconds,
        minReplicas: policy.minReplicas,
        maxReplicas: policy.maxReplicas,
      });
    } else {
      setFormData(defaultValues);
    }
  }, [policy, open]);

  const handleSubmit = async () => {
    try {
      if (isEditing && policy) {
        await updatePolicy.mutateAsync({
          id: policy.id,
          updates: formData,
        });
      } else {
        await createPolicy.mutateAsync({
          ...formData,
          gatewayId,
        });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save policy:", error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFormData(defaultValues);
    }
    onOpenChange(newOpen);
  };

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Scaling Policy" : "Create Scaling Policy"}
          </DialogTitle>
          <DialogDescription>
            Configure auto-scaling behavior for this gateway.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Policy Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g., CPU-based Scaling"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metric">Metric</Label>
            <Select
              value={formData.metric}
              onValueChange={(value) =>
                updateField("metric", value as ScalingPolicy["metric"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metricOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetValue">Target</Label>
              <Input
                id="targetValue"
                type="number"
                value={formData.targetValue}
                onChange={(e) =>
                  updateField("targetValue", parseInt(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scaleUpThreshold">Scale Up</Label>
              <Input
                id="scaleUpThreshold"
                type="number"
                value={formData.scaleUpThreshold}
                onChange={(e) =>
                  updateField("scaleUpThreshold", parseInt(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scaleDownThreshold">Scale Down</Label>
              <Input
                id="scaleDownThreshold"
                type="number"
                value={formData.scaleDownThreshold}
                onChange={(e) =>
                  updateField(
                    "scaleDownThreshold",
                    parseInt(e.target.value) || 0
                  )
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cooldownSeconds">Cooldown (seconds)</Label>
            <Input
              id="cooldownSeconds"
              type="number"
              value={formData.cooldownSeconds}
              onChange={(e) =>
                updateField("cooldownSeconds", parseInt(e.target.value) || 0)
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minReplicas">Min Replicas</Label>
              <Input
                id="minReplicas"
                type="number"
                min={1}
                value={formData.minReplicas}
                onChange={(e) =>
                  updateField("minReplicas", parseInt(e.target.value) || 1)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxReplicas">Max Replicas</Label>
              <Input
                id="maxReplicas"
                type="number"
                min={1}
                value={formData.maxReplicas}
                onChange={(e) =>
                  updateField("maxReplicas", parseInt(e.target.value) || 1)
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name || isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Policy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
