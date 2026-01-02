export interface User {
  id: string;
  email: string;
  name: string;
  organization_id: string;
  organization_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  organization_name: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface SSOInitiateResponse {
  authorization_url: string;
  state: string;
}

export interface SSOCallbackRequest {
  code: string;
  state: string;
}

// Multi-organization support
export interface OrganizationMembership {
  id: string;
  name: string;
  slug: string;
  role: string;
  is_primary: boolean;
  joined_at: string;
  joined_via: string;
}

export interface OrganizationsResponse {
  organizations: OrganizationMembership[];
}

export interface SwitchOrganizationRequest {
  organization_id: string;
}

export interface SwitchOrganizationResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  active_organization: OrganizationMembership;
}
