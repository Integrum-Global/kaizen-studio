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
  Textarea,
  Slider,
} from "@/components/ui";
import type { Agent, CreateAgentInput, UpdateAgentInput } from "../types";

const agentFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description is too long"),
  type: z.enum(["chat", "completion", "embedding", "custom"]),
  provider: z.enum(["openai", "anthropic", "google", "azure", "custom"]),
  model: z.string().min(1, "Model is required"),
  system_prompt: z.string().optional(),
  temperature: z.number().min(0).max(2),
  max_tokens: z.number().min(1).max(100000),
  status: z.enum(["active", "inactive", "error"]).optional(),
});

type AgentFormData = z.infer<typeof agentFormSchema>;

interface AgentFormProps {
  agent?: Agent;
  onSubmit: (data: CreateAgentInput | UpdateAgentInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function AgentForm({
  agent,
  onSubmit,
  onCancel,
  isSubmitting,
}: AgentFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AgentFormData>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: agent || {
      name: "",
      description: "",
      type: "chat",
      provider: "openai",
      model: "",
      system_prompt: "",
      temperature: 0.7,
      max_tokens: 4000,
      status: "active",
    },
  });

  const temperature = watch("temperature") ?? 0.7;
  const maxTokens = watch("max_tokens") ?? 4000;
  const type = watch("type") ?? "chat";
  const provider = watch("provider") ?? "openai";

  const modelOptions: Record<string, string[]> = {
    openai: ["gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"],
    anthropic: [
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
    ],
    google: ["gemini-pro", "gemini-pro-vision"],
    azure: ["gpt-4", "gpt-35-turbo"],
    custom: [],
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} placeholder="My AI Agent" />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="A helpful assistant for..."
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Type and Provider */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            value={type}
            onValueChange={(value) => setValue("type", value as any)}
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chat">Chat</SelectItem>
              <SelectItem value="completion">Completion</SelectItem>
              <SelectItem value="embedding">Embedding</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-destructive">{errors.type.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <Select
            value={provider}
            onValueChange={(value) => setValue("provider", value as any)}
          >
            <SelectTrigger id="provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="azure">Azure</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {errors.provider && (
            <p className="text-sm text-destructive">
              {errors.provider.message}
            </p>
          )}
        </div>
      </div>

      {/* Model */}
      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        {modelOptions[provider] && modelOptions[provider].length > 0 ? (
          <Select
            value={watch("model") || ""}
            onValueChange={(value) => setValue("model", value)}
          >
            <SelectTrigger id="model">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {modelOptions[provider].map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="model"
            {...register("model")}
            placeholder="custom-model-name"
          />
        )}
        {errors.model && (
          <p className="text-sm text-destructive">{errors.model.message}</p>
        )}
      </div>

      {/* System Prompt */}
      <div className="space-y-2">
        <Label htmlFor="system_prompt">System Prompt (Optional)</Label>
        <Textarea
          id="system_prompt"
          {...register("system_prompt")}
          placeholder="You are a helpful assistant..."
          rows={4}
        />
        {errors.system_prompt && (
          <p className="text-sm text-destructive">
            {errors.system_prompt.message}
          </p>
        )}
      </div>

      {/* Temperature */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="temperature">Temperature</Label>
          <span className="text-sm text-muted-foreground">
            {temperature.toFixed(2)}
          </span>
        </div>
        <Slider
          id="temperature"
          min={0}
          max={2}
          step={0.1}
          value={[temperature]}
          onValueChange={(value) => setValue("temperature", value[0] ?? 0.7)}
        />
        <p className="text-xs text-muted-foreground">
          Higher values make output more random, lower values more deterministic
        </p>
      </div>

      {/* Max Tokens */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="max_tokens">Max Tokens</Label>
          <span className="text-sm text-muted-foreground">
            {maxTokens.toLocaleString()}
          </span>
        </div>
        <Input
          id="max_tokens"
          type="number"
          {...register("max_tokens", { valueAsNumber: true })}
          min={1}
          max={100000}
        />
        {errors.max_tokens && (
          <p className="text-sm text-destructive">
            {errors.max_tokens.message}
          </p>
        )}
      </div>

      {/* Status */}
      {agent && (
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={watch("status")}
            onValueChange={(value) => setValue("status", value as any)}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : agent ? "Update Agent" : "Create Agent"}
        </Button>
      </div>
    </form>
  );
}
