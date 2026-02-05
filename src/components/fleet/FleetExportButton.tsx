import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FleetVehicleStats, FleetPremiumSummary } from '@/hooks/useFleetPremiumVehicles';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from 'sonner';

interface FleetExportButtonProps {
  vehicles: FleetVehicleStats[];
  summary: FleetPremiumSummary;
  month: number;
  year: number;
}

export const FleetExportButton = ({ vehicles, summary, month, year }: FleetExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const monthName = format(new Date(year, month - 1, 1), 'MMMM', { locale: da });

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const generateCSV = () => {
    const headers = [
      'Reg.nr',
      'Model',
      'Årgang',
      'Kilometerstand',
      'Brutto lejeindtægt',
      'LEJIO kommission (%)',
      'LEJIO salær (kr)',
      'Rengøringsgebyr',
      'Månedligt afdrag',
      'Restgæld',
      'Netto-udbetaling',
      'Udlejningsdage',
      'Tilgængelighedsdage',
      'Garanti %',
      'Status',
    ];

    const rows = vehicles.map(v => [
      v.registration,
      `${v.make} ${v.model}`,
      v.year || '',
      v.current_odometer || '',
      formatCurrency(v.monthlyGrossRevenue),
      `${Math.round(v.commissionRate * 100)}%`,
      formatCurrency(v.lejioCommissionAmount),
      formatCurrency(v.cleaningFees),
      formatCurrency(v.monthlyInstallment),
      formatCurrency(v.totalLoanBalance),
      formatCurrency(v.netPayout),
      v.daysRentedThisYear,
      v.daysAvailableThisYear,
      `${Math.round(v.guaranteePercentage)}%`,
      v.currentStatus === 'rented' ? 'Udlejet' : 
        v.currentStatus === 'available' ? 'Klar' : 
        v.currentStatus === 'maintenance' ? 'Værksted' : 'Klargøring',
    ]);

    // Add summary row
    rows.push([]);
    rows.push(['TOTAL', '', '', '',
      formatCurrency(summary.totalMonthlyGrossRevenue),
      '',
      formatCurrency(summary.totalCommission),
      formatCurrency(summary.totalCleaningFees),
      formatCurrency(summary.totalMonthlyInstallments),
      formatCurrency(summary.totalLoanBalance),
      formatCurrency(summary.finalNetPayout),
      '', '', '', '',
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    return csvContent;
  };

  const generateRevisorText = () => {
    const lines = [
      `FLEET PREMIUM MÅNEDSRAPPORT`,
      `${monthName} ${year}`,
      `Genereret: ${format(new Date(), 'd. MMMM yyyy HH:mm', { locale: da })}`,
      ``,
      `═══════════════════════════════════════════════════════════`,
      `OPSUMMERING`,
      `═══════════════════════════════════════════════════════════`,
      ``,
      `Antal køretøjer: ${summary.totalVehicles}`,
      ``,
      `INDTÆGTER:`,
      `  Brutto lejeindtægt:        ${formatCurrency(summary.totalMonthlyGrossRevenue).padStart(12)} kr`,
      `  Rengøringsgebyrer:        +${formatCurrency(summary.totalCleaningFees).padStart(12)} kr`,
      ``,
      `FRADRAG:`,
      `  LEJIO kommission:         -${formatCurrency(summary.totalCommission).padStart(12)} kr`,
      `  Månedlige afdrag:         -${formatCurrency(summary.totalMonthlyInstallments).padStart(12)} kr`,
      ``,
      `───────────────────────────────────────────────────────────`,
      `  NETTO-UDBETALING:          ${formatCurrency(summary.finalNetPayout).padStart(12)} kr`,
      `───────────────────────────────────────────────────────────`,
      ``,
      `RESTGÆLD (LÅN/AFDRAG):       ${formatCurrency(summary.totalLoanBalance).padStart(12)} kr`,
      ``,
      ``,
      `═══════════════════════════════════════════════════════════`,
      `SPECIFIKATION PR. KØRETØJ`,
      `═══════════════════════════════════════════════════════════`,
    ];

    vehicles.forEach((v, index) => {
      lines.push(``);
      lines.push(`${index + 1}. ${v.make} ${v.model} (${v.registration})`);
      lines.push(`───────────────────────────────────────────────────────────`);
      lines.push(`  Årgang: ${v.year || 'Ukendt'}    Km-stand: ${v.current_odometer?.toLocaleString('da-DK') || 'Ukendt'} km`);
      lines.push(`  Status: ${v.currentStatus === 'rented' ? 'Udlejet' : v.currentStatus === 'available' ? 'Klar til udlejning' : v.currentStatus === 'maintenance' ? 'Værksted' : 'Klargøring'}`);
      lines.push(``);
      lines.push(`  Brutto lejeindtægt:        ${formatCurrency(v.monthlyGrossRevenue).padStart(12)} kr`);
      lines.push(`  LEJIO kommission (${Math.round(v.commissionRate * 100)}%):   -${formatCurrency(v.lejioCommissionAmount).padStart(12)} kr`);
      if (v.cleaningFees > 0) {
        lines.push(`  Rengøringsgebyr:          +${formatCurrency(v.cleaningFees).padStart(12)} kr`);
      }
      if (v.monthlyInstallment > 0) {
        lines.push(`  Månedligt afdrag:         -${formatCurrency(v.monthlyInstallment).padStart(12)} kr`);
        if (v.activeLoan) {
          lines.push(`    → ${v.activeLoan.description}`);
          lines.push(`    → Restgæld: ${formatCurrency(v.activeLoan.remaining_balance)} kr (${v.activeLoan.remaining_months} mdr tilbage)`);
        }
      }
      lines.push(`  ─────────────────────────────────────────────`);
      lines.push(`  Netto:                     ${formatCurrency(v.netPayout).padStart(12)} kr`);
      lines.push(``);
      lines.push(`  Garanti-opfyldelse: ${v.daysRentedThisYear}/${v.guaranteeDays} dage (${Math.round(v.guaranteePercentage)}%)`);
      lines.push(`  Tilgængelighedsdage: ${v.daysAvailableThisYear}`);
    });

    lines.push(``);
    lines.push(`═══════════════════════════════════════════════════════════`);
    lines.push(`FORKLARING TIL REVISOR`);
    lines.push(`═══════════════════════════════════════════════════════════`);
    lines.push(``);
    lines.push(`Fleet Premium er en udlejningsordning, hvor LEJIO ApS varetager`);
    lines.push(`al udlejning af bilerne mod en kommission af omsætningen.`);
    lines.push(``);
    lines.push(`Kommissionssatser:`);
    lines.push(`  1-4 biler:  35%`);
    lines.push(`  5-9 biler:  30%`);
    lines.push(`  10-19 biler: 25%`);
    lines.push(`  20+ biler:  20%`);
    lines.push(``);
    lines.push(`Afdrag på lån/reparationer modregnes direkte i udbetalingen.`);
    lines.push(`Oprettelsesgebyr på lån: 300 kr.`);
    lines.push(``);
    lines.push(`10-måneders garanti: LEJIO garanterer mindst 300 udlejningsdage`);
    lines.push(`pr. køretøj pr. år, under forudsætning af at bilen har været`);
    lines.push(`tilgængelig (ikke på værksted el.lign.).`);

    return lines.join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob(['\ufeff' + content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const csv = generateCSV();
      downloadFile(csv, `fleet-rapport-${year}-${String(month).padStart(2, '0')}.csv`, 'text/csv');
      toast.success('CSV-fil downloadet');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Kunne ikke eksportere rapport');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportRevisor = async () => {
    setIsExporting(true);
    try {
      const text = generateRevisorText();
      downloadFile(text, `fleet-revisor-bilag-${year}-${String(month).padStart(2, '0')}.txt`, 'text/plain');
      toast.success('Revisor-bilag downloadet');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Kunne ikke eksportere bilag');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Eksportér
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Download CSV (regneark)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportRevisor}>
          <FileText className="w-4 h-4 mr-2" />
          Eksportér til revisor
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
