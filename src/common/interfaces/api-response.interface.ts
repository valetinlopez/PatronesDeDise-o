export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

/** Los controllers devuelven esto para que el interceptor arme el envoltorio. */
export interface ServiceResult<T = unknown> {
  message?: string;
  data: T;
  meta?: PaginationMeta;
}
