import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Target, DollarSign } from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { CRMDeal } from '@/hooks/useCRM';
import { SalesLead } from '@/hooks/useSalesLeads';
import { calculateLeadScore, getTopSources } from '@/utils/leadScoring';

interface CRMDashboardWidgetProps {
  leads: SalesLead[];
  deals: CRMDeal[];
}

export const CRMDashboardWidget = ({ leads, deals }: CRMDashboardWidgetProps) => {
  // Calculate metrics
  const thisWeekLeads = leads.filter(lead =>
    isAfter(new Date(lead.created_at), subDays(new Date(), 7))
  ).length;

  const hotLeads = leads.filter(lead => {
    const score = calculateLeadScore(lead);
    return score >= 70;
  }).length;

  const totalDealsValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  const wonDeals = deals.filter(deal => deal.stage === 'won').length;
  const conversionRate = leads.length > 0 
    ? Math.round((wonDeals / leads.length) * 100)
    : 0;

  const stageBreakdown = {
    new: deals.filter(d => d.stage === 'new').length,
    qualified: deals.filter(d => d.stage === 'qualified').length,
    proposal: deals.filter(d => d.stage === 'proposal').length,
    won: wonDeals,
    lost: deals.filter(d => d.stage === 'lost').length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* New Leads This Week */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Nye Leads (Uge)</span>
            <Users className="w-4 h-4 text-primary" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{thisWeekLeads}</div>
          <p className="text-xs text-muted-foreground mt-1">Sidste 7 dage</p>
        </CardContent>
      </Card>

      {/* Hot Leads (High Score) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Hot Leads</span>
            <Target className="w-4 h-4 text-green-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{hotLeads}</div>
          <p className="text-xs text-muted-foreground mt-1">Score 70+</p>
        </CardContent>
      </Card>

      {/* Pipeline Value */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Pipeline Værdi</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat('da-DK', { 
              style: 'currency', 
              currency: 'DKK',
              notation: 'compact' 
            }).format(totalDealsValue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{deals.length} deals</p>
        </CardContent>
      </Card>

      {/* Conversion Rate */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Conversion Rate</span>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">{wonDeals} vundne deals</p>
        </CardContent>
      </Card>

      {/* Deal Stage Breakdown */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Deal Pipeline</CardTitle>
          <CardDescription>Fordeling af deals på stadier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(stageBreakdown).map(([stage, count]) => (
              <div key={stage} className="flex items-center justify-between">
                <span className="text-sm capitalize">{stage === 'new' ? 'Ny' : stage === 'qualified' ? 'Kvalificeret' : stage === 'proposal' ? 'Tilbud' : stage === 'won' ? 'Vundet' : 'Tabt'}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Sources */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Top Kilder</CardTitle>
          <CardDescription>Bedste lead kilder</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {getTopSources(leads).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between">
                <span className="text-sm capitalize">{source}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
