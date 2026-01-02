import apiClient from "@/api";
import type {
  AuditLog,
  AuditFilters,
  AuditResponse,
  ExportAuditLogsInput,
} from "../types";

/**
 * Audit logs API client
 */
export const auditApi = {
  /**
   * Get all audit logs with optional filters
   */
  getLogs: async (filters?: AuditFilters): Promise<AuditResponse> => {
    const params = new URLSearchParams();
    // organization_id is required by the backend
    if (filters?.organization_id)
      params.append("organization_id", filters.organization_id);
    if (filters?.action) params.append("action", filters.action);
    if (filters?.actor) params.append("user_id", filters.actor);
    if (filters?.resource) params.append("resource_type", filters.resource);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.startDate) params.append("start_date", filters.startDate);
    if (filters?.endDate) params.append("end_date", filters.endDate);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.page)
      params.append(
        "offset",
        ((filters.page - 1) * (filters.pageSize || 20)).toString()
      );
    if (filters?.pageSize) params.append("limit", filters.pageSize.toString());

    const response = await apiClient.get<
      { logs: AuditLog[]; total: number } | AuditLog[]
    >(`/api/v1/audit/logs?${params.toString()}`);

    // Handle both array and paginated response formats
    if (Array.isArray(response.data)) {
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 20;
      return {
        logs: response.data,
        total: response.data.length,
        page,
        pageSize,
      };
    }

    const data = response.data;
    return {
      logs: data.logs || [],
      total: data.total || 0,
      page: filters?.page || 1,
      pageSize: filters?.pageSize || 20,
    };
  },

  /**
   * Get audit log by ID
   */
  getById: async (id: string): Promise<AuditLog> => {
    const response = await apiClient.get<AuditLog>(`/api/v1/audit/logs/${id}`);
    return response.data;
  },

  /**
   * Export audit logs
   */
  export: async (input: ExportAuditLogsInput): Promise<Blob> => {
    const params = new URLSearchParams();
    params.append("format", input.format);

    if (input.filters?.action) params.append("action", input.filters.action);
    if (input.filters?.actor) params.append("actor", input.filters.actor);
    if (input.filters?.resource)
      params.append("resource", input.filters.resource);
    if (input.filters?.status) params.append("status", input.filters.status);
    if (input.filters?.startDate)
      params.append("start_date", input.filters.startDate);
    if (input.filters?.endDate)
      params.append("end_date", input.filters.endDate);
    if (input.filters?.search) params.append("search", input.filters.search);

    const response = await apiClient.get(
      `/api/v1/audit/export?${params.toString()}`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  },
};

export default auditApi;
