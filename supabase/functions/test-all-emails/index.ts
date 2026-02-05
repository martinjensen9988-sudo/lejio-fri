import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testType, email } = await req.json();
    
    console.log(`[TEST-EMAIL] Sending test: ${testType} to ${email}`);

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromEmail = Deno.env.get("SMTP_FROM_EMAIL") || "noreply@lejio.dk";

    if (!smtpHost || !smtpUser || !smtpPassword) {
      return new Response(
        JSON.stringify({ success: false, message: "SMTP not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: 465,
        tls: true,
        auth: { username: smtpUser, password: smtpPassword },
      },
    });

    let subject = "";
    let html = "";
    const year = new Date().getFullYear();

    if (testType === "booking_paid") {
      subject = "🎉 [TEST] Booking bekræftet - Tesla Model 3";
      html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #2962FF, #00E676); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .success-badge { background: linear-gradient(135deg, #d4edda, #c3e6cb); border-radius: 16px; padding: 20px; text-align: center; margin: 20px 0; }
    .success-badge h2 { color: #155724; margin: 0; }
    .info-card { background: #f8f9fa; border-radius: 16px; padding: 25px; margin: 20px 0; }
    .info-card h3 { margin: 0 0 15px; color: #2962FF; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e9ecef; }
    .info-row:last-child { border-bottom: none; }
    .price-total { background: linear-gradient(135deg, #2962FF, #00E676); border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
    .price-total p { color: rgba(255,255,255,0.9); margin: 0 0 5px; }
    .price-total h2 { color: white; margin: 0; font-size: 28px; }
    .footer { background: #f8f9fa; padding: 25px; text-align: center; }
    .footer p { margin: 5px 0; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Booking bekræftet!</h1>
      <p style="color: rgba(255,255,255,0.9);">Din betaling er modtaget</p>
    </div>
    <div class="content">
      <div class="success-badge">
        <h2>✅ Betaling gennemført</h2>
        <p style="margin: 10px 0 0; color: #155724;">Din booking er nu bekræftet og reserveret til dig.</p>
      </div>
      <p>Hej Test Lejer,</p>
      <p>Tak for din booking! Vi har modtaget din betaling, og køretøjet er nu reserveret til dig.</p>
      <div class="info-card">
        <h3>🚗 Køretøj</h3>
        <div class="info-row"><span>Bil</span><span><strong>Tesla Model 3</strong></span></div>
        <div class="info-row"><span>Registreringsnummer</span><span><strong>AB12345</strong></span></div>
      </div>
      <div class="info-card">
        <h3>📅 Lejeperiode</h3>
        <div class="info-row"><span>Fra</span><span><strong>Lørdag 25. januar 2025 kl. 10:00</strong></span></div>
        <div class="info-row"><span>Til</span><span><strong>Tirsdag 28. januar 2025 kl. 16:00</strong></span></div>
      </div>
      <div class="price-total">
        <p>Total pris</p>
        <h2>2.500 kr</h2>
      </div>
      <div class="info-card" style="background: #e3f2fd;">
        <h3 style="color: #1565c0;">👤 Din udlejer</h3>
        <p style="margin: 5px 0;"><strong>Demo Udlejer ApS</strong></p>
        <p style="margin: 5px 0;">📞 12345678</p>
        <p style="margin: 5px 0;">✉️ udlejer@demo.dk</p>
      </div>
    </div>
    <div class="footer">
      <p><strong>LEJIO</strong> - Biludlejning gjort nemt</p>
      <p>© ${year} LEJIO. [TEST EMAIL]</p>
    </div>
  </div>
</body>
</html>`;
    } else if (testType === "contract_signed") {
      subject = "📝 [TEST] Kontrakt underskrevet - BMW X5";
      html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #2962FF, #00E676); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .success-badge { background: linear-gradient(135deg, #d4edda, #c3e6cb); border-radius: 16px; padding: 20px; text-align: center; margin: 20px 0; }
    .info-card { background: #f8f9fa; border-radius: 16px; padding: 25px; margin: 20px 0; }
    .info-card h3 { margin: 0 0 15px; color: #2962FF; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e9ecef; }
    .info-row:last-child { border-bottom: none; }
    .footer { background: #f8f9fa; padding: 25px; text-align: center; }
    .footer p { margin: 5px 0; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📝 Kontrakt underskrevet!</h1>
      <p style="color: rgba(255,255,255,0.9);">Begge parter har nu underskrevet</p>
    </div>
    <div class="content">
      <div class="success-badge">
        <h2 style="color: #155724; margin: 0;">✅ Kontrakten er komplet</h2>
        <p style="margin: 10px 0 0; color: #155724;">Begge parter har underskrevet lejekontrakten.</p>
      </div>
      <p>Hej Test Bruger,</p>
      <p>Lejekontrakten for <strong>BMW X5</strong> (CD67890) er nu underskrevet af begge parter og juridisk bindende.</p>
      <div class="info-card">
        <h3>📄 Kontrakt info</h3>
        <div class="info-row"><span>Kontrakt nr.</span><span><strong>2025-TEST001</strong></span></div>
        <div class="info-row"><span>Køretøj</span><span><strong>BMW X5</strong></span></div>
        <div class="info-row"><span>Registreringsnummer</span><span><strong>CD67890</strong></span></div>
      </div>
      <div class="info-card">
        <h3>📅 Lejeperiode</h3>
        <div class="info-row"><span>Fra</span><span><strong>25. januar 2025</strong></span></div>
        <div class="info-row"><span>Til</span><span><strong>30. januar 2025</strong></span></div>
      </div>
      <p style="background: #fff3cd; padding: 15px; border-radius: 12px; color: #856404;">
        <strong>📎 PDF vedhæftet</strong><br>
        I en rigtig email ville PDF-kontrakten være vedhæftet her.
      </p>
    </div>
    <div class="footer">
      <p><strong>LEJIO</strong> - Biludlejning gjort nemt</p>
      <p>© ${year} LEJIO. [TEST EMAIL]</p>
    </div>
  </div>
</body>
</html>`;
    } else if (testType === "check_in") {
      subject = "🔑 [TEST] Bil udleveret - Audi A4";
      html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #2962FF, #00E676); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .info-card { background: #f8f9fa; border-radius: 16px; padding: 25px; margin: 20px 0; }
    .info-card h3 { margin: 0 0 15px; color: #2962FF; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e9ecef; }
    .info-row:last-child { border-bottom: none; }
    .status-box { background: linear-gradient(135deg, #d4edda, #c3e6cb); border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 25px; text-align: center; }
    .footer p { margin: 5px 0; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔑 Bil udleveret</h1>
      <p style="color: rgba(255,255,255,0.9);">Din lejeperiode er nu startet</p>
    </div>
    <div class="content">
      <p>Hej Test Lejer,</p>
      <p>Din leje af <strong>Audi A4</strong> (EF11223) er nu registreret som startet.</p>
      <div class="info-card">
        <h3>📋 Udleverings-info</h3>
        <div class="info-row"><span>Tidspunkt</span><span><strong>23. januar 2025 kl. 10:00</strong></span></div>
        <div class="info-row"><span>Køretøj</span><span><strong>Audi A4</strong></span></div>
        <div class="info-row"><span>Registreringsnummer</span><span><strong>EF11223</strong></span></div>
        <div class="info-row"><span>Km-stand</span><span><strong>45.000 km</strong></span></div>
        <div class="info-row"><span>Brændstofniveau</span><span><strong>100%</strong></span></div>
      </div>
      <div class="status-box">
        <h3 style="color: #155724; margin: 0;">✅ Kør forsigtigt!</h3>
        <p style="margin: 10px 0 0; color: #155724;">Husk at kontakte udlejer ved eventuelle skader eller problemer.</p>
      </div>
    </div>
    <div class="footer">
      <p><strong>LEJIO</strong> - Biludlejning gjort nemt</p>
      <p>© ${year} LEJIO. [TEST EMAIL]</p>
    </div>
  </div>
</body>
</html>`;
    } else if (testType === "check_out") {
      subject = "🏁 [TEST] Bil afleveret - Audi A4";
      html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #FF6B35, #F7C548); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .info-card { background: #f8f9fa; border-radius: 16px; padding: 25px; margin: 20px 0; }
    .info-card h3 { margin: 0 0 15px; color: #2962FF; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e9ecef; }
    .info-row:last-child { border-bottom: none; }
    .status-box { background: linear-gradient(135deg, #fff3cd, #ffeeba); border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 25px; text-align: center; }
    .footer p { margin: 5px 0; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏁 Bil afleveret</h1>
      <p style="color: rgba(255,255,255,0.9);">Din lejeperiode er nu afsluttet</p>
    </div>
    <div class="content">
      <p>Hej Test Lejer,</p>
      <p>Din leje af <strong>Audi A4</strong> (EF11223) er nu registreret som afsluttet.</p>
      <div class="info-card">
        <h3>📋 Afleverings-info</h3>
        <div class="info-row"><span>Tidspunkt</span><span><strong>28. januar 2025 kl. 16:00</strong></span></div>
        <div class="info-row"><span>Køretøj</span><span><strong>Audi A4</strong></span></div>
        <div class="info-row"><span>Registreringsnummer</span><span><strong>EF11223</strong></span></div>
        <div class="info-row"><span>Km-stand</span><span><strong>45.350 km</strong></span></div>
        <div class="info-row"><span>Brændstofniveau</span><span><strong>85%</strong></span></div>
      </div>
      <div class="status-box">
        <h3 style="color: #856404; margin: 0;">✅ Tak for leje!</h3>
        <p style="margin: 10px 0 0; color: #856404;">Vi håber du havde en god oplevelse. Du vil modtage en afregning snarest.</p>
      </div>
      <p style="font-size: 14px; color: #666;">
        <strong>Bemærk:</strong> Evt. ekstra opkrævninger for km-overskridelse eller brændstof vil blive afregnet separat.
      </p>
    </div>
    <div class="footer">
      <p><strong>LEJIO</strong> - Biludlejning gjort nemt</p>
      <p>© ${year} LEJIO. [TEST EMAIL]</p>
    </div>
  </div>
</body>
</html>`;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid testType. Use: booking_paid, contract_signed, check_in, check_out" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await client.send({
      from: smtpFromEmail,
      to: email,
      subject,
      content: html,
      html,
    });

    await client.close();

    console.log(`[TEST-EMAIL] Sent ${testType} to ${email}`);

    return new Response(
      JSON.stringify({ success: true, testType, email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[TEST-EMAIL] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
