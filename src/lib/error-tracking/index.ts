/**
 * Error Tracking Service
 *
 * Centralized error tracking for production monitoring
 * Can integrate with Sentry, LogRocket, or other services
 */

interface ErrorContext {
  user?: {
    id?: string
    email?: string
  }
  tags?: Record<string, string>
  extra?: Record<string, unknown>
}

interface ErrorEvent {
  message: string
  stack?: string
  context?: ErrorContext
  timestamp: string
  level: 'error' | 'warning' | 'info'
  environment: string
}

class ErrorTracker {
  private isInitialized = false
  private environment: string

  constructor() {
    this.environment = process.env.NODE_ENV || 'development'
  }

  /**
   * Initialize error tracking service
   * In production, this would initialize Sentry or similar
   */
  init() {
    if (this.isInitialized) return

    // In production with SENTRY_DSN, initialize Sentry
    if (this.environment === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Future: Initialize Sentry here
      // Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN })
      console.info('Error tracking initialized (production mode)')
    } else {
      console.info('Error tracking initialized (development mode)')
    }

    this.isInitialized = true
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: ErrorContext) {
    const event: ErrorEvent = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      level: 'error',
      environment: this.environment,
    }

    if (this.environment === 'production') {
      // In production, send to error tracking service
      this.sendToService(event)

      // Future: Sentry.captureException(error, { contexts: context })
    } else {
      // In development, log to console
      console.error('Error tracked:', event)
    }
  }

  /**
   * Capture a message (non-error)
   */
  captureMessage(message: string, level: 'error' | 'warning' | 'info' = 'info', context?: ErrorContext) {
    const event: ErrorEvent = {
      message,
      context,
      timestamp: new Date().toISOString(),
      level,
      environment: this.environment,
    }

    if (this.environment === 'production') {
      this.sendToService(event)
    } else {
      console.log(`[${level.toUpperCase()}]`, message, context)
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: { id: string; email?: string } | null) {
    if (this.environment === 'production') {
      // Future: Sentry.setUser(user)
    } else {
      console.log('User context set:', user)
    }
  }

  /**
   * Add breadcrumb (navigation trail)
   */
  addBreadcrumb(message: string, data?: Record<string, unknown>) {
    if (this.environment === 'production') {
      // Future: Sentry.addBreadcrumb({ message, data })
    } else {
      console.log('Breadcrumb:', message, data)
    }
  }

  /**
   * Send error event to tracking service
   * This is a placeholder for future API integration
   */
  private async sendToService(event: ErrorEvent) {
    try {
      // Future: Send to Sentry, LogRocket, or custom endpoint
      // For now, just log to console in production
      console.error('Production error:', {
        message: event.message,
        timestamp: event.timestamp,
        level: event.level,
      })

      // Example: Send to custom API endpoint
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event),
      // })
    } catch (error) {
      // Fail silently to avoid error tracking errors
      console.error('Failed to send error to tracking service:', error)
    }
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker()

// Initialize on import (safe for both client and server)
if (typeof window !== 'undefined') {
  errorTracker.init()
}

/**
 * Convenience functions
 */
export function trackError(error: Error, context?: ErrorContext) {
  errorTracker.captureException(error, context)
}

export function trackMessage(message: string, level: 'error' | 'warning' | 'info' = 'info', context?: ErrorContext) {
  errorTracker.captureMessage(message, level, context)
}

export function setUserContext(user: { id: string; email?: string } | null) {
  errorTracker.setUser(user)
}

export function addBreadcrumb(message: string, data?: Record<string, unknown>) {
  errorTracker.addBreadcrumb(message, data)
}
