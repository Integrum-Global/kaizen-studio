/**
 * Main conditions section for the policy editor
 * Contains template bar, condition list, logic toggle, preview, and reference warnings
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { Plus, HelpCircle, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConditionRow } from "./ConditionRow";
import { ConditionTemplates } from "./ConditionTemplates";
import { ConditionTemplatesModal } from "./ConditionTemplatesModal";
import { OverallPreview } from "./OverallPreview";
import { ReferenceWarnings } from "./ReferenceWarnings";
import { useConditionBuilder } from "./hooks";
import { useValidateConditions } from "../../hooks/usePolicyReferences";
import type { ConditionGroup, PolicyCondition, ConditionTemplate } from "./types";
import type { ResourceReferenceStatus } from "../../types";

interface ConditionsSectionProps {
  initialConditions?: PolicyCondition[];
  initialLogic?: "all" | "any";
  onChange?: (group: ConditionGroup) => void;
  disabled?: boolean;
  /** Policy ID for fetching existing references (optional, for edit mode) */
  policyId?: string;
}

export function ConditionsSection({
  initialConditions = [],
  initialLogic = "all",
  onChange,
  disabled,
  // policyId is available for future use (e.g., fetching existing references from server)
  policyId: _policyId,
}: ConditionsSectionProps) {
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [referenceWarnings, setReferenceWarnings] = useState<
    ResourceReferenceStatus[]
  >([]);
  const [warningsDismissed, setWarningsDismissed] = useState(false);

  const validateConditionsMutation = useValidateConditions();

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
    validateCondition,
  } = useConditionBuilder({
    initialConditions,
    initialLogic,
    onChange,
  });

  // Validate references when conditions change or on initial load
  const validateReferences = useCallback(async () => {
    if (conditions.length === 0) {
      setReferenceWarnings([]);
      return;
    }

    // Convert PolicyCondition to API format
    const apiConditions = conditions
      .filter((c) => c.attribute && c.value !== "")
      .map((c) => ({
        attribute: c.attribute,
        operator: c.operator,
        value: c.value as string | string[] | number | boolean,
      }));

    if (apiConditions.length === 0) {
      setReferenceWarnings([]);
      return;
    }

    try {
      const result = await validateConditionsMutation.mutateAsync({
        conditions: apiConditions,
      });

      if (result.references) {
        setReferenceWarnings(result.references);
        // Reset dismissed state when new warnings appear
        if (
          result.references.some(
            (r) => r.status === "orphaned" || r.status === "changed"
          )
        ) {
          setWarningsDismissed(false);
        }
      }
    } catch (error) {
      console.warn("Failed to validate condition references:", error);
    }
  }, [conditions, validateConditionsMutation]);

  // Validate on mount if we have initial conditions
  useEffect(() => {
    if (initialConditions.length > 0) {
      validateReferences();
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle template application from quick bar or modal
  const handleApplyTemplate = (template: ConditionTemplate) => {
    applyTemplate(template.id);
  };

  // Handle dismissing reference warnings
  const handleDismissWarnings = () => {
    setWarningsDismissed(true);
  };

  // Handle refreshing reference validation
  const handleRefreshWarnings = () => {
    setWarningsDismissed(false);
    validateReferences();
  };

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

      {/* Reference Warnings */}
      {!warningsDismissed && referenceWarnings.length > 0 && (
        <ReferenceWarnings
          references={referenceWarnings}
          onDismiss={handleDismissWarnings}
          onRefresh={handleRefreshWarnings}
        />
      )}

      {/* Quick Templates */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Quick Templates</Label>
        <ConditionTemplates
          onApplyTemplate={handleApplyTemplate}
          onOpenModal={() => setIsTemplateModalOpen(true)}
          disabled={disabled}
        />
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

      {/* Overall Preview */}
      <OverallPreview
        conditions={conditions}
        logic={logic}
        showJsonToggle={true}
      />

      {/* Templates Modal */}
      <ConditionTemplatesModal
        open={isTemplateModalOpen}
        onOpenChange={setIsTemplateModalOpen}
        onApplyTemplate={handleApplyTemplate}
      />
    </div>
  );
}
