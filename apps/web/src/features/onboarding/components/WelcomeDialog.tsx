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
import { useOnboarding } from "../hooks/useOnboarding";
import type { OnboardingTour } from "../types/onboarding";

interface WelcomeDialogProps {
  tour?: OnboardingTour;
  title?: string;
  description?: string;
  showOnFirstVisit?: boolean;
}

export function WelcomeDialog({
  tour,
  title = "Welcome to Kaizen Studio",
  description = "Build, test, and deploy AI agents with ease. Let's get you started!",
  showOnFirstVisit = true,
}: WelcomeDialogProps) {
  const { hasSeenWelcome, markWelcomeSeen, start } = useOnboarding({ tour });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (showOnFirstVisit && !hasSeenWelcome) {
      setIsOpen(true);
    }
  }, [showOnFirstVisit, hasSeenWelcome]);

  const handleStartTour = () => {
    markWelcomeSeen();
    setIsOpen(false);
    if (tour) {
      start();
    }
  };

  const handleSkip = () => {
    markWelcomeSeen();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-base pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">What you can do:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Design AI agents with signature-based programming</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Build multi-agent pipelines with visual canvas</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Test and debug agent interactions in real-time</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Deploy to production environments with one click</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleSkip}>
            Skip for now
          </Button>
          {tour && <Button onClick={handleStartTour}>Take the tour</Button>}
          {!tour && <Button onClick={handleSkip}>Get started</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
