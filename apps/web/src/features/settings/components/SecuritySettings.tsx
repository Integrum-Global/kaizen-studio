import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Switch,
  Input,
  Button,
  Separator,
  Badge,
} from "@/components/ui";
import { Save, Shield, Clock, Lock, Trash2, Plus } from "lucide-react";
import {
  useOrganizationSettings,
  useUpdateOrganizationSettings,
} from "../hooks";
import type { SecuritySettings as SecuritySettingsType } from "../types";

export function SecuritySettings() {
  const { data: settings, isPending } = useOrganizationSettings();
  const { mutate: updateSettings, isPending: isUpdating } =
    useUpdateOrganizationSettings();

  const [security, setSecurity] = useState<SecuritySettingsType>({
    mfaEnabled: false,
    sessionTimeout: 60,
    ipWhitelist: [],
  });

  const [newIp, setNewIp] = useState("");

  useEffect(() => {
    if (settings) {
      setSecurity(settings.security);
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ security });
  };

  const handleMfaToggle = () => {
    setSecurity((prev) => ({ ...prev, mfaEnabled: !prev.mfaEnabled }));
  };

  const handleTimeoutChange = (value: string) => {
    const timeout = parseInt(value, 10);
    if (!isNaN(timeout) && timeout > 0) {
      setSecurity((prev) => ({ ...prev, sessionTimeout: timeout }));
    }
  };

  const handleAddIp = () => {
    if (newIp && !security.ipWhitelist.includes(newIp)) {
      setSecurity((prev) => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, newIp],
      }));
      setNewIp("");
    }
  };

  const handleRemoveIp = (ip: string) => {
    setSecurity((prev) => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter((item) => item !== ip),
    }));
  };

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>
          Manage security settings for your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* MFA Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="mfa" className="text-base cursor-pointer">
                  Multi-Factor Authentication (MFA)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Require MFA for all users in your organization
                </p>
              </div>
            </div>
            <Switch
              id="mfa"
              checked={security.mfaEnabled}
              onCheckedChange={handleMfaToggle}
            />
          </div>

          <Separator />

          {/* Session Timeout */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="timeout" className="text-base">
                  Session Timeout
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically log out users after a period of inactivity
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    id="timeout"
                    type="number"
                    min="5"
                    max="1440"
                    value={security.sessionTimeout}
                    onChange={(e) => handleTimeoutChange(e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* IP Whitelist */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5 flex-1">
                <Label className="text-base">IP Whitelist</Label>
                <p className="text-sm text-muted-foreground">
                  Restrict access to specific IP addresses
                </p>

                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Enter IP address (e.g., 192.168.1.1)"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddIp();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddIp}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {security.ipWhitelist.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {security.ipWhitelist.map((ip) => (
                      <Badge
                        key={ip}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {ip}
                        <button
                          type="button"
                          onClick={() => handleRemoveIp(ip)}
                          className="ml-1 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {security.ipWhitelist.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    No IP addresses whitelisted. All IPs are allowed.
                  </p>
                )}
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isUpdating}>
            <Save className="mr-2 h-4 w-4" />
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
