import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS/injection
function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[&<>"']/g, char => 
    ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[char] || char
  );
}

interface ContractSignedRequest {
  contractId: string;
  signerRole: 'lessor' | 'renter';
  bothPartiesSigned?: boolean;
}

interface Contract {
  id: string;
  contract_number: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_registration: string;
  vehicle_vin: string | null;
  vehicle_year: number | null;
  vehicle_value: number | null;
  start_date: string;
  end_date: string;
  daily_price: number;
  included_km: number;
  extra_km_price: number;
  total_price: number;
  deposit_amount: number | null;
  deductible_amount: number | null;
  lessor_name: string;
  lessor_email: string;
  lessor_phone: string | null;
  lessor_address: string | null;
  lessor_company_name: string | null;
  lessor_cvr: string | null;
  lessor_signature: string | null;
  lessor_signed_at: string | null;
  renter_name: string;
  renter_email: string;
  renter_phone: string | null;
  renter_address: string | null;
  renter_license_number: string | null;
  renter_signature: string | null;
  renter_signed_at: string | null;
  vanvidskørsel_accepted: boolean;
  vanvidskørsel_liability_amount: number | null;
  insurance_company: string | null;
  insurance_policy_number: string | null;
  status: string;
  checkin_pin?: string;
}

async function generateContractPDF(contract: Contract): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const primaryColor = rgb(0.16, 0.38, 1); // #2962FF
  const dangerColor = rgb(0.8, 0.2, 0.2);
  const textColor = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.5, 0.5, 0.5);
  const lineColor = rgb(0.85, 0.85, 0.85);
  
  let currentPage = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = currentPage.getSize();
  
  const margin = 50;
  let y = height - margin;
  
  const checkNewPage = () => {
    if (y < 80) {
      currentPage = pdfDoc.addPage([595.28, 841.89]);
      y = height - margin;
    }
  };
  
  const drawText = (text: string, x: number, yPos: number, size = 10, font = helvetica, color = textColor) => {
    currentPage.drawText(text, { x, y: yPos, size, font, color });
  };
  
  const drawLine = (yPos: number) => {
    currentPage.drawLine({
      start: { x: margin, y: yPos },
      end: { x: width - margin, y: yPos },
      thickness: 0.5,
      color: lineColor,
    });
  };

  const drawSectionHeader = (title: string, color = primaryColor) => {
    checkNewPage();
    drawLine(y + 5);
    y -= 5;
    drawText(title, margin, y, 12, helveticaBold, color);
    y -= 20;
  };

  const drawLabelValue = (label: string, value: string, xOffset = 0) => {
    drawText(label, margin + xOffset, y, 9, helvetica, lightGray);
    drawText(value, margin + xOffset + 100, y, 10, helvetica, textColor);
  };

  // Header
  drawText('LEJEKONTRAKT', margin, y, 24, helveticaBold, primaryColor);
  drawText(contract.contract_number, margin + 200, y, 16, helveticaBold, textColor);
  y -= 20;
  drawText('LEJIO - Biludlejning', margin, y, 10, helvetica, lightGray);
  y -= 40;
  
  // Udlejer Section
  drawSectionHeader('UDLEJER');
  drawLabelValue('Navn:', contract.lessor_name);
  y -= 15;
  if (contract.lessor_company_name) {
    drawLabelValue('Virksomhed:', contract.lessor_company_name);
    y -= 15;
  }
  if (contract.lessor_cvr) {
    drawLabelValue('CVR. Nr.:', contract.lessor_cvr);
    y -= 15;
  }
  drawLabelValue('Email:', contract.lessor_email);
  y -= 15;
  if (contract.lessor_phone) {
    drawLabelValue('Telefon:', contract.lessor_phone);
    y -= 15;
  }
  if (contract.lessor_address) {
    drawLabelValue('Adresse:', contract.lessor_address);
    y -= 15;
  }
  y -= 10;

  // Lejer Section
  drawSectionHeader('LEJER');
  drawLabelValue('Navn:', contract.renter_name);
  y -= 15;
  drawLabelValue('Email:', contract.renter_email);
  y -= 15;
  if (contract.renter_phone) {
    drawLabelValue('Telefon:', contract.renter_phone);
    y -= 15;
  }
  if (contract.renter_address) {
    drawLabelValue('Adresse:', contract.renter_address);
    y -= 15;
  }
  if (contract.renter_license_number) {
    drawLabelValue('Kørekort nr.:', contract.renter_license_number);
    y -= 15;
  }
  y -= 10;

  // Lejebil Section
  drawSectionHeader('LEJEBIL');
  drawLabelValue('Reg. nr.:', contract.vehicle_registration);
  y -= 15;
  drawLabelValue('Mærke, model:', `${contract.vehicle_make}, ${contract.vehicle_model}`);
  y -= 15;
  if (contract.vehicle_year) {
    drawLabelValue('Årgang:', contract.vehicle_year.toString());
    y -= 15;
  }
  if (contract.vehicle_vin) {
    drawLabelValue('Stelnummer:', contract.vehicle_vin);
    y -= 15;
  }
  if (contract.vehicle_value) {
    drawLabelValue('Køretøjets værdi:', `${contract.vehicle_value.toLocaleString('da-DK')} kr`);
    y -= 15;
  }
  y -= 10;

  // Lejeaftale Section
  const startDate = new Date(contract.start_date).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
  const endDate = new Date(contract.end_date).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
  
  drawSectionHeader('LEJEAFTALE');
  drawText('Periode', margin, y, 10, helveticaBold, textColor);
  y -= 15;
  drawLabelValue('Fra dato:', startDate);
  y -= 15;
  drawLabelValue('Til dato:', endDate);
  y -= 20;

  // Priser Section
  drawSectionHeader('PRISER');
  drawLabelValue('Dagspris:', `${contract.daily_price.toLocaleString('da-DK')} kr inkl. moms`);
  y -= 15;
  drawLabelValue('Km inkl. pr. dag:', `${contract.included_km} km`);
  y -= 15;
  drawLabelValue('Pris pr. overkørt km:', `${contract.extra_km_price} kr inkl. moms`);
  y -= 15;
  if (contract.deposit_amount && contract.deposit_amount > 0) {
    drawLabelValue('Depositum:', `${contract.deposit_amount.toLocaleString('da-DK')} kr`);
    y -= 15;
  }
  y -= 5;
  drawText('Total pris:', margin, y, 11, helveticaBold, textColor);
  drawText(`${contract.total_price.toLocaleString('da-DK')} kr inkl. moms`, margin + 100, y, 12, helveticaBold, primaryColor);
  y -= 20;

  // Forsikring Section
  drawSectionHeader('FORSIKRINGSFORHOLD');
  const deductible = contract.deductible_amount || 5000;
  drawLabelValue('Selvrisiko:', `${deductible.toLocaleString('da-DK')} kr (momsfri)`);
  y -= 15;
  if (contract.insurance_company) {
    drawLabelValue('Forsikringsselskab:', contract.insurance_company);
    y -= 15;
  }
  if (contract.insurance_policy_number) {
    drawLabelValue('Policenummer:', contract.insurance_policy_number);
    y -= 15;
  }
  y -= 10;

  // Førerforhold
  checkNewPage();
  drawSectionHeader('FØRERFORHOLD');
  const forerText = 'Bilen må kun føres af den lejer, der har tegnet lejekontrakten samt personer over 23 år, der hører til lejers husstand, hvis disse har et gyldigt dansk kørekort. Bilen må ikke fremlejes, benyttes til motorsport, eller til person- eller godstransport mod betaling.';
  const forerLines = splitTextToLines(forerText, 70);
  for (const line of forerLines) {
    drawText(line, margin, y, 9, helvetica, textColor);
    y -= 12;
  }
  y -= 10;

  // Vanvidskørsel Section
  checkNewPage();
  drawSectionHeader('VANVIDSKØRSEL', dangerColor);
  const vanvidText = 'Ved lejers underskrift erklærer lejer, at lejer og dem lejer måtte overlade bilen til, ikke tidligere har kørt vanvidskørsel og ikke vil køre i denne bil på en måde der kan karakteriseres som vanvidskørsel, jf. færdselslovens § 133a. Lejer accepterer fuldt erstatningsansvar ved konfiskation af bilen som følge af vanvidskørsel.';
  const vanvidLines = splitTextToLines(vanvidText, 70);
  for (const line of vanvidLines) {
    drawText(line, margin, y, 9, helvetica, textColor);
    y -= 12;
  }
  y -= 5;
  if (contract.vanvidskørsel_liability_amount) {
    drawText('Erstatningsansvar ved konfiskation:', margin, y, 9, helveticaBold, dangerColor);
    drawText(`${contract.vanvidskørsel_liability_amount.toLocaleString('da-DK')} kr`, margin + 200, y, 10, helveticaBold, dangerColor);
    y -= 15;
  }
  if (contract.vanvidskørsel_accepted) {
    drawText('✓ Accepteret af lejer', margin, y, 9, helveticaBold, rgb(0, 0.6, 0.3));
    y -= 15;
  }
  y -= 10;

  // Vilkår Section
  checkNewPage();
  drawSectionHeader('GENERELLE VILKÅR');
  const vilkaar = [
    '• Køretøjet skal afleveres i samme stand som ved modtagelse',
    '• Rygning i køretøjet er ikke tilladt',
    '• Lejer er ansvarlig for at overholde færdselsreglerne',
    '• Ved skader skal udlejer kontaktes omgående',
    '• Lejer hæfter for selvrisiko ved forsikringsskader',
    '• Ved overskridelse af inkluderede km beregnes ekstra km-pris',
    '• Alle bøder og afgifter pålagt køretøjet betales af lejer',
  ];
  for (const v of vilkaar) {
    checkNewPage();
    drawText(v, margin, y, 9, helvetica, textColor);
    y -= 14;
  }
  y -= 10;

  // Underskrifter Section
  checkNewPage();
  drawSectionHeader('UNDERSKRIFTER');
  
  // Udlejer underskrift
  drawText('Udlejer:', margin, y, 10, helveticaBold, textColor);
  y -= 15;
  drawText(contract.lessor_name, margin, y, 10, helvetica, textColor);
  y -= 15;
  
  const lessorSignedDate = contract.lessor_signed_at 
    ? new Date(contract.lessor_signed_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Ikke underskrevet';
  drawText(`Dato: ${lessorSignedDate}`, margin, y, 9, helvetica, lightGray);
  
  if (contract.lessor_signature) {
    try {
      const signatureData = contract.lessor_signature.split(',')[1];
      if (signatureData) {
        const signatureBytes = Uint8Array.from(atob(signatureData), c => c.charCodeAt(0));
        const signatureImage = await pdfDoc.embedPng(signatureBytes);
        const signatureDims = signatureImage.scale(0.3);
        y -= 5;
        currentPage.drawImage(signatureImage, {
          x: margin,
          y: y - Math.min(signatureDims.height, 40),
          width: Math.min(signatureDims.width, 150),
          height: Math.min(signatureDims.height, 40),
        });
        y -= 45;
      }
    } catch (e) {
      console.log('Could not embed lessor signature:', e);
      y -= 15;
      drawText('[Underskrift registreret digitalt]', margin, y, 8, helvetica, lightGray);
      y -= 20;
    }
  } else {
    y -= 30;
    drawLine(y);
    y -= 5;
  }
  
  y -= 15;
  
  // Lejer underskrift
  checkNewPage();
  drawText('Lejer:', margin, y, 10, helveticaBold, textColor);
  y -= 15;
  drawText(contract.renter_name, margin, y, 10, helvetica, textColor);
  y -= 15;
  
  const renterSignedDate = contract.renter_signed_at 
    ? new Date(contract.renter_signed_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Ikke underskrevet';
  drawText(`Dato: ${renterSignedDate}`, margin, y, 9, helvetica, lightGray);
  
  if (contract.renter_signature) {
    try {
      const signatureData = contract.renter_signature.split(',')[1];
      if (signatureData) {
        const signatureBytes = Uint8Array.from(atob(signatureData), c => c.charCodeAt(0));
        const signatureImage = await pdfDoc.embedPng(signatureBytes);
        const signatureDims = signatureImage.scale(0.3);
        y -= 5;
        currentPage.drawImage(signatureImage, {
          x: margin,
          y: y - Math.min(signatureDims.height, 40),
          width: Math.min(signatureDims.width, 150),
          height: Math.min(signatureDims.height, 40),
        });
      }
    } catch (e) {
      console.log('Could not embed renter signature:', e);
      y -= 15;
      drawText('[Underskrift registreret digitalt]', margin, y, 8, helvetica, lightGray);
    }
  } else {
    y -= 30;
    drawLine(y);
  }
  
  // Footer on all pages
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    p.drawText('Genereret af LEJIO • lejio.dk', { 
      x: margin, 
      y: 30, 
      size: 8, 
      font: helvetica, 
      color: lightGray 
    });
    p.drawText(`Kontrakt: ${contract.contract_number} • Side ${i + 1} af ${pages.length}`, { 
      x: width - margin - 150, 
      y: 30, 
      size: 8, 
      font: helvetica, 
      color: lightGray 
    });
  }
  
  return await pdfDoc.save();
}

// Helper function to split text into lines
function splitTextToLines(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  return lines;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Use service role for data access after verifying user
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { contractId, signerRole, bothPartiesSigned }: ContractSignedRequest = await req.json();

    console.log(`Sending contract signed email for contract: ${contractId}, signer: ${signerRole}, bothPartiesSigned: ${bothPartiesSigned}`);

    // Fetch contract details
    const { data: contract, error: contractError } = await supabaseAdmin
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      console.error('Contract not found:', contractError);
      return new Response(JSON.stringify({ error: 'Contract not found' }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format dates
    const startDate = new Date(contract.start_date).toLocaleDateString('da-DK');
    const endDate = new Date(contract.end_date).toLocaleDateString('da-DK');
    const signedAt = new Date().toLocaleDateString('da-DK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Check if SMTP is configured
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") || "noreply@lejio.dk";

    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.log("SMTP not configured, skipping email");
      return new Response(JSON.stringify({ success: true, message: 'SMTP not configured' }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate PDF
    console.log('Generating contract PDF...');
    const pdfBytes = await generateContractPDF(contract as Contract);
    const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));
    console.log('PDF generated successfully, size:', pdfBytes.length);

    // Upload PDF to Supabase Storage
    const fileName = `${contract.lessor_id}/${contract.contract_number}.pdf`;
    console.log('Uploading PDF to storage:', fileName);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error('Error uploading PDF to storage:', uploadError);
    } else {
      console.log('PDF uploaded successfully:', uploadData.path);
      
      // Update contract with PDF URL
      const { data: urlData } = supabase.storage
        .from('contracts')
        .getPublicUrl(fileName);
      
      // For private buckets, we store the path instead
      const pdfPath = fileName;
      
      const { error: updateError } = await supabase
        .from('contracts')
        .update({ pdf_url: pdfPath })
        .eq('id', contractId);
        
      if (updateError) {
        console.error('Error updating contract with PDF URL:', updateError);
      } else {
        console.log('Contract updated with PDF path:', pdfPath);
      }
    }

    // Escape user-provided data for email HTML
    const safeContractNumber = escapeHtml(contract.contract_number);
    const safeVehicleMake = escapeHtml(contract.vehicle_make);
    const safeVehicleModel = escapeHtml(contract.vehicle_model);
    const safeVehicleRegistration = escapeHtml(contract.vehicle_registration);
    const safeLessorName = escapeHtml(contract.lessor_name);
    const safeLessorEmail = escapeHtml(contract.lessor_email);
    const safeLessorPhone = escapeHtml(contract.lessor_phone);
    const safeRenterName = escapeHtml(contract.renter_name);
    const safeRenterEmail = escapeHtml(contract.renter_email);
    const safeRenterPhone = escapeHtml(contract.renter_phone);

    // Build contract details HTML
    const contractDetailsHtml = `
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Kontraktdetaljer</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Kontraktnummer:</td>
            <td style="padding: 8px 0; font-weight: bold;">${safeContractNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Køretøj:</td>
            <td style="padding: 8px 0; font-weight: bold;">${safeVehicleMake} ${safeVehicleModel}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Registreringsnummer:</td>
            <td style="padding: 8px 0; font-weight: bold;">${safeVehicleRegistration}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Lejeperiode:</td>
            <td style="padding: 8px 0; font-weight: bold;">${startDate} - ${endDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Dagspris:</td>
            <td style="padding: 8px 0; font-weight: bold;">${contract.daily_price} kr</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Inkluderede km:</td>
            <td style="padding: 8px 0; font-weight: bold;">${contract.included_km} km/dag</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Total pris:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #2962FF;">${contract.total_price} kr</td>
          </tr>
          ${contract.deposit_amount ? `
          <tr>
            <td style="padding: 8px 0; color: #666;">Depositum:</td>
            <td style="padding: 8px 0; font-weight: bold;">${contract.deposit_amount} kr</td>
          </tr>
          ` : ''}
        </table>
      </div>
    `;

    // Status badge
    const isFullySigned = contract.status === 'signed';
    const statusBadge = isFullySigned 
      ? `<span style="background-color: #00E676; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold;">✓ Fuldt underskrevet</span>`
      : `<span style="background-color: #FFD600; color: #333; padding: 8px 16px; border-radius: 20px; font-weight: bold;">⏳ Afventer ${contract.lessor_signature ? 'lejer' : 'udlejer'}s underskrift</span>`;

    // Build email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Nunito', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2962FF; margin: 0;">LEJIO</h1>
          <p style="color: #666; margin: 5px 0;">Din biludlejningsplatform</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #2962FF 0%, #448AFF 100%); color: white; padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0 0 10px 0;">Kontrakt underskrevet! ✍️</h2>
          <p style="margin: 0; opacity: 0.9;">Du har underskrevet lejekontrakten</p>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.8;">${signedAt}</p>
        </div>

        <div style="text-align: center; margin: 20px 0;">
          ${statusBadge}
        </div>

        <div style="background-color: #e3f2fd; border-left: 4px solid #2962FF; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #1565c0;">
            <strong>📎 Vedhæftet: Lejekontrakt</strong><br>
            Din underskrevne lejekontrakt er vedhæftet som PDF.
          </p>
        </div>

        ${contractDetailsHtml}

        <div style="display: table; width: 100%; margin: 20px 0;">
          <div style="display: table-cell; width: 48%; background-color: #e3f2fd; padding: 15px; border-radius: 8px; vertical-align: top;">
            <h4 style="color: #2962FF; margin-top: 0;">Udlejer</h4>
            <p style="margin: 5px 0;"><strong>${safeLessorName}</strong></p>
            <p style="margin: 5px 0; color: #666;">${safeLessorEmail}</p>
            ${safeLessorPhone ? `<p style="margin: 5px 0; color: #666;">${safeLessorPhone}</p>` : ''}
            ${contract.lessor_signature ? `<p style="margin: 5px 0; color: #00E676;">✓ Underskrevet</p>` : ''}
          </div>
          <div style="display: table-cell; width: 4%;"></div>
          <div style="display: table-cell; width: 48%; background-color: #fff3e0; padding: 15px; border-radius: 8px; vertical-align: top;">
            <h4 style="color: #FF8A65; margin-top: 0;">Lejer</h4>
            <p style="margin: 5px 0;"><strong>${safeRenterName}</strong></p>
            <p style="margin: 5px 0; color: #666;">${safeRenterEmail}</p>
            ${safeRenterPhone ? `<p style="margin: 5px 0; color: #666;">${safeRenterPhone}</p>` : ''}
            ${contract.renter_signature ? `<p style="margin: 5px 0; color: #00E676;">✓ Underskrevet</p>` : ''}
          </div>
        </div>

        ${contract.vanvidskørsel_accepted ? `
        <div style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #c62828;">
            <strong>⚠️ Vanvidskørsel-klausul accepteret:</strong><br>
            Du har accepteret fuldt ansvar for køretøjets værdi ved skader forårsaget af vanvidskørsel.
          </p>
        </div>
        ` : ''}

        ${isFullySigned ? `
        <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #2e7d32;">
            <strong>✓ Kontrakten er nu gyldig!</strong><br>
            Begge parter har underskrevet. Bookingen er bekræftet og køretøjet er klar til afhentning ${startDate}.
          </p>
        </div>
        ` : `
        <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #f57c00;">
            <strong>⏳ Afventer underskrift</strong><br>
            Kontrakten mangler stadig udlejerens underskrift før den er gyldig.
          </p>
        </div>
        `}

        ${isFullySigned && contract.checkin_pin ? `
        <div style="background-color: #f3e5f5; border-left: 4px solid #9c27b0; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #6a1b9a;">
            <strong>🔑 Din check-in PIN-kode:</strong><br>
            Brug denne kode når du scanner QR-koden ved afhentning:<br>
            <span style="font-size: 18px; font-weight: bold; letter-spacing: 3px; color: #2962FF; font-family: 'Courier New', monospace;">${contract.checkin_pin}</span>
          </p>
        </div>
        ` : ''}

        <div style="text-align: center; margin-top: 30px;">
          <a href="https://lejio.dk/my-rentals" style="display: inline-block; background-color: #2962FF; color: white; padding: 14px 28px; text-decoration: none; border-radius: 25px; font-weight: bold;">
            Se mine lejeaftaler
          </a>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
          <p>Dette er en automatisk genereret email fra LEJIO.</p>
          <p>Du modtager denne email fordi du er part i en lejekontrakt.</p>
          <p style="margin-top: 10px;">
            <a href="https://lejio.dk" style="color: #2962FF;">lejio.dk</a>
          </p>
        </div>
      </body>
      </html>
    `;

    // Create SMTP client
    const client = new SMTPClient({
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

    // Determine recipient based on signerRole when bothPartiesSigned is true
    const recipientEmail = signerRole === 'lessor' ? contract.lessor_email : contract.renter_email;
    const recipientName = signerRole === 'lessor' ? safeLessorName : safeRenterName;
    
    // Customize email content based on recipient
    let finalEmailHtml = emailHtml;
    let emailSubject = `Kontrakt ${contract.contract_number} - ${isFullySigned ? 'Fuldt underskrevet ✓' : 'Din underskrift er registreret'}`;
    
    if (bothPartiesSigned && signerRole === 'lessor') {
      // Lessor version when both have signed
      finalEmailHtml = emailHtml
        .replace('Du har underskrevet lejekontrakten', `Kontrakten er nu underskrevet af begge parter`)
        .replace('Se mine lejeaftaler', 'Se mine udlejninger');
      emailSubject = `Kontrakt ${contract.contract_number} - Fuldt underskrevet! ✓`;
    }

    // Send email to the appropriate recipient
    await client.send({
      from: fromEmail,
      to: recipientEmail,
      subject: emailSubject,
      content: finalEmailHtml,
      html: finalEmailHtml,
      attachments: [
        {
          filename: `Lejekontrakt-${contract.contract_number}.pdf`,
          content: pdfBase64,
          encoding: 'base64',
          contentType: 'application/pdf',
        },
      ],
    });

    console.log(`Contract signed email with PDF sent to ${signerRole}:`, recipientEmail);

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in send-contract-signed function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
