import { useForm } from "react-hook-form";
import { useState } from "react";
import { AlertRuleBuilder } from "./AlertRuleBuilder";
import { Input, Textarea, Button, Switch, Label } from "@/components/ui";
import type {
  AlertRule,
  CreateAlertRuleInput,
  AlertMetric,
  AlertOperator,
  AlertSeverity,
} from "../types";
import { Loader2 } from "lucide-react";

interface AlertFormProps {
  rule?: AlertRule;
  onSubmit: (data: CreateAlertRuleInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function AlertForm({
  rule,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AlertFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateAlertRuleInput>({
    defaultValues: {
      name: rule?.name || "",
      description: rule?.description || "",
      metric: rule?.metric || "cpu_usage",
      operator: rule?.operator || "gt",
      threshold: rule?.threshold || 80,
      duration: rule?.duration || 300,
      severity: rule?.severity || "warning",
      enabled: rule?.enabled ?? true,
    },
  });

  const [metric, setMetric] = useState<AlertMetric>(
    rule?.metric || "cpu_usage"
  );
  const [operator, setOperator] = useState<AlertOperator>(
    rule?.operator || "gt"
  );
  const [threshold, setThreshold] = useState<number>(rule?.threshold || 80);
  const [duration, setDuration] = useState<number>(rule?.duration || 300);
  const [severity, setSeverity] = useState<AlertSeverity>(
    rule?.severity || "warning"
  );

  const handleFormSubmit = (data: CreateAlertRuleInput) => {
    const submitData = {
      ...data,
      metric,
      operator,
      threshold,
      duration,
      severity,
    };
    onSubmit(submitData);
  };

  const handleMetricChange = (value: AlertMetric) => {
    setMetric(value);
    setValue("metric", value);
  };

  const handleOperatorChange = (value: AlertOperator) => {
    setOperator(value);
    setValue("operator", value);
  };

  const handleThresholdChange = (value: number) => {
    setThreshold(value);
    setValue("threshold", value);
  };

  const handleDurationChange = (value: number) => {
    setDuration(value);
    setValue("duration", value);
  };

  const handleSeverityChange = (value: AlertSeverity) => {
    setSeverity(value);
    setValue("severity", value);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>

        <div className="space-y-2">
          <Label htmlFor="name">
            Rule Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            {...register("name", {
              required: "Name is required",
              minLength: {
                value: 3,
                message: "Name must be at least 3 characters",
              },
              maxLength: {
                value: 100,
                message: "Name must be less than 100 characters",
              },
            })}
            placeholder="e.g., High CPU Usage Alert"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            A descriptive name for your alert rule
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register("description", {
              maxLength: {
                value: 500,
                message: "Description must be less than 500 characters",
              },
            })}
            placeholder="Describe when this alert should trigger and what action to take..."
            rows={3}
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Optional details about this alert rule
          </p>
        </div>
      </div>

      {/* Alert Condition */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Alert Condition</h3>

        <AlertRuleBuilder
          metric={metric}
          operator={operator}
          threshold={threshold}
          duration={duration}
          severity={severity}
          onMetricChange={handleMetricChange}
          onOperatorChange={handleOperatorChange}
          onThresholdChange={handleThresholdChange}
          onDurationChange={handleDurationChange}
          onSeverityChange={handleSeverityChange}
          disabled={isSubmitting}
        />
      </div>

      {/* Enable/Disable */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label className="text-base">Enable Rule</Label>
          <p className="text-sm text-muted-foreground">
            Start monitoring this alert rule immediately after creation
          </p>
        </div>
        <Switch
          checked={watch("enabled")}
          onCheckedChange={(checked) => setValue("enabled", checked)}
          disabled={isSubmitting}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {rule ? "Update Rule" : "Create Rule"}
        </Button>
      </div>
    </form>
  );
}
