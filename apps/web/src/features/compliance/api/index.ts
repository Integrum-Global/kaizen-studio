/**
 * Compliance API Client
 *
 * API functions for compliance operations.
 */

import type {
  ComplianceDashboardData,
  ComplianceFilter,
  AuditEvent,
  ConstraintViolation,
  ExportRequest,
} from '../types';

const API_BASE = '/api';

/**
 * Fetch compliance dashboard data
 */
export async function fetchComplianceDashboard(
  filter?: Partial<ComplianceFilter>
): Promise<ComplianceDashboardData> {
  const params = new URLSearchParams();

  if (filter?.valueChainId) {
    params.append('valueChainId', filter.valueChainId);
  }
  if (filter?.departmentId) {
    params.append('departmentId', filter.departmentId);
  }
  if (filter?.dateRange) {
    params.append('startDate', filter.dateRange.start);
    params.append('endDate', filter.dateRange.end);
  }

  const queryString = params.toString();
  const url = `${API_BASE}/compliance/dashboard${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch compliance dashboard: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch trust health metrics
 */
export async function fetchTrustHealth(): Promise<ComplianceDashboardData['trustHealth']> {
  const response = await fetch(`${API_BASE}/compliance/health`);
  if (!response.ok) {
    throw new Error(`Failed to fetch trust health: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch constraint violations
 */
export async function fetchConstraintViolations(
  filter?: Partial<ComplianceFilter>
): Promise<ConstraintViolation[]> {
  const params = new URLSearchParams();

  if (filter?.departmentId) {
    params.append('departmentId', filter.departmentId);
  }
  if (filter?.userId) {
    params.append('userId', filter.userId);
  }
  if (filter?.severity && filter.severity !== 'all') {
    params.append('severity', filter.severity);
  }
  if (filter?.dateRange) {
    params.append('startDate', filter.dateRange.start);
    params.append('endDate', filter.dateRange.end);
  }

  const queryString = params.toString();
  const url = `${API_BASE}/compliance/violations${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch violations: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch audit events
 */
export async function fetchAuditEvents(
  filter?: ComplianceFilter,
  page = 1,
  pageSize = 50
): Promise<{ events: AuditEvent[]; total: number; hasMore: boolean }> {
  const params = new URLSearchParams();

  params.append('page', page.toString());
  params.append('pageSize', pageSize.toString());

  if (filter?.departmentId) {
    params.append('departmentId', filter.departmentId);
  }
  if (filter?.userId) {
    params.append('userId', filter.userId);
  }
  if (filter?.valueChainId) {
    params.append('valueChainId', filter.valueChainId);
  }
  if (filter?.type && filter.type !== 'all') {
    params.append('type', filter.type);
  }
  if (filter?.dateRange) {
    params.append('startDate', filter.dateRange.start);
    params.append('endDate', filter.dateRange.end);
  }
  if (filter?.searchQuery) {
    params.append('q', filter.searchQuery);
  }

  const url = `${API_BASE}/audit/enterprise?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch audit events: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Acknowledge a compliance alert
 */
export async function acknowledgeAlert(alertId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/compliance/alerts/${alertId}/acknowledge`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Failed to acknowledge alert: ${response.statusText}`);
  }
}

/**
 * Export compliance report
 */
export async function exportComplianceReport(request: ExportRequest): Promise<Blob> {
  const response = await fetch(`${API_BASE}/compliance/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to export report: ${response.statusText}`);
  }

  return response.blob();
}

/**
 * Export audit trail
 */
export async function exportAuditTrail(
  filter: ComplianceFilter,
  format: 'csv' | 'pdf'
): Promise<Blob> {
  const response = await fetch(`${API_BASE}/audit/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filter, format }),
  });

  if (!response.ok) {
    throw new Error(`Failed to export audit trail: ${response.statusText}`);
  }

  return response.blob();
}
