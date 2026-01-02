/**
 * Team types and interfaces
 */

export type TeamRole = "team_lead" | "member";

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  created_at: string;
}

export interface Team {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
}

export interface CreateTeamInput {
  name: string;
  description?: string;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
}

export interface AddTeamMemberInput {
  user_id: string;
  role: TeamRole;
}

export interface UpdateTeamMemberRoleInput {
  role: TeamRole;
}

export interface TeamFilters {
  search?: string;
  page?: number;
  page_size?: number;
}

export interface TeamResponse {
  records: Team[];
  total: number;
}
