import { useState } from "react";
import {
  SettingsLayout,
  GeneralSettings,
  AppearanceSettings,
  NotificationSettings,
  SecuritySettings,
} from "@/features/settings";
import { TabsContent } from "@/components/ui";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <SettingsLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <TabsContent value="general" className="space-y-6">
        <GeneralSettings />
      </TabsContent>

      <TabsContent value="appearance" className="space-y-6">
        <AppearanceSettings />
      </TabsContent>

      <TabsContent value="notifications" className="space-y-6">
        <NotificationSettings />
      </TabsContent>

      <TabsContent value="security" className="space-y-6">
        <SecuritySettings />
      </TabsContent>
    </SettingsLayout>
  );
}
