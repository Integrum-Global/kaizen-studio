import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Input,
  Label,
  Checkbox,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import type { CreateApiKeyInput } from "../types";
import { cn } from "@/lib/utils";

const apiKeyFormSchema = z.object({
  name: z.string().min(1, "API key name is required"),
  permissions: z
    .array(z.string())
    .min(1, "At least one permission is required"),
  scopes: z.array(z.string()),
  expiresAt: z.date().optional(),
});

type ApiKeyFormData = z.infer<typeof apiKeyFormSchema>;

interface ApiKeyFormProps {
  onSubmit: (data: CreateApiKeyInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const AVAILABLE_PERMISSIONS = [
  { id: "read", label: "Read", description: "View resources" },
  { id: "write", label: "Write", description: "Create and update resources" },
  { id: "delete", label: "Delete", description: "Delete resources" },
  { id: "admin", label: "Admin", description: "Full access to all resources" },
];

const AVAILABLE_SCOPES = [
  { id: "agents", label: "Agents", description: "Access to agents" },
  {
    id: "deployments",
    label: "Deployments",
    description: "Access to deployments",
  },
  { id: "pipelines", label: "Pipelines", description: "Access to pipelines" },
  { id: "api-keys", label: "API Keys", description: "Manage API keys" },
];

export function ApiKeyForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: ApiKeyFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ApiKeyFormData>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      name: "",
      permissions: [],
      scopes: [],
      expiresAt: undefined,
    },
  });

  const permissions = watch("permissions") ?? [];
  const scopes = watch("scopes") ?? [];
  const expiresAt = watch("expiresAt");

  const togglePermission = (permissionId: string) => {
    const newPermissions = permissions.includes(permissionId)
      ? permissions.filter((p) => p !== permissionId)
      : [...permissions, permissionId];
    setValue("permissions", newPermissions, { shouldValidate: true });
  };

  const toggleScope = (scopeId: string) => {
    const newScopes = scopes.includes(scopeId)
      ? scopes.filter((s) => s !== scopeId)
      : [...scopes, scopeId];
    setValue("scopes", newScopes);
  };

  const handleFormSubmit = (data: ApiKeyFormData) => {
    const createInput: CreateApiKeyInput = {
      name: data.name,
      permissions: data.permissions,
      scopes: data.scopes,
      expiresAt: data.expiresAt?.toISOString(),
    };
    onSubmit(createInput);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">API Key Name</Label>
        <Input id="name" {...register("name")} placeholder="My API Key" />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Permissions */}
      <div className="space-y-3">
        <Label>Permissions</Label>
        <div className="space-y-2">
          {AVAILABLE_PERMISSIONS.map((permission) => (
            <div key={permission.id} className="flex items-start space-x-3">
              <Checkbox
                id={`permission-${permission.id}`}
                checked={permissions.includes(permission.id)}
                onCheckedChange={() => togglePermission(permission.id)}
              />
              <div className="space-y-1 leading-none">
                <label
                  htmlFor={`permission-${permission.id}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {permission.label}
                </label>
                <p className="text-xs text-muted-foreground">
                  {permission.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        {errors.permissions && (
          <p className="text-sm text-destructive">
            {errors.permissions.message}
          </p>
        )}
      </div>

      {/* Scopes */}
      <div className="space-y-3">
        <Label>Scopes</Label>
        <div className="space-y-2">
          {AVAILABLE_SCOPES.map((scope) => (
            <div key={scope.id} className="flex items-start space-x-3">
              <Checkbox
                id={`scope-${scope.id}`}
                checked={scopes.includes(scope.id)}
                onCheckedChange={() => toggleScope(scope.id)}
              />
              <div className="space-y-1 leading-none">
                <label
                  htmlFor={`scope-${scope.id}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {scope.label}
                </label>
                <p className="text-xs text-muted-foreground">
                  {scope.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expiration Date */}
      <div className="space-y-2">
        <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !expiresAt && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {expiresAt ? format(expiresAt, "PPP") : "No expiration"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={expiresAt}
              onSelect={(date) => setValue("expiresAt", date)}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          Leave empty for keys that never expire
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create API Key"}
        </Button>
      </div>
    </form>
  );
}
