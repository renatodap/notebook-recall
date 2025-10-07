/**
 * Validation Module - Barrel Export
 *
 * Centralized export for all validation schemas and middleware.
 * Import from this file for cleaner imports throughout the application.
 *
 * @example
 * import { validateRequestBody, CreateSourceSchema } from '@/lib/validation'
 */

// Export all schemas
export * from './schemas'

// Export middleware utilities
export {
  validateRequestBody,
  validateQueryParams,
  validatePathParams,
  withValidation,
  createValidationErrorResponse,
  isZodError,
} from './middleware'
