import apiClient from "@/api";
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
  UserResponse,
} from "../types";

/**
 * User API client
 */
export const usersApi = {
  /**
   * Get all users with optional filters
   */
  getAll: async (filters?: UserFilters): Promise<UserResponse> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.role) params.append("role", filters.role);
    if (filters?.limit !== undefined)
      params.append("limit", filters.limit.toString());
    if (filters?.offset !== undefined)
      params.append("offset", filters.offset.toString());

    const response = await apiClient.get<UserResponse>(
      `/api/v1/users?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get user by ID
   */
  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/api/v1/users/${id}`);
    return response.data;
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>("/api/v1/users/me");
    return response.data;
  },

  /**
   * Create a new user
   */
  create: async (input: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post<User>("/api/v1/users", input);
    return response.data;
  },

  /**
   * Update user
   */
  update: async (id: string, input: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.put<User>(`/api/v1/users/${id}`, input);
    return response.data;
  },

  /**
   * Delete a user (soft delete)
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/users/${id}`);
  },
};

export default usersApi;
