import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Switch,
  Button,
  Separator,
} from "@/components/ui";
import { Save, Mail, Smartphone, MessageSquare, Calendar } from "lucide-react";
import {
  useOrganizationSettings,
  useUpdateOrganizationSettings,
} from "../hooks";
import type { NotificationSettings as NotificationSettingsType } from "../types";

export function NotificationSettings() {
  const { data: settings, isPending } = useOrganizationSettings();
  const { mutate: updateSettings, isPending: isUpdating } =
    useUpdateOrganizationSettings();

  const [notifications, setNotifications] = useState<NotificationSettingsType>({
    email: true,
    push: true,
    slack: false,
    digest: false,
  });

  useEffect(() => {
    if (settings) {
      setNotifications(settings.notifications);
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ notifications });
  };

  const handleToggle = (field: keyof NotificationSettingsType) => {
    setNotifications((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const notificationOptions = [
    {
      id: "email" as const,
      label: "Email Notifications",
      description: "Receive notifications via email",
      icon: <Mail className="h-5 w-5 text-muted-foreground" />,
    },
    {
      id: "push" as const,
      label: "Push Notifications",
      description: "Receive browser push notifications",
      icon: <Smartphone className="h-5 w-5 text-muted-foreground" />,
    },
    {
      id: "slack" as const,
      label: "Slack Notifications",
      description: "Receive notifications in Slack",
      icon: <MessageSquare className="h-5 w-5 text-muted-foreground" />,
    },
    {
      id: "digest" as const,
      label: "Daily Digest",
      description: "Receive a daily summary of activities",
      icon: <Calendar className="h-5 w-5 text-muted-foreground" />,
    },
  ];

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Manage how you receive notifications about your organization's
          activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {notificationOptions.map((option, index) => (
              <div key={option.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    {option.icon}
                    <div className="space-y-0.5">
                      <Label
                        htmlFor={option.id}
                        className="text-base cursor-pointer"
                      >
                        {option.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={option.id}
                    checked={notifications[option.id]}
                    onCheckedChange={() => handleToggle(option.id)}
                  />
                </div>
              </div>
            ))}
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
