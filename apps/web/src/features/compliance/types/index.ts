/**
 * Compliance Types
 *
 * Types for compliance dashboard and monitoring.
 * Level 3 (Value Chain Owner) experience.
 */

/**
 * Trust health metrics
 */
export interface TrustHealthMetrics {
  /** Number of valid trust relationships */
  valid: number;
  /** Number of expiring trust relationships */
  expiring: number;
  /** Number of expired trust relationships */
  expired: number;
  /** Number of revoked trust relationships */
  revoked: number;
  /** Total count */
  total: number;
  /** Overall health percentage (0-100) */
  percentage: number;
}

/**
 * Constraint violation record
 */
export interface ConstraintViolation {
  id: string;
  /** Timestamp of the violation */
  timestamp: string;
  /** Type of constraint that was violated */
  constraintType: string;
  /** The limit that was set */
  limit: string;
  /** The actual value that exceeded the limit */
  actual: string;
  /** User who caused the violation */
  userId: string;
  userName: string;
  /** Work unit where violation occurred */
  workUnitId: string;
  workUnitName: string;
  /** Department */
  departmentId: string;
  departmentName: string;
  /** Severity: warning, error, critical */
  severity: 'warning' | 'error' | 'critical';
  /** Whether the violation was resolved */
  resolved: boolean;
  /** Resolution details if resolved */
  resolution?: string;
}

/**
 * Weekly violations summary
 */
export interface WeeklyViolations {
  /** Week label (e.g., "W1", "Jan 1-7") */
  week: string;
  /** Start date of the week */
  startDate: string;
  /** End date of the week */
  endDate: string;
  /** Number of violations */
  count: number;
  /** Breakdown by severity */
  bySevertity: {
    warning: number;
    error: number;
    critical: number;
  };
}

/**
 * Audit event types
 */
export type AuditEventType =
  | 'ESTABLISH'
  | 'DELEGATE'
  | 'REVOKE'
  | 'VERIFY'
  | 'VIOLATION'
  | 'RENEW'
  | 'EXPIRE';

/**
 * Audit event record
 */
export interface AuditEvent {
  id: string;
  /** Event timestamp */
  timestamp: string;
  /** Type of event */
  type: AuditEventType;
  /** Description of the event */
  description: string;
  /** User who performed the action */
  actorId: string;
  actorName: string;
  /** Target user (for delegation events) */
  targetId?: string;
  targetName?: string;
  /** Department */
  departmentId?: string;
  departmentName?: string;
  /** Value chain (if applicable) */
  valueChainId?: string;
  valueChainName?: string;
  /** Work unit (if applicable) */
  workUnitId?: string;
  workUnitName?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Compliance alert
 */
export interface ComplianceAlert {
  id: string;
  /** Alert severity */
  severity: 'info' | 'warning' | 'error' | 'critical';
  /** Alert title */
  title: string;
  /** Alert description */
  description: string;
  /** Timestamp when alert was raised */
  timestamp: string;
  /** Whether the alert is acknowledged */
  acknowledged: boolean;
  /** Link to related entity */
  link?: string;
}

/**
 * Trust health bar props
 */
export interface TrustHealthBarProps {
  valid: number;
  expiring: number;
  expired: number;
  revoked: number;
  className?: string;
  showLegend?: boolean;
  showPercentage?: boolean;
  animate?: boolean;
}

/**
 * Constraint violations chart props
 */
export interface ConstraintViolationsChartProps {
  data: WeeklyViolations[];
  onWeekClick?: (week: string) => void;
  className?: string;
}

/**
 * Compliance filters
 */
export interface ComplianceFilter {
  departmentId?: string;
  userId?: string;
  valueChainId?: string;
  type?: AuditEventType | 'all';
  severity?: 'all' | 'warning' | 'error' | 'critical';
  dateRange?: {
    start: string;
    end: string;
  };
  searchQuery?: string;
}

/**
 * Compliance dashboard data
 */
export interface ComplianceDashboardData {
  trustHealth: TrustHealthMetrics;
  weeklyViolations: WeeklyViolations[];
  recentEvents: AuditEvent[];
  alerts: ComplianceAlert[];
  lastUpdated: string;
}

/**
 * Export format
 */
export type ExportFormat = 'pdf' | 'csv' | 'json';

/**
 * Export request
 */
export interface ExportRequest {
  format: ExportFormat;
  filter?: ComplianceFilter;
  includeAuditEvents?: boolean;
  includeViolations?: boolean;
  includeTrustHealth?: boolean;
}
