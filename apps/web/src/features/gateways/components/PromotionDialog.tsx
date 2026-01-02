import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Loader2 } from "lucide-react";
import { usePromotionTargets, useCreatePromotion } from "../hooks";
import type { Gateway, GatewayEnvironment } from "../types";

interface PromotionDialogProps {
  gateway: Gateway | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const environmentLabels: Record<GatewayEnvironment, string> = {
  development: "Development",
  staging: "Staging",
  production: "Production",
};

export function PromotionDialog({
  gateway,
  open,
  onOpenChange,
  onSuccess,
}: PromotionDialogProps) {
  const [notes, setNotes] = useState("");
  const [selectedTarget, setSelectedTarget] =
    useState<GatewayEnvironment | null>(null);

  const { data: targets, isLoading: loadingTargets } = usePromotionTargets(
    gateway?.environment || "development"
  );
  const createPromotion = useCreatePromotion();

  const handleSubmit = async () => {
    if (!gateway || !selectedTarget) return;

    try {
      await createPromotion.mutateAsync({
        gatewayId: gateway.id,
        targetEnvironment: selectedTarget,
        notes: notes || undefined,
      });
      onOpenChange(false);
      setNotes("");
      setSelectedTarget(null);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create promotion:", error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setNotes("");
      setSelectedTarget(null);
    }
    onOpenChange(newOpen);
  };

  if (!gateway) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Promote Gateway</DialogTitle>
          <DialogDescription>
            Promote {gateway.name} from {environmentLabels[gateway.environment]}{" "}
            to a new environment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="text-base py-1 px-3">
              {environmentLabels[gateway.environment]}
            </Badge>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            {loadingTargets ? (
              <Badge variant="secondary" className="text-base py-1 px-3">
                Loading...
              </Badge>
            ) : targets && targets.length > 0 ? (
              <div className="flex gap-2">
                {targets.map((target) => (
                  <Badge
                    key={target}
                    variant={selectedTarget === target ? "default" : "outline"}
                    className="text-base py-1 px-3 cursor-pointer"
                    onClick={() => setSelectedTarget(target)}
                  >
                    {environmentLabels[target]}
                  </Badge>
                ))}
              </div>
            ) : (
              <Badge variant="secondary" className="text-base py-1 px-3">
                No targets available
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">Current Version</Label>
            <p className="text-sm font-mono bg-muted px-3 py-2 rounded">
              {gateway.version}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this promotion..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedTarget || createPromotion.isPending}
          >
            {createPromotion.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Create Promotion Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
