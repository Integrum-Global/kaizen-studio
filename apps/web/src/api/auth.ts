import apiClient from "./index";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  RefreshTokenRequest,
  SSOInitiateResponse,
  SSOCallbackRequest,
  OrganizationsResponse,
  SwitchOrganizationRequest,
  SwitchOrganizationResponse,
} from "../types/auth";

export const authApi = {
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      "/api/v1/auth/register",
      data
    );
    return response.data;
  },

  /**
   * Login with email and password
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      "/api/v1/auth/login",
      data
    );
    return response.data;
  },

  /**
   * Logout the current user
   */
  logout: async (): Promise<void> => {
    await apiClient.post("/api/v1/auth/logout");
  },

  /**
   * Refresh access token using refresh token
   */
  refreshToken: async (data: RefreshTokenRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      "/api/v1/auth/refresh",
      data
    );
    return response.data;
  },

  /**
   * Get current user information
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>("/api/v1/auth/me");
    return response.data;
  },

  /**
   * Get current user permissions
   */
  getPermissions: async (): Promise<string[]> => {
    const response = await apiClient.get<{ permissions: string[] }>(
      "/api/v1/auth/permissions"
    );
    return response.data.permissions;
  },

  /**
   * Initiate SSO login with a provider
   */
  ssoInitiate: async (provider: string): Promise<SSOInitiateResponse> => {
    const response = await apiClient.get<{ auth_url: string; state: string }>(
      `/api/v1/sso/initiate/${provider}`
    );
    return {
      authorization_url: response.data.auth_url,
      state: response.data.state,
    };
  },

  /**
   * Complete SSO callback after provider authentication
   */
  ssoCallback: async (
    provider: string,
    code: string,
    state: string
  ): Promise<AuthResponse> => {
    const data: SSOCallbackRequest = { code, state };
    const response = await apiClient.post<AuthResponse>(
      `/api/v1/sso/${provider}/callback`,
      data
    );
    return response.data;
  },

  // Multi-organization support

  /**
   * Get all organizations the current user belongs to
   */
  getOrganizations: async (): Promise<OrganizationsResponse> => {
    const response = await apiClient.get<OrganizationsResponse>(
      "/api/v1/auth/me/organizations"
    );
    return response.data;
  },

  /**
   * Switch to a different organization
   */
  switchOrganization: async (
    data: SwitchOrganizationRequest
  ): Promise<SwitchOrganizationResponse> => {
    const response = await apiClient.post<SwitchOrganizationResponse>(
      "/api/v1/auth/me/switch-org",
      data
    );
    return response.data;
  },
};

export default authApi;
