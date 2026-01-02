/**
 * Alert types and interfaces
 */

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertStatus = "active" | "resolved" | "acknowledged";
export type AlertOperator = "gt" | "lt" | "eq" | "gte" | "lte" | "ne";
export type AlertMetric =
  | "cpu_usage"
  | "memory_usage"
  | "disk_usage"
  | "response_time"
  | "error_rate"
  | "request_count"
  | "active_users"
  | "system_event";

export interface Alert {
  id: string;
  name: string;
  description?: string;
  severity: AlertSeverity;
  status: AlertStatus;
  metric: AlertMetric;
  condition: string;
  threshold: number;
  current_value?: number;
  rule_id?: string;
  triggered_at: string;
  resolved_at?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  metric: AlertMetric;
  operator: AlertOperator;
  threshold: number;
  duration: number; // seconds
  severity: AlertSeverity;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertHistory {
  id: string;
  alert_id: string;
  triggered_at: string;
  resolved_at?: string;
  duration?: number; // seconds
  value: number;
  threshold: number;
  severity: AlertSeverity;
  details?: string;
}

export interface CreateAlertRuleInput {
  name: string;
  description?: string;
  metric: AlertMetric;
  operator: AlertOperator;
  threshold: number;
  duration: number;
  severity: AlertSeverity;
  enabled?: boolean;
}

export interface UpdateAlertRuleInput {
  name?: string;
  description?: string;
  metric?: AlertMetric;
  operator?: AlertOperator;
  threshold?: number;
  duration?: number;
  severity?: AlertSeverity;
  enabled?: boolean;
}

export interface AcknowledgeAlertInput {
  note?: string;
}

export interface AlertFilters {
  search?: string;
  severity?: AlertSeverity;
  status?: AlertStatus;
  metric?: AlertMetric;
  page?: number;
  page_size?: number;
}

export interface AlertRuleFilters {
  search?: string;
  metric?: AlertMetric;
  severity?: AlertSeverity;
  enabled?: boolean;
  page?: number;
  page_size?: number;
}

export interface AlertResponse {
  records: Alert[];
  total: number;
}

export interface AlertRuleResponse {
  records: AlertRule[];
  total: number;
}

export interface AlertHistoryResponse {
  records: AlertHistory[];
  total: number;
}

export const alertMetricLabels: Record<AlertMetric, string> = {
  cpu_usage: "CPU Usage",
  memory_usage: "Memory Usage",
  disk_usage: "Disk Usage",
  response_time: "Response Time",
  error_rate: "Error Rate",
  request_count: "Request Count",
  active_users: "Active Users",
  system_event: "System Event",
};

export const alertOperatorLabels: Record<AlertOperator, string> = {
  gt: "Greater Than",
  lt: "Less Than",
  eq: "Equal To",
  gte: "Greater Than or Equal",
  lte: "Less Than or Equal",
  ne: "Not Equal To",
};

export const alertSeverityLabels: Record<AlertSeverity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
};
