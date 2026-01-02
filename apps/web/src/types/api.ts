/**
 * Common API types and interfaces
 */

export interface ApiError {
  detail: string;
  status_code?: number;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface FilterParams {
  search?: string;
  status?: string;
  created_after?: string;
  created_before?: string;
  [key: string]: any;
}

export interface ListParams extends PaginationParams, FilterParams {}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface BulkOperationResult<T> {
  success: T[];
  failed: {
    item: T;
    error: string;
  }[];
  total: number;
  success_count: number;
  failed_count: number;
}

export type SortOrder = "asc" | "desc";

export type ResourceStatus =
  | "active"
  | "inactive"
  | "pending"
  | "suspended"
  | "deleted";
