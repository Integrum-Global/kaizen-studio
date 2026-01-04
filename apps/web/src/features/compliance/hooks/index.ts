/**
 * Compliance Hooks
 *
 * React Query hooks for compliance data fetching and mutations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchComplianceDashboard,
  fetchTrustHealth,
  fetchConstraintViolations,
  fetchAuditEvents,
  acknowledgeAlert,
  exportComplianceReport,
  exportAuditTrail,
} from '../api';
import type { ComplianceFilter } from '../types';

/**
 * Query keys for compliance
 */
export const complianceKeys = {
  all: ['compliance'] as const,
  dashboard: (filter?: Partial<ComplianceFilter>) => [...complianceKeys.all, 'dashboard', filter] as const,
  health: () => [...complianceKeys.all, 'health'] as const,
  violations: (filter?: Partial<ComplianceFilter>) => [...complianceKeys.all, 'violations', filter] as const,
  auditEvents: (filter?: ComplianceFilter, page?: number) => [...complianceKeys.all, 'audit', filter, page] as const,
};

/**
 * Hook to fetch compliance dashboard data
 */
export function useComplianceDashboard(filter?: Partial<ComplianceFilter>) {
  return useQuery({
    queryKey: complianceKeys.dashboard(filter),
    queryFn: () => fetchComplianceDashboard(filter),
    refetchInterval: 60000, // Refresh every minute
  });
}

/**
 * Hook to fetch trust health metrics
 */
export function useTrustHealth() {
  return useQuery({
    queryKey: complianceKeys.health(),
    queryFn: fetchTrustHealth,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Hook to fetch constraint violations
 */
export function useConstraintViolations(filter?: Partial<ComplianceFilter>) {
  return useQuery({
    queryKey: complianceKeys.violations(filter),
    queryFn: () => fetchConstraintViolations(filter),
  });
}

/**
 * Hook to fetch audit events with pagination
 */
export function useAuditEvents(
  filter?: ComplianceFilter,
  page = 1,
  pageSize = 50
) {
  return useQuery({
    queryKey: complianceKeys.auditEvents(filter, page),
    queryFn: () => fetchAuditEvents(filter, page, pageSize),
  });
}

/**
 * Hook to acknowledge an alert
 */
export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
    },
  });
}

/**
 * Hook to export compliance report
 */
export function useExportComplianceReport() {
  return useMutation({
    mutationFn: exportComplianceReport,
    onSuccess: (blob, request) => {
      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report.${request.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });
}

/**
 * Hook to export audit trail
 */
export function useExportAuditTrail() {
  return useMutation({
    mutationFn: ({ filter, format }: { filter: ComplianceFilter; format: 'csv' | 'pdf' }) =>
      exportAuditTrail(filter, format),
    onSuccess: (blob, { format }) => {
      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-trail.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });
}
