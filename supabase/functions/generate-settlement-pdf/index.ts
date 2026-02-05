import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SettlementData {
  lessor_id: string;
  month: string; // Format: YYYY-MM
  year: number;
}

interface VehicleSettlement {
  registration: string;
  make: string;
  model: string;
  grossRevenue: number;
  bookingsCount: number;
}

interface LoanDeduction {
  description: string;
  monthlyInstallment: number;
  remainingBalance: number;
}

interface SettlementReport {
  lessorName: string;
  lessorEmail: string;
  companyName: string | null;
  period: string;
  generatedAt: string;
  vehicles: VehicleSettlement[];
  totalGrossRevenue: number;
  commissionRate: number;
  commissionAmount: number;
  loans: LoanDeduction[];
  totalLoanDeductions: number;
  netPayout: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { lessor_id, month, year } = await req.json() as SettlementData;

    if (!lessor_id || !month || !year) {
      throw new Error('lessor_id, month, and year are required');
    }

    console.log(`Generating settlement PDF for lessor ${lessor_id}, period ${year}-${month}`);

    // Fetch lessor profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, company_name, fleet_commission_rate')
      .eq('id', lessor_id)
      .single();

    if (profileError || !profile) {
      throw new Error('Could not find lessor profile');
    }

    const commissionRate = profile.fleet_commission_rate || 30;

    // Fetch vehicles for this lessor
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, make, model, registration')
      .eq('owner_id', lessor_id);

    if (vehiclesError) throw vehiclesError;

    const vehicleIds = (vehicles || []).map(v => v.id);

    // Calculate date range for the month
    const monthStart = new Date(year, parseInt(month) - 1, 1);
    const monthEnd = new Date(year, parseInt(month), 0);
    const monthStartStr = monthStart.toISOString().split('T')[0];
    const monthEndStr = monthEnd.toISOString().split('T')[0];

    // Fetch bookings for this period
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('vehicle_id, total_price, start_date, end_date')
      .in('vehicle_id', vehicleIds)
      .in('status', ['confirmed', 'completed', 'active'])
      .lte('start_date', monthEndStr)
      .gte('end_date', monthStartStr);

    if (bookingsError) throw bookingsError;

    // Calculate revenue per vehicle
    const vehicleSettlements: VehicleSettlement[] = (vehicles || []).map(vehicle => {
      const vehicleBookings = (bookings || []).filter(b => b.vehicle_id === vehicle.id);
      
      // Calculate prorated revenue for bookings that span multiple months
      let grossRevenue = 0;
      vehicleBookings.forEach(booking => {
        const bookingStart = new Date(booking.start_date);
        const bookingEnd = new Date(booking.end_date);
        const totalBookingDays = Math.ceil((bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Calculate days within this month
        const effectiveStart = new Date(Math.max(bookingStart.getTime(), monthStart.getTime()));
        const effectiveEnd = new Date(Math.min(bookingEnd.getTime(), monthEnd.getTime()));
        const daysInMonth = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Prorate the revenue
        const proratedRevenue = (booking.total_price / totalBookingDays) * daysInMonth;
        grossRevenue += proratedRevenue;
      });

      return {
        registration: vehicle.registration,
        make: vehicle.make,
        model: vehicle.model,
        grossRevenue: Math.round(grossRevenue),
        bookingsCount: vehicleBookings.length,
      };
    }).filter(v => v.grossRevenue > 0 || v.bookingsCount > 0);

    const totalGrossRevenue = vehicleSettlements.reduce((sum, v) => sum + v.grossRevenue, 0);
    const commissionAmount = Math.round((totalGrossRevenue * commissionRate) / 100);

    // Fetch active loans for this lessor
    const { data: loans, error: loansError } = await supabase
      .from('fleet_vehicle_loans')
      .select('description, monthly_installment, remaining_balance')
      .eq('lessor_id', lessor_id)
      .eq('status', 'active');

    if (loansError) throw loansError;

    const loanDeductions: LoanDeduction[] = (loans || []).map(loan => ({
      description: loan.description,
      monthlyInstallment: loan.monthly_installment,
      remainingBalance: loan.remaining_balance,
    }));

    const totalLoanDeductions = loanDeductions.reduce((sum, l) => sum + l.monthlyInstallment, 0);
    const netPayout = totalGrossRevenue - commissionAmount - totalLoanDeductions;

    // Build the report
    const report: SettlementReport = {
      lessorName: profile.full_name || 'Ikke angivet',
      lessorEmail: profile.email,
      companyName: profile.company_name,
      period: `${monthStart.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' })}`,
      generatedAt: new Date().toISOString(),
      vehicles: vehicleSettlements,
      totalGrossRevenue,
      commissionRate,
      commissionAmount,
      loans: loanDeductions,
      totalLoanDeductions,
      netPayout,
    };

    // Generate HTML for PDF
    const html = generateSettlementHTML(report);

    console.log('Settlement report generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        report,
        html,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating settlement PDF:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function generateSettlementHTML(report: SettlementReport): string {
  const formatCurrency = (amount: number) => 
    amount.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return `
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LEJIO Opgørelse - ${report.period}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a1a;
      line-height: 1.5;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #10b981;
    }
    .logo { 
      font-size: 28px; 
      font-weight: bold; 
      color: #10b981;
    }
    .doc-info { text-align: right; }
    .doc-info h2 { font-size: 18px; color: #666; }
    .doc-info p { font-size: 14px; color: #888; }
    
    .recipient { margin-bottom: 30px; }
    .recipient h3 { font-size: 16px; color: #666; margin-bottom: 5px; }
    .recipient p { font-size: 14px; }
    
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 20px;
    }
    th, td { 
      padding: 12px; 
      text-align: left; 
      border-bottom: 1px solid #eee;
    }
    th { 
      background: #f8f9fa; 
      font-weight: 600;
      color: #666;
      font-size: 12px;
      text-transform: uppercase;
    }
    td { font-size: 14px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    
    .summary { 
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
    }
    .summary-row { 
      display: flex; 
      justify-content: space-between; 
      padding: 8px 0;
      font-size: 14px;
    }
    .summary-row.total { 
      border-top: 2px solid #ddd; 
      padding-top: 15px;
      margin-top: 10px;
      font-size: 18px;
      font-weight: bold;
    }
    .summary-row.total .amount { color: #10b981; }
    .deduction { color: #ef4444; }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #888;
      text-align: center;
    }
    
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">LEJIO</div>
    <div class="doc-info">
      <h2>Månedlig Opgørelse</h2>
      <p>${report.period}</p>
      <p>Genereret: ${new Date(report.generatedAt).toLocaleDateString('da-DK')}</p>
    </div>
  </div>

  <div class="recipient">
    <h3>Til</h3>
    <p><strong>${report.companyName || report.lessorName}</strong></p>
    <p>${report.lessorEmail}</p>
  </div>

  <h3 style="margin-bottom: 15px; font-size: 16px;">Omsætning pr. køretøj</h3>
  <table>
    <thead>
      <tr>
        <th>Køretøj</th>
        <th class="text-center">Antal bookinger</th>
        <th class="text-right">Brutto omsætning</th>
      </tr>
    </thead>
    <tbody>
      ${report.vehicles.map(v => `
        <tr>
          <td><strong>${v.registration}</strong> - ${v.make} ${v.model}</td>
          <td class="text-center">${v.bookingsCount}</td>
          <td class="text-right">${formatCurrency(v.grossRevenue)} kr</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${report.loans.length > 0 ? `
    <h3 style="margin: 30px 0 15px; font-size: 16px;">Aktive Lån & Afdrag</h3>
    <table>
      <thead>
        <tr>
          <th>Beskrivelse</th>
          <th class="text-right">Månedligt afdrag</th>
          <th class="text-right">Restgæld</th>
        </tr>
      </thead>
      <tbody>
        ${report.loans.map(l => `
          <tr>
            <td>${l.description}</td>
            <td class="text-right deduction">-${formatCurrency(l.monthlyInstallment)} kr</td>
            <td class="text-right">${formatCurrency(l.remainingBalance)} kr</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : ''}

  <div class="summary">
    <div class="summary-row">
      <span>Brutto lejeindtægt</span>
      <span>${formatCurrency(report.totalGrossRevenue)} kr</span>
    </div>
    <div class="summary-row">
      <span>LEJIO kommission (${report.commissionRate}%)</span>
      <span class="deduction">-${formatCurrency(report.commissionAmount)} kr</span>
    </div>
    ${report.totalLoanDeductions > 0 ? `
      <div class="summary-row">
        <span>Afdrag på lån</span>
        <span class="deduction">-${formatCurrency(report.totalLoanDeductions)} kr</span>
      </div>
    ` : ''}
    <div class="summary-row total">
      <span>Udbetaling til dig</span>
      <span class="amount">${formatCurrency(report.netPayout)} kr</span>
    </div>
  </div>

  <div class="footer">
    <p>LEJIO ApS · CVR: XXXXXXXX · www.lejio.dk</p>
    <p>Denne opgørelse er automatisk genereret. Ved spørgsmål kontakt support@lejio.dk</p>
  </div>
</body>
</html>
  `.trim();
}
