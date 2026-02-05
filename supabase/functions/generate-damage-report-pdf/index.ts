import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DamageItem {
  id: string;
  position: string;
  damage_type: string;
  severity: string;
  description: string | null;
  photo_url: string | null;
}

interface DamageReport {
  id: string;
  report_type: string;
  odometer_reading: number | null;
  fuel_level: string | null;
  exterior_clean: boolean | null;
  interior_clean: boolean | null;
  notes: string | null;
  created_at: string;
  damage_items: DamageItem[];
}

interface RequestBody {
  reportId: string;
  bookingId: string;
}

const POSITION_LABELS: Record<string, string> = {
  'front-left': 'Forfra venstre',
  'front-center': 'Forfra midt',
  'front-right': 'Forfra højre',
  'left-side': 'Venstre side',
  'right-side': 'Højre side',
  'rear-left': 'Bagfra venstre',
  'rear-center': 'Bagfra midt',
  'rear-right': 'Bagfra højre',
  'roof': 'Tag',
  'interior-front': 'Kabine foran',
  'interior-rear': 'Kabine bag',
  'trunk': 'Bagagerum',
};

const DAMAGE_TYPE_LABELS: Record<string, string> = {
  'scratch': 'Ridse',
  'dent': 'Bule',
  'crack': 'Revne',
  'stain': 'Plet',
  'tear': 'Flænge',
  'missing': 'Mangler',
  'broken': 'Ødelagt',
  'other': 'Andet',
};

const SEVERITY_LABELS: Record<string, string> = {
  'minor': 'Mindre',
  'moderate': 'Moderat',
  'severe': 'Alvorlig',
};

const FUEL_LEVEL_LABELS: Record<string, string> = {
  'empty': 'Tom',
  'quarter': '1/4',
  'half': '1/2',
  'three_quarters': '3/4',
  'full': 'Fuld',
};

async function fetchImageAsBytes(url: string): Promise<Uint8Array | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { reportId, bookingId }: RequestBody = await req.json();

    if (!reportId || !bookingId) {
      return new Response(JSON.stringify({ error: "Missing reportId or bookingId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch damage report
    const { data: report, error: reportError } = await supabase
      .from("damage_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      console.error("Report error:", reportError);
      return new Response(JSON.stringify({ error: "Damage report not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch damage items
    const { data: damageItems, error: itemsError } = await supabase
      .from("damage_items")
      .select("*")
      .eq("damage_report_id", reportId)
      .order("created_at", { ascending: true });

    if (itemsError) {
      console.error("Items error:", itemsError);
    }

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, vehicles(*)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("Booking error:", bookingError);
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch lessor profile
    const { data: lessorProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", booking.lessor_id)
      .single();

    console.log("Generating PDF for report:", reportId);

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();
    let y = height - 50;

    const primaryColor = rgb(0.16, 0.38, 1); // Electric Blue
    const textColor = rgb(0.1, 0.1, 0.1);
    const grayColor = rgb(0.4, 0.4, 0.4);

    // Header
    page.drawRectangle({
      x: 0,
      y: height - 80,
      width: width,
      height: 80,
      color: primaryColor,
    });

    page.drawText("LEJIO", {
      x: 50,
      y: height - 45,
      size: 24,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    const reportTypeText = report.report_type === 'pickup' ? 'Udleveringsrapport' : 'Indleveringsrapport';
    page.drawText(`Skadesrapport - ${reportTypeText}`, {
      x: 50,
      y: height - 70,
      size: 14,
      font: helvetica,
      color: rgb(1, 1, 1),
    });

    const dateStr = new Date(report.created_at).toLocaleDateString('da-DK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    page.drawText(dateStr, {
      x: width - 200,
      y: height - 55,
      size: 10,
      font: helvetica,
      color: rgb(1, 1, 1),
    });

    y = height - 110;

    // Vehicle Info Section
    page.drawText("Køretøjsinformation", {
      x: 50,
      y,
      size: 14,
      font: helveticaBold,
      color: primaryColor,
    });
    y -= 25;

    const vehicle = booking.vehicles;
    const vehicleInfo = [
      `Mærke/Model: ${vehicle?.make || ''} ${vehicle?.model || ''} ${vehicle?.variant || ''}`,
      `Registrering: ${vehicle?.registration || 'N/A'}`,
      `Årgang: ${vehicle?.year || 'N/A'}`,
      `Farve: ${vehicle?.color || 'N/A'}`,
    ];

    vehicleInfo.forEach((info) => {
      page.drawText(info, {
        x: 50,
        y,
        size: 10,
        font: helvetica,
        color: textColor,
      });
      y -= 15;
    });

    y -= 15;

    // Lessor/Renter Info
    page.drawText("Udlejer", {
      x: 50,
      y,
      size: 12,
      font: helveticaBold,
      color: textColor,
    });
    page.drawText("Lejer", {
      x: 300,
      y,
      size: 12,
      font: helveticaBold,
      color: textColor,
    });
    y -= 18;

    page.drawText(lessorProfile?.company_name || lessorProfile?.full_name || 'N/A', {
      x: 50,
      y,
      size: 10,
      font: helvetica,
      color: grayColor,
    });
    page.drawText(`${booking.renter_first_name || ''} ${booking.renter_last_name || ''}`.trim() || booking.renter_name || 'N/A', {
      x: 300,
      y,
      size: 10,
      font: helvetica,
      color: grayColor,
    });
    y -= 15;

    page.drawText(lessorProfile?.email || '', {
      x: 50,
      y,
      size: 10,
      font: helvetica,
      color: grayColor,
    });
    page.drawText(booking.renter_email || '', {
      x: 300,
      y,
      size: 10,
      font: helvetica,
      color: grayColor,
    });
    y -= 30;

    // Vehicle Status Section
    page.drawRectangle({
      x: 40,
      y: y - 80,
      width: width - 80,
      height: 100,
      color: rgb(0.97, 0.97, 0.97),
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 1,
    });

    page.drawText("Køretøjets tilstand ved " + (report.report_type === 'pickup' ? 'udlevering' : 'indlevering'), {
      x: 50,
      y: y + 5,
      size: 12,
      font: helveticaBold,
      color: textColor,
    });
    y -= 20;

    const statusInfo = [
      `Kilometerstand: ${report.odometer_reading ? report.odometer_reading.toLocaleString('da-DK') + ' km' : 'Ikke angivet'}`,
      `Brændstofniveau: ${report.fuel_level ? FUEL_LEVEL_LABELS[report.fuel_level] || report.fuel_level : 'Ikke angivet'}`,
      `Udvendig ren: ${report.exterior_clean ? 'Ja' : 'Nej'}`,
      `Indvendig ren: ${report.interior_clean ? 'Ja' : 'Nej'}`,
    ];

    statusInfo.forEach((info, index) => {
      const xPos = index % 2 === 0 ? 50 : 300;
      const yOffset = Math.floor(index / 2) * 18;
      page.drawText(info, {
        x: xPos,
        y: y - yOffset,
        size: 10,
        font: helvetica,
        color: textColor,
      });
    });
    y -= 60;

    if (report.notes) {
      page.drawText(`Bemærkninger: ${report.notes}`, {
        x: 50,
        y,
        size: 10,
        font: helvetica,
        color: grayColor,
      });
      y -= 25;
    }

    y -= 20;

    // Damages Section
    const items = damageItems || [];
    page.drawText(`Registrerede skader (${items.length})`, {
      x: 50,
      y,
      size: 14,
      font: helveticaBold,
      color: primaryColor,
    });
    y -= 25;

    if (items.length === 0) {
      page.drawText("Ingen skader registreret.", {
        x: 50,
        y,
        size: 10,
        font: helvetica,
        color: grayColor,
      });
      y -= 20;
    } else {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Check if we need a new page
        if (y < 150) {
          page = pdfDoc.addPage([595, 842]);
          y = height - 50;
        }

        // Damage item box
        page.drawRectangle({
          x: 40,
          y: y - 60,
          width: width - 80,
          height: 80,
          color: rgb(1, 0.98, 0.94), // Light coral background
          borderColor: rgb(1, 0.54, 0.4),
          borderWidth: 1,
        });

        page.drawText(`Skade ${i + 1}`, {
          x: 50,
          y: y + 5,
          size: 11,
          font: helveticaBold,
          color: textColor,
        });

        // Severity badge
        const severityLabel = SEVERITY_LABELS[item.severity] || item.severity;
        const severityColor = item.severity === 'severe' ? rgb(0.8, 0.2, 0.2) :
                             item.severity === 'moderate' ? rgb(0.9, 0.5, 0.1) :
                             rgb(0.7, 0.6, 0.1);
        page.drawText(severityLabel, {
          x: 110,
          y: y + 5,
          size: 9,
          font: helveticaBold,
          color: severityColor,
        });

        y -= 18;

        page.drawText(`Position: ${POSITION_LABELS[item.position] || item.position}`, {
          x: 50,
          y,
          size: 10,
          font: helvetica,
          color: textColor,
        });

        page.drawText(`Type: ${DAMAGE_TYPE_LABELS[item.damage_type] || item.damage_type}`, {
          x: 250,
          y,
          size: 10,
          font: helvetica,
          color: textColor,
        });

        y -= 15;

        if (item.description) {
          page.drawText(`Beskrivelse: ${item.description}`, {
            x: 50,
            y,
            size: 10,
            font: helvetica,
            color: grayColor,
          });
          y -= 15;
        }

        if (item.photo_url) {
          page.drawText(`📷 Billede vedhæftet`, {
            x: 50,
            y,
            size: 9,
            font: helvetica,
            color: primaryColor,
          });
          y -= 15;
        }

        y -= 25;
      }
    }

    // Footer
    if (y < 80) {
      page = pdfDoc.addPage([595, 842]);
      y = height - 50;
    }

    page.drawLine({
      start: { x: 50, y: 60 },
      end: { x: width - 50, y: 60 },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.9),
    });

    page.drawText("Genereret af LEJIO - lejio.dk", {
      x: 50,
      y: 40,
      size: 8,
      font: helvetica,
      color: grayColor,
    });

    page.drawText(`Rapport ID: ${reportId.slice(0, 8)}`, {
      x: width - 150,
      y: 40,
      size: 8,
      font: helvetica,
      color: grayColor,
    });

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();
    const base64Pdf = btoa(String.fromCharCode(...pdfBytes));

    // Upload to storage
    const fileName = `damage-reports/${bookingId}/${reportId}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
    }

    // Get signed URL
    const { data: signedUrlData } = await supabase.storage
      .from("contracts")
      .createSignedUrl(fileName, 3600); // 1 hour

    console.log("PDF generated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        pdfBase64: base64Pdf,
        pdfUrl: signedUrlData?.signedUrl,
        fileName: `skadesrapport-${report.report_type}-${vehicle?.registration || 'ukendt'}.pdf`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error generating damage report PDF:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate PDF";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
