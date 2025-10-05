/**
 * Common API types to replace 'any' in API routes
 */

/**
 * Generic database record from Supabase queries
 */
export interface DatabaseRecord {
  id: string
  created_at: string
  [key: string]: unknown
}

/**
 * RPC function result type
 */
export type RPCResult<T = Record<string, unknown>> = T[] | null

/**
 * Error type for API responses
 */
export interface APIError {
  error: string
  details?: string
  code?: string
}

/**
 * Success response type
 */
export interface APISuccess<T = unknown> {
  data: T
  message?: string
}

/**
 * Paginated response type
 */
export interface PaginatedResponse<T = unknown> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

/**
 * Generic request body type
 */
export type RequestBody = Record<string, unknown>

/**
 * File upload types
 */
export interface FileUploadData {
  file: File | Blob
  filename: string
  contentType: string
}

/**
 * Generic error that can be caught
 */
export interface CaughtError {
  message: string
  stack?: string
  cause?: unknown
}

/**
 * Type guard for checking if error is CaughtError
 */
export function isCaughtError(error: unknown): error is CaughtError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as CaughtError).message === 'string'
  )
}

/**
 * Safe error message extractor
 */
export function getErrorMessage(error: unknown): string {
  if (isCaughtError(error)) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unknown error occurred'
}
