/**
 * DelegationWizard Component
 *
 * 5-step wizard for delegating trust from one agent to another
 *
 * Steps:
 * 1. Select source agent (delegator)
 * 2. Select target agent (delegatee)
 * 3. Select capabilities to delegate
 * 4. Configure constraints and limits
 * 5. Review and confirm
 */

import { useState, useCallback } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useDelegateTrust } from "../../../hooks";
import type { DelegateTrustRequest, DelegationRecord } from "../../../types";
import { SourceAgentStep } from "./steps/SourceAgentStep";
import { TargetAgentStep } from "./steps/TargetAgentStep";
import { CapabilitySelectionStep } from "./steps/CapabilitySelectionStep";
import { ConstraintsStep } from "./steps/ConstraintsStep";
import { ReviewStep } from "./steps/ReviewStep";
import type { DelegationFormData, DelegatedCapabilityData } from "./schema";

interface DelegationWizardProps {
  onSuccess?: (delegation: DelegationRecord) => void;
  onCancel?: () => void;
  /** Pre-fill source agent ID */
  initialSourceAgentId?: string;
}

interface WizardStep {
  id: number;
  title: string;
  description: string;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    title: "Source Agent",
    description: "Select the agent delegating trust",
  },
  {
    id: 2,
    title: "Target Agent",
    description: "Select the agent receiving trust",
  },
  {
    id: 3,
    title: "Capabilities",
    description: "Choose capabilities to delegate",
  },
  { id: 4, title: "Constraints", description: "Set limits and restrictions" },
  { id: 5, title: "Review", description: "Confirm and create delegation" },
];

const initialFormData: DelegationFormData = {
  sourceAgentId: "",
  targetAgentId: "",
  capabilities: [],
  globalConstraints: [],
  maxDelegationDepth: 1,
  allowFurtherDelegation: false,
  expiresAt: null,
  justification: "",
  metadata: {},
};

export function DelegationWizard({
  onSuccess,
  onCancel,
  initialSourceAgentId,
}: DelegationWizardProps) {
  const { toast } = useToast();
  const { mutate: delegateTrust, isPending } = useDelegateTrust();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<DelegationFormData>(() => ({
    ...initialFormData,
    sourceAgentId: initialSourceAgentId || "",
  }));
  const [stepErrors, setStepErrors] = useState<Record<number, string>>({});

  const progress = (currentStep / WIZARD_STEPS.length) * 100;

  const updateFormData = useCallback(
    <K extends keyof DelegationFormData>(
      key: K,
      value: DelegationFormData[K]
    ) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      // Clear any existing error for this step
      setStepErrors((prev) => {
        const updated = { ...prev };
        delete updated[currentStep];
        return updated;
      });
    },
    [currentStep]
  );

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.sourceAgentId) {
          setStepErrors({ ...stepErrors, 1: "Please select a source agent" });
          return false;
        }
        break;
      case 2:
        if (!formData.targetAgentId) {
          setStepErrors({ ...stepErrors, 2: "Please select a target agent" });
          return false;
        }
        if (formData.targetAgentId === formData.sourceAgentId) {
          setStepErrors({
            ...stepErrors,
            2: "Target agent must be different from source agent",
          });
          return false;
        }
        break;
      case 3:
        if (formData.capabilities.length === 0) {
          setStepErrors({
            ...stepErrors,
            3: "Please select at least one capability",
          });
          return false;
        }
        break;
      case 4:
        // Constraints are optional
        break;
      case 5:
        // Review step - all required fields should already be validated
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleStepClick = (stepId: number) => {
    // Only allow navigating to completed or current steps
    if (stepId <= currentStep) {
      setCurrentStep(stepId);
    }
  };

  const handleSubmit = () => {
    if (!validateCurrentStep()) return;

    // Build the delegation request
    // Convert capabilities to string format expected by the API
    const capabilityStrings = formData.capabilities.map(
      (cap: DelegatedCapabilityData) => cap.capability
    );

    const request: DelegateTrustRequest = {
      delegator_id: formData.sourceAgentId,
      delegatee_id: formData.targetAgentId,
      task_id: crypto.randomUUID(), // Generate a unique task ID
      capabilities: capabilityStrings,
      additional_constraints: formData.globalConstraints,
      expires_at: formData.expiresAt || undefined,
      metadata: {
        ...(formData.metadata || {}),
        justification: formData.justification || "",
        allow_further_delegation: String(formData.allowFurtherDelegation),
        max_delegation_depth: String(formData.maxDelegationDepth),
      },
    };

    delegateTrust(request, {
      onSuccess: (delegation: DelegationRecord) => {
        toast({
          title: "Delegation Created",
          description: `Successfully delegated capabilities to ${formData.targetAgentId}`,
        });
        onSuccess?.(delegation);
      },
      onError: (error: Error) => {
        toast({
          title: "Delegation Failed",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <SourceAgentStep
            value={formData.sourceAgentId}
            onChange={(value) => updateFormData("sourceAgentId", value)}
            error={stepErrors[1]}
          />
        );
      case 2:
        return (
          <TargetAgentStep
            value={formData.targetAgentId}
            onChange={(value) => updateFormData("targetAgentId", value)}
            sourceAgentId={formData.sourceAgentId}
            error={stepErrors[2]}
          />
        );
      case 3:
        return (
          <CapabilitySelectionStep
            sourceAgentId={formData.sourceAgentId}
            selectedCapabilities={formData.capabilities}
            onChange={(value) => updateFormData("capabilities", value)}
            error={stepErrors[3]}
          />
        );
      case 4:
        return (
          <ConstraintsStep
            constraints={formData.globalConstraints}
            maxDepth={formData.maxDelegationDepth}
            allowFurtherDelegation={formData.allowFurtherDelegation}
            onConstraintsChange={(value) =>
              updateFormData("globalConstraints", value)
            }
            onMaxDepthChange={(value) =>
              updateFormData("maxDelegationDepth", value)
            }
            onAllowFurtherDelegationChange={(value) =>
              updateFormData("allowFurtherDelegation", value)
            }
          />
        );
      case 5:
        return (
          <ReviewStep
            formData={formData}
            expiresAt={formData.expiresAt}
            justification={formData.justification || ""}
            onExpiresAtChange={(value) => updateFormData("expiresAt", value)}
            onJustificationChange={(value) =>
              updateFormData("justification", value)
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Delegate Trust</CardTitle>
        <Progress value={progress} className="mt-2" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step indicators */}
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => (
              <li
                key={step.id}
                className={cn(
                  "flex items-center",
                  index !== WIZARD_STEPS.length - 1 && "flex-1"
                )}
              >
                <button
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  disabled={step.id > currentStep}
                  className={cn(
                    "flex flex-col items-center",
                    step.id <= currentStep
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-50"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2",
                      step.id < currentStep
                        ? "border-green-600 bg-green-600 text-white"
                        : step.id === currentStep
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300 bg-white text-gray-500"
                    )}
                  >
                    {step.id < currentStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </span>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium",
                      step.id === currentStep
                        ? "text-blue-600"
                        : step.id < currentStep
                          ? "text-green-600"
                          : "text-gray-500"
                    )}
                  >
                    {step.title}
                  </span>
                </button>
                {index !== WIZARD_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 mx-4 h-0.5",
                      step.id < currentStep ? "bg-green-600" : "bg-gray-200"
                    )}
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Current step description */}
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">
            {WIZARD_STEPS[currentStep - 1]?.description}
          </p>
        </div>

        {/* Step content */}
        <div className="min-h-[300px] py-4">{renderStepContent()}</div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t">
          <div>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            {currentStep < WIZARD_STEPS.length ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Delegation
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
