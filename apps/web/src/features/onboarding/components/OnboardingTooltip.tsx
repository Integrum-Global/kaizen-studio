import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useOnboarding } from "../hooks/useOnboarding";
import type { OnboardingHint } from "../types/onboarding";

interface OnboardingTooltipProps {
  hint: OnboardingHint;
  children: React.ReactNode;
  autoShow?: boolean;
  delay?: number; // milliseconds before showing
}

export function OnboardingTooltip({
  hint,
  children,
  autoShow = true,
  delay = 500,
}: OnboardingTooltipProps): React.ReactElement {
  const { isHintDismissed, dismissHint } = useOnboarding();
  const [isOpen, setIsOpen] = useState(false);

  const isDismissed = isHintDismissed(hint.id);

  useEffect(() => {
    if (autoShow && !isDismissed && hint.showOnce !== false) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, delay);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoShow, isDismissed, hint.showOnce, delay]);

  const handleDismiss = () => {
    setIsOpen(false);
    dismissHint(hint.id);
  };

  if (isDismissed && hint.showOnce !== false) {
    return <>{children}</>;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={hint.position || "bottom"}
        className="w-80"
        sideOffset={8}
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm">{hint.title}</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{hint.description}</p>
          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={handleDismiss}>
              Got it
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
