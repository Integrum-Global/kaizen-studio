import { useMutation, useQuery } from "@tanstack/react-query";
import { auditApi } from "../api";
import type { AuditFilters, ExportAuditLogsInput } from "../types";
import { AxiosError } from "axios";

/**
 * Query key factory for audit logs
 */
export const auditKeys = {
  all: ["audit"] as const,
  lists: () => [...auditKeys.all, "list"] as const,
  list: (filters?: AuditFilters) => [...auditKeys.lists(), filters] as const,
  details: () => [...auditKeys.all, "detail"] as const,
  detail: (id: string) => [...auditKeys.details(), id] as const,
};

/**
 * Hook to get all audit logs with optional filters
 */
export function useAuditLogs(filters?: AuditFilters) {
  return useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: () => auditApi.getLogs(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get a single audit log by ID
 */
export function useAuditLog(id: string) {
  return useQuery({
    queryKey: auditKeys.detail(id),
    queryFn: () => auditApi.getById(id),
    enabled: !!id,
    staleTime: 60 * 1000, // 60 seconds
  });
}

/**
 * Hook to export audit logs
 */
export function useExportAuditLogs() {
  return useMutation({
    mutationFn: (input: ExportAuditLogsInput) => auditApi.export(input),
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString()}.${variables.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Export audit logs error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}
