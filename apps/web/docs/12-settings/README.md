# Settings

The Settings feature provides comprehensive configuration management for organizations and users in Kaizen Studio.

## Overview

Settings allow users to customize their Kaizen Studio experience across multiple areas:

- General organization settings
- Appearance and theming
- Notification preferences
- Security configuration
- User preferences

## Feature Structure

```
src/features/settings/
├── api.ts                       # API layer with settingsApi
├── hooks.ts                     # React Query hooks
├── types.ts                     # TypeScript interfaces
├── index.ts                     # Barrel export
└── components/
    ├── SettingsLayout.tsx       # Layout with navigation
    ├── GeneralSettings.tsx      # Organization settings
    ├── AppearanceSettings.tsx   # Theme settings
    ├── NotificationSettings.tsx # Notification prefs
    ├── SecuritySettings.tsx     # Security config
    ├── UserPreferences.tsx      # User-specific settings
    └── __tests__/               # Component tests
```

## Types

```typescript
type Theme = 'light' | 'dark' | 'system';

interface NotificationSettings {
  email: boolean;
  push: boolean;
  slack: boolean;
  digest: boolean;
}

interface SecuritySettings {
  mfaEnabled: boolean;
  sessionTimeout: number;  // minutes
  ipWhitelist: string[];
}

interface OrganizationSettings {
  id: string;
  organizationId: string;
  name: string;
  theme: Theme;
  timezone: string;
  language: string;
  notifications: NotificationSettings;
  security: SecuritySettings;
  createdAt: string;
  updatedAt: string;
}

interface UserSettings {
  id: string;
  userId: string;
  theme: Theme;
  language: string;
  notifications: NotificationSettings;
  dashboard: DashboardPreferences;
  createdAt: string;
  updatedAt: string;
}
```

## API Layer

```typescript
import { settingsApi } from '@/features/settings';

// Organization settings
const orgSettings = await settingsApi.getOrganizationSettings();
await settingsApi.updateOrganizationSettings({
  name: 'Acme Inc',
  timezone: 'America/New_York',
});

// User settings
const userSettings = await settingsApi.getUserSettings();
await settingsApi.updateUserSettings({
  theme: 'dark',
  language: 'en',
});
```

## Hooks

```typescript
import {
  useOrganizationSettings,
  useUpdateOrganizationSettings,
  useUserSettings,
  useUpdateUserSettings,
} from '@/features/settings';

// Organization settings
const { data: orgSettings, isPending } = useOrganizationSettings();
const updateOrg = useUpdateOrganizationSettings();
await updateOrg.mutateAsync({ name: 'New Name' });

// User settings
const { data: userSettings } = useUserSettings();
const updateUser = useUpdateUserSettings();
await updateUser.mutateAsync({ theme: 'dark' });
```

## Components

### SettingsLayout

Layout component with sidebar navigation for settings sections.

```tsx
import { SettingsLayout } from '@/features/settings';

function SettingsPage() {
  return (
    <SettingsLayout>
      <GeneralSettings />
    </SettingsLayout>
  );
}
```

Navigation items:
- General
- Appearance
- Notifications
- Security

### GeneralSettings

Organization-level configuration including name, timezone, and language.

```tsx
import { GeneralSettings } from '@/features/settings';

<GeneralSettings />

// Manages:
// - Organization name
// - Default timezone
// - Default language
```

### AppearanceSettings

Theme and visual preferences.

```tsx
import { AppearanceSettings } from '@/features/settings';

<AppearanceSettings />

// Options:
// - Light theme
// - Dark theme
// - System (follows OS)
```

### NotificationSettings

Notification channel preferences.

```tsx
import { NotificationSettings } from '@/features/settings';

<NotificationSettings />

// Channels:
// - Email notifications
// - Push notifications
// - Slack integration
// - Daily digest
```

### SecuritySettings

Security configuration for the organization.

```tsx
import { SecuritySettings } from '@/features/settings';

<SecuritySettings />

// Options:
// - MFA enforcement
// - Session timeout
// - IP whitelist
```

### UserPreferences

Individual user settings.

```tsx
import { UserPreferences } from '@/features/settings';

<UserPreferences />

// Includes:
// - Personal theme override
// - Language preference
// - Dashboard configuration
```

## Timezone Support

The timezone selector supports all IANA time zones:

```typescript
const commonTimezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];
```

## Language Support

Supported languages:
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `ja` - Japanese
- `zh` - Chinese

## Testing

The feature includes 14 tests covering:

- Form rendering
- Setting updates
- Loading states
- Theme switching
- Notification toggles

Run tests:

```bash
npm run test -- settings
```

## Related Features

- [Authentication](../04-authentication/README.md) - Session management
- [Teams](../09-teams/README.md) - Team-level settings
