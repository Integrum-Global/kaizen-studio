import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { EnvironmentVariablesEditor } from "./EnvironmentVariablesEditor";
import type {
  CreateDeploymentInput,
  UpdateDeploymentInput,
  Environment,
} from "../types";

const deploymentFormSchema = z.object({
  pipelineId: z.string().min(1, "Pipeline is required"),
  environment: z.enum(["development", "staging", "production"]),
  replicas: z
    .number()
    .min(1, "At least 1 replica required")
    .max(10, "Maximum 10 replicas"),
  maxConcurrency: z.number().min(1, "Must be at least 1"),
  timeout: z.number().min(1, "Must be at least 1 second"),
  retries: z.number().min(0, "Cannot be negative").max(5, "Maximum 5 retries"),
  environmentVariables: z.record(z.string(), z.string()),
});

type DeploymentFormData = z.infer<typeof deploymentFormSchema>;

interface DeploymentFormProps {
  pipelineId?: string;
  initialData?: UpdateDeploymentInput;
  onSubmit: (data: CreateDeploymentInput | UpdateDeploymentInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  mode: "create" | "update";
}

export function DeploymentForm({
  pipelineId,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  mode,
}: DeploymentFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DeploymentFormData>({
    resolver: zodResolver(deploymentFormSchema),
    defaultValues: {
      pipelineId: pipelineId || "",
      environment: initialData?.config?.environment
        ? Object.keys(initialData.config.environment).length > 0
          ? ("production" as Environment)
          : ("development" as Environment)
        : ("development" as Environment),
      replicas: initialData?.config?.replicas ?? 1,
      maxConcurrency: initialData?.config?.maxConcurrency ?? 10,
      timeout: initialData?.config?.timeout ?? 300,
      retries: initialData?.config?.retries ?? 3,
      environmentVariables: initialData?.config?.environment ?? {},
    },
  });

  const environment = watch("environment") ?? "development";
  const environmentVariables = watch("environmentVariables") ?? {};

  const handleFormSubmit = (data: DeploymentFormData) => {
    if (mode === "create") {
      const createInput: CreateDeploymentInput = {
        pipelineId: data.pipelineId,
        environment: data.environment,
        config: {
          replicas: data.replicas,
          maxConcurrency: data.maxConcurrency,
          timeout: data.timeout,
          retries: data.retries,
          environment: data.environmentVariables,
        },
      };
      onSubmit(createInput);
    } else {
      const updateInput: UpdateDeploymentInput = {
        config: {
          replicas: data.replicas,
          maxConcurrency: data.maxConcurrency,
          timeout: data.timeout,
          retries: data.retries,
          environment: data.environmentVariables,
        },
      };
      onSubmit(updateInput);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Pipeline ID (only for create mode) */}
      {mode === "create" && (
        <div className="space-y-2">
          <Label htmlFor="pipelineId">Pipeline ID</Label>
          <Input
            id="pipelineId"
            {...register("pipelineId")}
            placeholder="pipeline-123"
            disabled={!!pipelineId}
          />
          {errors.pipelineId && (
            <p className="text-sm text-destructive">
              {errors.pipelineId.message}
            </p>
          )}
        </div>
      )}

      {/* Environment */}
      <div className="space-y-2">
        <Label htmlFor="environment">Environment</Label>
        <Select
          value={environment}
          onValueChange={(value) =>
            setValue("environment", value as Environment)
          }
          disabled={mode === "update"}
        >
          <SelectTrigger id="environment">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="development">Development</SelectItem>
            <SelectItem value="staging">Staging</SelectItem>
            <SelectItem value="production">Production</SelectItem>
          </SelectContent>
        </Select>
        {mode === "update" && (
          <p className="text-xs text-muted-foreground">
            Environment cannot be changed after deployment
          </p>
        )}
        {errors.environment && (
          <p className="text-sm text-destructive">
            {errors.environment.message}
          </p>
        )}
      </div>

      {/* Replicas and Max Concurrency */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="replicas">Replicas</Label>
          <Input
            id="replicas"
            type="number"
            {...register("replicas", { valueAsNumber: true })}
            min={1}
            max={10}
          />
          {errors.replicas && (
            <p className="text-sm text-destructive">
              {errors.replicas.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxConcurrency">Max Concurrency</Label>
          <Input
            id="maxConcurrency"
            type="number"
            {...register("maxConcurrency", { valueAsNumber: true })}
            min={1}
          />
          {errors.maxConcurrency && (
            <p className="text-sm text-destructive">
              {errors.maxConcurrency.message}
            </p>
          )}
        </div>
      </div>

      {/* Timeout and Retries */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="timeout">Timeout (seconds)</Label>
          <Input
            id="timeout"
            type="number"
            {...register("timeout", { valueAsNumber: true })}
            min={1}
          />
          {errors.timeout && (
            <p className="text-sm text-destructive">{errors.timeout.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="retries">Retries</Label>
          <Input
            id="retries"
            type="number"
            {...register("retries", { valueAsNumber: true })}
            min={0}
            max={5}
          />
          {errors.retries && (
            <p className="text-sm text-destructive">{errors.retries.message}</p>
          )}
        </div>
      </div>

      {/* Environment Variables */}
      <EnvironmentVariablesEditor
        value={environmentVariables}
        onChange={(value) => setValue("environmentVariables", value)}
      />
      {errors.environmentVariables &&
        typeof errors.environmentVariables.message === "string" && (
          <p className="text-sm text-destructive">
            {errors.environmentVariables.message}
          </p>
        )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : mode === "create"
              ? "Create Deployment"
              : "Update Configuration"}
        </Button>
      </div>
    </form>
  );
}
