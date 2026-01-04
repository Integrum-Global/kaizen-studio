/**
 * TrustStep Component
 *
 * Step 5 of the WorkUnitCreateWizard.
 * Configure initial trust setup based on user level.
 */

import { Shield, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserLevel } from '../../types';
import type { StepProps, TrustSetupOption } from './types';

export interface TrustStepProps extends StepProps {
  /**
   * Current user level (determines available options)
   */
  userLevel: UserLevel;

  /**
   * Available users for delegation
   */
  delegatees?: Array<{ id: string; name: string; level: UserLevel }>;
}

/**
 * Trust setup step for the create wizard.
 * Options vary based on user level:
 * - Level 3: Can establish trust directly
 * - Level 2: Can only request delegation
 * - Level 1: Should not access this wizard (enforced elsewhere)
 */
export function TrustStep({
  formData,
  onChange,
  errors,
  userLevel,
  delegatees = [],
}: TrustStepProps) {
  const handleOptionChange = (value: string) => {
    onChange({
      trustSetup: value as TrustSetupOption,
      delegateeId: value !== 'delegate' ? undefined : formData.delegateeId,
    });
  };

  const handleDelegateeChange = (value: string) => {
    onChange({ delegateeId: value });
  };

  // Mock delegatees if none provided
  const availableDelegatees = delegatees.length > 0 ? delegatees : [
    { id: 'user-1', name: 'Alice Johnson', level: 3 as UserLevel },
    { id: 'user-2', name: 'Bob Smith', level: 3 as UserLevel },
    { id: 'user-3', name: 'Carol White', level: 2 as UserLevel },
  ];

  const canEstablishTrust = userLevel >= 3;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Trust Setup</h3>
        <p className="text-sm text-muted-foreground">
          {canEstablishTrust
            ? 'As a Value Chain Owner, you can establish trust directly or delegate to another user.'
            : 'Request trust delegation from a Value Chain Owner to activate this work unit.'}
        </p>
      </div>

      <RadioGroup
        value={formData.trustSetup}
        onValueChange={handleOptionChange}
        className="grid gap-4"
        aria-label="Trust setup option"
      >
        {/* Establish Trust (Level 3 only) */}
        {canEstablishTrust && (
          <Label
            htmlFor="trust-establish"
            className={cn(
              'flex cursor-pointer items-start space-x-4 rounded-lg border p-4 transition-colors',
              'hover:bg-accent/50',
              formData.trustSetup === 'establish' && 'border-primary bg-primary/5'
            )}
          >
            <RadioGroupItem value="establish" id="trust-establish" className="mt-1" />
            <div className="flex flex-1 items-start gap-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-1">
                <div className="font-medium">Establish Trust Now</div>
                <p className="text-sm text-muted-foreground">
                  Immediately establish trust for this work unit. It will be ready to
                  run right after creation.
                </p>
              </div>
            </div>
          </Label>
        )}

        {/* Request Delegation */}
        <Label
          htmlFor="trust-delegate"
          className={cn(
            'flex cursor-pointer items-start space-x-4 rounded-lg border p-4 transition-colors',
            'hover:bg-accent/50',
            formData.trustSetup === 'delegate' && 'border-primary bg-primary/5'
          )}
        >
          <RadioGroupItem value="delegate" id="trust-delegate" className="mt-1" />
          <div className="flex flex-1 items-start gap-4">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="font-medium">
                {canEstablishTrust ? 'Delegate to Another User' : 'Request Delegation'}
              </div>
              <p className="text-sm text-muted-foreground">
                {canEstablishTrust
                  ? 'Delegate trust establishment to another user in your organization.'
                  : 'Request a Value Chain Owner to establish trust for this work unit.'}
              </p>
            </div>
          </div>
        </Label>

        {/* Save as Pending */}
        <Label
          htmlFor="trust-skip"
          className={cn(
            'flex cursor-pointer items-start space-x-4 rounded-lg border p-4 transition-colors',
            'hover:bg-accent/50',
            formData.trustSetup === 'skip' && 'border-primary bg-primary/5'
          )}
        >
          <RadioGroupItem value="skip" id="trust-skip" className="mt-1" />
          <div className="flex flex-1 items-start gap-4">
            <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-2">
              <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="space-y-1">
              <div className="font-medium">Set Up Later</div>
              <p className="text-sm text-muted-foreground">
                Create the work unit with pending trust status. You can set up trust
                later before running it.
              </p>
            </div>
          </div>
        </Label>
      </RadioGroup>

      {/* Delegatee Selection (shown when delegate is selected) */}
      {formData.trustSetup === 'delegate' && (
        <div className="space-y-3 pl-10">
          <Label htmlFor="delegatee-select">
            {canEstablishTrust ? 'Delegate To' : 'Request From'}
          </Label>
          <Select
            value={formData.delegateeId || ''}
            onValueChange={handleDelegateeChange}
          >
            <SelectTrigger id="delegatee-select" data-testid="wizard-delegatee-select">
              <SelectValue placeholder="Select a user..." />
            </SelectTrigger>
            <SelectContent>
              {availableDelegatees.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    <span>{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Level {user.level}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.delegateeId && (
            <p className="text-sm text-destructive" role="alert">
              {errors.delegateeId}
            </p>
          )}
        </div>
      )}

      {errors?.trustSetup && (
        <p className="text-sm text-destructive" role="alert">
          {errors.trustSetup}
        </p>
      )}

      {/* Trust Status Preview */}
      <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">After Creation</h4>
        <div className="flex items-center gap-2">
          {formData.trustSetup === 'establish' ? (
            <>
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Trust will be valid - ready to run</span>
            </>
          ) : formData.trustSetup === 'delegate' ? (
            <>
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-sm">
                {canEstablishTrust
                  ? 'Delegation request will be sent'
                  : 'Trust will be pending delegation approval'}
              </span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-gray-500" />
              <span className="text-sm">Trust will be pending - configure before running</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrustStep;
