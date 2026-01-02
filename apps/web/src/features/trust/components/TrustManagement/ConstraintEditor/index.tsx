/**
 * ConstraintEditor Component
 *
 * Component for managing constraints with templates and custom input
 */

import { X, Plus, GripVertical } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConstraintType } from "../../../types";

interface ConstraintEditorProps {
  constraints: string[];
  onChange: (constraints: string[]) => void;
}

interface ConstraintTemplate {
  type: ConstraintType;
  label: string;
  description: string;
  template: string;
  placeholder: string;
}

const constraintTemplates: ConstraintTemplate[] = [
  {
    type: ConstraintType.RESOURCE_LIMIT,
    label: "Resource Limit",
    description: "Limit resource usage (e.g., max_tokens, max_requests)",
    template: "resource_limit:max_tokens:10000",
    placeholder: "resource_limit:max_tokens:10000",
  },
  {
    type: ConstraintType.TIME_WINDOW,
    label: "Time Window",
    description: "Restrict actions to specific time periods",
    template: "time_window:start:09:00,end:17:00",
    placeholder: "time_window:start:HH:MM,end:HH:MM",
  },
  {
    type: ConstraintType.DATA_SCOPE,
    label: "Data Scope",
    description: "Limit data access scope",
    template: "data_scope:org_id:123",
    placeholder: "data_scope:field:value",
  },
  {
    type: ConstraintType.ACTION_RESTRICTION,
    label: "Action Restriction",
    description: "Restrict specific actions",
    template: "action_restriction:deny:delete",
    placeholder: "action_restriction:allow|deny:action",
  },
  {
    type: ConstraintType.AUDIT_REQUIREMENT,
    label: "Audit Requirement",
    description: "Require audit logging for actions",
    template: "audit_requirement:level:high",
    placeholder: "audit_requirement:level:low|medium|high",
  },
];

export function ConstraintEditor({
  constraints,
  onChange,
}: ConstraintEditorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customConstraint, setCustomConstraint] = useState("");

  const addTemplateConstraint = () => {
    const template = constraintTemplates.find(
      (t) => t.type === selectedTemplate
    );
    if (template && template.template) {
      onChange([...constraints, template.template]);
      setSelectedTemplate("");
    }
  };

  const addCustomConstraint = () => {
    if (customConstraint.trim()) {
      onChange([...constraints, customConstraint.trim()]);
      setCustomConstraint("");
    }
  };

  const removeConstraint = (index: number) => {
    onChange(constraints.filter((_, i) => i !== index));
  };

  const moveConstraint = (index: number, direction: "up" | "down") => {
    const newConstraints = [...constraints];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < constraints.length) {
      const current = newConstraints[index];
      const target = newConstraints[targetIndex];
      if (current !== undefined && target !== undefined) {
        newConstraints[index] = target;
        newConstraints[targetIndex] = current;
        onChange(newConstraints);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Constraint Templates */}
      <div className="space-y-2">
        <Label>Add from Template</Label>
        <div className="flex gap-2">
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Select constraint template..." />
            </SelectTrigger>
            <SelectContent>
              {constraintTemplates.map((template) => (
                <SelectItem key={template.type} value={template.type}>
                  <div className="flex flex-col">
                    <span className="font-medium">{template.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {template.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={addTemplateConstraint}
            disabled={!selectedTemplate}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Custom Constraint */}
      <div className="space-y-2">
        <Label>Add Custom Constraint</Label>
        <div className="flex gap-2">
          <Input
            placeholder="custom_constraint:field:value"
            value={customConstraint}
            onChange={(e) => setCustomConstraint(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomConstraint();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addCustomConstraint}
            disabled={!customConstraint.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Format: constraint_type:field:value
        </p>
      </div>

      {/* Active Constraints */}
      {constraints.length > 0 && (
        <div className="space-y-2">
          <Label>Active Constraints ({constraints.length})</Label>
          <div className="space-y-2">
            {constraints.map((constraint, index) => {
              const constraintType = constraint.split(":")[0] || "";
              const template = constraintTemplates.find(
                (t) => t.type === constraintType
              );

              return (
                <Card key={index} className="p-3">
                  <div className="flex items-center gap-2">
                    {/* Drag handle */}
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => moveConstraint(index, "up")}
                        disabled={index === 0}
                      >
                        <GripVertical className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => moveConstraint(index, "down")}
                        disabled={index === constraints.length - 1}
                      >
                        <GripVertical className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Constraint type badge */}
                    {template && (
                      <Badge variant="outline">{template.label}</Badge>
                    )}

                    {/* Constraint value */}
                    <code className="flex-1 text-xs bg-muted px-2 py-1 rounded">
                      {constraint}
                    </code>

                    {/* Priority indicator */}
                    <Badge variant="secondary" className="text-xs">
                      P{index + 1}
                    </Badge>

                    {/* Remove button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeConstraint(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Constraints are evaluated in priority order (P1 first). Drag to
            reorder.
          </p>
        </div>
      )}

      {/* Template Preview */}
      {selectedTemplate && (
        <Card className="p-3 bg-muted">
          <div className="text-xs space-y-1">
            <div className="font-medium">Template Preview:</div>
            <code className="block">
              {
                constraintTemplates.find((t) => t.type === selectedTemplate)
                  ?.template
              }
            </code>
          </div>
        </Card>
      )}
    </div>
  );
}
