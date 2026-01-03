import type { Page } from "@playwright/test";
import { API_BASE_URL, getAuthHeaders } from "./auth";

/**
 * Trust fixture utilities for EATP E2E tests.
 * These functions create real trust data via the backend API.
 */

export interface TrustChainData {
  agent_id: string;
  authority_id: string;
  capabilities: string[];
  constraints: string[];
}

export interface CreatedTrustChain {
  agent_id: string;
  status: string;
  human_origin?: {
    human_id: string;
    display_name: string;
    auth_provider: string;
  };
}

/**
 * Create an organizational authority for trust establishment
 */
export async function createAuthority(
  page: Page,
  name: string = "E2E Test Authority"
): Promise<{ id: string; name: string } | null> {
  const headers = await getAuthHeaders(page);

  const response = await page.request.post(
    `${API_BASE_URL}/api/v1/trust/authorities?name=${encodeURIComponent(name)}`,
    { headers }
  );

  if (response.ok()) {
    return await response.json();
  }

  // If authority creation fails, try to get existing
  const listResponse = await page.request.get(
    `${API_BASE_URL}/api/v1/trust/authorities`,
    { headers }
  );

  if (listResponse.ok()) {
    const authorities = await listResponse.json();
    if (authorities.length > 0) {
      return authorities[0];
    }
  }

  return null;
}

/**
 * Establish a trust chain for an agent with human origin tracking
 */
export async function establishTrust(
  page: Page,
  data: TrustChainData
): Promise<CreatedTrustChain | null> {
  const headers = await getAuthHeaders(page);

  const response = await page.request.post(
    `${API_BASE_URL}/api/v1/trust/establish`,
    {
      headers,
      data: {
        agent_id: data.agent_id,
        authority_id: data.authority_id,
        capabilities: data.capabilities,
        constraints: data.constraints,
        expires_in_days: 30,
      },
    }
  );

  if (response.ok()) {
    return await response.json();
  }

  console.error("Failed to establish trust:", await response.text());
  return null;
}

/**
 * Create a delegation from one agent to another
 */
export async function delegateTrust(
  page: Page,
  delegatorId: string,
  delegateeId: string,
  capabilities: string[]
): Promise<boolean> {
  const headers = await getAuthHeaders(page);

  const response = await page.request.post(
    `${API_BASE_URL}/api/v1/trust/delegate`,
    {
      headers,
      data: {
        delegator_id: delegatorId,
        delegatee_id: delegateeId,
        capabilities,
        constraints: [],
        expires_in_days: 7,
      },
    }
  );

  return response.ok();
}

/**
 * Get the revocation impact preview for an agent
 */
export async function getRevocationImpact(
  page: Page,
  agentId: string
): Promise<{
  target_agent_id: string;
  affected_agents: Array<{ agent_id: string; delegation_depth: number }>;
  total_affected: number;
} | null> {
  const headers = await getAuthHeaders(page);

  const response = await page.request.get(
    `${API_BASE_URL}/api/v1/trust/revoke/${agentId}/impact`,
    { headers }
  );

  if (response.ok()) {
    return await response.json();
  }

  return null;
}

/**
 * Set up a complete trust hierarchy for EATP testing.
 * Creates:
 * - An authority
 * - A root agent with trust chain (has human origin)
 * - A delegated child agent
 * - A second-level delegated agent
 */
export async function setupTrustHierarchy(page: Page): Promise<{
  authority: { id: string; name: string };
  rootAgent: CreatedTrustChain;
  childAgent: CreatedTrustChain;
  grandchildAgent: CreatedTrustChain;
} | null> {
  // Create or get authority
  const authority = await createAuthority(page, "EATP Test Authority");
  if (!authority) {
    console.error("Failed to create authority");
    return null;
  }

  // Create root agent with trust chain
  const rootAgentId = `e2e-root-${Date.now()}`;
  const rootAgent = await establishTrust(page, {
    agent_id: rootAgentId,
    authority_id: authority.id,
    capabilities: ["read", "write", "execute", "delegate"],
    constraints: ["max_cost:1000", "time_window:business_hours"],
  });

  if (!rootAgent) {
    console.error("Failed to create root agent");
    return null;
  }

  // Create child agent (delegate from root)
  const childAgentId = `e2e-child-${Date.now()}`;
  const childAgent = await establishTrust(page, {
    agent_id: childAgentId,
    authority_id: authority.id,
    capabilities: ["read", "write"],
    constraints: ["max_cost:500"],
  });

  if (childAgent) {
    await delegateTrust(page, rootAgentId, childAgentId, ["read", "write"]);
  }

  // Create grandchild agent (delegate from child)
  const grandchildAgentId = `e2e-grandchild-${Date.now()}`;
  const grandchildAgent = await establishTrust(page, {
    agent_id: grandchildAgentId,
    authority_id: authority.id,
    capabilities: ["read"],
    constraints: ["max_cost:100"],
  });

  if (grandchildAgent) {
    await delegateTrust(page, childAgentId, grandchildAgentId, ["read"]);
  }

  return {
    authority,
    rootAgent: rootAgent!,
    childAgent: childAgent || rootAgent!,
    grandchildAgent: grandchildAgent || rootAgent!,
  };
}

/**
 * Clean up test trust chains by revoking them
 */
export async function cleanupTrustHierarchy(
  page: Page,
  agentIds: string[]
): Promise<void> {
  const headers = await getAuthHeaders(page);

  for (const agentId of agentIds) {
    await page.request.post(
      `${API_BASE_URL}/api/v1/trust/revoke?agent_id=${agentId}&reason=E2E%20test%20cleanup`,
      { headers }
    );
  }
}

/**
 * Get all trust chains for the current user's organization
 */
export async function listTrustChains(
  page: Page
): Promise<CreatedTrustChain[]> {
  const headers = await getAuthHeaders(page);

  const response = await page.request.get(
    `${API_BASE_URL}/api/v1/trust/chains`,
    { headers }
  );

  if (response.ok()) {
    const data = await response.json();
    return data.items || [];
  }

  return [];
}
