/**
 * Main conditions section for the policy editor
 * Contains template bar, condition list, logic toggle, and preview
 */

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Users,
  Clock,
  Shield,
  Bot,
  HelpCircle,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConditionRow } from "./ConditionRow";
import { useConditionBuilder } from "./hooks";
import { getCommonTemplates } from "./data/templates";
import type { ConditionGroup, PolicyCondition } from "./types";

interface ConditionsSectionProps {
  initialConditions?: PolicyCondition[];
  initialLogic?: "all" | "any";
  onChange?: (group: ConditionGroup) => void;
  disabled?: boolean;
}

const templateIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Clock,
  Shield,
  Bot,
};

export function ConditionsSection({
  initialConditions = [],
  initialLogic = "all",
  onChange,
  disabled,
}: ConditionsSectionProps) {
  const {
    conditions,
    logic,
    addCondition,
    removeCondition,
    updateConditionCategory,
    updateConditionAttribute,
    updateConditionOperator,
    updateConditionValue,
    setLogic,
    applyTemplate,
    getOverallTranslation,
    validateCondition,
  } = useConditionBuilder({
    initialConditions,
    initialLogic,
    onChange,
  });

  const commonTemplates = getCommonTemplates();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-base font-semibold">Conditions</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Define when this policy applies. Use templates for common
                  patterns or build custom conditions.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Quick Templates */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Quick Templates</Label>
        <div className="flex flex-wrap gap-2">
          {commonTemplates.map((template) => {
            const Icon = templateIcons[template.icon] || Shield;
            return (
              <Button
                key={template.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate(template.id)}
                disabled={disabled}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {template.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Condition List */}
      <div className="space-y-3">
        {conditions.length === 0 ? (
          <Card className="p-6 text-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Info className="h-8 w-8" />
              <p>No conditions defined</p>
              <p className="text-sm">
                This policy will apply to <strong>everyone</strong>.
              </p>
              <p className="text-sm">
                Choose a template above, or click below to add a custom
                condition.
              </p>
            </div>
          </Card>
        ) : (
          conditions.map((condition) => {
            const validation = validateCondition(condition);
            return (
              <ConditionRow
                key={condition.id}
                condition={condition}
                onUpdateCategory={(cat) =>
                  updateConditionCategory(condition.id, cat)
                }
                onUpdateAttribute={(attr) =>
                  updateConditionAttribute(condition.id, attr)
                }
                onUpdateOperator={(op) =>
                  updateConditionOperator(condition.id, op)
                }
                onUpdateValue={(val) =>
                  updateConditionValue(condition.id, val)
                }
                onRemove={() => removeCondition(condition.id)}
                errors={validation.errors}
                disabled={disabled}
              />
            );
          })
        )}
      </div>

      {/* Add Condition Button */}
      <Button
        type="button"
        variant="outline"
        onClick={addCondition}
        disabled={disabled}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Condition
      </Button>

      {/* Logic Toggle */}
      {conditions.length > 1 && (
        <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">When multiple conditions:</span>
          <RadioGroup
            value={logic}
            onValueChange={(v) => setLogic(v as "all" | "any")}
            className="flex gap-4"
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="all" id="logic-all" />
              <Label htmlFor="logic-all" className="cursor-pointer">
                ALL must match
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="any" id="logic-any" />
              <Label htmlFor="logic-any" className="cursor-pointer">
                ANY can match
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Preview */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="whitespace-pre-line">
          {getOverallTranslation()}
        </AlertDescription>
      </Alert>
    </div>
  );
}
