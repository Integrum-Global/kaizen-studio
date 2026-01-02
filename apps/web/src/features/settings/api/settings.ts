import apiClient from "@/api";
import type {
  OrganizationSettings,
  UserSettings,
  UpdateOrganizationSettingsInput,
  UpdateUserSettingsInput,
} from "../types";

export const settingsApi = {
  /**
   * Get organization settings
   */
  getOrganizationSettings: async (): Promise<OrganizationSettings> => {
    const response = await apiClient.get<OrganizationSettings>(
      "/api/v1/settings/organization"
    );
    return response.data;
  },

  /**
   * Update organization settings
   */
  updateOrganizationSettings: async (
    input: UpdateOrganizationSettingsInput
  ): Promise<OrganizationSettings> => {
    const response = await apiClient.put<OrganizationSettings>(
      "/api/v1/settings/organization",
      input
    );
    return response.data;
  },

  /**
   * Get user settings
   */
  getUserSettings: async (): Promise<UserSettings> => {
    const response = await apiClient.get<UserSettings>("/api/v1/settings/user");
    return response.data;
  },

  /**
   * Update user settings
   */
  updateUserSettings: async (
    input: UpdateUserSettingsInput
  ): Promise<UserSettings> => {
    const response = await apiClient.put<UserSettings>(
      "/api/v1/settings/user",
      input
    );
    return response.data;
  },
};

export default settingsApi;
