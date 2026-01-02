import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useOnboarding } from "../hooks/useOnboarding";
import type { OnboardingChecklist as ChecklistType } from "../types/onboarding";

interface OnboardingChecklistProps {
  checklist: ChecklistType;
  className?: string;
}

export function OnboardingChecklist({
  checklist,
  className,
}: OnboardingChecklistProps) {
  const {
    toggleChecklistItem,
    isChecklistItemCompleted,
    getChecklistProgress,
  } = useOnboarding();

  const progress = useMemo(() => {
    const itemIds = checklist.steps.map((step) => step.id);
    return getChecklistProgress(itemIds);
  }, [checklist.steps, getChecklistProgress]);

  const handleItemClick = (href?: string, action?: () => void) => {
    if (action) {
      action();
    } else if (href) {
      window.location.href = href;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="space-y-2">
          <CardTitle className="text-lg">{checklist.title}</CardTitle>
          {checklist.description && (
            <p className="text-sm text-muted-foreground">
              {checklist.description}
            </p>
          )}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {progress.completed} of {progress.total}
              </span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checklist.steps.map((step) => {
            const isCompleted = isChecklistItemCompleted(step.id);
            const hasAction = Boolean(step.href || step.action);

            return (
              <div key={step.id} className="flex items-start gap-3 group">
                <Checkbox
                  id={step.id}
                  checked={isCompleted}
                  onCheckedChange={() => toggleChecklistItem(step.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <label
                    htmlFor={step.id}
                    className={`text-sm font-medium leading-none cursor-pointer ${
                      isCompleted ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {step.label}
                  </label>
                  {step.description && (
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  )}
                </div>
                {hasAction && !isCompleted && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleItemClick(step.href, step.action)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
