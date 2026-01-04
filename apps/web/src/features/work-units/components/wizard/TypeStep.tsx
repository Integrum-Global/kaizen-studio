/**
 * TypeStep Component
 *
 * Step 1 of the WorkUnitCreateWizard.
 * Allows user to choose between atomic and composite work unit types.
 */

import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { WorkUnitIcon } from '../WorkUnitIcon';
import type { StepProps } from './types';
import type { WorkUnitType } from '../../types';

export interface TypeStepProps extends StepProps {}

/**
 * Type selection step for the create wizard.
 * Provides clear visual distinction between atomic and composite work units.
 */
export function TypeStep({ formData, onChange, errors }: TypeStepProps) {
  const handleTypeChange = (value: string) => {
    onChange({ type: value as WorkUnitType });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">What type of work unit?</h3>
        <p className="text-sm text-muted-foreground">
          Choose the type that best describes what this work unit will do.
        </p>
      </div>

      <RadioGroup
        value={formData.type}
        onValueChange={handleTypeChange}
        className="grid gap-4"
        aria-label="Work unit type"
      >
        {/* Atomic Option */}
        <Label
          htmlFor="type-atomic"
          className={cn(
            'flex cursor-pointer items-start space-x-4 rounded-lg border p-4 transition-colors',
            'hover:bg-accent/50',
            formData.type === 'atomic' && 'border-primary bg-primary/5'
          )}
        >
          <RadioGroupItem value="atomic" id="type-atomic" className="mt-1" />
          <div className="flex flex-1 items-start gap-4">
            <WorkUnitIcon type="atomic" size="lg" className="mt-0.5" />
            <div className="space-y-1">
              <div className="font-medium">Atomic Work Unit</div>
              <p className="text-sm text-muted-foreground">
                A single capability that executes directly. Best for focused tasks like
                data extraction, document analysis, or simple transformations.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs">
                  Data extraction
                </span>
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs">
                  Document analysis
                </span>
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs">
                  Validation
                </span>
              </div>
            </div>
          </div>
        </Label>

        {/* Composite Option */}
        <Label
          htmlFor="type-composite"
          className={cn(
            'flex cursor-pointer items-start space-x-4 rounded-lg border p-4 transition-colors',
            'hover:bg-accent/50',
            formData.type === 'composite' && 'border-primary bg-primary/5'
          )}
        >
          <RadioGroupItem value="composite" id="type-composite" className="mt-1" />
          <div className="flex flex-1 items-start gap-4">
            <WorkUnitIcon type="composite" size="lg" className="mt-0.5" />
            <div className="space-y-1">
              <div className="font-medium">Composite Work Unit</div>
              <p className="text-sm text-muted-foreground">
                Orchestrates multiple work units for complex multi-step tasks.
                Combines atomic and other composite units into workflows.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs">
                  Invoice processing
                </span>
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs">
                  Report generation
                </span>
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs">
                  Approval workflows
                </span>
              </div>
            </div>
          </div>
        </Label>
      </RadioGroup>

      {errors?.type && (
        <p className="text-sm text-destructive" role="alert">
          {errors.type}
        </p>
      )}
    </div>
  );
}

export default TypeStep;
