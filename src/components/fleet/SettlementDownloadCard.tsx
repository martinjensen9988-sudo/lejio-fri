import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Download, Loader2, Eye, Wallet, CreditCard, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { FleetPremiumSummary } from '@/hooks/useFleetPremiumVehicles';

interface SettlementDownloadCardProps {
  summary: FleetPremiumSummary | null;
}

export const SettlementDownloadCard = ({ summary }: SettlementDownloadCardProps) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const months = [
    { value: '1', label: 'Januar' },
    { value: '2', label: 'Februar' },
    { value: '3', label: 'Marts' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Maj' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const years = [2024, 2025, 2026].filter(y => y <= new Date().getFullYear());

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const handleGeneratePDF = async () => {
    if (!user) {
      toast.error('Du skal være logget ind');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-settlement-pdf', {
        body: {
          lessor_id: user.id,
          month: selectedMonth,
          year: parseInt(selectedYear),
        },
      });

      if (error) throw error;

      if (data?.html) {
        // Open HTML in new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(data.html);
          printWindow.document.close();
          printWindow.print();
        }
        toast.success('Opgørelse genereret!');
      }
    } catch (error) {
      console.error('Error generating settlement:', error);
      toast.error('Kunne ikke generere opgørelse');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewPDF = async () => {
    if (!user) {
      toast.error('Du skal være logget ind');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-settlement-pdf', {
        body: {
          lessor_id: user.id,
          month: selectedMonth,
          year: parseInt(selectedYear),
        },
      });

      if (error) throw error;

      if (data?.html) {
        // Open HTML in new tab for preview
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
          previewWindow.document.write(data.html);
          previewWindow.document.close();
        }
        toast.success('Opgørelse åbnet i nyt faneblad');
      }
    } catch (error) {
      console.error('Error previewing settlement:', error);
      toast.error('Kunne ikke vise opgørelse');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="bg-card rounded-2xl shadow-sm border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Finansielt Overblik
          </div>
          <Badge variant="outline" className="text-xs">Til regnskab</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Summary */}
        {summary && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-primary/10 rounded-xl p-4 text-center border border-primary/20">
              <Wallet className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-xl font-bold">{formatCurrency(summary.totalMonthlyGrossRevenue)} kr</p>
              <p className="text-xs text-muted-foreground">Brutto indtægt</p>
            </div>
            <div className="bg-accent/10 rounded-xl p-4 text-center border border-accent/20">
              <CreditCard className="w-5 h-5 mx-auto mb-2 text-accent" />
              <p className="text-xl font-bold">{formatCurrency(summary.totalCommission)} kr</p>
              <p className="text-xs text-muted-foreground">LEJIO kommission</p>
            </div>
            <div className="bg-destructive/10 rounded-xl p-4 text-center border border-destructive/20">
              <TrendingDown className="w-5 h-5 mx-auto mb-2 text-destructive" />
              <p className="text-xl font-bold">{formatCurrency(summary.totalMonthlyInstallments)} kr</p>
              <p className="text-xs text-muted-foreground">Afdrag</p>
            </div>
          </div>
        )}

        {/* Loan Summary */}
        {summary && summary.totalLoanBalance > 0 && (
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Aktuel restgæld</span>
              <span className="text-lg font-bold text-destructive">{formatCurrency(summary.totalLoanBalance)} kr</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Månedligt afdrag: {formatCurrency(summary.totalMonthlyInstallments)} kr
            </p>
          </div>
        )}

        {/* Net Payout */}
        {summary && (
          <div className="bg-mint/10 rounded-xl p-4 border border-mint/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Netto udbetaling</span>
              <span className="text-2xl font-bold text-mint">{formatCurrency(summary.finalNetPayout)} kr</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              = Brutto - Kommission - Afdrag
            </p>
          </div>
        )}

        {/* Download Section */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-3">Download månedsopgørelse</p>
          <div className="flex items-center gap-2 mb-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handlePreviewPDF}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              Vis opgørelse
            </Button>
            <Button 
              className="flex-1"
              onClick={handleGeneratePDF}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Print PDF
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            PDF'en indeholder alle fratræk og bilag til bogføring
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
