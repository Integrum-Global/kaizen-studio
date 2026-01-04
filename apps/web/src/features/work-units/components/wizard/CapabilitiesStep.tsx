/**
 * CapabilitiesStep Component
 *
 * Step 3 of the WorkUnitCreateWizard.
 * Define capabilities that the work unit provides.
 */

import { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Capability } from '../../types';
import type { StepProps } from './types';
import { CAPABILITY_PRESETS, CAPABILITY_TYPES } from './types';

export interface CapabilitiesStepProps extends StepProps {}

/**
 * Capabilities selection step for the create wizard.
 * Allows users to select from presets or create custom capabilities.
 */
export function CapabilitiesStep({ formData, onChange, errors }: CapabilitiesStepProps) {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customCapability, setCustomCapability] = useState<Partial<Capability>>({
    name: '',
    description: '',
    type: 'action',
    constraints: [],
  });

  const selectedIds = new Set(formData.capabilities.map((c) => c.id));

  const handlePresetToggle = (preset: (typeof CAPABILITY_PRESETS)[number]) => {
    if (selectedIds.has(preset.id)) {
      // Remove capability
      onChange({
        capabilities: formData.capabilities.filter((c) => c.id !== preset.id),
      });
    } else {
      // Add capability
      onChange({
        capabilities: [...formData.capabilities, preset],
      });
    }
  };

  const handleAddCustom = () => {
    if (!customCapability.name || !customCapability.description) {
      return;
    }

    const newCapability: Capability = {
      id: `custom-${Date.now()}`,
      name: customCapability.name,
      description: customCapability.description,
      type: customCapability.type || 'action',
      constraints: customCapability.constraints || [],
    };

    onChange({
      capabilities: [...formData.capabilities, newCapability],
    });

    // Reset form
    setCustomCapability({
      name: '',
      description: '',
      type: 'action',
      constraints: [],
    });
    setShowCustomForm(false);
  };

  const handleRemoveCapability = (id: string) => {
    onChange({
      capabilities: formData.capabilities.filter((c) => c.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Define Capabilities</h3>
        <p className="text-sm text-muted-foreground">
          Select what this work unit can do. You can choose from common capabilities
          or add custom ones.
        </p>
      </div>

      {/* Preset Capabilities */}
      <div className="space-y-3">
        <Label>Common Capabilities</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {CAPABILITY_PRESETS.map((preset) => {
            const isSelected = selectedIds.has(preset.id);
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetToggle(preset)}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                  'hover:bg-accent/50',
                  isSelected && 'border-primary bg-primary/5'
                )}
                aria-pressed={isSelected}
                data-testid={`capability-preset-${preset.id}`}
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border',
                    isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{preset.name}</div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Capability Form */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Custom Capabilities</Label>
          {!showCustomForm && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCustomForm(true)}
              data-testid="add-custom-capability-btn"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Custom
            </Button>
          )}
        </div>

        {showCustomForm && (
          <div className="rounded-lg border p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="custom-cap-name">Name</Label>
                <Input
                  id="custom-cap-name"
                  value={customCapability.name}
                  onChange={(e) =>
                    setCustomCapability((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Parse PDF"
                  data-testid="custom-capability-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-cap-type">Type</Label>
                <Select
                  value={customCapability.type}
                  onValueChange={(value) =>
                    setCustomCapability((prev) => ({
                      ...prev,
                      type: value as Capability['type'],
                    }))
                  }
                >
                  <SelectTrigger id="custom-cap-type" data-testid="custom-capability-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAPABILITY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-cap-desc">Description</Label>
              <Input
                id="custom-cap-desc"
                value={customCapability.description}
                onChange={(e) =>
                  setCustomCapability((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe what this capability does..."
                data-testid="custom-capability-description"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCustomForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAddCustom}
                disabled={!customCapability.name || !customCapability.description}
                data-testid="save-custom-capability-btn"
              >
                Add Capability
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Capabilities Summary */}
      {formData.capabilities.length > 0 && (
        <div className="space-y-3">
          <Label>Selected Capabilities ({formData.capabilities.length})</Label>
          <div className="flex flex-wrap gap-2">
            {formData.capabilities.map((cap) => (
              <Badge
                key={cap.id}
                variant="secondary"
                className="pl-2 pr-1 py-1 gap-1"
              >
                {cap.name}
                <button
                  type="button"
                  onClick={() => handleRemoveCapability(cap.id)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted"
                  aria-label={`Remove ${cap.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {errors?.capabilities && (
        <p className="text-sm text-destructive" role="alert">
          {errors.capabilities}
        </p>
      )}

      {formData.capabilities.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Select at least one capability for your work unit.
        </p>
      )}
    </div>
  );
}

export default CapabilitiesStep;
