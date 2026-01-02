import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowRight } from "lucide-react";
import type { BillingPlan, Quota } from "../types";

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quota?: Quota;
  suggestedPlan?: BillingPlan;
  onUpgrade: () => void;
}

export function UpgradePrompt({
  open,
  onOpenChange,
  quota,
  suggestedPlan,
  onUpgrade,
}: UpgradePromptProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Upgrade Your Plan
          </AlertDialogTitle>
          <AlertDialogDescription>
            {quota
              ? `You've reached ${Math.round(
                  (quota.current / quota.limit) * 100
                )}% of your ${quota.name.toLowerCase()} limit.`
              : "Unlock more features and higher limits by upgrading your plan."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {suggestedPlan && (
          <Card className="border-primary">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-semibold">{suggestedPlan.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {suggestedPlan.description}
                  </p>
                </div>
                <Badge variant="secondary">
                  ${suggestedPlan.monthlyPrice}/mo
                </Badge>
              </div>
              <ul className="text-sm space-y-1">
                {suggestedPlan.features.slice(0, 3).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Maybe Later</AlertDialogCancel>
          <AlertDialogAction onClick={onUpgrade}>
            <Zap className="h-4 w-4 mr-1" />
            Upgrade Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface UpgradeBannerProps {
  message?: string;
  onUpgrade: () => void;
}

export function UpgradeBanner({
  message = "Unlock more features with our premium plans",
  onUpgrade,
}: UpgradeBannerProps) {
  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Upgrade Your Plan</p>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        <Button onClick={onUpgrade}>
          View Plans
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

interface QuotaWarningProps {
  quota: Quota;
  onUpgrade: () => void;
}

export function QuotaWarning({ quota, onUpgrade }: QuotaWarningProps) {
  const percentUsed = quota.limit > 0 ? (quota.current / quota.limit) * 100 : 0;
  const isCritical = percentUsed >= quota.criticalThreshold;
  const isWarning = percentUsed >= quota.warningThreshold;

  if (!isWarning) return null;

  return (
    <div
      className={`border rounded-lg p-3 ${
        isCritical
          ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
          : "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className={`font-medium ${isCritical ? "text-red-700 dark:text-red-300" : "text-yellow-700 dark:text-yellow-300"}`}
          >
            {isCritical ? "Quota Limit Reached" : "Approaching Quota Limit"}
          </p>
          <p className="text-sm text-muted-foreground">
            {quota.name}: {Math.round(percentUsed)}% used
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onUpgrade}>
          Upgrade
        </Button>
      </div>
    </div>
  );
}
