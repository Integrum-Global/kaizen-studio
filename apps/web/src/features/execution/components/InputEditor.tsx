import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, FileJson } from "lucide-react";

interface InputEditorProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  className?: string;
}

export function InputEditor({ value, onChange, className }: InputEditorProps) {
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputText(JSON.stringify(value, null, 2));
  }, [value]);

  const handleChange = (text: string) => {
    setInputText(text);
    setError(null);

    if (!text.trim()) {
      onChange({});
      return;
    }

    try {
      const parsed = JSON.parse(text);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        onChange(parsed);
      } else {
        setError("Input must be a JSON object");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  const handleLoadSample = () => {
    const sample = {
      query: "Sample input query",
      context: "Additional context",
      parameters: {
        temperature: 0.7,
        max_tokens: 1000,
      },
    };
    const sampleText = JSON.stringify(sample, null, 2);
    setInputText(sampleText);
    onChange(sample);
    setError(null);
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(inputText);
      const formatted = JSON.stringify(parsed, null, 2);
      setInputText(formatted);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <Label htmlFor="input-editor" className="text-sm font-medium">
          Pipeline Inputs
        </Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLoadSample}
          >
            <FileJson className="h-3.5 w-3.5" />
            Load Sample
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFormat}
            disabled={!!error}
          >
            Format JSON
          </Button>
        </div>
      </div>

      <Textarea
        id="input-editor"
        value={inputText}
        onChange={(e) => handleChange(e.target.value)}
        placeholder='{"key": "value"}'
        className={`font-mono text-xs min-h-[300px] ${
          error ? "border-destructive focus-visible:ring-destructive" : ""
        }`}
        spellCheck={false}
      />

      {error && (
        <div className="flex items-start gap-2 mt-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!error && inputText.trim() && (
        <div className="mt-2 text-xs text-muted-foreground">
          Valid JSON - {Object.keys(value).length} key(s)
        </div>
      )}
    </div>
  );
}
