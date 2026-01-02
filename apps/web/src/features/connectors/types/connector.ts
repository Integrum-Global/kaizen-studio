/**
 * Connector types and interfaces
 */

export type ConnectorType =
  | "database"
  | "cloud"
  | "email"
  | "messaging"
  | "storage"
  | "api";

export type ConnectorStatus =
  | "connected"
  | "disconnected"
  | "error"
  | "pending";

/**
 * Base connector configuration
 */
export interface ConnectorConfig {
  [key: string]: unknown;
}

/**
 * Database connector configuration
 */
export interface DatabaseConfig extends ConnectorConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  connectionTimeout?: number;
}

/**
 * Cloud connector configuration (AWS, GCP, Azure)
 */
export interface CloudConfig extends ConnectorConfig {
  provider: "aws" | "gcp" | "azure";
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  projectId?: string;
  tenantId?: string;
  credentials?: Record<string, unknown>;
}

/**
 * Email connector configuration (SMTP, SendGrid, etc.)
 */
export interface EmailConfig extends ConnectorConfig {
  provider: "smtp" | "sendgrid" | "mailgun" | "ses";
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  apiKey?: string;
  fromEmail: string;
  fromName?: string;
  tls?: boolean;
}

/**
 * Messaging connector configuration (Slack, Teams, etc.)
 */
export interface MessagingConfig extends ConnectorConfig {
  provider: "slack" | "teams" | "discord" | "telegram";
  webhookUrl?: string;
  botToken?: string;
  channelId?: string;
  apiKey?: string;
}

/**
 * Storage connector configuration (S3, GCS, Azure Blob)
 */
export interface StorageConfig extends ConnectorConfig {
  provider: "s3" | "gcs" | "azure_blob" | "ftp";
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
}

/**
 * API connector configuration (REST, GraphQL)
 */
export interface APIConfig extends ConnectorConfig {
  baseUrl: string;
  apiType: "rest" | "graphql" | "soap";
  authType?: "none" | "basic" | "bearer" | "oauth2" | "api_key";
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  headers?: Record<string, string>;
}

/**
 * Main connector interface
 */
export interface Connector {
  id: string;
  organization_id: string;
  name: string;
  connector_type: ConnectorType;
  provider: string;
  status: ConnectorStatus;
  last_tested_at?: string;
  last_test_result?: string;
  last_error?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create connector request
 */
export interface CreateConnectorRequest {
  name: string;
  connector_type: ConnectorType;
  provider: string;
  config: Record<string, unknown>;
  status?: ConnectorStatus;
}

/**
 * Update connector request
 */
export interface UpdateConnectorRequest {
  name?: string;
  config?: Record<string, unknown>;
  status?: ConnectorStatus;
}

/**
 * Connector test result
 */
export interface TestResultResponse {
  success: boolean;
  message: string;
}

/**
 * Query execution request
 */
export interface ExecuteQueryRequest {
  query: string;
  params?: Record<string, unknown>;
}

/**
 * Query execution result
 */
export interface QueryResultResponse {
  success: boolean;
  message?: string;
  error?: string;
  query?: string;
  params?: Record<string, unknown>;
}

/**
 * Connector instance
 */
export interface ConnectorInstance {
  id: string;
  connector_id: string;
  agent_id: string;
  alias: string;
  config_override?: string;
  created_at: string;
}

/**
 * Connector instance with details
 */
export interface ConnectorInstanceWithDetails extends ConnectorInstance {
  connector?: Connector;
}

/**
 * Attach connector to agent request
 */
export interface AttachConnectorRequest {
  agent_id: string;
  alias: string;
  config_override?: Record<string, unknown>;
}

/**
 * Connector filters for listing
 */
export interface ConnectorFilters {
  organization_id?: string;
  connector_type?: ConnectorType;
  provider?: string;
  status?: ConnectorStatus;
  page?: number;
  page_size?: number;
}

/**
 * Connector response with pagination
 */
export interface ConnectorResponse {
  records: Connector[];
  total: number;
}

/**
 * Available connector types response
 */
export interface ConnectorTypesResponse {
  types: Record<string, unknown>;
}
