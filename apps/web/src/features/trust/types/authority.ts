/**
 * Authority Management Types
 *
 * Types specific to authority management UI (Phase 4)
 */

import type { AuthorityType } from "./index";

/**
 * Authority definition (UI-focused)
 */
export interface Authority {
  id: string;
  name: string;
  type: AuthorityType;
  description?: string;
  parentAuthorityId?: string;
  isActive: boolean;
  agentCount: number;
  certificateHash?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Input for creating a new authority
 */
export interface CreateAuthorityInput {
  name: string;
  type: AuthorityType;
  description?: string;
  parentAuthorityId?: string;
}

/**
 * Input for updating an authority
 */
export interface UpdateAuthorityInput {
  name?: string;
  description?: string;
  isActive?: boolean;
}

/**
 * Query filters for authorities
 */
export interface AuthorityFilters {
  type?: AuthorityType;
  isActive?: boolean;
  search?: string;
  sortBy?: "name" | "createdAt" | "agentCount";
  sortOrder?: "asc" | "desc";
}
