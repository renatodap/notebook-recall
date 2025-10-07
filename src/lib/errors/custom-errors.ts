/**
 * Custom Error Classes for Recall Notebook
 *
 * Provides production-level error handling with user-friendly messages
 * and proper error classification per CLAUDE.md standards.
 */

import { NextResponse } from 'next/server'

/**
 * Base error class for all application errors
 */
export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error for invalid user input
 * @example throw new ValidationError('Email format is invalid')
 */
export class ValidationError extends ApplicationError {
  constructor(message: string, public readonly field?: string) {
    super(message, 400, true);
  }
}

/**
 * Authentication error for missing or invalid credentials
 * @example throw new AuthenticationError('Please sign in to continue')
 */
export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true);
  }
}

/**
 * Authorization error for insufficient permissions
 * @example throw new AuthorizationError('You do not have permission to access this resource')
 */
export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, true);
  }
}

/**
 * Not found error for missing resources
 * @example throw new NotFoundError('Source not found')
 */
export class NotFoundError extends ApplicationError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true);
  }
}

/**
 * Rate limit error when user exceeds allowed requests
 * @example throw new RateLimitError('Too many requests. Please try again in 60 seconds', 60)
 */
export class RateLimitError extends ApplicationError {
  constructor(
    message: string = 'Too many requests. Please try again later',
    public readonly retryAfter?: number
  ) {
    super(message, 429, true);
  }
}

/**
 * API error for external service failures
 * @example throw new APIError('AI service is temporarily unavailable. Please try again')
 */
export class APIError extends ApplicationError {
  constructor(
    message: string,
    public readonly provider?: string,
    public readonly retryable: boolean = true
  ) {
    super(message, 503, retryable);
  }
}

/**
 * Database error for database operation failures
 * @example throw new DatabaseError('Failed to save source. Please try again')
 */
export class DatabaseError extends ApplicationError {
  constructor(message: string) {
    super(message, 500, true);
  }
}

/**
 * Configuration error for missing or invalid environment variables
 * @example throw new ConfigurationError('Missing ANTHROPIC_API_KEY environment variable')
 */
export class ConfigurationError extends ApplicationError {
  constructor(message: string) {
    super(message, 500, false);
  }
}

/**
 * Type guard to check if error is an ApplicationError
 */
export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}

/**
 * Converts any error to a user-friendly error response
 * Sanitizes internal errors to prevent information leakage
 */
export function toErrorResponse(error: unknown): {
  error: string;
  statusCode: number;
  retryAfter?: number;
} {
  // Handle known application errors
  if (isApplicationError(error)) {
    const response: { error: string; statusCode: number; retryAfter?: number } = {
      error: error.message,
      statusCode: error.statusCode,
    };

    if (error instanceof RateLimitError && error.retryAfter) {
      response.retryAfter = error.retryAfter;
    }

    return response;
  }

  // Handle unknown errors - sanitize message
  console.error('Unexpected error:', error);

  return {
    error: 'An unexpected error occurred. Please try again later',
    statusCode: 500,
  };
}

/**
 * Error handler for API routes
 * Logs error and returns appropriate response
 */
export function handleAPIError(error: unknown): NextResponse {
  const { error: message, statusCode, retryAfter } = toErrorResponse(error);

  const responseBody: { error: string; retryAfter?: number } = { error: message };

  if (retryAfter) {
    responseBody.retryAfter = retryAfter;
  }

  return NextResponse.json(responseBody, { status: statusCode });
}
