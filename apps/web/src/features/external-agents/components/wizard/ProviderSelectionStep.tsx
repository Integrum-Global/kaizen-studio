import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { WizardFormData } from "../ExternalAgentRegistrationWizard";
import type { ExternalAgentProvider } from "../../types";
import {
  MessageSquare,
  Slack,
  Send,
  FileText,
  MessageCircle,
} from "lucide-react";

interface ProviderSelectionStepProps {
  formData: WizardFormData;
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>;
}

const PROVIDERS: {
  value: ExternalAgentProvider;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    value: "teams",
    label: "Microsoft Teams",
    icon: MessageSquare,
    description: "Integrate with Microsoft Teams channels",
  },
  {
    value: "discord",
    label: "Discord",
    icon: MessageCircle,
    description: "Connect to Discord via webhooks",
  },
  {
    value: "slack",
    label: "Slack",
    icon: Slack,
    description: "Send messages to Slack channels",
  },
  {
    value: "telegram",
    label: "Telegram",
    icon: Send,
    description: "Connect to Telegram bots",
  },
  {
    value: "notion",
    label: "Notion",
    icon: FileText,
    description: "Integrate with Notion databases",
  },
];

export function ProviderSelectionStep({
  formData,
  setFormData,
}: ProviderSelectionStepProps) {
  const handleProviderChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      provider: value as ExternalAgentProvider,
      // Reset platform config when provider changes
      platformConfig: undefined,
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Provider</h3>
        <p className="text-sm text-muted-foreground">
          Choose the platform you want to integrate with
        </p>
      </div>

      <RadioGroup
        value={formData.provider}
        onValueChange={handleProviderChange}
        aria-label="Provider selection"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            return (
              <div key={provider.value} className="relative">
                <RadioGroupItem
                  value={provider.value}
                  id={provider.value}
                  className="peer sr-only"
                  aria-describedby={`${provider.value}-description`}
                />
                <Label
                  htmlFor={provider.value}
                  className="flex flex-col items-start p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <span className="font-semibold">{provider.label}</span>
                  </div>
                  <p
                    id={`${provider.value}-description`}
                    className="text-sm text-muted-foreground"
                  >
                    {provider.description}
                  </p>
                </Label>
              </div>
            );
          })}
        </div>
      </RadioGroup>

      {formData.provider && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm">
            <strong>Selected:</strong>{" "}
            {PROVIDERS.find((p) => p.value === formData.provider)?.label}
          </p>
        </div>
      )}
    </div>
  );
}
