/**
 * Settings types and interfaces
 */

export type Theme = "light" | "dark" | "system";

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  slack: boolean;
  digest: boolean;
}

export interface SecuritySettings {
  mfaEnabled: boolean;
  sessionTimeout: number; // minutes
  ipWhitelist: string[];
}

export interface OrganizationSettings {
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

export interface UserSettings {
  id: string;
  userId: string;
  theme: Theme;
  timezone: string;
  language: string;
  notifications: NotificationSettings;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrganizationSettingsInput {
  name?: string;
  theme?: Theme;
  timezone?: string;
  language?: string;
  notifications?: Partial<NotificationSettings>;
  security?: Partial<SecuritySettings>;
}

export interface UpdateUserSettingsInput {
  theme?: Theme;
  timezone?: string;
  language?: string;
  notifications?: Partial<NotificationSettings>;
}
