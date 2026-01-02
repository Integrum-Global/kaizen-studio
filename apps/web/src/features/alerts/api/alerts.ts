import apiClient from "@/api";
import type {
  Alert,
  AlertRule,
  AlertHistory,
  CreateAlertRuleInput,
  UpdateAlertRuleInput,
  AcknowledgeAlertInput,
  AlertFilters,
  AlertRuleFilters,
  AlertResponse,
  AlertRuleResponse,
  AlertHistoryResponse,
} from "../types";

/**
 * Transform audit log to Alert format
 */
function transformAuditToAlert(audit: Record<string, unknown>): Alert {
  const action = audit.action as string;
  const details = audit.details as string;

  // Determine severity from action type
  let severity: Alert["severity"] = "info";
  if (action?.includes("critical") || action?.includes("delete")) {
    severity = "critical";
  } else if (action?.includes("error") || action?.includes("fail")) {
    severity = "warning";
  }

  // Determine status from action
  let status: Alert["status"] = "active";
  if (action?.includes("resolved") || action?.includes("completed")) {
    status = "resolved";
  } else if (action?.includes("acknowledged")) {
    status = "acknowledged";
  }

  return {
    id: audit.id as string,
    name: `${audit.resource_type || "System"} Alert`,
    description: details || `${action?.replace(/_/g, " ")}`,
    severity,
    status,
    metric: "system_event",
    condition: action || "unknown",
    threshold: 0,
    current_value: 0,
    rule_id: undefined,
    triggered_at: audit.created_at as string,
    resolved_at:
      status === "resolved" ? (audit.created_at as string) : undefined,
    acknowledged_at:
      status === "acknowledged" ? (audit.created_at as string) : undefined,
    acknowledged_by: audit.user_id as string | undefined,
    created_at: audit.created_at as string,
    updated_at: audit.created_at as string,
  };
}

/**
 * Transform webhook to AlertRule format (using webhooks as rule proxy)
 */
function transformWebhookToRule(webhook: Record<string, unknown>): AlertRule {
  return {
    id: webhook.id as string,
    name: (webhook.name as string) || "Unnamed Rule",
    description: webhook.description as string | undefined,
    metric: "system_event",
    operator: "gt",
    threshold: 0,
    duration: 300,
    severity: "warning",
    enabled: (webhook.is_active as boolean) ?? true,
    created_at: webhook.created_at as string,
    updated_at: webhook.updated_at as string,
  };
}

export const alertsApi = {
  /**
   * Get all alerts with optional filters
   */
  getAll: async (filters?: AlertFilters): Promise<AlertResponse> => {
    try {
      const params: Record<string, string | number> = {
        limit: filters?.page_size || 12,
        offset: ((filters?.page || 1) - 1) * (filters?.page_size || 12),
      };

      const response = await apiClient.get<{
        records: Record<string, unknown>[];
        total: number;
      }>("/api/v1/audit", { params });

      let alerts = (response.data.records || []).map(transformAuditToAlert);

      // Apply filters
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        alerts = alerts.filter(
          (alert) =>
            alert.name.toLowerCase().includes(search) ||
            alert.description?.toLowerCase().includes(search)
        );
      }

      if (filters?.severity) {
        alerts = alerts.filter((alert) => alert.severity === filters.severity);
      }

      if (filters?.status) {
        alerts = alerts.filter((alert) => alert.status === filters.status);
      }

      return {
        records: alerts,
        total: response.data.total || alerts.length,
      };
    } catch {
      return { records: [], total: 0 };
    }
  },

  /**
   * Get alert by ID
   */
  getById: async (id: string): Promise<Alert> => {
    const response = await apiClient.get<{
      records: Record<string, unknown>[];
    }>("/api/v1/audit", { params: { limit: 100 } });

    const audit = (response.data.records || []).find(
      (a) => (a.id as string) === id
    );
    if (!audit) {
      throw new Error("Alert not found");
    }

    return transformAuditToAlert(audit);
  },

  /**
   * Acknowledge an alert (log audit event)
   */
  acknowledge: async (
    id: string,
    _input: AcknowledgeAlertInput
  ): Promise<Alert> => {
    // In a real implementation, this would update the alert state
    // For now, just return an acknowledged version of the alert
    const alert = await alertsApi.getById(id);
    return {
      ...alert,
      status: "acknowledged",
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: "current-user",
    };
  },

  /**
   * Resolve an alert (log audit event)
   */
  resolve: async (id: string): Promise<Alert> => {
    // In a real implementation, this would update the alert state
    const alert = await alertsApi.getById(id);
    return {
      ...alert,
      status: "resolved",
      resolved_at: new Date().toISOString(),
    };
  },

  /**
   * Get alert history
   */
  getHistory: async (alertId: string): Promise<AlertHistoryResponse> => {
    // Use audit logs for history
    const response = await apiClient.get<{
      records: Record<string, unknown>[];
    }>("/api/v1/audit", { params: { limit: 50 } });

    const history: AlertHistory[] = (response.data.records || [])
      .slice(0, 20)
      .map((audit, i) => ({
        id: `history-${alertId}-${i}`,
        alert_id: alertId,
        triggered_at: audit.created_at as string,
        resolved_at: undefined,
        duration: undefined,
        value: 0,
        threshold: 0,
        severity: "info" as const,
        details: (audit.details as string) || "No details",
      }));

    return {
      records: history,
      total: history.length,
    };
  },

  /**
   * Alert Rules API (using webhooks as proxy)
   */
  rules: {
    /**
     * Get all alert rules
     */
    getAll: async (filters?: AlertRuleFilters): Promise<AlertRuleResponse> => {
      try {
        const response = await apiClient.get<{
          records: Record<string, unknown>[];
          total: number;
        }>("/api/v1/webhooks");

        let rules = (response.data.records || []).map(transformWebhookToRule);

        // Apply filters
        if (filters?.search) {
          const search = filters.search.toLowerCase();
          rules = rules.filter(
            (rule) =>
              rule.name.toLowerCase().includes(search) ||
              rule.description?.toLowerCase().includes(search)
          );
        }

        if (filters?.enabled !== undefined) {
          rules = rules.filter((rule) => rule.enabled === filters.enabled);
        }

        // Pagination
        const page = filters?.page || 1;
        const pageSize = filters?.page_size || 12;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;

        return {
          records: rules.slice(start, end),
          total: response.data.total || rules.length,
        };
      } catch {
        return { records: [], total: 0 };
      }
    },

    /**
     * Get alert rule by ID
     */
    getById: async (id: string): Promise<AlertRule> => {
      const response = await apiClient.get<Record<string, unknown>>(
        `/api/v1/webhooks/${id}`
      );
      return transformWebhookToRule(response.data);
    },

    /**
     * Create a new alert rule (creates webhook)
     */
    create: async (input: CreateAlertRuleInput): Promise<AlertRule> => {
      const response = await apiClient.post<Record<string, unknown>>(
        "/api/v1/webhooks",
        {
          name: input.name,
          description: input.description,
          url: "https://alerts.internal/notify", // Placeholder URL
          events: ["alert.triggered"],
          is_active: input.enabled ?? true,
        }
      );

      return transformWebhookToRule(response.data);
    },

    /**
     * Update alert rule
     */
    update: async (
      id: string,
      input: UpdateAlertRuleInput
    ): Promise<AlertRule> => {
      const response = await apiClient.put<Record<string, unknown>>(
        `/api/v1/webhooks/${id}`,
        {
          name: input.name,
          description: input.description,
          is_active: input.enabled,
        }
      );

      return transformWebhookToRule(response.data);
    },

    /**
     * Delete an alert rule
     */
    delete: async (id: string): Promise<void> => {
      await apiClient.delete(`/api/v1/webhooks/${id}`);
    },

    /**
     * Toggle alert rule enabled state
     */
    toggle: async (id: string): Promise<AlertRule> => {
      const rule = await alertsApi.rules.getById(id);
      return alertsApi.rules.update(id, { enabled: !rule.enabled });
    },
  },
};

export default alertsApi;
