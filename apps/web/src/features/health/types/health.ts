/**
 * Health monitoring types and interfaces
 */

export type HealthStatus = "healthy" | "degraded" | "down" | "unhealthy";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type ExportFormat = "json" | "pdf" | "csv";

/**
 * Represents the health status of a service
 */
export interface ServiceHealth {
  id: string;
  name: string;
  status: HealthStatus;
  latency: number; // in milliseconds
  uptime: number; // percentage (0-100)
  lastCheck: string; // ISO timestamp
  description?: string;
  endpoint?: string;
}

/**
 * Represents a single health check result
 */
export interface HealthCheck {
  id: string;
  serviceId: string;
  status: HealthStatus;
  responseTime: number; // in milliseconds
  timestamp: string; // ISO timestamp
  errorMessage?: string;
}

/**
 * Represents an incident or outage
 */
export interface Incident {
  id: string;
  serviceId?: string;
  title: string;
  severity: IncidentSeverity;
  status?: "open" | "investigating" | "resolved";
  startedAt: string; // ISO timestamp
  resolvedAt?: string; // ISO timestamp, null if ongoing
  duration?: number; // minutes
  affectedServices: string[];
  description: string;
  affectedUsers?: number;
}

/**
 * System-wide health overview
 */
export interface SystemHealth {
  status?: HealthStatus; // Overall status (for new API)
  overallStatus?: HealthStatus; // Alternative name
  timestamp?: string;
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  downServices: number;
  averageLatency: number;
  averageUptime: number;
  lastUpdated: string; // ISO timestamp
  services?: ServiceStatus[]; // Service list (for new API)
  metrics?: HealthMetrics; // Metrics (for new API)
  dependencies?: DependencyStatus[]; // Dependencies (for new API)
}

/**
 * Filters for health queries
 */
export interface HealthFilters {
  status?: HealthStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Uptime data point for charts
 */
export interface UptimeDataPoint {
  timestamp: string;
  uptime: number;
  latency: number;
}

/**
 * Service status for dashboard
 */
export interface ServiceStatus {
  id: string;
  name: string;
  status: HealthStatus;
  uptime: number; // Percentage
  latency: number; // ms (alias for responseTime)
  responseTime?: number; // ms
  lastCheck: string; // ISO timestamp
  description?: string;
  message?: string;
}

/**
 * Health metrics
 */
export interface HealthMetrics {
  responseTime: {
    avg: number;
    p95: number;
    p99: number;
  };
  errorRate: number; // Percentage
  requestCount: number;
  cpu: number; // Percentage
  memory: number; // Percentage
}

/**
 * Dependency status
 */
export interface DependencyStatus {
  name: string;
  type: string; // "external" | "internal"
  status: HealthStatus;
  lastCheck: string;
  message?: string;
}

/**
 * Health report
 */
export interface HealthReport {
  timestamp: string;
  systemHealth: SystemHealth;
  incidents: Incident[];
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
}
