/**
 * ConfigStep Component
 *
 * Step 4 of the WorkUnitCreateWizard.
 * Configure workspace assignment and tags.
 */

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
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
import type { WorkspaceRef } from '../../types';
import type { StepProps } from './types';

export interface ConfigStepProps extends StepProps {
  /**
   * Available workspaces for assignment
   */
  workspaces?: WorkspaceRef[];
}

/**
 * Configuration step for the create wizard.
 * Allows workspace assignment and tag management.
 */
export function ConfigStep({ formData, onChange, errors, workspaces = [] }: ConfigStepProps) {
  const [tagInput, setTagInput] = useState('');

  const handleWorkspaceChange = (value: string) => {
    onChange({ workspaceId: value === 'none' ? undefined : value });
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      onChange({ tags: [...formData.tags, tag] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange({ tags: formData.tags.filter((t) => t !== tagToRemove) });
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Mock workspaces for now if none provided
  const availableWorkspaces: WorkspaceRef[] = workspaces.length > 0 ? workspaces : [
    { id: 'ws-1', name: 'Finance', color: 'blue' },
    { id: 'ws-2', name: 'Operations', color: 'green' },
    { id: 'ws-3', name: 'Customer Service', color: 'purple' },
    { id: 'ws-4', name: 'Engineering', color: 'orange' },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Organize your work unit by assigning it to a workspace and adding tags.
        </p>
      </div>

      {/* Workspace Selection */}
      <div className="space-y-3">
        <Label htmlFor="workspace-select">Workspace</Label>
        <Select
          value={formData.workspaceId || 'none'}
          onValueChange={handleWorkspaceChange}
        >
          <SelectTrigger id="workspace-select" data-testid="wizard-workspace-select">
            <SelectValue placeholder="Select a workspace" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No workspace</SelectItem>
            {availableWorkspaces.map((workspace) => (
              <SelectItem key={workspace.id} value={workspace.id}>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      workspace.color === 'blue' && 'bg-blue-500',
                      workspace.color === 'green' && 'bg-green-500',
                      workspace.color === 'purple' && 'bg-purple-500',
                      workspace.color === 'orange' && 'bg-orange-500',
                      !workspace.color && 'bg-gray-500'
                    )}
                  />
                  {workspace.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Workspaces help organize work units by team or department.
        </p>
        {errors?.workspaceId && (
          <p className="text-sm text-destructive" role="alert">
            {errors.workspaceId}
          </p>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <Label htmlFor="tag-input">Tags</Label>
        <div className="flex gap-2">
          <Input
            id="tag-input"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder="Add a tag..."
            className="flex-1"
            data-testid="wizard-tag-input"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddTag}
            disabled={!tagInput.trim()}
            data-testid="add-tag-btn"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="pl-2 pr-1 py-1 gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          Tags help with filtering and searching work units. Press Enter to add a tag.
        </p>
        {errors?.tags && (
          <p className="text-sm text-destructive" role="alert">
            {errors.tags}
          </p>
        )}
      </div>

      {/* Summary Preview */}
      <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Configuration Summary</h4>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Workspace:</span>
            <span className="font-medium">
              {formData.workspaceId
                ? availableWorkspaces.find((w) => w.id === formData.workspaceId)?.name || 'Unknown'
                : 'Not assigned'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tags:</span>
            <span className="font-medium">
              {formData.tags.length > 0 ? formData.tags.join(', ') : 'None'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfigStep;
