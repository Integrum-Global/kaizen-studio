/**
 * User types and interfaces
 */

export type UserRole = "org_owner" | "org_admin" | "developer" | "viewer";
export type UserStatus = "active" | "suspended" | "deleted";

/**
 * Main user interface
 */
export interface User {
  id: string;
  organization_id: string;
  email: string;
  name: string;
  status: UserStatus;
  role: UserRole;
  mfa_enabled: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create user request
 */
export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role: UserRole;
}

/**
 * Update user request
 */
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  mfa_enabled?: boolean;
}

/**
 * User filters for listing
 */
export interface UserFilters {
  status?: UserStatus;
  role?: UserRole;
  limit?: number;
  offset?: number;
}

/**
 * User response with pagination
 */
export interface UserResponse {
  records: User[];
  total: number;
}
