/**
 * Value Chains API Client
 *
 * API functions for value chain operations.
 */

import type {
  ValueChain,
  ValueChainsFilter,
  ValueChainsResponse,
  EnterpriseMetricsResponse,
} from '../types';

const API_BASE = '/api';

/**
 * Fetch value chains list
 */
export async function fetchValueChains(
  filter?: ValueChainsFilter
): Promise<ValueChainsResponse> {
  const params = new URLSearchParams();

  if (filter?.status && filter.status !== 'all') {
    params.append('status', filter.status);
  }
  if (filter?.departmentId) {
    params.append('departmentId', filter.departmentId);
  }
  if (filter?.trustStatus && filter.trustStatus !== 'all') {
    params.append('trustStatus', filter.trustStatus);
  }
  if (filter?.searchQuery) {
    params.append('q', filter.searchQuery);
  }

  const queryString = params.toString();
  const url = `${API_BASE}/value-chains${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch value chains: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch single value chain by ID
 */
export async function fetchValueChain(id: string): Promise<ValueChain> {
  const response = await fetch(`${API_BASE}/value-chains/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch value chain: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch enterprise metrics
 */
export async function fetchEnterpriseMetrics(): Promise<EnterpriseMetricsResponse> {
  const response = await fetch(`${API_BASE}/value-chains/metrics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch enterprise metrics: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new value chain
 */
export async function createValueChain(
  data: Omit<ValueChain, 'id' | 'createdAt' | 'updatedAt' | 'trustHealth' | 'metrics' | 'lastAuditAt'>
): Promise<ValueChain> {
  const response = await fetch(`${API_BASE}/value-chains`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create value chain: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update a value chain
 */
export async function updateValueChain(
  id: string,
  data: Partial<ValueChain>
): Promise<ValueChain> {
  const response = await fetch(`${API_BASE}/value-chains/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update value chain: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a value chain
 */
export async function deleteValueChain(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/value-chains/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete value chain: ${response.statusText}`);
  }
}

/**
 * Add department to value chain
 */
export async function addDepartmentToValueChain(
  valueChainId: string,
  departmentId: string
): Promise<ValueChain> {
  const response = await fetch(
    `${API_BASE}/value-chains/${valueChainId}/departments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ departmentId }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to add department: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Remove department from value chain
 */
export async function removeDepartmentFromValueChain(
  valueChainId: string,
  departmentId: string
): Promise<ValueChain> {
  const response = await fetch(
    `${API_BASE}/value-chains/${valueChainId}/departments/${departmentId}`,
    { method: 'DELETE' }
  );

  if (!response.ok) {
    throw new Error(`Failed to remove department: ${response.statusText}`);
  }

  return response.json();
}
