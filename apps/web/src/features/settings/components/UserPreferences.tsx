import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Button,
  Separator,
} from "@/components/ui";
import {
  Save,
  Sun,
  Moon,
  Monitor,
  Globe,
  Clock,
  Mail,
  Smartphone,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { useUserSettings, useUpdateUserSettings } from "../hooks";
import type { Theme, NotificationSettings } from "../types";

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
];

export function UserPreferences() {
  const { data: settings, isPending } = useUserSettings();
  const { mutate: updateSettings, isPending: isUpdating } =
    useUpdateUserSettings();

  const [theme, setTheme] = useState<Theme>("system");
  const [timezone, setTimezone] = useState("UTC");
  const [language, setLanguage] = useState("en");
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    push: true,
    slack: false,
    digest: false,
  });

  useEffect(() => {
    if (settings) {
      setTheme(settings.theme);
      setTimezone(settings.timezone);
      setLanguage(settings.language);
      setNotifications(settings.notifications);
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ theme, timezone, language, notifications });
  };

  const handleNotificationToggle = (field: keyof NotificationSettings) => {
    setNotifications((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] =
    [
      { value: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
      { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
      {
        value: "system",
        label: "System",
        icon: <Monitor className="h-4 w-4" />,
      },
    ];

  const notificationOptions = [
    {
      id: "email" as const,
      label: "Email",
      icon: <Mail className="h-4 w-4 text-muted-foreground" />,
    },
    {
      id: "push" as const,
      label: "Push",
      icon: <Smartphone className="h-4 w-4 text-muted-foreground" />,
    },
    {
      id: "slack" as const,
      label: "Slack",
      icon: <MessageSquare className="h-4 w-4 text-muted-foreground" />,
    },
    {
      id: "digest" as const,
      label: "Daily Digest",
      icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Preferences</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Preferences</CardTitle>
        <CardDescription>
          Customize your personal settings and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Theme Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              Theme
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={`
                    flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all
                    ${
                      theme === option.value
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/50"
                    }
                  `}
                >
                  {option.icon}
                  <span className="text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="user-timezone" className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Timezone
            </Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="user-timezone">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Language */}
          <div className="space-y-2">
            <Label htmlFor="user-language" className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Language
            </Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="user-language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Notification Preferences */}
          <div className="space-y-4">
            <Label className="text-base">Notification Preferences</Label>
            <div className="grid grid-cols-2 gap-4">
              {notificationOptions.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    {option.icon}
                    <Label
                      htmlFor={`user-${option.id}`}
                      className="cursor-pointer text-sm"
                    >
                      {option.label}
                    </Label>
                  </div>
                  <Switch
                    id={`user-${option.id}`}
                    checked={notifications[option.id]}
                    onCheckedChange={() => handleNotificationToggle(option.id)}
                  />
                </div>
              ))}
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
