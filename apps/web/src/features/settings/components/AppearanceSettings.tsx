import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Button,
} from "@/components/ui";
import { Sun, Moon, Monitor, Save } from "lucide-react";
import {
  useOrganizationSettings,
  useUpdateOrganizationSettings,
} from "../hooks";
import type { Theme } from "../types";

export function AppearanceSettings() {
  const { data: settings, isPending } = useOrganizationSettings();
  const { mutate: updateSettings, isPending: isUpdating } =
    useUpdateOrganizationSettings();

  const [selectedTheme, setSelectedTheme] = useState<Theme>("system");

  useEffect(() => {
    if (settings) {
      setSelectedTheme(settings.theme);
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ theme: selectedTheme });
  };

  const themeOptions: {
    value: Theme;
    label: string;
    icon: React.ReactNode;
    description: string;
  }[] = [
    {
      value: "light",
      label: "Light",
      icon: <Sun className="h-5 w-5" />,
      description: "Use light theme",
    },
    {
      value: "dark",
      label: "Dark",
      icon: <Moon className="h-5 w-5" />,
      description: "Use dark theme",
    },
    {
      value: "system",
      label: "System",
      icon: <Monitor className="h-5 w-5" />,
      description: "Follow system preferences",
    },
  ];

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize how Kaizen Studio looks on your device
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label>Theme</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedTheme(option.value)}
                  className={`
                    relative flex flex-col items-center gap-2 rounded-lg border-2 p-6 transition-all
                    ${
                      selectedTheme === option.value
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/50"
                    }
                  `}
                >
                  {option.icon}
                  <div className="text-center">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </div>
                  </div>
                  {selectedTheme === option.value && (
                    <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
                  )}
                </button>
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
