import apiClient from "@/api";
import type {
  Team,
  TeamWithMembers,
  TeamMember,
  CreateTeamInput,
  UpdateTeamInput,
  AddTeamMemberInput,
  UpdateTeamMemberRoleInput,
  TeamFilters,
  TeamResponse,
} from "../types";

/**
 * Team API client
 */
export const teamsApi = {
  /**
   * Get all teams with optional filters
   */
  getAll: async (filters?: TeamFilters): Promise<TeamResponse> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.page)
      params.append(
        "offset",
        ((filters.page - 1) * (filters.page_size || 50)).toString()
      );
    if (filters?.page_size)
      params.append("limit", filters.page_size.toString());

    const response = await apiClient.get<TeamResponse>(
      `/api/v1/teams?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get team by ID
   */
  getById: async (id: string): Promise<TeamWithMembers> => {
    const response = await apiClient.get<TeamWithMembers>(
      `/api/v1/teams/${id}`
    );
    return response.data;
  },

  /**
   * Create a new team
   */
  create: async (input: CreateTeamInput): Promise<Team> => {
    const response = await apiClient.post<Team>("/api/v1/teams", input);
    return response.data;
  },

  /**
   * Update team
   */
  update: async (id: string, input: UpdateTeamInput): Promise<Team> => {
    const response = await apiClient.put<Team>(`/api/v1/teams/${id}`, input);
    return response.data;
  },

  /**
   * Delete a team
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/teams/${id}`);
  },

  /**
   * Add member to team
   */
  addMember: async (
    teamId: string,
    input: AddTeamMemberInput
  ): Promise<TeamMember> => {
    const response = await apiClient.post<TeamMember>(
      `/api/v1/teams/${teamId}/members`,
      input
    );
    return response.data;
  },

  /**
   * Remove member from team
   */
  removeMember: async (teamId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/teams/${teamId}/members/${userId}`);
  },

  /**
   * Update team member role
   */
  updateMemberRole: async (
    teamId: string,
    userId: string,
    input: UpdateTeamMemberRoleInput
  ): Promise<TeamMember> => {
    const response = await apiClient.patch<TeamMember>(
      `/api/v1/teams/${teamId}/members/${userId}`,
      input
    );
    return response.data;
  },
};

export default teamsApi;
