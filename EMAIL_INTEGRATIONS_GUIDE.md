# Email Integration System

## Overview

The email integration system allows lessors to connect multiple email accounts (Gmail, Outlook, or custom SMTP) and choose which one to use when sending messages through LEJIO.

This replaces the single global SMTP configuration with a per-user, multi-account system.

---

## Features

✅ **Multiple Email Accounts** - Add Gmail, Outlook, or custom SMTP  
✅ **Default Email Selection** - Choose which email is used by default  
✅ **Test Emails** - Verify each integration works before using  
✅ **Email Activity Logging** - Track which emails were sent and from which account  
✅ **Connection Status** - Monitor if integrations are still working  
✅ **Fallback to System SMTP** - If no user integration, use global SMTP  

---

## Database Schema

### `lessor_email_integrations` Table

```sql
CREATE TABLE lessor_email_integrations (
  id UUID PRIMARY KEY,
  lessor_id UUID REFERENCES profiles(id),
  type VARCHAR(50), -- 'gmail', 'outlook', 'custom_smtp'
  email VARCHAR(255),
  display_name VARCHAR(255),
  is_default BOOLEAN,
  is_connected BOOLEAN,
  connection_status VARCHAR(50), -- 'connected', 'disconnected', 'expired'
  last_tested_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  metadata JSONB -- Securely stores encrypted credentials
);
```

### `email_activity_log` Table

```sql
CREATE TABLE email_activity_log (
  id UUID PRIMARY KEY,
  lessor_id UUID REFERENCES profiles(id),
  integration_id UUID REFERENCES lessor_email_integrations(id),
  recipient VARCHAR(255),
  subject VARCHAR(500),
  email_type VARCHAR(100), -- 'booking_confirmation', 'payment_reminder', etc.
  status VARCHAR(50), -- 'sent', 'failed', 'bounced', 'opened', 'clicked'
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP
);
```

---

## Components

### `EmailIntegrationSettings`

UI component for managing email integrations.

**Location:** `src/components/settings/EmailIntegrationSettings.tsx`

**Features:**
- Add new email integrations (Gmail, Outlook, custom SMTP)
- View all configured emails
- Set default email
- Send test emails
- Delete integrations
- Connection status monitoring

**Usage:**
```tsx
import { EmailIntegrationSettings } from '@/components/settings/EmailIntegrationSettings';

<EmailIntegrationSettings userId={userId} />
```

---

## API Endpoints

### 1. Test Email Integration

**Endpoint:** `POST /api/TestEmailIntegration`

**Purpose:** Verify email credentials before saving.

**Request:**
```json
{
  "type": "gmail",
  "email": "user@gmail.com",
  "metadata": {
    "passwordHash": "app-specific-password"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email integration test successful"
}
```

---

### 2. Send Test Email

**Endpoint:** `POST /api/SendTestEmail`

**Purpose:** Send a test email from configured integration.

**Request:**
```json
{
  "integrationId": "uuid",
  "testEmail": "recipient@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

---

### 3. Send Email With Integration

**Endpoint:** `POST /api/SendEmailWithIntegration`

**Purpose:** Send email using user's selected integration.

**Request:**
```json
{
  "lessorId": "uuid",
  "recipient": "customer@example.com",
  "subject": "Booking Confirmation",
  "html": "<h1>Welcome!</h1>",
  "text": "Welcome to LEJIO!",
  "emailType": "booking_confirmation",
  "integrationId": "uuid" // Optional: use default if not specified
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "integrationEmail": "sender@example.com"
}
```

**Behavior:**
- If `integrationId` specified, uses that integration
- If no `integrationId`, uses lessor's default integration
- If no user integration, falls back to system SMTP
- Logs activity to `email_activity_log`

---

## Hook Usage

### `useEmailIntegrations`

React hook for managing email integrations in components.

**Location:** `src/hooks/useEmailIntegrations.ts`

**Usage:**
```tsx
import { useEmailIntegrations } from '@/hooks/useEmailIntegrations';

function MyComponent({ userId }) {
  const {
    integrations,
    isLoading,
    fetchIntegrations,
    getDefaultIntegration,
    sendEmail,
    sendTestEmail,
    testIntegration,
  } = useEmailIntegrations(userId);

  // Fetch integrations on load
  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  // Send email
  const handleSendEmail = async () => {
    const result = await sendEmail(
      'customer@example.com',
      'Welcome to LEJIO',
      '<h1>Welcome!</h1>',
      {
        text: 'Plain text version',
        emailType: 'welcome',
        // integrationId: 'xxx' // Optional: use specific integration
      }
    );

    if (result.success) {
      console.log('Email sent!');
    }
  };

  // Get default integration
  const defaultEmail = getDefaultIntegration();
  console.log(`Sending from: ${defaultEmail?.email}`);

  return (
    // Component JSX
  );
}
```

---

## Email Types Supported

| Type | Description | When Sent |
|------|-------------|-----------|
| `welcome` | Welcome to LEJIO | New user signup |
| `booking_confirmation` | Confirm booking | After booking created |
| `payment_reminder` | Payment due reminder | 7 days before due |
| `booking_approved` | Booking approved by lessor | After lessor approves |
| `damage_report` | Damage report notification | After damage reported |
| `contract_ready` | Contract ready to sign | Contract generated |
| `monthly_summary` | Monthly activity summary | First of month |
| `test` | Test email | User testing integration |
| `general` | General message | Custom messages |

---

## Setup Instructions for Users

### Gmail Setup

1. **Enable 2-Step Verification**
   - Go to myaccount.google.com → Security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to myaccount.google.com → Security
   - Scroll to "App passwords"
   - Select Mail → Windows Computer
   - Copy the generated password

3. **Add to LEJIO**
   - Go to Settings → Email Integration
   - Click "Tilføj Email Integration"
   - Select "Gmail"
   - Enter: `your@gmail.com` and app password
   - Click "Test & Tilføj"

### Outlook Setup

1. **Enable 2-Step Verification** (optional but recommended)
   - Go to account.microsoft.com → Security
   - Enable two-step verification

2. **Create App Password** (if 2FA enabled)
   - Go to account.microsoft.com
   - Click "App passwords"
   - Copy the generated password

3. **Add to LEJIO**
   - Go to Settings → Email Integration
   - Click "Tilføj Email Integration"
   - Select "Outlook"
   - Enter: `your@outlook.com` and password
   - Click "Test & Tilføj"

### Custom SMTP Setup

For other email providers (hosting, corporate email, etc.):

1. **Get SMTP Details from Provider**
   - SMTP Host: `smtp.example.com`
   - SMTP Port: `587` (standard) or `465` (secure)
   - Username: `user@example.com`
   - Password: Your email password

2. **Add to LEJIO**
   - Go to Settings → Email Integration
   - Click "Tilføj Email Integration"
   - Select "SMTP"
   - Enter all SMTP details
   - Click "Test & Tilføj"

---

## Flow Diagram

```
User adds email integration
         ↓
TestEmailIntegration endpoint tests credentials
         ↓
Store integration in lessor_email_integrations table
         ↓
User sends booking confirmation
         ↓
SendEmailWithIntegration endpoint called
         ↓
Look up lessor's default integration (or specified one)
         ↓
Create SMTP transporter using integration credentials
         ↓
Send email via SMTP
         ↓
Log activity in email_activity_log
         ↓
Email delivered to recipient
```

---

## Error Handling

### Common Issues & Solutions

**❌ "Authentication failed"**
- Check email and password are correct
- Verify 2FA is enabled (if required by provider)
- Ensure you're using app-specific password (Gmail)

**❌ "Connection timeout"**
- Check SMTP host and port are correct
- Verify firewall isn't blocking port 587/465
- Test SMTP connection manually with telnet

**❌ "Email marked as spam"**
- Add SPF, DKIM, DMARC records for custom domains
- Verify sender email in provider
- Check email content for spam-like patterns

**❌ "Integration shows as expired"**
- Re-authenticate with email provider
- Check if password needs to be updated
- Regenerate app password if it expired

---

## Security Considerations

### Credential Storage

- Email credentials are stored in `metadata` JSONB field
- Should be encrypted at rest (set up in database)
- Never log or display full credentials
- Use environment variables for system SMTP

### Access Control

- RLS policies prevent users from seeing other users' integrations
- Credentials only accessible to owner
- API endpoints require authentication

### Best Practices

✅ Always use HTTPS  
✅ Enable 2FA on email accounts  
✅ Use app-specific passwords (Gmail, Outlook)  
✅ Regularly audit email activity log  
✅ Delete unused integrations  
✅ Monitor failed email deliveries  

---

## Monitoring & Logging

### Email Activity Log Query

```sql
SELECT 
  DATE(sent_at) AS date,
  COUNT(*) AS total_sent,
  integration_id,
  email_type,
  ARRAY_AGG(DISTINCT recipient) AS recipients
FROM email_activity_log
GROUP BY DATE(sent_at), integration_id, email_type
ORDER BY date DESC;
```

### Check Failed Emails

```sql
SELECT * FROM email_activity_log
WHERE status = 'failed'
ORDER BY sent_at DESC
LIMIT 20;
```

### Integration Health

```sql
SELECT 
  id,
  email,
  display_name,
  connection_status,
  last_tested_at,
  COUNT(eal.id) AS emails_sent
FROM lessor_email_integrations lei
LEFT JOIN email_activity_log eal ON lei.id = eal.integration_id
GROUP BY lei.id
ORDER BY lei.created_at DESC;
```

---

## Future Enhancements

- 🔐 OAuth2 for Gmail & Outlook (eliminate password storage)
- 📊 Email analytics dashboard (open rates, click rates)
- 🔔 Delivery notifications
- 🎯 Email template builder
- 📨 Email scheduling
- 🌐 Multi-language support
- ⚙️ Advanced SMTP settings (auth types, TLS versions)
- 🔄 Email forwarding & auto-reply
- 📎 Attachment support

---

## Support

For issues with email integrations:

1. Check your integration type and credentials
2. Verify 2FA is properly enabled
3. Send a test email to verify setup
4. Check email_activity_log for error details
5. Contact support: support@lejio.dk
