# Settings Feature

The Settings feature provides organization and personal preference management for the Kaizen Studio platform.

## Overview

The settings page uses a tabbed interface for:
- **General**: Organization name, timezone, date format
- **Appearance**: Theme selection (light/dark/system)
- **Notifications**: Email and in-app notification preferences
- **Security**: Password management, 2FA, session settings

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/settings` | SettingsPage | Main settings with tabbed interface |
| `/api-keys` | ApiKeysPage | API key management |
| `/webhooks` | WebhooksPage | Webhook configuration |

## Components

### SettingsLayout
Container component with tab navigation.

Features:
- Horizontal tab navigation
- Icon indicators for each tab
- Responsive design (icons only on mobile)
- Content area for tab panels

### GeneralSettings
Organization and profile settings.

Features:
- Organization name input
- Timezone selector
- Date format preferences
- Save button with loading state

### AppearanceSettings
Theme and visual preferences.

Features:
- Theme selection (Light/Dark/System)
- Preview cards for each theme
- Immediate theme application

### NotificationSettings
Notification preferences management.

Features:
- Email notification toggles
- In-app notification toggles
- Notification categories (alerts, updates, marketing)
- Toggle switches with labels

### SecuritySettings
Security and authentication settings.

Features:
- Current password verification
- New password input with confirmation
- Two-factor authentication toggle
- Active sessions list

## Data Flow

The settings feature uses React Query for data fetching:

```typescript
// src/features/settings/api/settings.ts
export const settingsApi = {
  getSettings: async (): Promise<Settings> => { ... },
  updateSettings: async (settings: Partial<Settings>): Promise<Settings> => { ... },
  updatePassword: async (request: PasswordChange): Promise<void> => { ... },
  updateTheme: async (theme: Theme): Promise<void> => { ... },
};
```

## React Query Hooks

```typescript
// Available hooks from src/features/settings/hooks
useSettings()           // Get current settings
useUpdateSettings()     // Mutation for updating settings
```

## Types

Key TypeScript interfaces:

```typescript
type Theme = "light" | "dark" | "system";

interface Settings {
  organizationName: string;
  timezone: string;
  dateFormat: string;
  theme: Theme;
  notifications: NotificationSettings;
}

interface NotificationSettings {
  emailAlerts: boolean;
  emailUpdates: boolean;
  emailMarketing: boolean;
  inAppAlerts: boolean;
  inAppUpdates: boolean;
}
```

## Tab Structure

The settings page uses Radix UI Tabs:

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="appearance">Appearance</TabsTrigger>
    <TabsTrigger value="notifications">Notifications</TabsTrigger>
    <TabsTrigger value="security">Security</TabsTrigger>
  </TabsList>

  <TabsContent value="general">
    <GeneralSettings />
  </TabsContent>
  {/* ... other tab panels */}
</Tabs>
```

## Accessibility

The settings feature implements accessibility requirements:
- Proper tab navigation with arrow keys
- ARIA labels on form controls
- Focus management within tabs
- Color-independent theme previews
- Keyboard-accessible toggles

## Testing

Run settings tests:
```bash
npx playwright test e2e/settings.spec.ts --project=chromium
```

Tests cover:
- Tab navigation and switching
- Form visibility in each tab
- Responsive design (mobile/desktop)
- Keyboard navigation
- Accessibility requirements
