/**
 * ReviewStep Component
 *
 * Step 5: Review delegation details and set expiration
 */

import {
  CalendarIcon,
  Shield,
  User,
  UserPlus,
  Clock,
  Settings,
} from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { CapabilityType } from "../../../../types";
import type { DelegationFormData } from "../schema";
import { cn } from "@/lib/utils";

interface ReviewStepProps {
  formData: DelegationFormData;
  expiresAt: string | null;
  justification: string;
  onExpiresAtChange: (value: string | null) => void;
  onJustificationChange: (value: string) => void;
}

const capabilityTypeColors: Record<CapabilityType, string> = {
  [CapabilityType.ACCESS]: "bg-blue-500",
  [CapabilityType.ACTION]: "bg-green-500",
  [CapabilityType.DELEGATION]: "bg-purple-500",
};

export function ReviewStep({
  formData,
  expiresAt,
  justification,
  onExpiresAtChange,
  onJustificationChange,
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold">
          Review Delegation Details
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          Confirm all details before creating the delegation.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Source Agent */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Source Agent</Label>
          </div>
          <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
            {formData.sourceAgentId || "Not selected"}
          </code>
        </Card>

        {/* Target Agent */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Target Agent</Label>
          </div>
          <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
            {formData.targetAgentId || "Not selected"}
          </code>
        </Card>
      </div>

      {/* Capabilities */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">
            Capabilities ({formData.capabilities.length})
          </Label>
        </div>
        <div className="space-y-2 max-h-[150px] overflow-y-auto">
          {formData.capabilities.map((cap, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-muted/50 rounded"
            >
              <Badge
                className={`text-white text-xs ${
                  capabilityTypeColors[cap.capability_type]
                }`}
              >
                {cap.capability_type}
              </Badge>
              <code className="text-xs truncate flex-1">{cap.capability}</code>
            </div>
          ))}
        </div>
      </Card>

      {/* Settings Summary */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Settings</Label>
        </div>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Allow Further Delegation
            </span>
            <span>{formData.allowFurtherDelegation ? "Yes" : "No"}</span>
          </div>
          {formData.allowFurtherDelegation && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Max Delegation Depth
              </span>
              <span>{formData.maxDelegationDepth}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Global Constraints</span>
            <span>{formData.globalConstraints.length} constraint(s)</span>
          </div>
        </div>
      </Card>

      <Separator />

      {/* Expiration Date */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Label className="font-medium">Expiration Date (Optional)</Label>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !expiresAt && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {expiresAt ? (
                format(new Date(expiresAt), "PPP")
              ) : (
                <span>No expiration (permanent)</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={expiresAt ? new Date(expiresAt) : undefined}
              onSelect={(date) => {
                onExpiresAtChange(date ? date.toISOString() : null);
              }}
              disabled={(date) => date < new Date()}
              initialFocus
            />
            {expiresAt && (
              <div className="p-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onExpiresAtChange(null)}
                  className="w-full"
                >
                  Remove Expiration
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          Leave empty for a permanent delegation that must be manually revoked.
        </p>
      </div>

      {/* Justification */}
      <div className="space-y-2">
        <Label htmlFor="justification" className="font-medium">
          Justification (Optional)
        </Label>
        <Textarea
          id="justification"
          placeholder="Explain why this delegation is being created..."
          value={justification}
          onChange={(e) => onJustificationChange(e.target.value)}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Provide context for audit and compliance purposes.
        </p>
      </div>
    </div>
  );
}
