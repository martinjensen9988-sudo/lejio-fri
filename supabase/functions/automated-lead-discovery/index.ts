// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutomatedLeadDiscoveryRequest {
  batchSize?: number;
  sendEmails?: boolean;
  enableNotifications?: boolean;
}

interface LeadStats {
  with_email: number;
  with_phone: number;
  with_website: number;
  with_cvr: number;
}

interface AiLeadData {
  total: number;
  savedLeads: number;
  enriched: number;
  stats: LeadStats;
  suggestions: Array<{ company_name: string; industry: string; city?: string; score: number }>;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      batchSize = 20,
      sendEmails = false,
      enableNotifications = true,
    } = (await req.json()) as AutomatedLeadDiscoveryRequest;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Call the ai-find-leads function with discovery mode
    console.log('🚀 Starting automated lead discovery...');
    const startTime = Date.now();

    const aiResponse = await fetch(`${supabaseUrl}/functions/v1/ai-find-leads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'discovery',
        autoEnrich: true,
        sendEmails,
        batchSize,
        includeScoring: true,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI find leads failed: ${errorText}`);
    }

    const aiData = (await aiResponse.json()) as AiLeadData;
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Lead discovery completed in ${duration}s`);
    console.log(`📊 Results:
      - Total found: ${aiData.total}
      - Saved: ${aiData.savedLeads}
      - Enriched: ${aiData.enriched}
      - With email: ${aiData.stats.with_email}
      - With phone: ${aiData.stats.with_phone}
      - With website: ${aiData.stats.with_website}
      - With CVR: ${aiData.stats.with_cvr}
    `);

    // Send admin notification if enabled
    if (enableNotifications && aiData.savedLeads > 0) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-admin-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject: `🎯 Daglig Lead Discovery - ${aiData.savedLeads} nye leads fundet`,
            title: 'Daglig Lead Discovery Rapport',
            content: `
              <h2>Lead Discovery Report</h2>
              <p>Automatisk lead discovery kørt kl. ${new Date().toLocaleTimeString('da-DK')}</p>
              
              <h3>📊 Statistik:</h3>
              <ul>
                <li><strong>Nye leads gemt:</strong> ${aiData.savedLeads} stk</li>
                <li><strong>Berigede (med kontaktinfo):</strong> ${aiData.enriched} stk</li>
                <li><strong>Med email:</strong> ${aiData.stats.with_email} stk</li>
                <li><strong>Med telefon:</strong> ${aiData.stats.with_phone} stk</li>
                <li><strong>Med website:</strong> ${aiData.stats.with_website} stk</li>
                <li><strong>Med CVR:</strong> ${aiData.stats.with_cvr} stk</li>
              </ul>

              <h3>⏱️ Performance:</h3>
              <p>Køretid: ${duration} sekunder</p>

              <h3>🎯 Top 5 Leads (højeste score):</h3>
              <table style="border-collapse: collapse; width: 100%;">
                <tr style="background: #f0f0f0;">
                  <th style="border: 1px solid #ddd; padding: 8px;">Virksomhed</th>
                  <th style="border: 1px solid #ddd; padding: 8px;">Industri</th>
                  <th style="border: 1px solid #ddd; padding: 8px;">By</th>
                  <th style="border: 1px solid #ddd; padding: 8px;">Score</th>
                </tr>
                ${aiData.suggestions
                  .slice(0, 5)
                  .map(
                    (s: any) => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${s.company_name}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${s.industry}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${s.city || '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${s.score}/10</td>
                  </tr>
                `
                  )
                  .join('')}
              </table>

              <hr />
              <p style="font-size: 12px; color: #666;">
                Denne rapport er auto-genereret af LEJIO's Lead Finder system.
                <br />
                Se alle leads i <a href="#">admin dashboard</a>.
              </p>
            `,
          }),
        }).catch(err => console.error('Failed to send notification:', err));
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Automated lead discovery completed',
        results: {
          totalFound: aiData.total,
          savedLeads: aiData.savedLeads,
          enriched: aiData.enriched,
          stats: aiData.stats,
          duration: `${duration}s`,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Automated discovery error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Automated discovery failed',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
