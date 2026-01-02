import { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui";
import { Settings, Bell, Shield, User, Palette } from "lucide-react";

interface SettingsLayoutProps {
  children?: ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function SettingsLayout({
  children,
  activeTab = "general",
  onTabChange,
}: SettingsLayoutProps) {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your organization and personal preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">User Preferences</span>
          </TabsTrigger>
        </TabsList>

        {children}
      </Tabs>
    </div>
  );
}
