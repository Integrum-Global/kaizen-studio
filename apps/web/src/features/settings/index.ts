// Settings Feature Barrel Export

// Types - export with explicit names to avoid collision with component names
export type {
  Theme,
  NotificationSettings as NotificationSettingsType,
  SecuritySettings as SecuritySettingsType,
  OrganizationSettings,
  UserSettings,
  UpdateOrganizationSettingsInput,
  UpdateUserSettingsInput,
} from "./types";

// API
export { settingsApi } from "./api";

// Hooks
export {
  settingsKeys,
  useOrganizationSettings,
  useUpdateOrganizationSettings,
  useUserSettings,
  useUpdateUserSettings,
} from "./hooks";

// Components
export {
  SettingsLayout,
  GeneralSettings,
  AppearanceSettings,
  NotificationSettings,
  SecuritySettings,
  UserPreferences,
} from "./components";
