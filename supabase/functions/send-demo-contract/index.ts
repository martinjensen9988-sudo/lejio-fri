import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DemoContractRequest {
  recipientEmail: string;
}

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 3; // Max 3 demo contracts per hour per email

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(email);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(email, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  entry.count++;
  return false;
}

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Colors matching the LEJIO design system
const COLORS = {
  primary: rgb(0.16, 0.38, 1),        // #2962FF
  primaryLight: rgb(0.9, 0.93, 1),    // Light blue background
  danger: rgb(0.8, 0.2, 0.2),         // Red
  dangerLight: rgb(1, 0.95, 0.95),    // Light red background
  success: rgb(0.1, 0.7, 0.4),        // Green
  successLight: rgb(0.93, 0.99, 0.96),// Light green background
  amber: rgb(0.85, 0.55, 0.1),        // Amber
  amberLight: rgb(1, 0.98, 0.93),     // Light amber background
  purple: rgb(0.5, 0.3, 0.7),         // Purple
  text: rgb(0.15, 0.15, 0.15),        // Dark text
  textMuted: rgb(0.45, 0.45, 0.45),   // Muted text
  border: rgb(0.9, 0.9, 0.9),         // Border
  bgLight: rgb(0.98, 0.98, 0.98),     // Light background
  white: rgb(1, 1, 1),
};

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

async function generateDemoContractPDF(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let currentPage = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = currentPage.getSize();
  
  const margin = 40;
  const contentWidth = width - margin * 2;
  let y = height - margin;
  let pageNumber = 1;
  
  // Demo data
  const demoContract = {
    contract_number: '2025-000001',
    created_at: new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' }),
    lessor_name: 'LEJIO Demo ApS',
    lessor_company_name: 'LEJIO Demo ApS',
    lessor_cvr: '12345678',
    lessor_email: 'demo@lejio.dk',
    lessor_phone: '+45 12 34 56 78',
    lessor_address: 'Demovej 123, 2100 København Ø',
    renter_name: 'Martin Jensen',
    renter_email: 'martinjensen9988@gmail.com',
    renter_phone: '+45 77 17 67 29',
    renter_address: 'Testvej 456, 7361 Ejstrupholm',
    renter_license_number: '37773994',
    vehicle_registration: 'AB12345',
    vehicle_make: 'VOLKSWAGEN',
    vehicle_model: 'PASSAT',
    vehicle_year: 2022,
    vehicle_vin: 'WVWZZZ3CZWE123456',
    vehicle_value: 250000,
    start_date: '1. januar 2025',
    end_date: '31. januar 2025',
    daily_price: 450,
    included_km: 100,
    extra_km_price: 2.50,
    total_price: 13950,
    deposit_amount: 5000,
    deductible_amount: 6000,
    insurance_company: 'Tryg Forsikring',
    insurance_policy_number: 'POL-2024-123456',
    vanvidskorsel_liability_amount: 250000,
    roadside_assistance_provider: 'Falck',
    roadside_assistance_phone: '+45 70 10 20 30',
    fuel_policy_enabled: true,
    fuel_missing_fee: 250,
    fuel_price_per_liter: 18.50,
  };

  const formatCurrency = (amount: number) => `${amount.toLocaleString('da-DK')} kr`;
  
  const checkNewPage = (requiredSpace: number = 100) => {
    if (y < requiredSpace) {
      // Add footer to current page
      addFooter(currentPage, pageNumber);
      pageNumber++;
      currentPage = pdfDoc.addPage([595.28, 841.89]);
      y = height - margin;
    }
  };

  const addFooter = (page: typeof currentPage, pNum: number) => {
    const totalPages = 4; // Approximate
    page.drawRectangle({
      x: margin,
      y: 20,
      width: contentWidth,
      height: 30,
      color: COLORS.bgLight,
    });
    page.drawText('LEJIO', { x: margin + 10, y: 30, size: 10, font: helveticaBold, color: COLORS.primary });
    page.drawText('• lejio.dk', { x: margin + 50, y: 30, size: 9, font: helvetica, color: COLORS.textMuted });
    page.drawText(`Kontrakt nr. ${demoContract.contract_number}  •  Side ${pNum}`, { 
      x: width - margin - 150, y: 30, size: 9, font: helvetica, color: COLORS.textMuted 
    });
  };

  const drawText = (text: string, x: number, yPos: number, size = 10, font = helvetica, color = COLORS.text) => {
    currentPage.drawText(text, { x, y: yPos, size, font, color });
  };

  const drawRoundedRect = (x: number, yPos: number, w: number, h: number, color: typeof COLORS.white, borderColor?: typeof COLORS.border) => {
    currentPage.drawRectangle({ x, y: yPos, width: w, height: h, color });
    if (borderColor) {
      currentPage.drawRectangle({ x, y: yPos, width: w, height: h, borderColor, borderWidth: 0.5 });
    }
  };

  const drawSectionHeader = (title: string, iconLabel: string, bgColor: typeof COLORS.primaryLight, iconColor: typeof COLORS.primary) => {
    checkNewPage(150);
    y -= 25;
    
    // Icon circle with simple letter (emojis not supported in PDF fonts)
    currentPage.drawCircle({ x: margin + 12, y: y + 3, size: 12, color: bgColor });
    // Use first letter of icon label or fallback
    const safeLabel = iconLabel.length === 1 && iconLabel.charCodeAt(0) < 128 ? iconLabel : title.charAt(0).toUpperCase();
    drawText(safeLabel, margin + 8, y - 1, 8, helveticaBold, iconColor);
    
    // Title
    drawText(title, margin + 30, y, 13, helveticaBold, COLORS.text);
    y -= 20;
  };

  const drawInfoRow = (label: string, value: string, xStart: number = margin, colWidth: number = contentWidth / 2 - 10) => {
    drawText(label, xStart + 10, y, 9, helvetica, COLORS.textMuted);
    drawText(value, xStart + colWidth - 10 - helveticaBold.widthOfTextAtSize(value, 10), y, 10, helveticaBold, COLORS.text);
    y -= 16;
  };

  const drawCard = (x: number, yPos: number, w: number, h: number, bgColor: typeof COLORS.white = COLORS.white) => {
    drawRoundedRect(x, yPos - h, w, h, bgColor, COLORS.border);
  };

  const drawParagraph = (text: string, fontSize = 9, maxWidth = 85) => {
    const lines = splitTextToLines(text, maxWidth);
    for (const line of lines) {
      checkNewPage(80);
      drawText(line, margin + 10, y, fontSize, helvetica, COLORS.text);
      y -= 13;
    }
  };

  // =============== PAGE 1: HEADER & MAIN INFO ===============
  
  // Professional gradient header (simulated with rectangles)
  const headerHeight = 100;
  currentPage.drawRectangle({
    x: 0,
    y: height - headerHeight,
    width: width,
    height: headerHeight,
    color: COLORS.primary,
  });
  
  // Logo box
  drawRoundedRect(margin, height - 75, 80, 45, COLORS.white);
  drawText('LEJIO', margin + 10, height - 60, 22, helveticaBold, COLORS.primary);
  
  // Title
  drawText('Lejekontrakt', margin + 100, height - 45, 24, helveticaBold, COLORS.white);
  currentPage.drawText('Billejeaftale mellem udlejer og lejer', { x: margin + 100, y: height - 62, size: 10, font: helvetica, color: rgb(0.9, 0.9, 1) });
  
  // Contract number box
  const cnBoxWidth = 130;
  currentPage.drawRectangle({ x: width - margin - cnBoxWidth, y: height - 80, width: cnBoxWidth, height: 50, color: rgb(0.3, 0.5, 1) });
  currentPage.drawText('KONTRAKT NR.', { x: width - margin - cnBoxWidth + 15, y: height - 45, size: 8, font: helvetica, color: rgb(0.8, 0.85, 1) });
  drawText(demoContract.contract_number, width - margin - cnBoxWidth + 15, height - 60, 14, helveticaBold, COLORS.white);
  currentPage.drawText(demoContract.created_at, { x: width - margin - cnBoxWidth + 15, y: height - 75, size: 8, font: helvetica, color: rgb(0.8, 0.85, 1) });
  
  y = height - headerHeight - 25;

  // =============== PARTIES SECTION (2 columns) ===============
  const colWidth = (contentWidth - 15) / 2;
  
  // Udlejer Card
  drawCard(margin, y, colWidth, 130, COLORS.white);
  const udlejerY = y - 5;
  currentPage.drawCircle({ x: margin + 17, y: udlejerY - 10, size: 12, color: COLORS.primaryLight });
  drawText('U', margin + 13, udlejerY - 14, 10, helveticaBold, COLORS.primary);
  drawText('Udlejer', margin + 35, udlejerY - 15, 12, helveticaBold, COLORS.text);
  
  let tempY = udlejerY - 35;
  const drawLV = (label: string, value: string, tx: number) => {
    drawText(label, tx, tempY, 8, helvetica, COLORS.textMuted);
    drawText(value, tx + 70, tempY, 9, helvetica, COLORS.text);
    tempY -= 14;
  };
  drawLV('Navn', demoContract.lessor_name, margin + 10);
  drawLV('Virksomhed', demoContract.lessor_company_name, margin + 10);
  drawLV('CVR', demoContract.lessor_cvr, margin + 10);
  drawLV('Email', demoContract.lessor_email, margin + 10);
  drawLV('Telefon', demoContract.lessor_phone, margin + 10);
  drawLV('Adresse', demoContract.lessor_address.substring(0, 30), margin + 10);
  
  // Lejer Card
  drawCard(margin + colWidth + 15, y, colWidth, 130, COLORS.white);
  const lejerX = margin + colWidth + 15;
  currentPage.drawCircle({ x: lejerX + 17, y: udlejerY - 10, size: 12, color: COLORS.successLight });
  drawText('L', lejerX + 14, udlejerY - 14, 10, helveticaBold, COLORS.success);
  drawText('Lejer', lejerX + 35, udlejerY - 15, 12, helveticaBold, COLORS.text);
  
  tempY = udlejerY - 35;
  const drawLV2 = (label: string, value: string) => {
    drawText(label, lejerX + 10, tempY, 8, helvetica, COLORS.textMuted);
    drawText(value, lejerX + 70, tempY, 9, helvetica, COLORS.text);
    tempY -= 14;
  };
  drawLV2('Navn', demoContract.renter_name);
  drawLV2('Email', demoContract.renter_email);
  drawLV2('Telefon', demoContract.renter_phone);
  drawLV2('Adresse', demoContract.renter_address.substring(0, 30));
  drawLV2('Kørekort nr.', demoContract.renter_license_number);
  
  y -= 150;

  // =============== VEHICLE SECTION ===============
  drawSectionHeader('Køretøj', 'K', COLORS.primaryLight, COLORS.primary);
  
  // Vehicle info cards in a row
  const vCardWidth = (contentWidth - 30) / 3;
  
  // Reg card
  drawCard(margin, y, vCardWidth, 55, COLORS.bgLight);
  drawText('REGISTRERING', margin + 10, y - 15, 8, helvetica, COLORS.textMuted);
  drawText(demoContract.vehicle_registration, margin + 10, y - 35, 18, helveticaBold, COLORS.primary);
  
  // Make/model card
  drawCard(margin + vCardWidth + 15, y, vCardWidth, 55, COLORS.bgLight);
  drawText('MÆRKE & MODEL', margin + vCardWidth + 25, y - 15, 8, helvetica, COLORS.textMuted);
  drawText(`${demoContract.vehicle_make} ${demoContract.vehicle_model}`, margin + vCardWidth + 25, y - 32, 11, helveticaBold, COLORS.text);
  drawText(`Årgang ${demoContract.vehicle_year}`, margin + vCardWidth + 25, y - 45, 9, helvetica, COLORS.textMuted);
  
  // Value card
  drawCard(margin + (vCardWidth + 15) * 2, y, vCardWidth, 55, COLORS.bgLight);
  drawText('KØRETØJETS VÆRDI', margin + (vCardWidth + 15) * 2 + 10, y - 15, 8, helvetica, COLORS.textMuted);
  drawText(formatCurrency(demoContract.vehicle_value), margin + (vCardWidth + 15) * 2 + 10, y - 35, 14, helveticaBold, COLORS.text);
  
  y -= 70;
  
  // VIN
  drawText('Stelnummer (VIN):', margin + 10, y, 9, helvetica, COLORS.textMuted);
  drawRoundedRect(margin + 100, y - 5, 180, 18, COLORS.bgLight);
  drawText(demoContract.vehicle_vin, margin + 105, y, 9, helvetica, COLORS.text);
  
  y -= 30;

  // =============== PERIOD & PRICING ===============
  const halfWidth = (contentWidth - 15) / 2;
  
  // Period section
  drawCard(margin, y, halfWidth, 100, COLORS.white);
  currentPage.drawCircle({ x: margin + 17, y: y - 15, size: 12, color: rgb(0.93, 0.9, 0.98) });
  drawText('P', margin + 13, y - 18, 10, helveticaBold, COLORS.purple);
  drawText('Lejeperiode', margin + 35, y - 20, 12, helveticaBold, COLORS.text);
  
  // From/To boxes
  const periodBoxW = (halfWidth - 40) / 2;
  drawRoundedRect(margin + 10, y - 90, periodBoxW, 50, COLORS.bgLight, COLORS.border);
  drawText('FRA', margin + 20, y - 50, 8, helvetica, COLORS.textMuted);
  drawText(demoContract.start_date, margin + 20, y - 70, 10, helveticaBold, COLORS.text);
  
  drawText('->', margin + 10 + periodBoxW + 5, y - 65, 12, helvetica, COLORS.textMuted);
  
  drawRoundedRect(margin + 10 + periodBoxW + 20, y - 90, periodBoxW, 50, COLORS.bgLight, COLORS.border);
  drawText('TIL', margin + 20 + periodBoxW + 20, y - 50, 8, helvetica, COLORS.textMuted);
  drawText(demoContract.end_date, margin + 20 + periodBoxW + 20, y - 70, 10, helveticaBold, COLORS.text);
  
  // Pricing section
  const priceX = margin + halfWidth + 15;
  drawCard(priceX, y, halfWidth, 100, COLORS.white);
  currentPage.drawCircle({ x: priceX + 17, y: y - 15, size: 12, color: COLORS.amberLight });
  drawText('$', priceX + 13, y - 18, 10, helveticaBold, COLORS.amber);
  drawText('Priser', priceX + 35, y - 20, 12, helveticaBold, COLORS.text);
  
  // Price rows
  let priceY = y - 40;
  const drawPriceRow = (label: string, value: string, isBold = false) => {
    drawText(label, priceX + 10, priceY, 9, helvetica, COLORS.text);
    drawText(value, priceX + halfWidth - 20, priceY, isBold ? 11 : 9, isBold ? helveticaBold : helvetica, isBold ? COLORS.primary : COLORS.text);
    priceY -= 14;
  };
  drawPriceRow('Dagspris:', `${formatCurrency(demoContract.daily_price)} inkl. moms`);
  drawPriceRow('Inkluderet km/dag:', `${demoContract.included_km} km`);
  drawPriceRow('Pris pr. overkørt km:', `${demoContract.extra_km_price} kr`);
  drawPriceRow('Depositum:', formatCurrency(demoContract.deposit_amount));
  
  // Total highlight
  drawRoundedRect(priceX, y - 100, halfWidth, 25, COLORS.primaryLight);
  drawText('Total pris', priceX + 10, y - 93, 10, helveticaBold, COLORS.text);
  drawText(formatCurrency(demoContract.total_price), priceX + halfWidth - 80, y - 93, 14, helveticaBold, COLORS.primary);
  
  y -= 120;

  // =============== INSURANCE SECTION ===============
  drawSectionHeader('Forsikring', 'F', COLORS.primaryLight, COLORS.primary);
  
  const insCardW = (contentWidth - 30) / 3;
  drawCard(margin, y, insCardW, 55, COLORS.primaryLight);
  drawText('SELVRISIKO', margin + 10, y - 15, 8, helvetica, COLORS.textMuted);
  drawText(formatCurrency(demoContract.deductible_amount), margin + 10, y - 35, 14, helveticaBold, COLORS.text);
  drawText('momsfri', margin + 10, y - 48, 8, helvetica, COLORS.textMuted);
  
  drawCard(margin + insCardW + 15, y, insCardW, 55, COLORS.primaryLight);
  drawText('FORSIKRINGSSELSKAB', margin + insCardW + 25, y - 15, 8, helvetica, COLORS.textMuted);
  drawText(demoContract.insurance_company, margin + insCardW + 25, y - 35, 11, helveticaBold, COLORS.text);
  
  drawCard(margin + (insCardW + 15) * 2, y, insCardW, 55, COLORS.primaryLight);
  drawText('POLICENUMMER', margin + (insCardW + 15) * 2 + 10, y - 15, 8, helvetica, COLORS.textMuted);
  drawText(demoContract.insurance_policy_number, margin + (insCardW + 15) * 2 + 10, y - 35, 10, helvetica, COLORS.text);
  
  y -= 75;

  // =============== ROADSIDE ASSISTANCE ===============
  drawSectionHeader('Vejhjælp', 'V', COLORS.successLight, COLORS.success);
  
  drawCard(margin, y, contentWidth / 2, 50, COLORS.successLight);
  drawText('Udbyder:', margin + 10, y - 18, 9, helvetica, COLORS.textMuted);
  drawText(demoContract.roadside_assistance_provider, margin + 10, y - 35, 11, helveticaBold, COLORS.text);
  drawText('Kontakt:', margin + contentWidth / 4, y - 18, 9, helvetica, COLORS.textMuted);
  drawText(demoContract.roadside_assistance_phone, margin + contentWidth / 4, y - 35, 14, helveticaBold, COLORS.success);
  
  y -= 70;

  // =============== FUEL POLICY ===============
  if (demoContract.fuel_policy_enabled) {
    drawSectionHeader('Brændstofpolitik', 'B', COLORS.amberLight, COLORS.amber);
    
    drawCard(margin, y, contentWidth, 85, COLORS.amberLight);
    y -= 5;
    drawParagraph('Køretøjet udleveres med fuld tank og skal afleveres med fuld tank. Såfremt tanken ikke er fyldt ved aflevering, gælder følgende gebyrer:', 9, 90);
    
    const fuelCardW = (contentWidth - 30) / 2;
    drawRoundedRect(margin + 10, y - 25, fuelCardW, 35, COLORS.white, COLORS.border);
    drawText('Fast gebyr', margin + 20, y - 10, 8, helvetica, COLORS.textMuted);
    drawText(formatCurrency(demoContract.fuel_missing_fee), margin + 20, y - 25, 14, helveticaBold, COLORS.text);
    
    drawRoundedRect(margin + fuelCardW + 25, y - 25, fuelCardW, 35, COLORS.white, COLORS.border);
    drawText('Pris pr. liter', margin + fuelCardW + 35, y - 10, 8, helvetica, COLORS.textMuted);
    drawText(`${demoContract.fuel_price_per_liter.toFixed(2)} kr`, margin + fuelCardW + 35, y - 25, 14, helveticaBold, COLORS.text);
    
    y -= 45;
  }
  
  // Add footer to page 1
  addFooter(currentPage, pageNumber);

  // =============== PAGE 2: DAMAGE REPORT ===============
  pageNumber++;
  currentPage = pdfDoc.addPage([595.28, 841.89]);
  y = height - margin;

  // Damage section header
  drawSectionHeader('Tilstandsrapport', 'T', rgb(1, 0.95, 0.9), rgb(0.9, 0.5, 0.2));
  
  // Draw vehicle damage diagram function
  const drawVehicleDamageMap = (xStart: number, yStart: number, mapWidth: number, title: string, damages: Array<{position: string, type: string, severity: string}>) => {
    const mapHeight = 180;
    const carWidth = mapWidth - 20;
    const carHeight = 140;
    const carX = xStart + 10;
    const carY = yStart - mapHeight + 30;
    
    // Background card
    drawRoundedRect(xStart, yStart - mapHeight, mapWidth, mapHeight, COLORS.bgLight, COLORS.border);
    
    // Title
    drawText(title, xStart + 10, yStart - 18, 11, helveticaBold, COLORS.text);
    
    // Draw simplified top-down car outline
    const cx = carX + carWidth / 2;
    const cy = carY + carHeight / 2;
    
    // Car body (rectangle with rounded look)
    currentPage.drawRectangle({
      x: cx - 30,
      y: cy - 55,
      width: 60,
      height: 110,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: COLORS.border,
      borderWidth: 1,
    });
    
    // Front (narrower)
    currentPage.drawRectangle({
      x: cx - 25,
      y: cy + 45,
      width: 50,
      height: 20,
      color: rgb(0.92, 0.92, 0.92),
      borderColor: COLORS.border,
      borderWidth: 0.5,
    });
    
    // Rear (narrower)
    currentPage.drawRectangle({
      x: cx - 25,
      y: cy - 65,
      width: 50,
      height: 15,
      color: rgb(0.92, 0.92, 0.92),
      borderColor: COLORS.border,
      borderWidth: 0.5,
    });
    
    // Windshield
    currentPage.drawRectangle({
      x: cx - 20,
      y: cy + 25,
      width: 40,
      height: 18,
      color: rgb(0.85, 0.9, 0.95),
      borderColor: COLORS.border,
      borderWidth: 0.5,
    });
    
    // Rear window
    currentPage.drawRectangle({
      x: cx - 18,
      y: cy - 45,
      width: 36,
      height: 15,
      color: rgb(0.85, 0.9, 0.95),
      borderColor: COLORS.border,
      borderWidth: 0.5,
    });
    
    // Side mirrors
    currentPage.drawCircle({ x: cx - 32, y: cy + 30, size: 4, color: rgb(0.8, 0.8, 0.8) });
    currentPage.drawCircle({ x: cx + 32, y: cy + 30, size: 4, color: rgb(0.8, 0.8, 0.8) });
    
    // Wheels
    currentPage.drawRectangle({ x: cx - 35, y: cy + 15, width: 8, height: 20, color: rgb(0.3, 0.3, 0.3) });
    currentPage.drawRectangle({ x: cx + 27, y: cy + 15, width: 8, height: 20, color: rgb(0.3, 0.3, 0.3) });
    currentPage.drawRectangle({ x: cx - 35, y: cy - 35, width: 8, height: 20, color: rgb(0.3, 0.3, 0.3) });
    currentPage.drawRectangle({ x: cx + 27, y: cy - 35, width: 8, height: 20, color: rgb(0.3, 0.3, 0.3) });
    
    // Position coordinates for damage markers (relative to car center)
    const positionCoords: Record<string, {x: number, y: number}> = {
      'front_left': { x: cx - 20, y: cy + 55 },
      'front_center': { x: cx, y: cy + 55 },
      'front_right': { x: cx + 20, y: cy + 55 },
      'left_front': { x: cx - 35, y: cy + 25 },
      'left_rear': { x: cx - 35, y: cy - 25 },
      'right_front': { x: cx + 35, y: cy + 25 },
      'right_rear': { x: cx + 35, y: cy - 25 },
      'rear_left': { x: cx - 20, y: cy - 60 },
      'rear_center': { x: cx, y: cy - 60 },
      'rear_right': { x: cx + 20, y: cy - 60 },
      'roof': { x: cx, y: cy },
      'hood': { x: cx, y: cy + 35 },
      'trunk': { x: cx, y: cy - 50 },
    };
    
    // Severity colors
    const severityColors: Record<string, typeof COLORS.primary> = {
      'minor': rgb(0.95, 0.8, 0.2),    // Yellow
      'moderate': rgb(0.95, 0.5, 0.2), // Orange
      'severe': rgb(0.9, 0.25, 0.25),  // Red
    };
    
    // Damage type labels
    const typeLabels: Record<string, string> = {
      'scratch': 'R',
      'dent': 'B',
      'crack': 'C',
      'stain': 'P',
    };
    
    // Draw damage markers
    damages.forEach((damage) => {
      const coords = positionCoords[damage.position];
      if (coords) {
        const color = severityColors[damage.severity] || severityColors.minor;
        const label = typeLabels[damage.type] || '?';
        
        // Draw marker circle
        currentPage.drawCircle({ x: coords.x, y: coords.y, size: 8, color: color });
        
        // Draw label
        currentPage.drawText(label, { 
          x: coords.x - 3, 
          y: coords.y - 3, 
          size: 8, 
          font: helveticaBold, 
          color: COLORS.white 
        });
      }
    });
    
    // Damage count badge
    if (damages.length > 0) {
      currentPage.drawCircle({ x: xStart + mapWidth - 20, y: yStart - 18, size: 10, color: COLORS.danger });
      currentPage.drawText(damages.length.toString(), { 
        x: xStart + mapWidth - 23, 
        y: yStart - 22, 
        size: 9, 
        font: helveticaBold, 
        color: COLORS.white 
      });
    }
  };

  // Demo damage data
  const pickupDamages = [
    { position: 'front_left', type: 'scratch', severity: 'minor' },
    { position: 'left_rear', type: 'dent', severity: 'moderate' },
  ];
  
  const returnDamages = [
    { position: 'front_left', type: 'scratch', severity: 'minor' },
    { position: 'left_rear', type: 'dent', severity: 'moderate' },
    { position: 'rear_right', type: 'scratch', severity: 'minor' },
    { position: 'right_front', type: 'crack', severity: 'severe' },
  ];
  
  // Draw two damage maps side by side
  const dmgMapWidth = (contentWidth - 20) / 2;
  drawCard(margin, y, contentWidth, 220, COLORS.bgLight);
  
  drawVehicleDamageMap(margin + 5, y - 10, dmgMapWidth, 'Ved udlevering', pickupDamages);
  drawVehicleDamageMap(margin + dmgMapWidth + 15, y - 10, dmgMapWidth, 'Ved indlevering', returnDamages);
  
  y -= 200;
  
  // Legend
  drawText('Forklaring på skadestyper:', margin + 10, y, 9, helveticaBold, COLORS.textMuted);
  y -= 18;
  
  const legendItems = [
    { color: rgb(0.95, 0.8, 0.2), label: 'R', text: 'Ridse' },
    { color: rgb(0.95, 0.5, 0.2), label: 'B', text: 'Bule' },
    { color: rgb(0.9, 0.25, 0.25), label: 'C', text: 'Revne' },
    { color: rgb(0.6, 0.4, 0.8), label: 'P', text: 'Plet' },
  ];
  
  let legendX = margin + 10;
  legendItems.forEach(item => {
    currentPage.drawCircle({ x: legendX + 5, y: y + 3, size: 6, color: item.color });
    currentPage.drawText(item.label, { x: legendX + 2, y: y, size: 7, font: helveticaBold, color: COLORS.white });
    drawText(item.text, legendX + 15, y, 9, helvetica, COLORS.text);
    legendX += 55;
  });
  
  legendX += 20;
  drawText('|', legendX, y, 9, helvetica, COLORS.textMuted);
  legendX += 15;
  
  // Severity legend
  const severityLegend = [
    { color: rgb(0.95, 0.8, 0.2), text: 'Mindre' },
    { color: rgb(0.95, 0.5, 0.2), text: 'Moderat' },
    { color: rgb(0.9, 0.25, 0.25), text: 'Alvorlig' },
  ];
  
  severityLegend.forEach(item => {
    currentPage.drawCircle({ x: legendX + 5, y: y + 3, size: 6, color: item.color });
    drawText(item.text, legendX + 15, y, 9, helvetica, COLORS.text);
    legendX += 60;
  });
  
  y -= 40;
  addFooter(currentPage, pageNumber);

  // =============== PAGE 3: TERMS ===============
  pageNumber++;
  currentPage = pdfDoc.addPage([595.28, 841.89]);
  y = height - margin;

  drawSectionHeader('Vilkår & Betingelser', 'V', COLORS.bgLight, COLORS.text);
  
  // Terms sections
  const drawTermsSection = (title: string, content: string) => {
    checkNewPage(120);
    drawCard(margin, y, contentWidth, 10, COLORS.white); // Min height, will expand
    drawText(title, margin + 10, y - 15, 11, helveticaBold, COLORS.text);
    y -= 30;
    drawParagraph(content, 9, 95);
    y -= 15;
  };
  
  drawTermsSection('Førerforhold', 
    'Bilen må kun føres af den lejer, der har tegnet lejekontrakten samt personer – over 23 år – der hører til lejers husstand, hvis disse har et gyldigt dansk kørekort, og erklærer at overholde færdselslovens bestemmelser ved deres brug af bilen. Bilen må ikke fremlejes, benyttes til motorsport, eller til person- eller godstransport mod betaling. Bilen må kun anvendes til kørsel i Danmark, hvis ikke andet er aftalt med udlejer.');
  
  drawTermsSection('Betaling', 
    'Betaling sker i henhold til den aftalte betalingsplan. Ved manglende betaling fremsendes rykkerskrivelse med gebyr. Udlejer er berettiget til at ophæve lejeaftalen og tilbagetage bilen straks, såfremt lejer misligholder lejeaftalen.');

  drawTermsSection('Overholdelse af forskrifter', 
    'Lejer er ansvarlig for, at såvel private som offentlige forskrifter, der gælder for benyttelse af køretøjet, overholdes. Dette indebærer tillige, at det påhviler lejer at betale eventuelle parkeringsafgifter, der måtte blive pålagt køretøjet. Hvis lejer forsømmer at betale eventuelt pålagte afgifter (fx standsnings- og parkeringsafgifter) vil udlejer opkræve sådanne afgifter hos lejer med tillæg af gebyrer.');

  drawTermsSection('P-Bøder', 
    'Bøderne skal betales med det samme. Ellers pålægges der ekstra gebyr og ekspeditionsgebyr oveni den oprindelige bøde. Har du mere end 2 ubetalte p-bøder, ophører samarbejdet og lejekontrakten er ikke længere gyldig.');

  drawTermsSection('Ingen rygning', 
    'Rygning er ikke tilladt i bilen. Overtrædes dette, vil udlejer opkræve gebyrer i overensstemmelse med gældende gebyroversigt. Lejer er oplyst om, at det sædvanligvis er særdeles omkostningsfyldt at få renset en bil, hvori der har været røget.');

  drawTermsSection('Service, syn og vedligeholdelse', 
    'Lejer skal vedligeholde bilen, således at bilen til enhver tid er i god og brugbar stand og ikke udviser anden forringelse end, hvad der følger af almindeligt slid og ælde. Det er lejers ansvar, at bilen får gennemført regelmæssige services og synsgennemgange.');

  drawTermsSection('Kaskoforsikring, skader og øvrige udgifter', 
    'Lejer hæfter for alle skader, som ikke er eller ville være dækket af en tegnet kaskoforsikring. Bemærk: Stenslag og evt. udskift af rude er ikke inkluderet i forsikringen. Øvrige udgifter i forbindelse med uheld under udlejningen betales af lejer.');

  drawTermsSection('Ophør', 
    'Opsigelsen er løbende måned + en måned. Udlejer er berettiget til at ophæve lejeaftalen og tilbagetage bilen straks, såfremt lejer misligholder lejeaftalen. Ved lejeaftalens udløb eller dennes ophør, er lejer forpligtet til at tilbagelevere bilen på udlejers adresse.');

  drawTermsSection('Tilbagelevering', 
    'Tilbagelevering skal ske inden kl. 15.00 på sidste dag i din kontrakt. Overtrædelse medfører ekstra dages leje og omkostninger. Bilen afleveres i rengjort og vasket stand. Betalt depositum refunderes 1 måned efter indlevering af bilen.');

  addFooter(currentPage, pageNumber);

  // =============== PAGE 3: FEES & RECKLESS DRIVING ===============
  pageNumber++;
  currentPage = pdfDoc.addPage([595.28, 841.89]);
  y = height - margin;

  // Gebyroversigt
  drawSectionHeader('Gebyroversigt', '💰', COLORS.bgLight, COLORS.text);
  
  drawCard(margin, y, contentWidth, 150, COLORS.bgLight);
  const gebyrer = [
    ['Kopi af aftale', '100 kr pr. aftale'],
    ['Dokumentændringer', '500 kr pr. aftale'],
    ['Rykkerskrivelse', '100 kr pr. faktura'],
    ['Gebyr for mangler ved aflevering', '1.500 kr + faktiske omkostninger'],
    ['Aflevering på forkert sted', '1.500 kr + faktiske omkostninger'],
    ['Gebyr for ubetalte afgifter/bøder', '500 kr'],
    ['Rygning i køretøjet', '5.000 kr'],
    ['Udeblivelse fra værkstedstid', '500 kr'],
  ];
  
  let gY = y - 15;
  for (const [gebyr, pris] of gebyrer) {
    drawText(`• ${gebyr}`, margin + 15, gY, 9, helvetica, COLORS.text);
    drawText(pris, margin + contentWidth - 150, gY, 9, helveticaBold, COLORS.text);
    gY -= 16;
  }
  
  y -= 170;

  // Vanvidskørsel section - with danger styling
  checkNewPage(250);
  y -= 15;
  drawRoundedRect(margin, y - 200, contentWidth, 215, COLORS.dangerLight, COLORS.danger);
  
  currentPage.drawCircle({ x: margin + 17, y: y - 15, size: 12, color: rgb(1, 0.9, 0.9) });
  drawText('!', margin + 14, y - 18, 10, helveticaBold, COLORS.danger);
  drawText('Vanvidskørsel', margin + 35, y - 20, 13, helveticaBold, COLORS.danger);
  
  y -= 40;
  const vanvidText = 'Ved lejers underskrift, erklærer lejer, at lejer – og dem lejer måtte overlade bilen til – ikke tidligere har kørt, eller vil køre i denne bil, på en måde, der kan karakteriseres som vanvidskørsel, jf. færdselslovens § 133a.';
  drawParagraph(vanvidText, 9, 92);
  
  y -= 5;
  const vanvidText2 = 'Lejer accepterer personligt det fulde erstatningsansvar ved konfiskation af bilen som følge af vanvidskørsel.';
  const lines2 = splitTextToLines(vanvidText2, 92);
  for (const line of lines2) {
    drawText(line, margin + 15, y, 9, helveticaBold, COLORS.text);
    y -= 13;
  }
  
  y -= 10;
  drawRoundedRect(margin + 15, y - 30, contentWidth - 30, 35, rgb(1, 0.95, 0.95), COLORS.danger);
  drawText('Erstatningsansvar ved konfiskation', margin + 25, y - 15, 10, helveticaBold, COLORS.danger);
  drawText(formatCurrency(demoContract.vanvidskorsel_liability_amount), margin + contentWidth - 150, y - 15, 16, helveticaBold, COLORS.danger);
  
  y -= 50;
  drawText('Følgende overtrædelser betragtes som vanvidskørsel:', margin + 15, y, 10, helveticaBold, COLORS.danger);
  y -= 18;
  const vanvidsRules = [
    'Uagtsomt manddrab under særligt skærpende omstændigheder',
    'Særlig hensynsløs kørsel',
    'Kørsel med hastighedsoverskridelse på mere end 100% ved kørsel over 100 km/t',
    'Kørsel med en hastighed på 200 km/t eller derover',
    'Spirituskørsel med en promille over 2,00',
  ];
  for (const rule of vanvidsRules) {
    drawText(`• ${rule}`, margin + 20, y, 9, helvetica, COLORS.text);
    y -= 14;
  }
  
  y -= 30;
  
  addFooter(currentPage, pageNumber);

  // =============== PAGE 4: SIGNATURES ===============
  pageNumber++;
  currentPage = pdfDoc.addPage([595.28, 841.89]);
  y = height - margin;

  drawSectionHeader('Underskrifter', 'U', rgb(0.93, 0.9, 0.98), COLORS.purple);
  
  const sigWidth = (contentWidth - 20) / 2;
  
  // Udlejer signature
  drawCard(margin, y, sigWidth, 130, COLORS.bgLight);
  drawText('Udlejer', margin + 15, y - 20, 11, helveticaBold, COLORS.text);
  
  // Signature placeholder
  currentPage.drawRectangle({
    x: margin + 15,
    y: y - 85,
    width: sigWidth - 30,
    height: 45,
    borderColor: COLORS.border,
    borderWidth: 1,
  });
  drawText('Afventer underskrift', margin + sigWidth / 2 - 40, y - 65, 9, helvetica, COLORS.textMuted);
  
  drawText(demoContract.lessor_name, margin + 15, y - 105, 10, helveticaBold, COLORS.text);
  drawText('Dato: [Afventer]', margin + 15, y - 120, 9, helvetica, COLORS.textMuted);
  
  // Lejer signature
  drawCard(margin + sigWidth + 20, y, sigWidth, 130, COLORS.bgLight);
  drawText('Lejer', margin + sigWidth + 35, y - 20, 11, helveticaBold, COLORS.text);
  
  // Signature placeholder
  currentPage.drawRectangle({
    x: margin + sigWidth + 35,
    y: y - 85,
    width: sigWidth - 30,
    height: 45,
    borderColor: COLORS.border,
    borderWidth: 1,
  });
  drawText('Afventer underskrift', margin + sigWidth + sigWidth / 2 - 20, y - 65, 9, helvetica, COLORS.textMuted);
  
  drawText(demoContract.renter_name, margin + sigWidth + 35, y - 105, 10, helveticaBold, COLORS.text);
  drawText('Dato: [Afventer]', margin + sigWidth + 35, y - 120, 9, helvetica, COLORS.textMuted);
  
  addFooter(currentPage, pageNumber);
  
  return await pdfDoc.save();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail }: DemoContractRequest = await req.json();

    // Validate email format
    if (!recipientEmail || !isValidEmail(recipientEmail)) {
      console.error("Invalid email format:", recipientEmail);
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check rate limit
    if (isRateLimited(recipientEmail.toLowerCase())) {
      console.error("Rate limit exceeded for:", recipientEmail);
      return new Response(JSON.stringify({ 
        error: "Too many requests. Please try again later.",
        retryAfterMinutes: 60 
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Generating and sending demo contract to: ${recipientEmail}`);

    // Check if SMTP is configured
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") || "noreply@lejio.dk";

    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.error("SMTP not configured");
      return new Response(JSON.stringify({ error: 'SMTP not configured' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate PDF
    console.log('Generating demo contract PDF...');
    const pdfBytes = await generateDemoContractPDF();
    const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));
    console.log('PDF generated successfully, size:', pdfBytes.length);

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
          <h1 style="color: #2962FF; margin: 0; font-size: 32px;">LEJIO</h1>
          <p style="color: #666; margin: 5px 0;">Danmarks bedste biludlejningsplatform</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #2962FF 0%, #1e4bd8 100%); color: white; padding: 30px; border-radius: 16px; margin-bottom: 25px;">
          <h2 style="margin: 0 0 10px 0; font-size: 24px;">Din demo lejekontrakt</h2>
          <p style="margin: 0; opacity: 0.9;">Tak for din interesse i LEJIO!</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin-bottom: 25px;">
          <h3 style="margin: 0 0 15px 0; color: #333;">Hvad er inkluderet?</h3>
          <ul style="margin: 0; padding-left: 20px; color: #555;">
            <li style="margin-bottom: 8px;">Professionelt designet lejekontrakt</li>
            <li style="margin-bottom: 8px;">Alle nødvendige juridiske vilkår</li>
            <li style="margin-bottom: 8px;">Digital underskrift sektion</li>
            <li style="margin-bottom: 8px;">Vanvidskørsel erklæring</li>
            <li style="margin-bottom: 8px;">Gebyroversigt</li>
          </ul>
        </div>
        
        <p style="color: #555;">Vedhæftet finder du en demo-version af vores lejekontrakt. Denne viser, hvordan dine kontrakter vil se ud, når du bruger LEJIO til at administrere dine biludlejninger.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://lejio.dk" style="display: inline-block; background: #2962FF; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Kom i gang med LEJIO</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #888; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} LEJIO • Danmarks bedste biludlejningsplatform<br>
          <a href="https://lejio.dk" style="color: #2962FF;">lejio.dk</a>
        </p>
      </body>
      </html>
    `;

    // Initialize SMTP client with SSL
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

    // Send email with PDF attachment
    await client.send({
      from: fromEmail,
      to: recipientEmail,
      subject: "Din LEJIO Demo Lejekontrakt",
      content: "auto",
      html: emailHtml,
      attachments: [
        {
          filename: `LEJIO-Demo-Lejekontrakt-2025-000001.pdf`,
          content: pdfBase64,
          encoding: "base64",
          contentType: "application/pdf",
        },
      ],
    });

    await client.close();

    console.log(`Demo contract email sent to: ${recipientEmail}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in send-demo-contract function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
