/**
 * IpRangeInput - IP address input with CIDR validation
 * Supports single IP, CIDR range (192.168.0.0/24), or IP list
 */

import { useState, useMemo, useCallback } from "react";
import { X, AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IpRangeInputProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Validate IPv4 address
 */
function isValidIpv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255 && part === String(num);
  });
}

/**
 * Validate CIDR notation
 */
function isValidCidr(cidr: string): boolean {
  const parts = cidr.split("/");
  const ip = parts[0];
  const mask = parts[1];
  if (!ip || !mask) return false;
  const maskNum = parseInt(mask, 10);
  return isValidIpv4(ip) && maskNum >= 0 && maskNum <= 32;
}

/**
 * Validate IP or CIDR
 */
function isValidIpOrCidr(value: string): boolean {
  if (!value || value.trim() === "") return false;
  const trimmed = value.trim();

  // Check if it's a CIDR
  if (trimmed.includes("/")) {
    return isValidCidr(trimmed);
  }

  // Otherwise check if it's a valid IPv4
  return isValidIpv4(trimmed);
}

/**
 * Get validation error message for an IP/CIDR value
 */
function getValidationError(value: string): string | null {
  if (!value || value.trim() === "") {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    const ip = parts[0];
    const mask = parts[1];

    if (!ip || !isValidIpv4(ip)) {
      return "Invalid IP address format (expected: x.x.x.x)";
    }

    if (!mask) {
      return "Invalid CIDR mask (must be 0-32)";
    }

    const maskNum = parseInt(mask, 10);
    if (isNaN(maskNum) || maskNum < 0 || maskNum > 32) {
      return "Invalid CIDR mask (must be 0-32)";
    }

    return null;
  }

  if (!isValidIpv4(trimmed)) {
    return "Invalid IP address format (expected: x.x.x.x or x.x.x.x/xx)";
  }

  return null;
}

/**
 * Format IP range for display
 */
function formatIpRange(value: string): string {
  if (value.includes("/")) {
    const [ip, mask] = value.split("/");
    return `${ip}/${mask}`;
  }
  return value;
}

export function IpRangeInput({
  value,
  onChange,
  multiple = false,
  disabled = false,
  placeholder = "192.168.1.0/24 or 10.0.0.1",
}: IpRangeInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [touched, setTouched] = useState(false);

  // Normalize value to array for multi-value mode
  const values = useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value.map(String) : [];
    }
    return [];
  }, [value, multiple]);

  // Validation state for current input
  const inputError = useMemo(() => {
    if (!touched || !inputValue) return null;
    return getValidationError(inputValue);
  }, [inputValue, touched]);

  // Validation state for single value mode
  const singleValueError = useMemo(() => {
    if (multiple || !touched) return null;
    const singleValue = typeof value === "string" ? value : "";
    if (!singleValue) return null;
    return getValidationError(singleValue);
  }, [value, multiple, touched]);

  // Handle adding a value in multi-value mode
  const handleAddValue = useCallback(() => {
    if (!inputValue.trim() || !isValidIpOrCidr(inputValue)) return;

    const newValue = inputValue.trim();
    if (!values.includes(newValue)) {
      onChange([...values, newValue]);
    }
    setInputValue("");
  }, [inputValue, values, onChange]);

  // Handle removing a value in multi-value mode
  const handleRemoveValue = useCallback(
    (indexToRemove: number) => {
      const newValues = values.filter((_, i) => i !== indexToRemove);
      onChange(newValues.length > 0 ? newValues : []);
    },
    [values, onChange]
  );

  // Handle key press in input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddValue();
      }
    },
    [handleAddValue]
  );

  // Handle single value change
  const handleSingleValueChange = useCallback(
    (newValue: string) => {
      setTouched(true);
      onChange(newValue);
    },
    [onChange]
  );

  // Multi-value mode
  if (multiple) {
    return (
      <div className="flex-1 space-y-2">
        {/* Display selected IP ranges */}
        {values.length > 0 && (
          <div className="flex flex-wrap gap-1 min-h-[32px] p-1 border rounded-md bg-background">
            {values.map((v, i) => {
              const isValid = isValidIpOrCidr(v);
              return (
                <Badge
                  key={i}
                  variant={isValid ? "secondary" : "destructive"}
                  className="gap-1 font-mono text-xs"
                >
                  {isValid ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {formatIpRange(v)}
                  <button
                    type="button"
                    onClick={() => handleRemoveValue(i)}
                    className="hover:bg-muted rounded ml-1"
                    disabled={disabled}
                    aria-label={`Remove ${v}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}

        {/* Input for adding new values */}
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Input
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setTouched(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "font-mono",
                inputError && "border-destructive focus-visible:ring-destructive"
              )}
              aria-invalid={!!inputError}
              aria-describedby={inputError ? "ip-input-error" : undefined}
            />
            {inputError && (
              <p
                id="ip-input-error"
                className="text-xs text-destructive flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3" />
                {inputError}
              </p>
            )}
          </div>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={handleAddValue}
            disabled={disabled || !inputValue || !!inputError}
            aria-label="Add IP address"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Enter IP address or CIDR range (e.g., 192.168.1.0/24) and press Enter
          or click + to add
        </p>
      </div>
    );
  }

  // Single value mode
  const singleValue = typeof value === "string" ? value : "";
  const isValid = singleValue ? isValidIpOrCidr(singleValue) : true;

  return (
    <div className="flex-1 space-y-1">
      <div className="relative">
        <Input
          value={singleValue}
          onChange={(e) => handleSingleValueChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "font-mono pr-8",
            singleValueError &&
              "border-destructive focus-visible:ring-destructive"
          )}
          aria-invalid={!!singleValueError}
          aria-describedby={singleValueError ? "ip-single-error" : undefined}
        />
        {singleValue && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {isValid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
          </div>
        )}
      </div>
      {singleValueError && (
        <p
          id="ip-single-error"
          className="text-xs text-destructive flex items-center gap-1"
        >
          <AlertCircle className="h-3 w-3" />
          {singleValueError}
        </p>
      )}
      {!singleValueError && singleValue && isValid && (
        <p className="text-xs text-muted-foreground">
          {singleValue.includes("/")
            ? `CIDR range: ${singleValue}`
            : `Single IP: ${singleValue}`}
        </p>
      )}
    </div>
  );
}

/**
 * Export validation utilities for use in useConditionValidation
 */
export { isValidIpv4, isValidCidr, isValidIpOrCidr, getValidationError };
