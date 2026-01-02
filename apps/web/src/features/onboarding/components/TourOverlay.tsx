import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useOnboarding } from "../hooks/useOnboarding";
import type { OnboardingTour } from "../types/onboarding";

interface TourOverlayProps {
  tour: OnboardingTour;
  onComplete?: () => void;
  onSkip?: () => void;
}

interface HighlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourOverlay({ tour, onComplete, onSkip }: TourOverlayProps) {
  const {
    currentStep,
    currentStepIndex,
    isTourActive,
    hasNextStep,
    hasPreviousStep,
    progress,
    next,
    previous,
    skip,
  } = useOnboarding({ tour });

  const [highlightPosition, setHighlightPosition] =
    useState<HighlightPosition | null>(null);

  // Calculate highlight position based on target element
  const updateHighlightPosition = useCallback(() => {
    if (!currentStep?.target) {
      setHighlightPosition(null);
      return;
    }

    const element = document.querySelector(currentStep.target);
    if (!element) {
      setHighlightPosition(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    setHighlightPosition({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    });
  }, [currentStep?.target]);

  // Update highlight on step change and window resize
  useEffect(() => {
    if (!isTourActive) return;

    updateHighlightPosition();

    const handleResize = () => updateHighlightPosition();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [isTourActive, updateHighlightPosition]);

  // Scroll to highlighted element
  useEffect(() => {
    if (!currentStep?.target) return;

    const element = document.querySelector(currentStep.target);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentStep?.target]);

  const handleNext = () => {
    next();
    if (!hasNextStep) {
      onComplete?.();
    }
  };

  const handleSkip = () => {
    skip();
    onSkip?.();
  };

  // Calculate tooltip position relative to highlight
  const tooltipPosition = useMemo(() => {
    if (!highlightPosition || !currentStep) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const position = currentStep.position || "bottom";
    const padding = 16;

    switch (position) {
      case "top":
        return {
          top: `${highlightPosition.top - padding}px`,
          left: `${highlightPosition.left + highlightPosition.width / 2}px`,
          transform: "translate(-50%, -100%)",
        };
      case "bottom":
        return {
          top: `${highlightPosition.top + highlightPosition.height + padding}px`,
          left: `${highlightPosition.left + highlightPosition.width / 2}px`,
          transform: "translate(-50%, 0)",
        };
      case "left":
        return {
          top: `${highlightPosition.top + highlightPosition.height / 2}px`,
          left: `${highlightPosition.left - padding}px`,
          transform: "translate(-100%, -50%)",
        };
      case "right":
        return {
          top: `${highlightPosition.top + highlightPosition.height / 2}px`,
          left: `${highlightPosition.left + highlightPosition.width + padding}px`,
          transform: "translate(0, -50%)",
        };
      default:
        return {
          top: `${highlightPosition.top + highlightPosition.height + padding}px`,
          left: `${highlightPosition.left + highlightPosition.width / 2}px`,
          transform: "translate(-50%, 0)",
        };
    }
  }, [highlightPosition, currentStep]);

  if (!isTourActive || !currentStep) {
    return null;
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/50 z-[100]" />

      {/* Highlight cutout */}
      {highlightPosition && (
        <div
          className="fixed z-[101] rounded-md ring-4 ring-primary/50 pointer-events-none transition-all duration-300"
          style={{
            top: `${highlightPosition.top - 4}px`,
            left: `${highlightPosition.left - 4}px`,
            width: `${highlightPosition.width + 8}px`,
            height: `${highlightPosition.height + 8}px`,
          }}
        />
      )}

      {/* Tooltip card */}
      <Card
        className="fixed z-[102] w-full max-w-md shadow-xl transition-all duration-300"
        style={tooltipPosition}
      >
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Step {currentStepIndex + 1} of {tour.steps.length}
                </span>
              </div>
              <h3 className="font-semibold text-lg">{currentStep.title}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close tour</span>
            </Button>
          </div>

          {/* Progress bar */}
          <Progress value={progress} className="h-1" />

          {/* Description */}
          <p className="text-sm text-muted-foreground">
            {currentStep.description}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip tour
            </Button>
            <div className="flex items-center gap-2">
              {hasPreviousStep && (
                <Button variant="outline" size="sm" onClick={previous}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {hasNextStep ? (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  "Finish"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
