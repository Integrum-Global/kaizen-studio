import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { ProviderSelectionStep } from "./wizard/ProviderSelectionStep";
import { BasicInformationStep } from "./wizard/BasicInformationStep";
import { AuthenticationConfigStep } from "./wizard/AuthenticationConfigStep";
import { PlatformConfigStep } from "./wizard/PlatformConfigStep";
import { GovernanceSettingsStep } from "./wizard/GovernanceSettingsStep";
import { ReviewAndSubmitStep } from "./wizard/ReviewAndSubmitStep";
import { useCreateExternalAgent } from "../hooks";
import { useToast } from "@/hooks/use-toast";
import type {
  ExternalAgentProvider,
  AuthConfig,
  PlatformConfig,
  GovernanceConfig,
  CreateExternalAgentRequest,
} from "../types";

interface ExternalAgentRegistrationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface WizardFormData {
  // Step 1: Provider Selection
  provider?: ExternalAgentProvider;

  // Step 2: Basic Information
  name: string;
  description: string;
  tags: string[];

  // Step 3: Authentication Configuration
  authConfig?: AuthConfig;

  // Step 4: Platform Configuration
  platformConfig?: PlatformConfig;

  // Step 5: Governance Settings
  governanceConfig: GovernanceConfig;
}

const INITIAL_FORM_DATA: WizardFormData = {
  name: "",
  description: "",
  tags: [],
  governanceConfig: {},
};

export function ExternalAgentRegistrationWizard({
  open,
  onOpenChange,
}: ExternalAgentRegistrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>(INITIAL_FORM_DATA);
  const createAgent = useCreateExternalAgent();
  const { toast } = useToast();

  const totalSteps = 6;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleJumpToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.provider ||
      !formData.authConfig ||
      !formData.platformConfig
    ) {
      toast({
        title: "Error",
        description: "Please complete all required fields",
        variant: "destructive",
      });
      return;
    }

    const request: CreateExternalAgentRequest = {
      name: formData.name,
      description: formData.description || undefined,
      provider: formData.provider,
      auth_config: formData.authConfig,
      platform_config: formData.platformConfig,
      governance_config: formData.governanceConfig,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
    };

    try {
      await createAgent.mutateAsync(request);
      toast({
        title: "Success",
        description: "External agent registered successfully",
      });
      handleClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.detail || "Failed to register external agent",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData(INITIAL_FORM_DATA);
    onOpenChange(false);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!formData.provider;
      case 2:
        return formData.name.length >= 3;
      case 3:
        return !!formData.authConfig;
      case 4:
        return !!formData.platformConfig;
      case 5:
        return true; // Governance is optional
      case 6:
        return true; // Review step
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        aria-labelledby="wizard-title"
        aria-describedby="wizard-description"
      >
        <DialogHeader>
          <DialogTitle id="wizard-title">
            Register External Agent
          </DialogTitle>
          <DialogDescription id="wizard-description">
            Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Stepper */}
        <div className="mb-6">
          <ProgressStepper currentStep={currentStep} totalSteps={totalSteps} />
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {currentStep === 1 && (
            <ProviderSelectionStep
              formData={formData}
              setFormData={setFormData}
            />
          )}
          {currentStep === 2 && (
            <BasicInformationStep
              formData={formData}
              setFormData={setFormData}
            />
          )}
          {currentStep === 3 && (
            <AuthenticationConfigStep
              formData={formData}
              setFormData={setFormData}
            />
          )}
          {currentStep === 4 && (
            <PlatformConfigStep formData={formData} setFormData={setFormData} />
          )}
          {currentStep === 5 && (
            <GovernanceSettingsStep
              formData={formData}
              setFormData={setFormData}
            />
          )}
          {currentStep === 6 && (
            <ReviewAndSubmitStep
              formData={formData}
              onEditStep={handleJumpToStep}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            aria-label="Go to previous step"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              aria-label="Go to next step"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || createAgent.isPending}
              aria-label="Submit registration"
            >
              {createAgent.isPending ? (
                "Submitting..."
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Submit
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProgressStepper({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center justify-between">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step < currentStep
                  ? "bg-primary text-primary-foreground"
                  : step === currentStep
                    ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                    : "bg-muted text-muted-foreground"
              }`}
              aria-current={step === currentStep ? "step" : undefined}
            >
              {step < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                <span>{step}</span>
              )}
            </div>
            <div className="text-xs mt-2 text-center max-w-[80px] text-muted-foreground">
              {getStepLabel(step)}
            </div>
          </div>
          {step < totalSteps && (
            <div
              className={`h-[2px] flex-1 transition-colors ${
                step < currentStep ? "bg-primary" : "bg-muted"
              }`}
              aria-hidden="true"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function getStepTitle(step: number): string {
  const titles = [
    "Provider Selection",
    "Basic Information",
    "Authentication",
    "Platform Configuration",
    "Governance Settings",
    "Review and Submit",
  ];
  return titles[step - 1] || "";
}

function getStepLabel(step: number): string {
  const labels = [
    "Provider",
    "Info",
    "Auth",
    "Platform",
    "Governance",
    "Review",
  ];
  return labels[step - 1] || "";
}
