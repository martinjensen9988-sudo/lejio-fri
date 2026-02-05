import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Milestone thresholds
const MILESTONES = [10, 25, 50, 100, 250, 500, 1000];

const logStep = (step: string, details?: unknown) => {
  console.log(`[MILESTONE] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate CRON_SECRET
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      logStep('Unauthorized request');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    logStep('Starting milestone check');

    // Get all lessors with their booking counts
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, company_name');

    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`);
    }

    // Get booking counts per lessor
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('lessor_id');

    if (bookingsError) {
      throw new Error(`Error fetching bookings: ${bookingsError.message}`);
    }

    // Count bookings per lessor
    const bookingCounts = new Map<string, number>();
    for (const booking of bookings || []) {
      const count = bookingCounts.get(booking.lessor_id) || 0;
      bookingCounts.set(booking.lessor_id, count + 1);
    }

    logStep('Booking counts calculated', { 
      totalLessors: profiles?.length,
      lessorsWithBookings: bookingCounts.size 
    });

    // Check for milestone achievements
    const milestonesReached: Array<{
      lessor_id: string;
      email: string;
      name: string;
      milestone: number;
      total_bookings: number;
    }> = [];

    for (const profile of profiles || []) {
      const totalBookings = bookingCounts.get(profile.id) || 0;
      
      // Check if they've exactly hit a milestone
      for (const milestone of MILESTONES) {
        if (totalBookings === milestone) {
          milestonesReached.push({
            lessor_id: profile.id,
            email: profile.email,
            name: profile.full_name || profile.company_name || 'Udlejer',
            milestone,
            total_bookings: totalBookings,
          });
        }
      }
    }

    if (milestonesReached.length === 0) {
      logStep('No milestones reached');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No milestones reached',
        milestonesChecked: MILESTONES 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logStep('Milestones reached', { count: milestonesReached.length });

    // Send notification emails for each milestone
    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPassword = Deno.env.get('SMTP_PASSWORD');
    const smtpFromEmail = Deno.env.get('SMTP_FROM_EMAIL') || 'noreply@lejio.dk';

    if (!smtpHost || !smtpUser || !smtpPassword) {
      logStep('SMTP not configured, skipping email notifications');
      return new Response(JSON.stringify({ 
        success: true, 
        milestonesReached,
        message: 'Milestones found but SMTP not configured' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Import SMTP client
    const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");

    const smtpClient = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: 465,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    });

    let emailsSent = 0;

    for (const achievement of milestonesReached) {
      try {
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Nunito', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: bold; color: #2962FF; }
    .milestone-badge { 
      background: linear-gradient(135deg, #2962FF, #00E676); 
      color: white; 
      padding: 20px 40px; 
      border-radius: 12px; 
      text-align: center; 
      margin: 30px 0;
    }
    .milestone-number { font-size: 48px; font-weight: bold; }
    .milestone-text { font-size: 18px; margin-top: 10px; }
    h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 20px; }
    p { color: #666; line-height: 1.6; }
    .cta { 
      display: inline-block; 
      background: #FFD600; 
      color: #1a1a1a; 
      padding: 12px 24px; 
      border-radius: 8px; 
      text-decoration: none; 
      font-weight: bold;
      margin-top: 20px;
    }
    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">LEJIO</div>
    </div>
    
    <h1>Tillykke, ${achievement.name}! 🎉</h1>
    
    <div class="milestone-badge">
      <div class="milestone-number">${achievement.milestone}</div>
      <div class="milestone-text">bookinger opnået!</div>
    </div>
    
    <p>
      Du har nu gennemført <strong>${achievement.milestone} bookinger</strong> på LEJIO. 
      Det er en fantastisk milepæl, og vi er stolte af at have dig som en del af vores platform.
    </p>
    
    <p>
      Din dedikation og professionelle tilgang gør en forskel, og vi glæder os til at se 
      din forretning fortsætte med at vokse.
    </p>
    
    <p style="text-align: center;">
      <a href="https://lejio.dk/dashboard" class="cta">Se dit dashboard</a>
    </p>
    
    <div class="footer">
      <p>Med venlig hilsen,<br>Holdet bag LEJIO</p>
      <p>lejio.dk</p>
    </div>
  </div>
</body>
</html>
        `;

        await smtpClient.send({
          from: smtpFromEmail,
          to: achievement.email,
          subject: `🎉 Tillykke! Du har nået ${achievement.milestone} bookinger på LEJIO`,
          html: emailHtml,
        });

        emailsSent++;
        logStep('Milestone email sent', { email: achievement.email, milestone: achievement.milestone });
      } catch (emailError) {
        console.error(`Error sending email to ${achievement.email}:`, emailError);
      }
    }

    await smtpClient.close();

    logStep('Milestone check completed', { 
      milestonesFound: milestonesReached.length,
      emailsSent 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      milestonesReached,
      emailsSent 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Milestone check error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
