/**
 * Audit log types and interfaces
 */

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "access"
  | "export"
  | "deploy"
  | "execute";

export type AuditStatus = "success" | "failure";

export interface AuditActor {
  id: string;
  name: string;
  email: string;
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  actor: AuditActor;
  resource: string;
  resourceId: string;
  resourceName?: string;
  status: AuditStatus;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface AuditFilters {
  organization_id?: string;
  action?: AuditAction;
  actor?: string;
  resource?: string;
  status?: AuditStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}

export type ExportFormat = "csv" | "json";

export interface ExportAuditLogsInput {
  filters?: Omit<AuditFilters, "page" | "pageSize">;
  format: ExportFormat;
}
