import { supabase } from '@/integrations/azure/client';
import { differenceInDays, startOfDay, addDays } from 'date-fns';

// Webhook event types
export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

// Invoice type definition
interface Invoice {
  id: string;
  due_date: string;
  lessor_id: string;
  renter_id: string;
}

// Subscription type definition
interface Subscription {
  id: string;
  renter_id: string;
  lessor_id: string;
  vehicle_id: string;
  daily_rate: number;
  billing_cycle_days: number;
  subscription_type: string;
  completed_billing_cycles: number;
  last_billed_date: string | null;
  status: string;
}

// Process overdue invoices and trigger dunning
export const processDunningWebhook = async (): Promise<void> => {
  try {
    // Get all unpaid invoices
    const { data: unpaidInvoices, error } = await (supabase)
      .from('invoices')
      .select('id, due_date, lessor_id, renter_id')
      .in('status', ['unpaid', 'partially_paid', 'overdue'])
      .lt('due_date', new Date().toISOString());

    if (error) throw error;

    for (const invoice of (unpaidInvoices || []) as Invoice[]) {
      const daysOverdue = differenceInDays(new Date(), new Date(invoice.due_date));

      // Determine reminder type based on days overdue
      let reminderType = 'overdue_1';
      if (daysOverdue > 21) {
        reminderType = 'final_notice';
      } else if (daysOverdue > 14) {
        reminderType = 'overdue_3';
      } else if (daysOverdue > 7) {
        reminderType = 'overdue_2';
      }

      // Check if reminder already sent
      const { data: existingReminder } = await (supabase)
        .from('payment_reminders')
        .select('id')
        .eq('invoice_id', invoice.id)
        .eq('reminder_type', reminderType)
        .single();

      if (!existingReminder) {
        // Create reminder
        await (supabase)
          .from('payment_reminders')
          .insert({
            invoice_id: invoice.id,
            reminder_type: reminderType,
            scheduled_date: new Date().toISOString(),
            status: 'pending',
            email_subject: `Rykkerskrivelse: Betaling af faktura ${invoice.id}`,
            email_body: `Din faktura er ${daysOverdue} dage forfalden. Venligst betale hurtigst muligt.`,
            recipient_email: invoice.renter_id, // Will be looked up by RLS
          });
        // Send reminder email via Edge Function
        try {
          await fetch('/functions/v1/send-dunning-reminder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              invoice_id: invoice.id,
              reminder_type: reminderType,
            }),
          });
        } catch (err) {
          console.error('Dunning webhook error:', err);
        }
      }
    }
  } catch (err) {
    console.error('Dunning webhook failed:', err);
  }
};

// Process subscription billings
export const processSubscriptionBillingWebhook = async (): Promise<void> => {
  try {
    const today = startOfDay(new Date()).toISOString();

    // Get subscriptions due for billing
    const { data: dueSubscriptions, error } = await (supabase)
      .from('subscriptions')
      .select('id, renter_id, lessor_id, vehicle_id, daily_rate, billing_cycle_days, subscription_type, completed_billing_cycles')
      .eq('status', 'active')
      .or(
        `and(last_billed_date.is.null,created_at.lt.${today}),` +
        `last_billed_date.lt.${addDays(new Date(today), -1).toISOString()}`
      );

    if (error) throw error;

    for (const subscription of (dueSubscriptions || []) as Subscription[]) {
      const billingAmount = subscription.daily_rate * subscription.billing_cycle_days;

      // Create invoice for subscription
      const { data: invoice, error: invoiceError } = await (supabase)
        .from('invoices')
        .insert({
          booking_id: null, // Subscription-based, not booking-based
          lessor_id: sub.lessor_id,
          renter_id: sub.renter_id,
          invoice_number: `SUB-${Date.now()}`, // Auto-generated
          status: 'sent',
          amount_total: billingAmount,
          amount_paid: 0,
          amount_due: billingAmount,
          issue_date: today,
          due_date: addDays(new Date(today), 30).toISOString(),
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (invoiceError) {
        console.error('Invoice creation error:', invoiceError);
        continue;
      }

      // Update subscription last billed date
      await (supabase)
        .from('subscriptions')
        .update({
          last_billed_date: today,
          completed_billing_cycles: (subscription.completed_billing_cycles || 0) + 1,
        })
        .eq('id', subscription.id);

      // Create accounting entries
      await (supabase)
        .from('accounting_entries')
        .insert([
          {
            invoice_id: invoice.id,
            subscription_id: sub.id,
            lessor_id: sub.lessor_id,
            entry_type: 'revenue',
            account_code: '4200', // Subscription Revenue
            debit_amount: billingAmount,
            credit_amount: 0,
            accounting_period: new Date().toISOString().substring(0, 7), // YYYY-MM
            posting_date: today,
            status: 'posted',
          },
          {
            invoice_id: invoice.id,
            subscription_id: sub.id,
            lessor_id: sub.lessor_id,
            entry_type: 'receivable',
            account_code: '1200', // Accounts Receivable
            debit_amount: 0,
            credit_amount: billingAmount,
            accounting_period: new Date().toISOString().substring(0, 7),
            posting_date: today,
            status: 'posted',
          },
        ]);

      // Send invoice email via Edge Function
      await fetch('/functions/v1/send-invoice-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoice.id,
          subscription_id: subscription.id,
        }),
      }).catch((err) => {
        console.error('Invoice email error:', err);
      });
    }
  } catch (err) {
    console.error('Subscription billing webhook failed:', err);
  }
};

// Handle webhook payload
export const handleWebhookPayload = async (payload: WebhookPayload): Promise<void> => {
  switch (payload.event) {
    case 'process_dunning':
      await processDunningWebhook();
      break;
    case 'process_subscription_billing':
      await processSubscriptionBillingWebhook();
      break;
    default:
      console.warn('Unknown webhook event:', payload.event);
  }
};

// Schedule webhook processing (client-side)
export const initWebhookScheduler = (): (() => void) => {
  // Run dunning process every 6 hours
  const dunningInterval = setInterval(() => {
    processDunningWebhook().catch((err) => {
      console.error('Dunning scheduler error:', err);
    });
  }, 6 * 60 * 60 * 1000);

  // Run subscription billing every 24 hours at midnight
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const timeUntilTomorrow = tomorrow.getTime() - now.getTime();

  setTimeout(() => {
    processSubscriptionBillingWebhook().catch((err) => {
      console.error('Subscription billing error:', err);
    });

    setInterval(() => {
      processSubscriptionBillingWebhook().catch((err) => {
        console.error('Subscription billing scheduler error:', err);
      });
    }, 24 * 60 * 60 * 1000);
  }, timeUntilTomorrow);

  // Return cleanup function
  return () => {
    clearInterval(dunningInterval);
  };
};
