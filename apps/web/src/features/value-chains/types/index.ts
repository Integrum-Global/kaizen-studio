/**
 * Value Chain Types
 *
 * Types for enterprise value chains spanning multiple departments.
 * Level 3 (Value Chain Owner) experience.
 */

/**
 * Trust status for a department or work unit
 */
export type TrustStatus = 'valid' | 'expiring' | 'expired' | 'revoked';

/**
 * Trust health summary for a value chain
 */
export interface TrustHealth {
  /** Number of valid trust relationships */
  valid: number;
  /** Number of expiring trust relationships (within 7 days) */
  expiring: number;
  /** Number of expired trust relationships */
  expired: number;
  /** Number of revoked trust relationships */
  revoked: number;
  /** Overall health percentage (0-100) */
  percentage: number;
  /** Overall status based on counts */
  status: TrustStatus;
}

/**
 * Department within a value chain
 */
export interface Department {
  id: string;
  name: string;
  description?: string;
  /** Work units in this department for this value chain */
  workUnitCount: number;
  /** Active users in this department for this value chain */
  userCount: number;
  /** Trust status of this department's work units */
  trustStatus: TrustStatus;
  /** Label for what this department does in the value chain */
  roleLabel?: string;
}

/**
 * Value chain metrics
 */
export interface ValueChainMetrics {
  /** Total number of departments */
  departmentCount: number;
  /** Total number of work units across all departments */
  workUnitCount: number;
  /** Total number of active users */
  userCount: number;
  /** Total executions today */
  executionsToday: number;
  /** Success rate (0-100) */
  successRate: number;
  /** Error count today */
  errorCount: number;
  /** Cost consumption vs budget (0-100+) */
  costPercentage: number;
}

/**
 * Value chain entity
 */
export interface ValueChain {
  id: string;
  name: string;
  description: string;
  /** Status: active, paused, archived */
  status: 'active' | 'paused' | 'archived';
  /** Departments in order of the value chain flow */
  departments: Department[];
  /** Trust health summary */
  trustHealth: TrustHealth;
  /** Metrics for this value chain */
  metrics: ValueChainMetrics;
  /** Last audit timestamp */
  lastAuditAt: string;
  /** Created timestamp */
  createdAt: string;
  /** Updated timestamp */
  updatedAt: string;
  /** Owner user ID */
  ownerId: string;
  /** Owner name for display */
  ownerName?: string;
}

/**
 * Enterprise overview metrics (aggregate across all value chains)
 */
export interface EnterpriseMetrics {
  /** Total active trust relationships */
  activeTrust: number;
  /** Trust relationships expiring soon */
  expiringTrust: number;
  /** Trust relationships with issues */
  issues: number;
  /** Total value chains */
  valueChainCount: number;
  /** Total departments across all value chains */
  departmentCount: number;
  /** Total work units across all value chains */
  workUnitCount: number;
  /** Total active users */
  userCount: number;
}

/**
 * Value chain card props
 */
export interface ValueChainCardProps {
  valueChain: ValueChain;
  onViewChain: () => void;
  onTrustMap: () => void;
  onCompliance: () => void;
  onAudit: () => void;
}

/**
 * Department flow visualization props
 */
export interface DepartmentFlowVisualizationProps {
  departments: Department[];
  trustStatus?: Record<string, TrustStatus>;
  compact?: boolean;
  className?: string;
}

/**
 * Enterprise overview props
 */
export interface EnterpriseOverviewProps {
  metrics: EnterpriseMetrics;
  onActiveTrustClick?: () => void;
  onExpiringClick?: () => void;
  onIssuesClick?: () => void;
  className?: string;
}

/**
 * Value chains list filters
 */
export interface ValueChainsFilter {
  status?: 'active' | 'paused' | 'archived' | 'all';
  departmentId?: string;
  trustStatus?: TrustStatus | 'all';
  searchQuery?: string;
}

/**
 * Value chains API response
 */
export interface ValueChainsResponse {
  valueChains: ValueChain[];
  total: number;
  hasMore: boolean;
}

/**
 * Enterprise metrics API response
 */
export interface EnterpriseMetricsResponse {
  metrics: EnterpriseMetrics;
  lastUpdated: string;
}
