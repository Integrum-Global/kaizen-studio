import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Loader2, Minus, Plus } from "lucide-react";
import { useManualScale } from "../hooks";
import type { Gateway } from "../types";

interface ManualScaleControlsProps {
  gateway: Gateway;
  onSuccess?: () => void;
}

export function ManualScaleControls({
  gateway,
  onSuccess,
}: ManualScaleControlsProps) {
  const [replicas, setReplicas] = useState(gateway.replicas);
  const [reason, setReason] = useState("");

  const manualScale = useManualScale();

  const handleScale = async () => {
    if (replicas === gateway.replicas) return;

    try {
      await manualScale.mutateAsync({
        gatewayId: gateway.id,
        replicas,
        reason: reason || undefined,
      });
      setReason("");
      onSuccess?.();
    } catch (error) {
      console.error("Failed to scale:", error);
    }
  };

  const handleIncrement = () => {
    if (replicas < gateway.maxReplicas) {
      setReplicas(replicas + 1);
    }
  };

  const handleDecrement = () => {
    if (replicas > gateway.minReplicas) {
      setReplicas(replicas - 1);
    }
  };

  const hasChanged = replicas !== gateway.replicas;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Scaling</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <Label>Replicas</Label>
            <span className="text-sm text-muted-foreground">
              Current: {gateway.replicas}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              disabled={replicas <= gateway.minReplicas}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <Slider
                value={[replicas]}
                min={gateway.minReplicas}
                max={gateway.maxReplicas}
                step={1}
                onValueChange={([value]) =>
                  value !== undefined && setReplicas(value)
                }
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              disabled={replicas >= gateway.maxReplicas}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              className="w-20"
              min={gateway.minReplicas}
              max={gateway.maxReplicas}
              value={replicas}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= gateway.minReplicas && val <= gateway.maxReplicas) {
                  setReplicas(val);
                }
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Min: {gateway.minReplicas}</span>
            <span>Max: {gateway.maxReplicas}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Reason (optional)</Label>
          <Textarea
            id="reason"
            placeholder="Reason for scaling..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />
        </div>

        <Button
          className="w-full"
          onClick={handleScale}
          disabled={!hasChanged || manualScale.isPending}
        >
          {manualScale.isPending && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          {hasChanged ? `Scale to ${replicas} replicas` : "No changes to apply"}
        </Button>
      </CardContent>
    </Card>
  );
}
