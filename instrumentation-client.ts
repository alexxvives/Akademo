import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://37deb84c09ff2d19b29fe83a83fc8088@o4511153106190336.ingest.de.sentry.io/4511153109729360',

  // Capture 10% of transactions for performance monitoring
  tracesSampleRate: 0.1,

  // Don't send PII (IP addresses, etc.) — GDPR compliance for Spanish users
  sendDefaultPii: false,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',
});
