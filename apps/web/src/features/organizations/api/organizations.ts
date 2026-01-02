/**
 * Organizations API Client
 */

import { apiClient } from "@/api";
import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationFilters,
  OrganizationResponse,
} from "../types";

const BASE_URL = "/api/v1/organizations";

export async function getOrganizations(
  filters?: OrganizationFilters
): Promise<OrganizationResponse> {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.offset) params.append("offset", filters.offset.toString());

  const response = await apiClient.get<OrganizationResponse>(BASE_URL, {
    params,
  });
  return response.data;
}

export async function getOrganization(id: string): Promise<Organization> {
  const response = await apiClient.get<Organization>(`${BASE_URL}/${id}`);
  return response.data;
}

export async function createOrganization(
  input: CreateOrganizationInput
): Promise<Organization> {
  const response = await apiClient.post<Organization>(BASE_URL, input);
  return response.data;
}

export async function updateOrganization(
  id: string,
  input: UpdateOrganizationInput
): Promise<Organization> {
  const response = await apiClient.put<Organization>(`${BASE_URL}/${id}`, input);
  return response.data;
}

export async function deleteOrganization(id: string): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`);
}

/**
 * Get user count for an organization
 */
export async function getOrganizationUserCount(id: string): Promise<number> {
  try {
    const response = await apiClient.get<{ total: number }>(
      `/api/v1/users?organization_id=${id}&limit=1`
    );
    return response.data.total || 0;
  } catch {
    return 0;
  }
}
