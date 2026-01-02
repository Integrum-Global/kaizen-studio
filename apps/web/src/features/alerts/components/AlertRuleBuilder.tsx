import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Label,
  Badge,
} from "@/components/ui";
import type { AlertMetric, AlertOperator, AlertSeverity } from "../types";
import {
  alertMetricLabels,
  alertOperatorLabels,
  alertSeverityLabels,
} from "../types";
import { AlertCircle, TrendingUp, TrendingDown, Equal } from "lucide-react";

interface AlertRuleBuilderProps {
  metric?: AlertMetric;
  operator?: AlertOperator;
  threshold?: number;
  duration?: number;
  severity?: AlertSeverity;
  onMetricChange: (metric: AlertMetric) => void;
  onOperatorChange: (operator: AlertOperator) => void;
  onThresholdChange: (threshold: number) => void;
  onDurationChange: (duration: number) => void;
  onSeverityChange: (severity: AlertSeverity) => void;
  disabled?: boolean;
}

export function AlertRuleBuilder({
  metric,
  operator,
  threshold,
  duration,
  severity,
  onMetricChange,
  onOperatorChange,
  onThresholdChange,
  onDurationChange,
  onSeverityChange,
  disabled = false,
}: AlertRuleBuilderProps) {
  const [conditionPreview, setConditionPreview] = useState("");

  useEffect(() => {
    if (
      metric &&
      operator &&
      threshold !== undefined &&
      duration !== undefined
    ) {
      const metricLabel = alertMetricLabels[metric];
      const operatorLabel = alertOperatorLabels[operator];
      const durationMinutes = Math.floor(duration / 60);

      setConditionPreview(
        `Trigger when ${metricLabel} is ${operatorLabel.toLowerCase()} ${threshold} for ${
          durationMinutes > 0
            ? `${durationMinutes} minutes`
            : `${duration} seconds`
        }`
      );
    } else {
      setConditionPreview("Configure the rule to see preview");
    }
  }, [metric, operator, threshold, duration]);

  const getOperatorIcon = (op: AlertOperator) => {
    switch (op) {
      case "gt":
      case "gte":
        return <TrendingUp className="h-4 w-4" />;
      case "lt":
      case "lte":
        return <TrendingDown className="h-4 w-4" />;
      case "eq":
      case "ne":
        return <Equal className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (
    sev: AlertSeverity
  ): "destructive" | "outline" | "secondary" | "default" => {
    switch (sev) {
      case "critical":
        return "destructive";
      case "warning":
        return "outline";
      case "info":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      {/* Condition Preview */}
      <div className="p-4 border rounded-lg bg-muted/50">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium mb-1">Condition Preview</h3>
            <p className="text-sm text-muted-foreground">{conditionPreview}</p>
          </div>
        </div>
      </div>

      {/* Metric Selection */}
      <div className="space-y-2">
        <Label htmlFor="metric">Metric to Monitor</Label>
        <Select
          value={metric}
          onValueChange={(value) => onMetricChange(value as AlertMetric)}
          disabled={disabled}
        >
          <SelectTrigger id="metric">
            <SelectValue placeholder="Select a metric" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(alertMetricLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Operator & Threshold */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="operator">Condition</Label>
          <Select
            value={operator}
            onValueChange={(value) => onOperatorChange(value as AlertOperator)}
            disabled={disabled}
          >
            <SelectTrigger id="operator">
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(alertOperatorLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    {getOperatorIcon(key as AlertOperator)}
                    <span>{label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="threshold">Threshold Value</Label>
          <Input
            id="threshold"
            type="number"
            placeholder="e.g., 80"
            value={threshold ?? ""}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value)) {
                onThresholdChange(value);
              }
            }}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <Label htmlFor="duration">Duration (seconds)</Label>
        <Input
          id="duration"
          type="number"
          placeholder="e.g., 300 (5 minutes)"
          value={duration ?? ""}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value > 0) {
              onDurationChange(value);
            }
          }}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Alert will trigger if the condition persists for this duration
        </p>
      </div>

      {/* Severity */}
      <div className="space-y-2">
        <Label htmlFor="severity">Severity Level</Label>
        <div className="flex gap-2">
          {Object.entries(alertSeverityLabels).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onSeverityChange(key as AlertSeverity)}
              disabled={disabled}
              className={`flex-1 p-3 border rounded-lg transition-all ${
                severity === key
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <Badge
                variant={getSeverityColor(key as AlertSeverity)}
                className="w-full justify-center"
              >
                {label}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Visual Rule Summary */}
      {metric &&
        operator &&
        threshold !== undefined &&
        duration !== undefined &&
        severity && (
          <div className="p-4 border rounded-lg space-y-3">
            <h3 className="text-sm font-medium">Rule Summary</h3>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline">{alertMetricLabels[metric]}</Badge>
              <span className="text-muted-foreground">is</span>
              <Badge variant="outline">
                {getOperatorIcon(operator)}
                <span className="ml-1">{alertOperatorLabels[operator]}</span>
              </Badge>
              <Badge variant="outline">{threshold}</Badge>
              <span className="text-muted-foreground">for</span>
              <Badge variant="outline">
                {Math.floor(duration / 60) > 0
                  ? `${Math.floor(duration / 60)}m`
                  : `${duration}s`}
              </Badge>
              <span className="text-muted-foreground">→</span>
              <Badge variant={getSeverityColor(severity)}>
                {alertSeverityLabels[severity]}
              </Badge>
            </div>
          </div>
        )}
    </div>
  );
}
