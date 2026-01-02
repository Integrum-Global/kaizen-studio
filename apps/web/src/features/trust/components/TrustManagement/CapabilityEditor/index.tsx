/**
 * CapabilityEditor Component
 *
 * Component for managing agent capabilities with templates and constraints
 */

import { X, Plus, Settings } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CapabilityType } from "../../../types";
import type { CapabilityFormData } from "../EstablishTrustForm/schema";

interface CapabilityEditorProps {
  capabilities: CapabilityFormData[];
  onChange: (capabilities: CapabilityFormData[]) => void;
  error?: string;
}

interface CapabilityTemplate {
  name: string;
  capability: string;
  capability_type: CapabilityType;
  description: string;
  defaultConstraints?: string[];
}

const capabilityTemplates: CapabilityTemplate[] = [
  {
    name: "Read Access",
    capability: "access:read:*",
    capability_type: CapabilityType.ACCESS,
    description: "Read access to resources",
    defaultConstraints: ["data_scope:read_only:true"],
  },
  {
    name: "Write Access",
    capability: "access:write:*",
    capability_type: CapabilityType.ACCESS,
    description: "Write access to resources",
    defaultConstraints: ["audit_requirement:level:medium"],
  },
  {
    name: "Execute Action",
    capability: "action:execute:*",
    capability_type: CapabilityType.ACTION,
    description: "Execute actions",
    defaultConstraints: ["audit_requirement:level:high"],
  },
  {
    name: "Query Database",
    capability: "action:query:database",
    capability_type: CapabilityType.ACTION,
    description: "Query database resources",
    defaultConstraints: ["resource_limit:max_queries:1000"],
  },
  {
    name: "Delegate Trust",
    capability: "delegation:create:*",
    capability_type: CapabilityType.DELEGATION,
    description: "Delegate trust to other agents",
    defaultConstraints: ["audit_requirement:level:high"],
  },
];

const capabilityTypeColors: Record<CapabilityType, string> = {
  [CapabilityType.ACCESS]: "bg-blue-500",
  [CapabilityType.ACTION]: "bg-green-500",
  [CapabilityType.DELEGATION]: "bg-purple-500",
};

export function CapabilityEditor({
  capabilities,
  onChange,
  error,
}: CapabilityEditorProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customCapability, setCustomCapability] = useState({
    capability: "",
    capability_type: CapabilityType.ACCESS,
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editConstraints, setEditConstraints] = useState<string[]>([]);

  const addTemplateCapability = (template: CapabilityTemplate) => {
    const newCapability: CapabilityFormData = {
      capability: template.capability,
      capability_type: template.capability_type,
      constraints: template.defaultConstraints || [],
    };
    onChange([...capabilities, newCapability]);
  };

  const addCustomCapability = () => {
    if (customCapability.capability.trim()) {
      const newCapability: CapabilityFormData = {
        capability: customCapability.capability.trim(),
        capability_type: customCapability.capability_type,
        constraints: [],
      };
      onChange([...capabilities, newCapability]);
      setCustomCapability({
        capability: "",
        capability_type: CapabilityType.ACCESS,
      });
      setShowCustom(false);
    }
  };

  const removeCapability = (index: number) => {
    onChange(capabilities.filter((_, i) => i !== index));
  };

  const openConstraintsDialog = (index: number) => {
    const capability = capabilities[index];
    if (capability) {
      setEditingIndex(index);
      setEditConstraints(capability.constraints || []);
    }
  };

  const saveConstraints = () => {
    if (editingIndex !== null) {
      const current = capabilities[editingIndex];
      if (current) {
        const updated = [...capabilities];
        updated[editingIndex] = {
          capability: current.capability,
          capability_type: current.capability_type,
          constraints: editConstraints,
          scope: current.scope,
        };
        onChange(updated);
        setEditingIndex(null);
        setEditConstraints([]);
      }
    }
  };

  const addConstraint = (constraint: string) => {
    setEditConstraints([...editConstraints, constraint]);
  };

  const removeConstraint = (index: number) => {
    setEditConstraints(editConstraints.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Template Gallery */}
      <div className="space-y-2">
        <Label>Capability Templates</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {capabilityTemplates.map((template, index) => (
            <Card
              key={index}
              className="p-3 hover:bg-accent cursor-pointer transition-colors"
              onClick={() => addTemplateCapability(template)}
            >
              <div className="flex items-start gap-2">
                <Badge
                  className={`text-white ${
                    capabilityTypeColors[template.capability_type]
                  }`}
                >
                  {template.capability_type}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{template.name}</div>
                  <code className="text-xs text-muted-foreground block truncate">
                    {template.capability}
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">
                    {template.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Capability */}
      <div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowCustom(!showCustom)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Capability
        </Button>

        {showCustom && (
          <Card className="p-4 mt-2 space-y-3">
            <div className="space-y-2">
              <Label>Capability URI</Label>
              <Input
                placeholder="access:read:resource_type"
                value={customCapability.capability}
                onChange={(e) =>
                  setCustomCapability({
                    ...customCapability,
                    capability: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Format: type:action:resource (e.g., access:read:*)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Capability Type</Label>
              <Select
                value={customCapability.capability_type}
                onValueChange={(value) =>
                  setCustomCapability({
                    ...customCapability,
                    capability_type: value as CapabilityType,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CapabilityType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={addCustomCapability}
                disabled={!customCapability.capability.trim()}
              >
                Add
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCustom(false)}
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Active Capabilities */}
      {capabilities.length > 0 && (
        <div className="space-y-2">
          <Label>Active Capabilities ({capabilities.length})</Label>
          <div className="space-y-2">
            {capabilities.map((capability, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-start gap-2">
                  <Badge
                    className={`text-white ${
                      capabilityTypeColors[capability.capability_type]
                    }`}
                  >
                    {capability.capability_type}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <code className="text-sm block truncate">
                      {capability.capability}
                    </code>
                    {capability.constraints &&
                      capability.constraints.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {capability.constraints.length} constraint(s)
                          </Badge>
                        </div>
                      )}
                  </div>
                  <div className="flex gap-1">
                    <Dialog
                      open={editingIndex === index}
                      onOpenChange={(open) => {
                        if (!open) {
                          setEditingIndex(null);
                          setEditConstraints([]);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openConstraintsDialog(index)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Capability Constraints</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Add Constraint</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="constraint:field:value"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    const value = e.currentTarget.value.trim();
                                    if (value) {
                                      addConstraint(value);
                                      e.currentTarget.value = "";
                                    }
                                  }
                                }}
                              />
                            </div>
                          </div>

                          {editConstraints.length > 0 && (
                            <div className="space-y-2">
                              <Label>Active Constraints</Label>
                              {editConstraints.map((constraint, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 p-2 bg-muted rounded"
                                >
                                  <code className="flex-1 text-xs">
                                    {constraint}
                                  </code>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeConstraint(i)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingIndex(null);
                                setEditConstraints([]);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="button" onClick={saveConstraints}>
                              Save
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCapability(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
