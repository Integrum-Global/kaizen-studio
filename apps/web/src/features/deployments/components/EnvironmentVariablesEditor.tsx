import { useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnvironmentVariable {
  key: string;
  value: string;
}

interface EnvironmentVariablesEditorProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  className?: string;
}

/**
 * Component for editing environment variables as key-value pairs
 */
export function EnvironmentVariablesEditor({
  value,
  onChange,
  className,
}: EnvironmentVariablesEditorProps) {
  // Convert object to array for easier manipulation
  const [variables, setVariables] = useState<EnvironmentVariable[]>(() =>
    Object.entries(value).map(([key, val]) => ({ key, value: val }))
  );

  const handleAdd = () => {
    const newVariables = [...variables, { key: "", value: "" }];
    setVariables(newVariables);
  };

  const handleRemove = (index: number) => {
    const newVariables = variables.filter((_, i) => i !== index);
    setVariables(newVariables);
    updateParent(newVariables);
  };

  const handleKeyChange = (index: number, newKey: string) => {
    const newVariables = [...variables];
    const existing = newVariables[index];
    newVariables[index] = { key: newKey, value: existing?.value ?? "" };
    setVariables(newVariables);
    updateParent(newVariables);
  };

  const handleValueChange = (index: number, newValue: string) => {
    const newVariables = [...variables];
    const existing = newVariables[index];
    newVariables[index] = { key: existing?.key ?? "", value: newValue };
    setVariables(newVariables);
    updateParent(newVariables);
  };

  const updateParent = (vars: EnvironmentVariable[]) => {
    const obj: Record<string, string> = {};
    vars.forEach((v) => {
      if (v.key.trim()) {
        obj[v.key] = v.value;
      }
    });
    onChange(obj);
  };

  const validateKey = (key: string): boolean => {
    // Environment variable keys should be valid identifiers
    return /^[A-Z_][A-Z0-9_]*$/i.test(key);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label>Environment Variables</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="h-8"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Variable
        </Button>
      </div>

      <div className="space-y-2">
        {variables.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            No environment variables defined. Click "Add Variable" to create
            one.
          </p>
        ) : (
          variables.map((variable, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  placeholder="KEY"
                  value={variable.key}
                  onChange={(e) => handleKeyChange(index, e.target.value)}
                  className={cn(
                    variable.key && !validateKey(variable.key)
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  )}
                />
                {variable.key && !validateKey(variable.key) && (
                  <p className="text-xs text-red-500 mt-1">
                    Invalid key format. Use letters, numbers, and underscores.
                  </p>
                )}
              </div>
              <div className="flex-1">
                <Input
                  placeholder="value"
                  value={variable.value}
                  onChange={(e) => handleValueChange(index, e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                className="h-10 w-10 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
