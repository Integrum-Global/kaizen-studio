/**
 * WorkUnitCreateWizard Component
 *
 * Multi-step wizard for creating new work units.
 * Guides users through type selection, basic info, capabilities,
 * configuration, and trust setup.
 */

import { useState, useCallback, useMemo } from 'react';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { UserLevel, WorkspaceRef } from '../../types';
import type { CreateWorkUnitFormData, WizardStep } from './types';
import { defaultFormData } from './types';
import { TypeStep } from './TypeStep';
import { InfoStep } from './InfoStep';
import { CapabilitiesStep } from './CapabilitiesStep';
import { ConfigStep } from './ConfigStep';
import { TrustStep } from './TrustStep';

export interface WorkUnitCreateWizardProps {
  /**
   * Whether the wizard is open
   */
  isOpen: boolean;

  /**
   * Close handler
   */
  onClose: () => void;

  /**
   * Submit handler with form data
   */
  onSubmit: (data: CreateWorkUnitFormData) => Promise<void>;

  /**
   * Current user level
   */
  userLevel: UserLevel;

  /**
   * Available workspaces
   */
  workspaces?: WorkspaceRef[];

  /**
   * Available delegatees for trust setup
   */
  delegatees?: Array<{ id: string; name: string; level: UserLevel }>;

  /**
   * Whether submission is in progress
   */
  isSubmitting?: boolean;
}

const STEPS = [
  { id: 'type', title: 'Type', description: 'Choose work unit type' },
  { id: 'info', title: 'Info', description: 'Basic information' },
  { id: 'capabilities', title: 'Capabilities', description: 'Define capabilities' },
  { id: 'config', title: 'Config', description: 'Configuration' },
  { id: 'trust', title: 'Trust', description: 'Trust setup' },
] as const;

type StepId = (typeof STEPS)[number]['id'];

/**
 * Validate form data for a specific step
 */
function validateStep(
  stepId: StepId,
  formData: CreateWorkUnitFormData
): Record<string, string> {
  const errors: Record<string, string> = {};

  switch (stepId) {
    case 'type':
      if (!formData.type) {
        errors.type = 'Please select a work unit type';
      }
      break;

    case 'info':
      if (!formData.name.trim()) {
        errors.name = 'Name is required';
      } else if (formData.name.length < 3) {
        errors.name = 'Name must be at least 3 characters';
      } else if (formData.name.length > 100) {
        errors.name = 'Name must be less than 100 characters';
      }

      if (!formData.description.trim()) {
        errors.description = 'Description is required';
      } else if (formData.description.length < 10) {
        errors.description = 'Description must be at least 10 characters';
      } else if (formData.description.length > 500) {
        errors.description = 'Description must be less than 500 characters';
      }
      break;

    case 'capabilities':
      if (formData.capabilities.length === 0) {
        errors.capabilities = 'Please add at least one capability';
      }
      break;

    case 'config':
      // No required fields in config step
      break;

    case 'trust':
      if (formData.trustSetup === 'delegate' && !formData.delegateeId) {
        errors.delegateeId = 'Please select a user to delegate to';
      }
      break;
  }

  return errors;
}

/**
 * WorkUnitCreateWizard provides a guided, multi-step form for creating work units.
 */
export function WorkUnitCreateWizard({
  isOpen,
  onClose,
  onSubmit,
  userLevel,
  workspaces = [],
  delegatees = [],
  isSubmitting = false,
}: WorkUnitCreateWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CreateWorkUnitFormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));

  const currentStepId = STEPS[currentStep]?.id ?? 'type';
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;

  // Build wizard steps with completion status
  const wizardSteps: WizardStep[] = useMemo(() => {
    return STEPS.map((step, index) => ({
      ...step,
      isCompleted: index < currentStep || (visitedSteps.has(index) && Object.keys(validateStep(step.id, formData)).length === 0),
      isActive: index === currentStep,
    }));
  }, [currentStep, formData, visitedSteps]);

  const handleFormChange = useCallback((updates: Partial<CreateWorkUnitFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    // Clear errors for changed fields
    const updatedFields = Object.keys(updates);
    setErrors((prev) => {
      const newErrors = { ...prev };
      updatedFields.forEach((field) => delete newErrors[field]);
      return newErrors;
    });
  }, []);

  const handleNext = useCallback(() => {
    const stepErrors = validateStep(currentStepId, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    if (!isLastStep) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setVisitedSteps((prev) => new Set([...prev, nextStep]));
    }
  }, [currentStep, currentStepId, formData, isLastStep]);

  const handleBack = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
      setErrors({});
    }
  }, [isFirstStep]);

  const handleSubmit = useCallback(async () => {
    // Validate all steps before submission
    for (const step of STEPS) {
      const stepErrors = validateStep(step.id, formData);
      if (Object.keys(stepErrors).length > 0) {
        // Go to the step with errors
        setCurrentStep(STEPS.findIndex((s) => s.id === step.id));
        setErrors(stepErrors);
        return;
      }
    }

    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData(defaultFormData);
      setCurrentStep(0);
      setVisitedSteps(new Set([0]));
      setErrors({});
    } catch (error) {
      // Error handling is done by the parent
      console.error('Failed to create work unit:', error);
    }
  }, [formData, onSubmit]);

  const handleClose = useCallback(() => {
    // Reset form state when closing
    setFormData(defaultFormData);
    setCurrentStep(0);
    setVisitedSteps(new Set([0]));
    setErrors({});
    onClose();
  }, [onClose]);

  const handleStepClick = useCallback((index: number) => {
    // Only allow clicking on visited steps or steps before current
    if (index < currentStep || visitedSteps.has(index)) {
      setCurrentStep(index);
      setErrors({});
    }
  }, [currentStep, visitedSteps]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Work Unit</DialogTitle>
          <DialogDescription>
            Follow the steps to create a new work unit.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2 py-4">
          {wizardSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={() => handleStepClick(index)}
                disabled={!visitedSteps.has(index) && index > currentStep}
                className={cn(
                  'flex items-center gap-2 transition-colors',
                  step.isActive ? 'text-primary' : 'text-muted-foreground',
                  (visitedSteps.has(index) || index < currentStep) && 'cursor-pointer hover:text-primary',
                  !visitedSteps.has(index) && index > currentStep && 'cursor-not-allowed opacity-50'
                )}
                aria-current={step.isActive ? 'step' : undefined}
                data-testid={`wizard-step-${step.id}`}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                    step.isActive && 'border-primary bg-primary text-primary-foreground',
                    step.isCompleted && !step.isActive && 'border-primary bg-primary/10 text-primary',
                    !step.isActive && !step.isCompleted && 'border-muted-foreground'
                  )}
                >
                  {step.isCompleted && !step.isActive ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium">
                  {step.title}
                </span>
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 w-8 sm:w-12 transition-colors',
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4 px-1" data-testid="wizard-content">
          {currentStepId === 'type' && (
            <TypeStep formData={formData} onChange={handleFormChange} errors={errors} />
          )}
          {currentStepId === 'info' && (
            <InfoStep formData={formData} onChange={handleFormChange} errors={errors} />
          )}
          {currentStepId === 'capabilities' && (
            <CapabilitiesStep formData={formData} onChange={handleFormChange} errors={errors} />
          )}
          {currentStepId === 'config' && (
            <ConfigStep
              formData={formData}
              onChange={handleFormChange}
              errors={errors}
              workspaces={workspaces}
            />
          )}
          {currentStepId === 'trust' && (
            <TrustStep
              formData={formData}
              onChange={handleFormChange}
              errors={errors}
              userLevel={userLevel}
              delegatees={delegatees}
            />
          )}
        </div>

        <Separator />

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <div className="flex gap-2">
            {!isFirstStep && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
                data-testid="wizard-back-btn"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}

            {isLastStep ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                data-testid="wizard-submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Work Unit'
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                data-testid="wizard-next-btn"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WorkUnitCreateWizard;
