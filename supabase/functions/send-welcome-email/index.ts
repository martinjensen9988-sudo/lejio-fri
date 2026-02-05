import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[&<>"']/g, char => 
    ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[char] || char
  );
}

interface WelcomeEmailRequest {
  email: string;
  fullName: string;
  userType: 'privat' | 'professionel';
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, userType }: WelcomeEmailRequest = await req.json();

    console.log(`[WELCOME-EMAIL] Sending to ${email}, type: ${userType}`);

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromEmail = Deno.env.get("SMTP_FROM_EMAIL") || "noreply@lejio.dk";

    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.log("[WELCOME-EMAIL] SMTP not configured");
      return new Response(
        JSON.stringify({ success: false, message: "SMTP not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const safeName = escapeHtml(fullName) || 'der';
    const isProUser = userType === 'professionel';

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #2962FF, #00E676); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px; }
    .content { padding: 40px 30px; }
    .welcome-box { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 16px; padding: 30px; margin: 20px 0; text-align: center; }
    .welcome-box h2 { color: #2962FF; margin: 0 0 10px; font-size: 24px; }
    .features { margin: 30px 0; }
    .feature { display: flex; align-items: flex-start; margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 12px; }
    .feature-icon { width: 40px; height: 40px; background: #2962FF; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0; }
    .feature-text h3 { margin: 0 0 5px; font-size: 16px; color: #333; }
    .feature-text p { margin: 0; font-size: 14px; color: #666; }
    .cta { text-align: center; margin: 30px 0; }
    .cta a { display: inline-block; background: linear-gradient(135deg, #2962FF, #00E676); color: white; padding: 15px 40px; border-radius: 30px; text-decoration: none; font-weight: 600; font-size: 16px; }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; }
    .footer p { margin: 5px 0; font-size: 12px; color: #888; }
    .footer a { color: #2962FF; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚗 Velkommen til LEJIO!</h1>
      <p>Din konto er nu oprettet</p>
    </div>
    
    <div class="content">
      <div class="welcome-box">
        <h2>Hej ${safeName}! 👋</h2>
        <p>Vi er glade for at have dig med. ${isProUser ? 'Som professionel udlejer har du adgang til alle vores erhvervsværktøjer.' : 'Du er nu klar til at leje eller udleje køretøjer på Danmarks smarteste platform.'}</p>
      </div>

      <div class="features">
        <h3 style="color: #2962FF; margin-bottom: 20px;">🎯 Kom godt i gang</h3>
        
        ${isProUser ? `
        <div class="feature">
          <div class="feature-icon">📊</div>
          <div class="feature-text">
            <h3>Opret dine køretøjer</h3>
            <p>Tilføj dine biler til flåden og kom i gang med at modtage bookinger med det samme.</p>
          </div>
        </div>
        
        <div class="feature">
          <div class="feature-icon">📱</div>
          <div class="feature-text">
            <h3>Digital check-in/check-out</h3>
            <p>Brug vores smarte app til automatisk at registrere km-stand og brændstof.</p>
          </div>
        </div>
        
        <div class="feature">
          <div class="feature-icon">📋</div>
          <div class="feature-text">
            <h3>Digitale kontrakter</h3>
            <p>Alle kontrakter underskrives digitalt - sikkert og juridisk bindende.</p>
          </div>
        </div>
        ` : `
        <div class="feature">
          <div class="feature-icon">🔍</div>
          <div class="feature-text">
            <h3>Find dit perfekte køretøj</h3>
            <p>Søg blandt hundredvis af biler, varevogne og motorcykler i hele Danmark.</p>
          </div>
        </div>
        
        <div class="feature">
          <div class="feature-icon">📱</div>
          <div class="feature-text">
            <h3>Book med få klik</h3>
            <p>Vælg datoer, betal sikkert, og modtag din digitale kontrakt med det samme.</p>
          </div>
        </div>
        
        <div class="feature">
          <div class="feature-icon">⭐</div>
          <div class="feature-text">
            <h3>Verificerede udlejere</h3>
            <p>Alle udlejere er verificeret, så du kan leje med tryghed.</p>
          </div>
        </div>
        `}
      </div>

      <div class="cta">
        <a href="https://lejio.dk/dashboard">Gå til dit dashboard</a>
      </div>

      <p style="text-align: center; color: #888; font-size: 14px; margin-top: 30px;">
        Har du spørgsmål? Du kan altid kontakte os på <a href="mailto:support@lejio.dk" style="color: #2962FF;">support@lejio.dk</a>
      </p>
    </div>

    <div class="footer">
      <p><strong>LEJIO</strong> - Biludlejning gjort nemt</p>
      <p>© ${new Date().getFullYear()} LEJIO. Alle rettigheder forbeholdes.</p>
      <p><a href="https://lejio.dk">lejio.dk</a></p>
    </div>
  </div>
</body>
</html>
    `;

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: 465,
        tls: true,
        auth: { username: smtpUser, password: smtpPassword },
      },
    });

    await client.send({
      from: smtpFromEmail,
      to: email,
      subject: `🚗 Velkommen til LEJIO, ${safeName}!`,
      content: emailHtml,
      html: emailHtml,
    });

    await client.close();

    console.log(`[WELCOME-EMAIL] Sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[WELCOME-EMAIL] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
