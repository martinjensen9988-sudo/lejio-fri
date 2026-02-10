import { HttpRequest, HttpResponseInit, app } from '@azure/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * @typedef {Object} PaymentHistoryResponse
 * @property {Array} paid - List of paid invoices
 * @property {Array} unpaid - List of unpaid invoices
 * @property {number} totalPaid - Total paid amount
 * @property {number} totalUnpaid - Total unpaid amount
 * @property {Object} statistics - Payment statistics
 */

async function getPaymentHistory(request) {
  try {
    const lessorId = request.query.get('lessor_id');
    const startDate = request.query.get('start_date');
    const endDate = request.query.get('end_date');

    if (!lessorId) {
      return {
        status: 400,
        jsonBody: { error: 'Missing lessor_id parameter' },
      };
    }

    // Get all invoices for this lessor
    let query = supabase
      .from('invoices')
      .select(
        'id, invoice_number, amount, due_date, status, payment_date, payment_method, created_at, bookings(lessor:profiles(company_name, full_name))'
      )
      .eq('bookings.lessor_id', lessorId);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: invoices, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment history:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to fetch payment history' },
      };
    }

    // Get lessor details
    const { data: lessor } = await supabase
      .from('profiles')
      .select('company_name, full_name, email')
      .eq('id', lessorId)
      .single();

    const lessorName = lessor?.company_name || lessor?.full_name || 'Unknown';

    // Categorize invoices
    const today = new Date();
    const paid = [];
    const unpaid = [];
    let totalPaid = 0;
    let totalUnpaid = 0;
    let overdueCount = 0;
    let paymentTimes = [];

    if (invoices) {
      for (const inv of invoices) {
        if (inv.status === 'paid' && inv.payment_date) {
          paid.push({
            id: inv.id,
            invoiceNumber: inv.invoice_number,
            amount: inv.amount,
            paidDate: inv.payment_date,
            paymentMethod: inv.payment_method || 'Unknown',
            lessorName: lessorName,
          });
          totalPaid += inv.amount;

          // Calculate payment time
          const createdDate = new Date(inv.created_at);
          const paidDate = new Date(inv.payment_date);
          const daysToPay = Math.floor(
            (paidDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          paymentTimes.push(daysToPay);
        } else if (inv.status !== 'cancelled') {
          const status: 'unpaid' | 'overdue' =
            new Date(inv.due_date) < today ? 'overdue' : 'unpaid';
          if (status === 'overdue') {
            overdueCount++;
          }

          unpaid.push({
            id: inv.id,
            invoiceNumber: inv.invoice_number,
            amount: inv.amount,
            dueDate: inv.due_date,
            status,
            lessorName: lessorName,
          });
          totalUnpaid += inv.amount;
        }
      }
    }

    // Calculate average payment time
    const averagePaymentTime =
      paymentTimes.length > 0
        ? Math.round(paymentTimes.reduce((a, b) => a + b) / paymentTimes.length)
        : 0;

    const response = {
      paid: paid.slice(0, 50), // Limit to last 50
      unpaid,
      totalPaid,
      totalUnpaid,
      statistics: {
        totalInvoices: invoices?.length || 0,
        paidInvoices: paid.length,
        unpaidInvoices: unpaid.length,
        overdueInvoices: overdueCount,
        totalAmountPaid: totalPaid,
        totalAmountUnpaid: totalUnpaid,
        averagePaymentTime,
      },
    };

    return {
      status: 200,
      jsonBody: response,
    };
  } catch (error) {
    console.error('Error in getPaymentHistory:', error);
    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
    };
  }
}

app.function('GetPaymentHistory', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getPaymentHistory,
});
