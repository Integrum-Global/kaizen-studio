import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { WizardFormData } from "../ExternalAgentRegistrationWizard";
import type { AuthType, AuthConfig } from "../../types";

interface AuthenticationConfigStepProps {
  formData: WizardFormData;
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>;
}

export function AuthenticationConfigStep({
  formData,
  setFormData,
}: AuthenticationConfigStepProps) {
  const [authType, setAuthType] = useState<AuthType>(
    formData.authConfig?.type || "api_key"
  );

  const handleAuthTypeChange = (value: string) => {
    const type = value as AuthType;
    setAuthType(type);

    // Initialize auth config based on type
    if (type === "api_key") {
      setFormData((prev) => ({
        ...prev,
        authConfig: { type: "api_key", key: "", header_name: "X-API-Key" },
      }));
    } else if (type === "oauth2") {
      setFormData((prev) => ({
        ...prev,
        authConfig: {
          type: "oauth2",
          client_id: "",
          client_secret: "",
          token_url: "",
        },
      }));
    } else if (type === "custom") {
      setFormData((prev) => ({
        ...prev,
        authConfig: { type: "custom", config: {} },
      }));
    }
  };

  const updateAuthConfig = (
    key: string,
    value: unknown
  ) => {
    setFormData((prev) => ({
      ...prev,
      authConfig: { ...prev.authConfig!, [key]: value } as AuthConfig,
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Authentication Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Configure how to authenticate with the external platform
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Authentication Type</Label>
          <RadioGroup value={authType} onValueChange={handleAuthTypeChange} className="mt-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="api_key" id="api_key" />
              <Label htmlFor="api_key" className="font-normal cursor-pointer">
                API Key
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="oauth2" id="oauth2" />
              <Label htmlFor="oauth2" className="font-normal cursor-pointer">
                OAuth2
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom" className="font-normal cursor-pointer">
                Custom
              </Label>
            </div>
          </RadioGroup>
        </div>

        {authType === "api_key" && formData.authConfig?.type === "api_key" && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={formData.authConfig.key}
                onChange={(e) => updateAuthConfig("key", e.target.value)}
                placeholder="Enter API key"
                required
              />
            </div>
            <div>
              <Label htmlFor="header-name">Header Name</Label>
              <Input
                id="header-name"
                value={formData.authConfig.header_name}
                onChange={(e) => updateAuthConfig("header_name", e.target.value)}
                placeholder="X-API-Key"
              />
            </div>
          </div>
        )}

        {authType === "oauth2" && formData.authConfig?.type === "oauth2" && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label htmlFor="client-id">Client ID</Label>
              <Input
                id="client-id"
                value={formData.authConfig.client_id}
                onChange={(e) => updateAuthConfig("client_id", e.target.value)}
                placeholder="Enter client ID"
                required
              />
            </div>
            <div>
              <Label htmlFor="client-secret">Client Secret</Label>
              <Input
                id="client-secret"
                type="password"
                value={formData.authConfig.client_secret}
                onChange={(e) => updateAuthConfig("client_secret", e.target.value)}
                placeholder="Enter client secret"
                required
              />
            </div>
            <div>
              <Label htmlFor="token-url">Token URL</Label>
              <Input
                id="token-url"
                type="url"
                value={formData.authConfig.token_url}
                onChange={(e) => updateAuthConfig("token_url", e.target.value)}
                placeholder="https://auth.example.com/token"
                required
              />
            </div>
          </div>
        )}

        {authType === "custom" && formData.authConfig?.type === "custom" && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label htmlFor="custom-config">Configuration (JSON)</Label>
              <Textarea
                id="custom-config"
                value={JSON.stringify(formData.authConfig.config, null, 2)}
                onChange={(e) => {
                  try {
                    const config = JSON.parse(e.target.value);
                    updateAuthConfig("config", config);
                  } catch {
                    // Invalid JSON, don't update
                  }
                }}
                placeholder='{&#10;  "key": "value"&#10;}'
                rows={6}
                className="font-mono text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
