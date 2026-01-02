import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Label } from "@/components/ui";
import type {
  CreateConnectorRequest,
  UpdateConnectorRequest,
  ConnectorType,
} from "../types";

const connectorTypeValues = [
  "database",
  "cloud",
  "email",
  "messaging",
  "storage",
  "api",
] as const;

const connectorFormSchema = z.object({
  name: z
    .string()
    .min(1, "Connector name is required")
    .max(100, "Connector name must be less than 100 characters"),
  connector_type: z.enum(connectorTypeValues),
  provider: z.string().min(1, "Provider is required"),
  config: z.record(z.string(), z.unknown()),
});

type ConnectorFormData = z.infer<typeof connectorFormSchema>;

interface ConnectorFormProps {
  initialData?: {
    name: string;
    connector_type: ConnectorType;
    provider: string;
  };
  onSubmit: (data: CreateConnectorRequest | UpdateConnectorRequest) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  mode: "create" | "update";
}

export function ConnectorForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  mode,
}: ConnectorFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<ConnectorFormData>({
    resolver: zodResolver(connectorFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      connector_type: initialData?.connector_type || "database",
      provider: initialData?.provider || "",
      config: {},
    },
  });

  const selectedType = watch("connector_type");

  const handleFormSubmit = (data: ConnectorFormData) => {
    if (mode === "create") {
      const createInput: CreateConnectorRequest = {
        name: data.name,
        connector_type: data.connector_type,
        provider: data.provider,
        config: data.config,
      };
      onSubmit(createInput);
    } else {
      const updateInput: UpdateConnectorRequest = {
        name: data.name,
        config: data.config,
      };
      onSubmit(updateInput);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Connector Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Connector Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="e.g., Production Database"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Connector Type */}
      <div className="space-y-2">
        <Label htmlFor="connector_type">
          Type <span className="text-destructive">*</span>
        </Label>
        <select
          id="connector_type"
          {...register("connector_type")}
          disabled={mode === "update"}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="database">Database</option>
          <option value="cloud">Cloud</option>
          <option value="email">Email</option>
          <option value="messaging">Messaging</option>
          <option value="storage">Storage</option>
          <option value="api">API</option>
        </select>
        {errors.connector_type && (
          <p className="text-sm text-destructive">
            {errors.connector_type.message}
          </p>
        )}
      </div>

      {/* Provider */}
      <div className="space-y-2">
        <Label htmlFor="provider">
          Provider <span className="text-destructive">*</span>
        </Label>
        <Input
          id="provider"
          {...register("provider")}
          disabled={mode === "update"}
          placeholder="e.g., postgresql, aws, smtp"
        />
        {errors.provider && (
          <p className="text-sm text-destructive">{errors.provider.message}</p>
        )}
      </div>

      {/* Dynamic Configuration Fields */}
      <div className="space-y-4">
        <Label>Configuration</Label>
        <div className="border rounded-lg p-4 space-y-4">
          <Controller
            name="config"
            control={control}
            render={({ field }) => (
              <DynamicConfigFields
                type={selectedType}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : mode === "create"
              ? "Create Connector"
              : "Update Connector"}
        </Button>
      </div>
    </form>
  );
}

interface DynamicConfigFieldsProps {
  type: ConnectorType;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

function DynamicConfigFields({
  type,
  value,
  onChange,
}: DynamicConfigFieldsProps) {
  const handleFieldChange = (key: string, fieldValue: string) => {
    onChange({
      ...value,
      [key]: fieldValue,
    });
  };

  const renderFieldsByType = () => {
    switch (type) {
      case "database":
        return (
          <>
            <ConfigField
              label="Host"
              name="host"
              value={value.host as string}
              onChange={handleFieldChange}
              required
            />
            <ConfigField
              label="Port"
              name="port"
              type="number"
              value={value.port as string}
              onChange={handleFieldChange}
              required
            />
            <ConfigField
              label="Database"
              name="database"
              value={value.database as string}
              onChange={handleFieldChange}
              required
            />
            <ConfigField
              label="Username"
              name="username"
              value={value.username as string}
              onChange={handleFieldChange}
              required
            />
            <ConfigField
              label="Password"
              name="password"
              type="password"
              value={value.password as string}
              onChange={handleFieldChange}
              required
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ssl"
                checked={value.ssl as boolean}
                onChange={(e) => onChange({ ...value, ssl: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="ssl" className="font-normal">
                Use SSL
              </Label>
            </div>
          </>
        );

      case "cloud":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="provider">Provider *</Label>
              <select
                id="provider"
                value={(value.provider as string) || "aws"}
                onChange={(e) =>
                  onChange({ ...value, provider: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="aws">AWS</option>
                <option value="gcp">GCP</option>
                <option value="azure">Azure</option>
              </select>
            </div>
            <ConfigField
              label="Region"
              name="region"
              value={value.region as string}
              onChange={handleFieldChange}
              required
            />
            <ConfigField
              label="Access Key ID"
              name="accessKeyId"
              value={value.accessKeyId as string}
              onChange={handleFieldChange}
            />
            <ConfigField
              label="Secret Access Key"
              name="secretAccessKey"
              type="password"
              value={value.secretAccessKey as string}
              onChange={handleFieldChange}
            />
          </>
        );

      case "email":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="emailProvider">Provider *</Label>
              <select
                id="emailProvider"
                value={(value.provider as string) || "smtp"}
                onChange={(e) =>
                  onChange({ ...value, provider: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="smtp">SMTP</option>
                <option value="sendgrid">SendGrid</option>
                <option value="mailgun">Mailgun</option>
                <option value="ses">AWS SES</option>
              </select>
            </div>
            <ConfigField
              label="From Email"
              name="fromEmail"
              type="email"
              value={value.fromEmail as string}
              onChange={handleFieldChange}
              required
            />
            <ConfigField
              label="Host"
              name="host"
              value={value.host as string}
              onChange={handleFieldChange}
            />
            <ConfigField
              label="Port"
              name="port"
              type="number"
              value={value.port as string}
              onChange={handleFieldChange}
            />
            <ConfigField
              label="Username"
              name="username"
              value={value.username as string}
              onChange={handleFieldChange}
            />
            <ConfigField
              label="Password/API Key"
              name="password"
              type="password"
              value={value.password as string}
              onChange={handleFieldChange}
            />
          </>
        );

      case "messaging":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="messagingProvider">Provider *</Label>
              <select
                id="messagingProvider"
                value={(value.provider as string) || "slack"}
                onChange={(e) =>
                  onChange({ ...value, provider: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="slack">Slack</option>
                <option value="teams">Microsoft Teams</option>
                <option value="discord">Discord</option>
                <option value="telegram">Telegram</option>
              </select>
            </div>
            <ConfigField
              label="Webhook URL"
              name="webhookUrl"
              value={value.webhookUrl as string}
              onChange={handleFieldChange}
            />
            <ConfigField
              label="Bot Token"
              name="botToken"
              type="password"
              value={value.botToken as string}
              onChange={handleFieldChange}
            />
            <ConfigField
              label="Channel ID"
              name="channelId"
              value={value.channelId as string}
              onChange={handleFieldChange}
            />
          </>
        );

      case "storage":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="storageProvider">Provider *</Label>
              <select
                id="storageProvider"
                value={(value.provider as string) || "s3"}
                onChange={(e) =>
                  onChange({ ...value, provider: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="s3">AWS S3</option>
                <option value="gcs">Google Cloud Storage</option>
                <option value="azure_blob">Azure Blob Storage</option>
                <option value="ftp">FTP</option>
              </select>
            </div>
            <ConfigField
              label="Bucket/Container"
              name="bucket"
              value={value.bucket as string}
              onChange={handleFieldChange}
            />
            <ConfigField
              label="Region"
              name="region"
              value={value.region as string}
              onChange={handleFieldChange}
            />
            <ConfigField
              label="Access Key ID"
              name="accessKeyId"
              value={value.accessKeyId as string}
              onChange={handleFieldChange}
            />
            <ConfigField
              label="Secret Access Key"
              name="secretAccessKey"
              type="password"
              value={value.secretAccessKey as string}
              onChange={handleFieldChange}
            />
          </>
        );

      case "api":
        return (
          <>
            <ConfigField
              label="Base URL"
              name="baseUrl"
              value={value.baseUrl as string}
              onChange={handleFieldChange}
              required
            />
            <div className="space-y-2">
              <Label htmlFor="apiType">API Type *</Label>
              <select
                id="apiType"
                value={(value.apiType as string) || "rest"}
                onChange={(e) =>
                  onChange({ ...value, apiType: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="rest">REST</option>
                <option value="graphql">GraphQL</option>
                <option value="soap">SOAP</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="authType">Authentication Type</Label>
              <select
                id="authType"
                value={(value.authType as string) || "none"}
                onChange={(e) =>
                  onChange({ ...value, authType: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="none">None</option>
                <option value="basic">Basic Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="api_key">API Key</option>
                <option value="oauth2">OAuth2</option>
              </select>
            </div>
            {value.authType === "basic" && (
              <>
                <ConfigField
                  label="Username"
                  name="username"
                  value={value.username as string}
                  onChange={handleFieldChange}
                />
                <ConfigField
                  label="Password"
                  name="password"
                  type="password"
                  value={value.password as string}
                  onChange={handleFieldChange}
                />
              </>
            )}
            {(value.authType === "bearer" || value.authType === "oauth2") && (
              <ConfigField
                label="Token"
                name="token"
                type="password"
                value={value.token as string}
                onChange={handleFieldChange}
              />
            )}
            {value.authType === "api_key" && (
              <ConfigField
                label="API Key"
                name="apiKey"
                type="password"
                value={value.apiKey as string}
                onChange={handleFieldChange}
              />
            )}
          </>
        );

      default:
        return (
          <p className="text-sm text-muted-foreground">
            Select a connector type to configure
          </p>
        );
    }
  };

  return <div className="space-y-4">{renderFieldsByType()}</div>;
}

interface ConfigFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string | undefined;
  onChange: (key: string, value: string) => void;
  required?: boolean;
}

function ConfigField({
  label,
  name,
  type = "text",
  value,
  onChange,
  required,
}: ConfigFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
        value={value || ""}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </div>
  );
}
