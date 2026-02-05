# Lejio API Documentation

## Overview

Lejio API provides programmatic access to vehicle rental, invoicing, subscriptions, and accounting features.

## Authentication

All API requests require Bearer token authentication:

```
Authorization: Bearer YOUR_API_KEY
```

API keys are managed in the admin dashboard under Settings > API Keys.

## Base URL

```
https://api.lejio.dk/v1
```

## Invoices

### List Invoices

```
GET /invoices
```

Query parameters:
- `status` - Filter by status (draft, sent, paid, overdue, cancelled)
- `lessor_id` - Filter by lessor ID
- `start_date` - Filter by issue date (ISO 8601)
- `end_date` - Filter by issue date (ISO 8601)
- `limit` - Results per page (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "invoice_number": "INV-2026-000001",
      "status": "paid",
      "amount_total": 1500,
      "amount_paid": 1500,
      "amount_due": 0,
      "issue_date": "2026-01-26T00:00:00Z",
      "due_date": "2026-02-25T00:00:00Z",
      "created_at": "2026-01-26T10:30:00Z"
    }
  ],
  "total": 250,
  "limit": 50,
  "offset": 0
}
```

### Get Invoice

```
GET /invoices/{invoice_id}
```

### Create Invoice

```
POST /invoices
```

Request body:
```json
{
  "booking_id": "uuid",
  "lessor_id": "uuid",
  "renter_id": "uuid",
  "amount_total": 1500,
  "due_date": "2026-02-25T00:00:00Z"
}
```

### Record Payment

```
POST /invoices/{invoice_id}/payments
```

Request body:
```json
{
  "amount": 750,
  "method": "card",
  "reference": "payment_ref_123"
}
```

### Send Invoice

```
POST /invoices/{invoice_id}/send
```

## Subscriptions

### List Subscriptions

```
GET /subscriptions
```

Query parameters:
- `status` - Filter by status (active, paused, cancelled)
- `renter_id` - Filter by renter ID
- `vehicle_id` - Filter by vehicle ID
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

### Create Subscription

```
POST /subscriptions
```

Request body:
```json
{
  "renter_id": "uuid",
  "vehicle_id": "uuid",
  "subscription_type": "monthly",
  "daily_rate": 500,
  "start_date": "2026-01-26T00:00:00Z"
}
```

Subscription types: `daily`, `weekly`, `monthly`, `quarterly`, `yearly`

### Pause Subscription

```
POST /subscriptions/{subscription_id}/pause
```

### Resume Subscription

```
POST /subscriptions/{subscription_id}/resume
```

### Cancel Subscription

```
POST /subscriptions/{subscription_id}/cancel
```

Request body:
```json
{
  "reason": "Customer request"
}
```

## Payment Reminders

### List Reminders

```
GET /reminders
```

Query parameters:
- `status` - Filter by status (pending, sent, failed)
- `reminder_type` - Filter by type (due_date, overdue_1, overdue_2, overdue_3, final_notice)
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

### Create Reminder

```
POST /reminders
```

Request body:
```json
{
  "invoice_id": "uuid",
  "reminder_type": "overdue_1",
  "email_subject": "Betaling af faktura",
  "email_body": "Venligst betal din faktura",
  "recipient_email": "customer@example.com"
}
```

### Send Reminder

```
POST /reminders/{reminder_id}/send
```

## Accounting

### List Entries

```
GET /accounting/entries
```

Query parameters:
- `status` - Filter by status (draft, posted, reconciled)
- `entry_type` - Filter by type (revenue, expense, receivable, payable)
- `lessor_id` - Filter by lessor ID
- `accounting_period` - Filter by period (YYYY-MM)
- `limit` - Results per page (default: 50)

### Get Trial Balance

```
GET /accounting/trial-balance
```

Query parameters:
- `accounting_period` - Period (YYYY-MM, default: current month)
- `lessor_id` - Filter by lessor (admin only without this)

Response:
```json
{
  "period": "2026-01",
  "accounts": [
    {
      "account_code": "4000",
      "account_name": "Rental Income",
      "debit": 0,
      "credit": 15000
    }
  ],
  "total_debit": 15000,
  "total_credit": 15000,
  "balanced": true
}
```

### Export Ledger

```
GET /accounting/export
```

Query parameters:
- `format` - Export format (csv, json)
- `accounting_period` - Period (YYYY-MM)

## Webhooks

Webhooks notify your system of important events.

### Configure Webhook

```
POST /webhooks
```

Request body:
```json
{
  "url": "https://yoursite.com/webhooks",
  "events": ["invoice.paid", "subscription.created", "payment_failed"]
}
```

### Webhook Events

- `invoice.created` - New invoice generated
- `invoice.sent` - Invoice sent to customer
- `invoice.paid` - Invoice payment received
- `invoice.overdue` - Invoice became overdue
- `subscription.created` - New subscription created
- `subscription.cancelled` - Subscription cancelled
- `payment.failed` - Payment attempt failed
- `reminder.sent` - Payment reminder sent

### Webhook Payload

```json
{
  "event": "invoice.paid",
  "timestamp": "2026-01-26T10:30:00Z",
  "data": {
    "invoice_id": "uuid",
    "amount": 1500,
    "payment_method": "card"
  }
}
```

## Error Handling

All errors return appropriate HTTP status codes with error details:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required field: amount",
    "details": {
      "field": "amount",
      "reason": "required"
    }
  }
}
```

### Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Server Error

## Rate Limiting

API requests are rate limited:

- **Basic tier**: 1,000 requests/hour
- **Business tier**: 10,000 requests/hour
- **Enterprise**: Custom limits

Rate limit headers:
- `X-RateLimit-Limit` - Total requests allowed
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Unix timestamp when limit resets

## Code Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.lejio.dk/v1',
  headers: {
    Authorization: `Bearer YOUR_API_KEY`,
  },
});

// Get invoices
const invoices = await api.get('/invoices', {
  params: { status: 'paid' },
});

// Create subscription
const subscription = await api.post('/subscriptions', {
  renter_id: 'uuid',
  vehicle_id: 'uuid',
  subscription_type: 'monthly',
  daily_rate: 500,
  start_date: new Date().toISOString(),
});
```

### Python

```python
import requests

api = requests.Session()
api.headers.update({
    'Authorization': 'Bearer YOUR_API_KEY'
})

# Get invoices
response = api.get('https://api.lejio.dk/v1/invoices', 
  params={'status': 'paid'})
invoices = response.json()

# Record payment
response = api.post(
  f'https://api.lejio.dk/v1/invoices/{invoice_id}/payments',
  json={'amount': 750, 'method': 'card'})
```

### cURL

```bash
# Get invoices
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://api.lejio.dk/v1/invoices?status=paid"

# Create subscription
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "renter_id": "uuid",
    "vehicle_id": "uuid",
    "subscription_type": "monthly",
    "daily_rate": 500,
    "start_date": "2026-01-26T00:00:00Z"
  }' \
  "https://api.lejio.dk/v1/subscriptions"
```

## Support

- Email: api-support@lejio.dk
- Docs: https://docs.lejio.dk
- Status: https://status.lejio.dk
