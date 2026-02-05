# Sentry Error Tracking Setup

This guide explains how to set up error tracking for LEJIO using Sentry.

## What is Sentry?

Sentry is a real-time error tracking platform that:
- Captures all JavaScript errors in production
- Groups similar errors together
- Tracks performance metrics
- Provides session replay (see exactly what user was doing)
- Sends alerts when new errors occur

## Quick Setup (5 minutes)

### 1. Create Sentry Account

1. Go to https://sentry.io
2. Sign up (free tier includes 5,000 error events/month)
3. Create a new project:
   - Platform: **React**
   - Project name: `lejio`
   - Team: Select your team

### 2. Get Your DSN

After creating the project:
1. You'll see a DSN like: `https://exampleKey@o123.ingest.sentry.io/456`
2. Copy this value

### 3. Add to Environment

Add to `.env.local`:
```bash
VITE_SENTRY_DSN=https://exampleKey@o123.ingest.sentry.io/456
VITE_APP_VERSION=0.0.1
```

### 4. Test the Integration

Run in development:
```bash
npm run dev
```

Open browser console and run:
```javascript
// This will test Sentry
throw new Error("Test Sentry Integration");
```

Check [Sentry Dashboard](https://sentry.io/organizations) → Issues. You should see the test error.

## How It Works

### Automatic Error Capture

**React Component Errors:**
- Any error in a React component is caught by ErrorBoundary
- Automatically sent to Sentry with component stack trace

**JavaScript Runtime Errors:**
- Unhandled exceptions and promise rejections
- Automatically captured

**Network Errors:**
- Failed API calls can be tracked
- Visible in Performance section

### Manual Error Tracking

You can also manually track errors in your code:

```typescript
import { captureException, addSentryBreadcrumb } from '@/lib/sentry';

// Capture an exception
try {
  // risky code
} catch (error) {
  captureException(error as Error, { 
    context: 'lead_discovery' 
  });
}

// Add breadcrumb (tracks user action before error)
addSentryBreadcrumb('User clicked "Run Discovery"', 'user-action');

// Capture message
import { captureMessage } from '@/lib/sentry';
captureMessage('User started lead discovery', 'info');
```

## Configuration

### Production vs Development

The Sentry config in `src/lib/sentry.ts`:

```typescript
// Development: 100% of transactions captured
// Production: Only 10% (to reduce costs)
tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
```

### User Context

When user logs in, set their context:

```typescript
import { setSentryUser, clearSentryUser } from '@/lib/sentry';

// After user logs in
setSentryUser('user-id-123', 'user@example.com', 'John Doe');

// When user logs out
clearSentryUser();
```

This helps you see which users are affected by errors.

## Key Features

### 1. Error Grouping
Sentry automatically groups similar errors together, so you can see:
- How many times an error occurred
- When it started
- Which versions are affected

### 2. Performance Monitoring
Track:
- Page load time
- API response times
- Component render times
- Database query duration

### 3. Session Replay
See exactly what the user was doing:
- Mouse movements and clicks
- Form submissions
- Console logs
- Network requests

### 4. Releases
Track which version of your code has errors:
```typescript
// In sentry.ts
release: import.meta.env.VITE_APP_VERSION || 'unknown',
```

After deploying new version, update VITE_APP_VERSION.

## Dashboard Overview

### Issues Page
Shows all errors with:
- Error type and message
- First/last time seen
- Number of occurrences
- Affected users

Click an issue to see:
- Full stack trace
- User context
- Browser/device info
- Session replay

### Performance Page
Tracks:
- Slowest pages
- Slowest API endpoints
- Apdex score (user satisfaction)

### Releases Page
View errors per version:
- See when bugs were introduced
- Track if fix resolved the issue

## Common Errors to Monitor

1. **Payment Integration Errors**
   - Failed Stripe/MobilePay transactions
   - Setup issues early

2. **GPS & Location Errors**
   - GPS device failures
   - Geofence boundary issues

3. **Email Sending Failures**
   - SendGrid API errors
   - Template rendering issues

4. **Lead Discovery Errors**
   - AI API failures
   - Enrichment service issues

5. **Database Errors**
   - Connection timeouts
   - RLS policy violations

## Alerts & Notifications

### Alert Rules

1. Go to Sentry Dashboard
2. Settings → Alert Rules
3. Create alerts for:
   - New issue in production
   - Error spike (>100 errors in 5 min)
   - Regression (same error returns after being fixed)

### Notification Channels

Send alerts to:
- Email
- Slack (recommended)
- PagerDuty
- Custom webhook

## Advanced Usage

### Set Up Slack Integration

1. In Sentry, go to Settings → Integrations → Slack
2. Click "Add Integration"
3. Authorize LEJIO workspace
4. Go to Issue Settings, enable notifications to #errors channel

### Track Deploy

```bash
# After deploying, tell Sentry:
sentry-cli releases finalize <version>
sentry-cli releases set-commits <version> --auto
```

### View Release Health

1. Go to Releases page
2. See which versions have errors
3. Track if new version fixes issues

## Cost & Pricing

**Free Tier:**
- 5,000 error events/month
- 1 release tracked
- Basic session replay

**Paid Tiers:**
- Professional: $29/month (100K events)
- Enterprise: Custom pricing

For LEJIO (~50-100 errors/month), free tier is sufficient.

## Troubleshooting

### Errors not appearing in Sentry

**Check:**
1. Is VITE_SENTRY_DSN set?
   ```bash
   echo $VITE_SENTRY_DSN
   ```
2. Does the DSN look valid? (https://key@url)
3. Are you in production or dev mode with tracing enabled?

### Too many errors captured

**Solution:** Adjust `tracesSampleRate` in `src/lib/sentry.ts`:
```typescript
tracesSampleRate: 0.05,  // Only 5% of transactions
```

### Sensitive data being captured

**Solution:** Use `beforeSend` in `src/lib/sentry.ts`:
```typescript
beforeSend(event) {
  // Remove sensitive data before sending
  return event;
}
```

## References

- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Dashboard](https://sentry.io)
- [Sentry Python Edge Functions](https://docs.sentry.io/platforms/python/) (if tracking edge functions)

## Next Steps

1. ✅ Create Sentry account
2. ✅ Add DSN to .env.local
3. ✅ Test with manual error
4. ✅ Set up Slack notifications
5. ✅ Configure alert rules
6. ✅ Review errors weekly
