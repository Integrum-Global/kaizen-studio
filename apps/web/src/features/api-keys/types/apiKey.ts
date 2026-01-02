/**
 * API Key types and interfaces
 */

export type ApiKeyStatus = "active" | "revoked" | "expired";

export interface ApiKey {
  id: string;
  name: string;
  key: string; // Masked key (e.g., "kks_abc...xyz")
  prefix: string; // Key prefix (e.g., "kks_abc")
  permissions: string[];
  scopes: string[];
  lastUsedAt?: string;
  expiresAt?: string;
  status: ApiKeyStatus;
  createdBy: string;
  createdAt: string;
}

export interface CreateApiKeyInput {
  name: string;
  permissions: string[];
  scopes: string[];
  expiresAt?: string;
}

export interface ApiKeyFilters {
  search?: string;
  status?: ApiKeyStatus;
  page?: number;
  page_size?: number;
}

export interface ApiKeyResponse {
  keys: ApiKey[];
  total: number;
  page: number;
  page_size: number;
}

export interface NewApiKeyResponse {
  key: ApiKey;
  fullKey: string; // Full key shown only once
}
