/**
 * Webhook types and interfaces
 */

export type WebhookStatus = "active" | "inactive";

export type DeliveryStatus = "pending" | "success" | "failed";

/**
 * Main webhook interface
 */
export interface Webhook {
  id: string;
  organization_id: string;
  name: string;
  url: string;
  events: string[];
  status: WebhookStatus;
  last_triggered_at?: string;
  failure_count: number;
  created_by: string;
  created_at: string;
}

/**
 * Webhook with secret (only returned on create)
 */
export interface WebhookWithSecret extends Webhook {
  secret: string;
}

/**
 * Webhook delivery record
 */
export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: string;
  response_status?: number;
  response_body?: string;
  duration_ms?: number;
  status: DeliveryStatus;
  attempt_count: number;
  created_at: string;
}

/**
 * Create webhook request
 */
export interface CreateWebhookRequest {
  name: string;
  url: string;
  events: string[];
}

/**
 * Update webhook request
 */
export interface UpdateWebhookRequest {
  name?: string;
  url?: string;
  events?: string[];
  status?: WebhookStatus;
}

/**
 * Test webhook request
 */
export interface TestWebhookRequest {
  event_type?: string;
}

/**
 * Test webhook response
 */
export interface TestWebhookResponse {
  message: string;
  delivery: WebhookDelivery;
}

/**
 * Webhook events response
 */
export interface WebhookEventsResponse {
  events: string[];
}

/**
 * Webhook filters for listing
 */
export interface WebhookFilters {
  status?: WebhookStatus;
  page?: number;
  page_size?: number;
}

/**
 * Webhook response with pagination
 */
export interface WebhookResponse {
  records: Webhook[];
  total: number;
}
