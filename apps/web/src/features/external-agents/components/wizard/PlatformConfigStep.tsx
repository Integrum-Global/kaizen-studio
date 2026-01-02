import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WizardFormData } from "../ExternalAgentRegistrationWizard";
import type { PlatformConfig } from "../../types";

interface PlatformConfigStepProps {
  formData: WizardFormData;
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>;
}

export function PlatformConfigStep({ formData, setFormData }: PlatformConfigStepProps) {
  const updatePlatformConfig = (updates: Partial<PlatformConfig>) => {
    setFormData((prev) => ({
      ...prev,
      platformConfig: { ...prev.platformConfig, ...updates } as PlatformConfig,
    }));
  };

  if (!formData.provider) return null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Platform Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Configure platform-specific settings for {formData.provider}
        </p>
      </div>

      <div className="space-y-4">
        {formData.provider === "teams" && (
          <>
            <div>
              <Label htmlFor="tenant-id">Tenant ID</Label>
              <Input id="tenant-id" onChange={(e) => updatePlatformConfig({ tenant_id: e.target.value })} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required />
            </div>
            <div>
              <Label htmlFor="channel-id">Channel ID</Label>
              <Input id="channel-id" onChange={(e) => updatePlatformConfig({ channel_id: e.target.value })} placeholder="19:xxxxxx@thread.tacv2" required />
            </div>
          </>
        )}

        {formData.provider === "discord" && (
          <>
            <div>
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input id="webhook-url" type="url" onChange={(e) => updatePlatformConfig({ webhook_url: e.target.value })} placeholder="https://discord.com/api/webhooks/..." required />
            </div>
            <div>
              <Label htmlFor="username">Username (optional)</Label>
              <Input id="username" onChange={(e) => updatePlatformConfig({ username: e.target.value })} placeholder="Bot Name" />
            </div>
          </>
        )}

        {formData.provider === "slack" && (
          <>
            <div>
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input id="webhook-url" type="url" onChange={(e) => updatePlatformConfig({ webhook_url: e.target.value })} placeholder="https://hooks.slack.com/services/..." required />
            </div>
            <div>
              <Label htmlFor="channel">Channel</Label>
              <Input id="channel" onChange={(e) => updatePlatformConfig({ channel: e.target.value })} placeholder="#general" required />
            </div>
          </>
        )}

        {formData.provider === "telegram" && (
          <>
            <div>
              <Label htmlFor="bot-token">Bot Token</Label>
              <Input id="bot-token" type="password" onChange={(e) => updatePlatformConfig({ bot_token: e.target.value })} placeholder="123456:ABC-DEF..." required />
            </div>
            <div>
              <Label htmlFor="chat-id">Chat ID</Label>
              <Input id="chat-id" onChange={(e) => updatePlatformConfig({ chat_id: e.target.value })} placeholder="-100123456789" required />
            </div>
          </>
        )}

        {formData.provider === "notion" && (
          <>
            <div>
              <Label htmlFor="token">Integration Token</Label>
              <Input id="token" type="password" onChange={(e) => updatePlatformConfig({ token: e.target.value })} placeholder="secret_..." required />
            </div>
            <div>
              <Label htmlFor="database-id">Database ID</Label>
              <Input id="database-id" onChange={(e) => updatePlatformConfig({ database_id: e.target.value })} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
