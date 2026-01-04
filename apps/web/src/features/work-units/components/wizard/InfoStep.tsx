/**
 * InfoStep Component
 *
 * Step 2 of the WorkUnitCreateWizard.
 * Collects basic information: name and description.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { StepProps } from './types';

export interface InfoStepProps extends StepProps {}

/**
 * Basic info step for the create wizard.
 * Collects name and description with validation feedback.
 */
export function InfoStep({ formData, onChange, errors }: InfoStepProps) {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ name: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ description: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <p className="text-sm text-muted-foreground">
          Give your work unit a clear name and description to help others understand its purpose.
        </p>
      </div>

      <div className="space-y-4">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="work-unit-name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="work-unit-name"
            value={formData.name}
            onChange={handleNameChange}
            placeholder="e.g., Invoice Data Extractor"
            error={!!errors?.name}
            aria-describedby={errors?.name ? 'name-error' : undefined}
            data-testid="wizard-name-input"
          />
          {errors?.name ? (
            <p id="name-error" className="text-sm text-destructive" role="alert">
              {errors.name}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Choose a descriptive name that clearly indicates what this work unit does.
            </p>
          )}
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <Label htmlFor="work-unit-description">
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="work-unit-description"
            value={formData.description}
            onChange={handleDescriptionChange}
            placeholder="Describe what this work unit does, its inputs, and expected outputs..."
            rows={4}
            className={errors?.description ? 'border-destructive focus-visible:ring-destructive' : ''}
            aria-describedby={errors?.description ? 'description-error' : undefined}
            data-testid="wizard-description-input"
          />
          {errors?.description ? (
            <p id="description-error" className="text-sm text-destructive" role="alert">
              {errors.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Explain what this work unit does and how it should be used. Good descriptions
              help team members understand when to use this work unit.
            </p>
          )}
        </div>
      </div>

      {/* Preview */}
      {(formData.name || formData.description) && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Preview</h4>
          <div className="space-y-1">
            <p className="font-medium">{formData.name || 'Untitled Work Unit'}</p>
            {formData.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {formData.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default InfoStep;
