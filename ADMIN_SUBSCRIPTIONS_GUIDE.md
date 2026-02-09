# Admin Subscriptions & Payment Management System

## Overview

A comprehensive admin dashboard and payment management system for lessors to view and manage subscription statuses, payment methods, and invoice payments.

## Features

### 1. **Admin Subscriptions Dashboard** (`/admin/subscriptions`)

Complete oversight of all lessor subscriptions with:

#### Statistics Cards
- **Total Lessors**: All registered lessor accounts
- **Active Subscriptions**: Paying customers with active subscriptions
- **Trial Period**: Users currently in trial phase
- **Inactive**: Users without active subscription

#### Filtering & Search
- **Company/Email Search**: Real-time search across all lessors
- **Status Filter**: Active, Trial, Paused, Inactive
- **Subscription Tier Filter**: Free, Basic, Standard, Premium, Professional, Business, Enterprise

#### Subscription Overview Table

| Field | Description |
|-------|-------------|
| **Company** | Lessor company name |
| **Email** | Contact email address |
| **Status** | Current subscription status with visual indicator |
| **Tier** | Current subscription plan level |
| **Payment Method** | How they're paying (Stripe/Card, Bank Transfer, Invoice, etc.) |
| **Last Payment** | Date and amount of most recent payment |
| **Trial Ends** | Days remaining until trial expires (color-coded warnings) |
| **Actions** | Edit button to modify subscription status/tier |

#### Edit Subscription Dialog
Admins can quickly:
- Change subscription status (Active → Paused → Inactive)
- Upgrade/downgrade subscription tier
- Changes saved immediately to database

---

### 2. **Invoice Payment Manager Component** (`InvoicePaymentManager.tsx`)

Customer-facing component for managing invoice payments and payment methods.

#### Three Tabs

##### **Invoices Tab**
- **Unpaid Total**: Highlighted card showing total amount owed
- **Invoice List**:
  - Invoice number (copy-able)
  - Amount (DKK)
  - Due date
  - Status badge (Paid ✓ | Unpaid ⏱️ | Overdue ⚠️ | Cancelled ✗)
  - Download button → PDF
  - Payment request button → Email invoice
  
- **Batch Payment**:
  - "Betal fakturaer" button for unpaid invoices
  - Select multiple invoices
  - Choose payment method:
    - 💳 **Credit Card**: Immediate payment via Stripe checkout
    - 🏦 **Bank Transfer**: Manual bank transfer with instructions
    - 📧 **Invoice/Email**: Email payment request to specified address

##### **Payment Methods Tab**
- View all saved payment methods
- Set default payment method
- Add new payment method
- Manage card details (edit/delete)

##### **Payment History Tab**
- All previously paid invoices
- Payment date and amount
- Payment method used
- Paid status with checkmark

---

### 3. **Invoice Payment Request Email**

When customers request payment via email:

**Email Template Features:**
- Professional HTML formatting
- Invoice details (number, amount, due date)
- Two payment options:
  1. **Direct Payment Link** - One-click payment button
  2. **Bank Details** - IBAN, BIC, reference number
- Support contact information
- Brand-consistent styling

---

### 4. **Payment History API** (`GetPaymentHistory`)

REST endpoint for tracking all lessor payments:

**Request:**
```
GET /api/GetPaymentHistory?lessor_id={uuid}&start_date={iso}&end_date={iso}
```

**Response:**
```json
{
  "paid": [
    {
      "id": "uuid",
      "invoiceNumber": "INV-001",
      "amount": 2500,
      "paidDate": "2026-01-15T10:30:00Z",
      "paymentMethod": "credit_card",
      "lessorName": "Company A"
    }
  ],
  "unpaid": [
    {
      "id": "uuid",
      "invoiceNumber": "INV-002",
      "amount": 1500,
      "dueDate": "2026-02-15",
      "status": "overdue",
      "lessorName": "Company A"
    }
  ],
  "totalPaid": 5000,
  "totalUnpaid": 1500,
  "statistics": {
    "totalInvoices": 50,
    "paidInvoices": 45,
    "unpaidInvoices": 5,
    "overdueInvoices": 2,
    "totalAmountPaid": 50000,
    "totalAmountUnpaid": 3000,
    "averagePaymentTime": 7
  }
}
```

---

### 5. **Invoice Payment Request API** (`SendInvoicePaymentRequest`)

Sends email payment requests to lessors:

**Request:**
```json
{
  "invoiceId": "uuid",
  "email": "contact@company.dk",
  "paymentMethod": "invoice"
}
```

**What Happens:**
1. Email sent with invoice details
2. Payment link included for direct payment
3. Bank transfer details provided
4. Invoice status updated with request timestamp
5. Invoice marked for manual follow-up if needed

---

## Database Schema

### New Fields Added to `profiles` Table
```sql
-- Payment method tracking
payment_method VARCHAR(50) -- 'stripe', 'bank_transfer', 'invoice', 'mobilepay'
last_payment_date TIMESTAMP
last_payment_amount DECIMAL(10, 2)

-- Subscription management
subscription_tier VARCHAR(50) -- 'free', 'basic', 'standard', 'premium', etc.
subscription_status VARCHAR(50) -- 'trial', 'active', 'paused', 'inactive'
trial_ends_at TIMESTAMP
stripe_customer_id VARCHAR(255)
stripe_subscription_id VARCHAR(255)
```

### `invoices` Table (Updated)
```sql
payment_method VARCHAR(50)
payment_requested_at TIMESTAMP
payment_request_email VARCHAR(255)
```

### New `lessor_payment_methods` Table (Optional)
```sql
CREATE TABLE lessor_payment_methods (
  id UUID PRIMARY KEY,
  lessor_id UUID NOT NULL,
  type VARCHAR(50), -- 'credit_card', 'bank_transfer', 'invoice'
  name VARCHAR(255),
  is_default BOOLEAN,
  details JSONB,
  created_at TIMESTAMP
);
```

---

## User Workflows

### Admin Workflow: View Payment Overview

1. Navigate to `/admin/subscriptions`
2. See stats dashboard (active, trial, inactive counts)
3. Search for specific company or filter by status
4. Click "Rediger" to modify subscription status/tier
5. Monitor "Seneste betaling" dates and amounts
6. Identify overdue customers (trial ending soon highlighted in red)

### Customer Workflow: Pay Invoice

1. Login to dashboard
2. Go to "Fakturaer" / "Invoices" section
3. See "Udestående betaling" (outstanding amount)
4. Click "Betal fakturaer" (Pay invoices)
5. Choose payment method:
   - **Credit Card** → Redirect to Stripe checkout
   - **Bank Transfer** → Receive bank details
   - **Invoice** → Email payment request
6. Confirm payment
7. See payment in history

---

## Payment Flow Summary

```
Lessor has unpaid invoice
    ↓
Admin creates/sends invoice
    ↓
Lessor receives invoice email
    ↓
Lessor chooses payment method:
    ├─→ Credit Card → Stripe checkout → Immediate payment
    ├─→ Bank Transfer → Manual payment via bank
    └─→ Invoice → Email reminder to send payment
    ↓
Payment tracked in database
    ↓
Automatic receipt email sent
    ↓
Payment appears in payment history
```

---

## Integration Points

### With Stripe Webhooks
- Payment succeeded → Mark invoice as paid
- Subscription created → Update subscription_tier
- Subscription updated → Update subscription_status

### With Email System
- SendInvoicePaymentRequest → Nodemailer + SendGrid
- Invoice payment confirmations
- Trial ending reminders
- Payment receipt emails

### With Cron Jobs
- Daily check for overdue invoices
- Automatic dunning emails (reminders)
- Trial ending notifications (48h before)

---

## Configuration

### Environment Variables Required
```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASSWORD=${SENDGRID_API_KEY}
MAIL_FROM=noreply@lejio.dk
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Admin Dashboard Access
- Added "Abonnementer" (Subscriptions) to admin menu
- Icon: CreditCard
- Path: `/admin/subscriptions`
- Access: Requires admin authentication

---

## Features Implemented

✅ Admin Subscriptions Dashboard with full lessor overview
✅ Real-time search and filtering by status/tier
✅ Batch subscription status/tier edits
✅ Invoice payment manager for customers
✅ Multiple payment method support (card, bank, invoice)
✅ Invoice download (PDF)
✅ Payment request email system
✅ Payment history tracking
✅ Statistics dashboard
✅ Professional email templates
✅ Color-coded status indicators
✅ Trial expiration warnings

---

## Next Steps

1. **Setup Database**: Run migrations to add new fields
2. **Configure Email**: Set SendGrid API key in environment
3. **Test Payment Flow**:
   - Generate test invoice
   - Request payment via email
   - Verify email delivery
   - Check payment tracking
4. **Monitor**: Watch payment history and outstanding amounts
5. **Automate**: Setup cron jobs for:
   - Trial ending reminders (48h before)
   - Overdue payment reminders (7, 14, 30 days)
   - Automatic subscription cancellation (if enabled)

---

## Support

For issues or questions about payment processing, contact:
- Technical: support@lejio.dk
- Billing: billing@lejio.dk
