/**
 * Validation Middleware for API Routes
 *
 * Provides reusable validation middleware that wraps Zod schemas
 * with proper error handling and user-friendly messages.
 *
 * @see CLAUDE.md Section 3: Security Standards
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ValidationError } from '@/lib/errors/custom-errors'

/**
 * Validates request body against a Zod schema
 * Throws ValidationError with user-friendly message on failure
 *
 * @param request - Next.js request object
 * @param schema - Zod schema to validate against
 * @returns Validated and typed data
 * @throws ValidationError if validation fails
 *
 * @example
 * const data = await validateRequestBody(request, CreateSourceSchema)
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      // Extract first error message for user-friendly response
      const firstError = result.error.issues[0]
      const field = firstError.path.join('.')
      const message = firstError.message

      throw new ValidationError(
        field ? `${field}: ${message}` : message,
        field
      )
    }

    return result.data
  } catch (error) {
    // If it's already a ValidationError, rethrow it
    if (error instanceof ValidationError) {
      throw error
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      throw new ValidationError('Invalid JSON in request body')
    }

    // Handle other errors
    throw new ValidationError('Failed to parse request body')
  }
}

/**
 * Validates query parameters against a Zod schema
 * Throws ValidationError with user-friendly message on failure
 *
 * @param request - Next.js request object
 * @param schema - Zod schema to validate against
 * @returns Validated and typed data
 * @throws ValidationError if validation fails
 *
 * @example
 * const params = validateQueryParams(request, GetSourcesQuerySchema)
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): T {
  const searchParams = new URL(request.url).searchParams
  const params = Object.fromEntries(searchParams.entries())

  const result = schema.safeParse(params)

  if (!result.success) {
    // Extract first error message for user-friendly response
    const firstError = result.error.issues[0]
    const field = firstError.path.join('.')
    const message = firstError.message

    throw new ValidationError(
      field ? `${field}: ${message}` : message,
      field
    )
  }

  return result.data
}

/**
 * Validates path parameters (e.g., [id] in route)
 * Throws ValidationError with user-friendly message on failure
 *
 * @param params - Path parameters from route
 * @param schema - Zod schema to validate against
 * @returns Validated and typed data
 * @throws ValidationError if validation fails
 *
 * @example
 * const { id } = validatePathParams(params, z.object({ id: z.string().uuid() }))
 */
export function validatePathParams<T>(
  params: Record<string, string | string[]>,
  schema: z.ZodSchema<T>
): T {
  const result = schema.safeParse(params)

  if (!result.success) {
    // Extract first error message for user-friendly response
    const firstError = result.error.issues[0]
    const field = firstError.path.join('.')
    const message = firstError.message

    throw new ValidationError(
      field ? `${field}: ${message}` : message,
      field
    )
  }

  return result.data
}

/**
 * Higher-order function that wraps an API route handler with validation
 * Automatically handles validation errors and returns proper error responses
 *
 * @param handler - The API route handler function
 * @param bodySchema - Optional Zod schema for request body validation
 * @param querySchema - Optional Zod schema for query params validation
 * @returns Wrapped handler with automatic validation
 *
 * @example
 * export const POST = withValidation(
 *   async (request, validatedBody, validatedQuery) => {
 *     // validatedBody and validatedQuery are typed and validated
 *     return NextResponse.json({ success: true })
 *   },
 *   CreateSourceSchema,
 *   GetSourcesQuerySchema
 * )
 */
export function withValidation<TBody = unknown, TQuery = unknown>(
  handler: (
    request: NextRequest,
    validatedBody?: TBody,
    validatedQuery?: TQuery
  ) => Promise<NextResponse>,
  bodySchema?: z.ZodSchema<TBody>,
  querySchema?: z.ZodSchema<TQuery>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      let validatedBody: TBody | undefined
      let validatedQuery: TQuery | undefined

      // Validate request body if schema provided
      if (bodySchema) {
        validatedBody = await validateRequestBody(request, bodySchema)
      }

      // Validate query params if schema provided
      if (querySchema) {
        validatedQuery = validateQueryParams(request, querySchema)
      }

      // Call the actual handler with validated data
      return await handler(request, validatedBody, validatedQuery)
    } catch (error) {
      // Validation errors are handled by the error handler
      throw error
    }
  }
}

/**
 * Helper to create a validation error response
 * Use this in catch blocks to handle ValidationError
 *
 * @param error - The validation error
 * @returns NextResponse with error details
 *
 * @example
 * catch (error) {
 *   if (error instanceof ValidationError) {
 *     return createValidationErrorResponse(error)
 *   }
 *   // Handle other errors
 * }
 */
export function createValidationErrorResponse(error: ValidationError): NextResponse {
  return NextResponse.json(
    {
      error: error.message,
      field: error.field,
    },
    { status: 400 }
  )
}

/**
 * Type guard to check if error is a Zod validation error
 */
export function isZodError(error: unknown): error is z.ZodError {
  return error instanceof z.ZodError
}
