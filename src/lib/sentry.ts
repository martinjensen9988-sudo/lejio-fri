/**
 * Sentry Error Tracking Configuration
 * Captures and reports errors in production
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export const initSentry = () => {
  // Only initialize in production or when DSN is explicitly set
  const sentryDSN = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE;

  if (!sentryDSN) {
    console.warn('⚠️ SENTRY_DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: sentryDSN,
    environment: environment,
    // Performance Monitoring
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Capture 100% of transactions for performance monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    // Capture 100% of replays for debugging
    replaysSessionSampleRate: environment === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || 'unknown',
    // Attach stack traces to all messages
    attachStacktrace: true,
    // Set user context if authenticated
    beforeSend(event, hint) {
      // Filter out specific errors if needed
      if (event.exception) {
        const error = hint.originalException;
        // Don't send certain errors (e.g., network timeouts during development)
        if (error instanceof Error && error.message.includes('NetworkError')) {
          return null;
        }
      }
      return event;
    },
  });
};

/**
 * Set user context for error tracking
 * Call this when user logs in
 */
export const setSentryUser = (userId: string, email?: string, name?: string) => {
  Sentry.setUser({
    id: userId,
    email,
    username: name,
  });
};

/**
 * Clear user context when logging out
 */
export const clearSentryUser = () => {
  Sentry.setUser(null);
};

/**
 * Add breadcrumb for tracking user actions
 * Useful for debugging what happened before an error
 */
export const addSentryBreadcrumb = (
  message: string,
  category: string = 'user-action',
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

/**
 * Capture exception manually
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (context) {
    Sentry.setContext('error-context', context);
  }
  Sentry.captureException(error);
};

/**
 * Capture message without exception
 */
export const captureMessage = (
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' = 'error'
) => {
  Sentry.captureMessage(message, level);
};
