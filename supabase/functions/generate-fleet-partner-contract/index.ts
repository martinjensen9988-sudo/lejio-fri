import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContractRequest {
  corporateAccountId: string;
}

// LEJIO brand colors
const LEJIO_GREEN = rgb(0.2, 0.7, 0.4);
const DARK_TEXT = rgb(0.1, 0.1, 0.1);
const GRAY_TEXT = rgb(0.4, 0.4, 0.4);

function getCommissionRate(model: string): number {
  switch (model) {
    case 'partner_starter': return 15;
    case 'fleet_basic': return 25;
    case 'fleet_premium': return 35;
    default: return 15;
  }
}

function getModelLabel(model: string): string {
  switch (model) {
    case 'partner_starter': return 'Partner Starter (15%)';
    case 'fleet_basic': return 'Fleet Basic (25%)';
    case 'fleet_premium': return 'Fleet Premium (35%)';
    default: return 'Partner Starter (15%)';
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('da-DK', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

async function generateContractPDF(contract: {
  contract_number: string;
  partner_company_name: string;
  partner_cvr: string;
  partner_address: string | null;
  partner_postal_code: string | null;
  partner_city: string | null;
  partner_contact_name: string;
  partner_email: string;
  partner_phone: string | null;
  fleet_model: string;
  commission_rate: number;
  initial_vehicle_count: number;
  contract_start_date: string;
  binding_end_date: string;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);
  
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;
  
  const addNewPage = () => {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    yPosition = pageHeight - margin;
  };
  
  const checkPageBreak = (neededHeight: number) => {
    if (yPosition - neededHeight < margin + 50) {
      addNewPage();
    }
  };
  
  const drawText = (text: string, options: {
    x?: number;
    size?: number;
    color?: ReturnType<typeof rgb>;
    bold?: boolean;
    maxWidth?: number;
  } = {}) => {
    const { x = margin, size = 10, color = DARK_TEXT, bold = false, maxWidth = contentWidth } = options;
    const selectedFont = bold ? fontBold : font;
    
    // Word wrap
    const words = text.split(' ');
    let line = '';
    const lines: string[] = [];
    
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const textWidth = selectedFont.widthOfTextAtSize(testLine, size);
      
      if (textWidth > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);
    
    for (const l of lines) {
      checkPageBreak(size + 4);
      currentPage.drawText(l, {
        x,
        y: yPosition,
        size,
        font: selectedFont,
        color,
      });
      yPosition -= size + 4;
    }
  };
  
  const drawSection = (title: string, content: string[]) => {
    checkPageBreak(60);
    yPosition -= 15;
    drawText(title, { size: 12, bold: true, color: LEJIO_GREEN });
    yPosition -= 5;
    for (const line of content) {
      drawText(line, { size: 10 });
    }
  };
  
  // Header
  drawText('Fleet Partneraftale', { size: 24, bold: true, color: LEJIO_GREEN });
  yPosition -= 10;
  drawText(`Kontraktnummer: ${contract.contract_number}`, { size: 11, color: GRAY_TEXT });
  drawText(`Dato: ${formatDate(new Date())}`, { size: 11, color: GRAY_TEXT });
  yPosition -= 20;
  
  // Section 1: Parties
  drawSection('§ 1. Aftalens Parter', []);
  yPosition -= 5;
  
  drawText('1.1 Platformsudbyder:', { size: 10, bold: true });
  drawText('LEJIO', { size: 10 });
  drawText('Erantisvej 2, st. 103', { size: 10 });
  drawText('8800 Viborg', { size: 10 });
  drawText('CVR-nr.: 44691507', { size: 10 });
  drawText('Hjemmeside: www.lejio.dk', { size: 10 });
  yPosition -= 10;
  
  drawText('1.2 Fleet Partner (Partneren/Udlejer):', { size: 10, bold: true });
  drawText(`Virksomhedsnavn: ${contract.partner_company_name}`, { size: 10 });
  drawText(`CVR-nummer: ${contract.partner_cvr}`, { size: 10 });
  if (contract.partner_address) {
    drawText(`Adresse: ${contract.partner_address}`, { size: 10 });
  }
  if (contract.partner_postal_code && contract.partner_city) {
    drawText(`Postnr. og by: ${contract.partner_postal_code} ${contract.partner_city}`, { size: 10 });
  }
  drawText(`Kontaktperson: ${contract.partner_contact_name}`, { size: 10 });
  drawText(`E-mail: ${contract.partner_email}`, { size: 10 });
  if (contract.partner_phone) {
    drawText(`Telefon: ${contract.partner_phone}`, { size: 10 });
  }
  drawText(`Antal køretøjer ved aftalens start: ${contract.initial_vehicle_count}`, { size: 10 });
  
  // Section 2: Definitions
  drawSection('§ 2. Definitioner', [
    '2.1 "Platformen" henviser til LEJIO\'s digitale markedsplads tilgængelig via www.lejio.dk og tilhørende applikationer.',
    '2.2 "Køretøjer" omfatter alle biler, motorcykler, scootere, campingvogne, autocampere og trailere, som Fleet Partner registrerer på Platformen.',
    '2.3 "Booking" betyder en bekræftet lejeaftale mellem Fleet Partner og en Lejer via Platformen.',
    '2.4 "Lejer" er en fysisk eller juridisk person, der lejer et Køretøj via Platformen.',
    '2.5 "Kommission" er det procentvise gebyr, som LEJIO opkræver af hver gennemført Booking.',
    '2.6 "Flåde" defineres som en samling på mere end 35 Køretøjer registreret af samme Fleet Partner.',
    '2.7 "Kontraktperiode" er den aftalte bindingsperiode som angivet i § 5.',
  ]);
  
  // Section 3: Purpose
  drawSection('§ 3. Aftalens Formål og Omfang', [
    '3.1 Denne aftale regulerer vilkårene for Fleet Partners anvendelse af Platformen til udlejning af Køretøjer til Lejere.',
    '3.2 LEJIO stiller Platformen til rådighed, herunder:',
    '    • Eksponering af Fleet Partners Køretøjer',
    '    • Bookingsystem og kalenderadministration',
    '    • Automatisk kontraktgenerering',
    '    • Verificering af Lejere via MitID',
    '    • Rating- og anmeldelsessystem',
    '    • Kundesupport i forbindelse med tekniske spørgsmål',
    '3.3 Fleet Partner er selv ansvarlig for:',
    '    • Køretøjernes tilstand, sikkerhed og lovlighed',
    '    • Forsikringsdækning af samtlige Køretøjer',
    '    • Direkte afregning af leje og depositum med Lejer',
    '    • Overholdelse af gældende lovgivning',
  ]);
  
  // Section 4: Pricing and Commission
  drawSection('§ 4. Priser og Kommission', [
    '4.1 Fleet-modeller:',
    '    • Partner Starter: 15% af bookingværdi - Basis platformadgang, standard support',
    '    • Fleet Basic: 25% af bookingværdi - Udvidet synlighed, prioriteret support, analyserapporter',
    '    • Fleet Premium: 35% af bookingværdi - Maksimal synlighed, dedikeret account manager, API-adgang, co-branding',
    '',
    `4.2 Valgt model: ${getModelLabel(contract.fleet_model)}`,
    '',
    '4.3 Kommissionen beregnes af den totale lejepris (ekskl. depositum).',
    '4.4 Der er intet fast månedligt gebyr i Fleet-modellerne.',
    '4.5 Eventuelle individuelle tillægsaftaler vedrørende særlige rabatter eller vilkår vedlægges som Bilag 1.',
    '4.6 LEJIO forbeholder sig ret til at justere kommissionssatser med 3 måneders skriftligt varsel.',
  ]);
  
  // Section 5: Binding period
  const startDate = new Date(contract.contract_start_date);
  const bindingEnd = new Date(contract.binding_end_date);
  
  drawSection('§ 5. Bindingsperiode og Opsigelse', [
    '5.1 Uopsigelighed og binding: Aftalen er uopsigelig i de første 6 måneder fra underskriftsdatoen.',
    `    Bindingsperiode: ${formatDate(startDate)} til ${formatDate(bindingEnd)}`,
    '5.2 Opsigelse efter bindingsperioden: Herefter kan aftalen opsiges med et varsel på løbende måned + 30 dage.',
    '5.3 Ophævelse ved væsentlig misligholdelse: Begge Parter kan ophæve aftalen med øjeblikkelig virkning ved væsentlig misligholdelse.',
  ]);
  
  // Section 6: Payment
  drawSection('§ 6. Betaling og Fakturering', [
    '6.1 Leje og depositum afregnes direkte mellem Lejer og Fleet Partner.',
    '6.2 LEJIO fakturerer Fleet Partner månedligt bagud for kommission af gennemførte Bookings.',
    '6.3 Betalingsbetingelser: Netto 14 dage fra fakturadato.',
    '6.4 Ved forsinket betaling pålægges rykkergebyr på 100 kr. samt morarente på 2% pr. påbegyndt måned.',
  ]);
  
  // Section 7: Partner obligations
  drawSection('§ 7. Fleet Partners Forpligtelser', [
    '7.1 Køretøjer: Alle Køretøjer skal være lovligt indregistrerede, synede og i forsvarlig stand.',
    '7.2 Forsikring: Fleet Partner garanterer, at samtlige Køretøjer er dækket af gyldig ansvarsforsikring.',
    '7.3 Tilgængelighed: Fleet Partner skal holde kalenderen opdateret med min. 2 ugers fremadrettet ledighed.',
    '7.4 Lejerservice: Henvendelser fra Lejere skal besvares inden for 24 timer på hverdage.',
    '7.5 Overholdelse af lovgivning: Fleet Partner er ansvarlig for at overholde alle relevante love og regler.',
  ]);
  
  // Section 8: LEJIO obligations
  drawSection('§ 8. LEJIOs Forpligtelser', [
    '8.1 LEJIO forpligter sig til at stille en stabil og funktionel Platform til rådighed.',
    '8.2 LEJIO garanterer en oppetid på Platformen på minimum 99% målt på årsbasis.',
    '8.3 Ved driftsforstyrrelser ud over 24 timer kompenseres Fleet Partner med 1 dags kommissionsfritagelse.',
  ]);
  
  // Section 9-11: Responsibility and liability
  drawSection('§ 9. Betalingsflow og Ansvar', [
    '9.1 Leje og depositum afregnes direkte mellem Lejer og Fleet Partner.',
    '9.2 LEJIO fungerer alene som formidlingsplatform.',
    '9.3 Al økonomisk afregning sker direkte mellem Fleet Partner og Lejer.',
  ]);
  
  drawSection('§ 10. Misligholdelse og Sanktioner', [
    '10.1 Ved Fleet Partners misligholdelse kan LEJIO iværksætte sanktioner jf. den fulde aftale.',
    '10.2 Ved gentagen misligholdelse (3+ tilfælde inden for 6 måneder) kan LEJIO ophæve aftalen uden varsel.',
  ]);
  
  drawSection('§ 11. Ansvarsbegrænsning', [
    '11.1 LEJIOs samlede ansvar er begrænset til kommissionen betalt i de 12 måneder forud for skadens indtræden.',
    '11.2 LEJIO er ikke ansvarlig for indirekte tab eller force majeure.',
  ]);
  
  // Section 12-16: Legal
  drawSection('§ 12-16. Fortrolighed, Persondata, Immaterielle Rettigheder, Ændringer, Lovvalg', [
    '12.1 Begge Parter forpligter sig til at behandle alle oplysninger som fortrolige.',
    '13.1 Begge Parter forpligter sig til at overholde GDPR.',
    '14.1 Alle immaterielle rettigheder til Platformen tilhører LEJIO.',
    '15.1 Ændringer i denne aftale skal ske skriftligt.',
    '16.1 Denne aftale er underlagt dansk ret med Retten i Viborg som første instans.',
  ]);
  
  // Signature section
  checkPageBreak(200);
  yPosition -= 30;
  drawText('§ 18. Underskrifter', { size: 14, bold: true, color: LEJIO_GREEN });
  yPosition -= 10;
  drawText('Denne aftale er udarbejdet i to eksemplarer, hvoraf hver Part modtager ét.', { size: 10 });
  yPosition -= 20;
  
  // LEJIO signature
  drawText('For LEJIO:', { size: 11, bold: true });
  yPosition -= 20;
  drawText('Navn: _________________________________', { size: 10 });
  yPosition -= 5;
  drawText('Titel: _________________________________', { size: 10 });
  yPosition -= 5;
  drawText('Dato: _________________________________', { size: 10 });
  yPosition -= 5;
  drawText('Underskrift: ___________________________', { size: 10 });
  
  yPosition -= 30;
  
  // Partner signature
  drawText('For Fleet Partner:', { size: 11, bold: true });
  yPosition -= 20;
  drawText('Navn: _________________________________', { size: 10 });
  yPosition -= 5;
  drawText('Titel: _________________________________', { size: 10 });
  yPosition -= 5;
  drawText('Dato: _________________________________', { size: 10 });
  yPosition -= 5;
  drawText('Underskrift: ___________________________', { size: 10 });
  
  yPosition -= 30;
  drawText('Bilag:', { size: 11, bold: true });
  drawText('• Bilag 1: Individuelle tillægsaftaler (hvis relevant)', { size: 10 });
  drawText('• Bilag 2: Liste over registrerede Køretøjer ved aftalens indgåelse', { size: 10 });
  drawText('• Bilag 3: Kontaktoplysninger for dedikeret account manager (Fleet Premium)', { size: 10 });
  
  yPosition -= 20;
  drawText('Version 1.0 – Januar 2026', { size: 9, color: GRAY_TEXT });
  
  return await pdfDoc.save();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin access
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const isAdmin = roles?.some(r => ['admin', 'super_admin', 'support'].includes(r.role));
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { corporateAccountId }: ContractRequest = await req.json();

    if (!corporateAccountId) {
      return new Response(JSON.stringify({ error: 'corporateAccountId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch corporate account
    const { data: account, error: accountError } = await supabase
      .from('corporate_accounts')
      .select('*')
      .eq('id', corporateAccountId)
      .single();

    if (accountError || !account) {
      return new Response(JSON.stringify({ error: 'Corporate account not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate contract number
    const { data: contractNumber } = await supabase.rpc('generate_fleet_contract_number');

    // Calculate dates
    const startDate = new Date();
    const bindingEndDate = new Date(startDate);
    bindingEndDate.setMonth(bindingEndDate.getMonth() + 6);

    const fleetModel = account.fleet_model || 'partner_starter';
    const commissionRate = getCommissionRate(fleetModel);

    // Create contract record
    const contractData = {
      corporate_account_id: corporateAccountId,
      contract_number: contractNumber,
      partner_company_name: account.company_name,
      partner_cvr: account.cvr_number,
      partner_address: account.billing_address,
      partner_postal_code: account.billing_postal_code,
      partner_city: account.billing_city,
      partner_contact_name: account.contact_name,
      partner_email: account.contact_email,
      partner_phone: account.contact_phone,
      fleet_model: fleetModel,
      commission_rate: commissionRate,
      initial_vehicle_count: account.initial_vehicle_count || 0,
      contract_start_date: startDate.toISOString().split('T')[0],
      binding_end_date: bindingEndDate.toISOString().split('T')[0],
      status: 'draft',
      created_by: user.id,
    };

    const { data: contract, error: insertError } = await supabase
      .from('fleet_partner_contracts')
      .insert(contractData)
      .select()
      .single();

    if (insertError) {
      console.error('Contract insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create contract' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate PDF
    const pdfBytes = await generateContractPDF({
      ...contractData,
      contract_number: contractNumber,
    });

    // Upload PDF to storage
    const pdfPath = `fleet-contracts/${contract.id}/${contractNumber}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(pdfPath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('PDF upload error:', uploadError);
    } else {
      // Update contract with PDF URL
      await supabase
        .from('fleet_partner_contracts')
        .update({ pdf_url: pdfPath })
        .eq('id', contract.id);
    }

    console.log(`Fleet partner contract ${contractNumber} created for ${account.company_name}`);

    return new Response(JSON.stringify({ 
      success: true, 
      contract: { ...contract, pdf_url: pdfPath },
      contractNumber,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-fleet-partner-contract:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
