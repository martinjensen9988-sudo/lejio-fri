import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CRMDeal } from '@/hooks/useCRM';
import { SalesLead } from '@/hooks/useSalesLeads';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Target, CheckCircle2, XCircle } from 'lucide-react';

interface CRMAnalyticsProps {
  leads: SalesLead[];
  deals: CRMDeal[];
}

export const CRMAnalytics = ({ leads, deals }: CRMAnalyticsProps) => {
  // Conversion funnel data
  const conversionFunnel = {
    leads: leads.length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    interested: leads.filter(l => l.status === 'interested').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    deals: deals.filter(d => d.stage !== 'lost').length,
    won: deals.filter(d => d.stage === 'won').length,
  };

  // Revenue by source
  const revenueBySource = new Map<string, number>();
  deals
    .filter(d => d.stage === 'won')
    .forEach(deal => {
      const source = deal.source || 'Unknown';
      revenueBySource.set(source, (revenueBySource.get(source) || 0) + (deal.value || 0));
    });

  const revenueBySourceData = Array.from(revenueBySource.entries()).map(([source, value]) => ({
    name: source.charAt(0).toUpperCase() + source.slice(1),
    value,
  }));

  // Win/Loss analysis
  const winRate = deals.length > 0
    ? Math.round((deals.filter(d => d.stage === 'won').length / deals.length) * 100)
    : 0;

  const winReasons = new Map<string, number>();
  deals
    .filter(d => d.stage === 'won')
    .forEach(deal => {
      const reason = deal.won_lost_reason || 'No reason';
      winReasons.set(reason, (winReasons.get(reason) || 0) + 1);
    });

  const lossReasons = new Map<string, number>();
  deals
    .filter(d => d.stage === 'lost')
    .forEach(deal => {
      const reason = deal.won_lost_reason || 'No reason';
      lossReasons.set(reason, (lossReasons.get(reason) || 0) + 1);
    });

  // Sales performance by team member
  const performanceByTeam = new Map<string, { deals: number; value: number; won: number }>();
  deals.forEach(deal => {
    const assignee = deal.assigned_to || 'Unassigned';
    const current = performanceByTeam.get(assignee) || { deals: 0, value: 0, won: 0 };
    performanceByTeam.set(assignee, {
      deals: current.deals + 1,
      value: current.value + (deal.value || 0),
      won: current.won + (deal.stage === 'won' ? 1 : 0),
    });
  });

  const teamPerformanceData = Array.from(performanceByTeam.entries()).map(([name, data]) => ({
    name: name || 'Usigneret',
    deals: data.deals,
    value: data.value,
    won: data.won,
    winRate: data.deals > 0 ? Math.round((data.won / data.deals) * 100) : 0,
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Konverteringstragtej
          </CardTitle>
          <CardDescription>Fra leads til vundne deals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { label: 'Leads', value: conversionFunnel.leads, icon: Users },
              { label: 'Kontaktet', value: conversionFunnel.contacted },
              { label: 'Interesseret', value: conversionFunnel.interested },
              { label: 'Kvalificeret', value: conversionFunnel.qualified },
              { label: 'Deals', value: conversionFunnel.deals },
              { label: 'Vundet', value: conversionFunnel.won, color: 'text-green-600' },
            ].map((item, idx) => {
              const conversionRate = idx > 0
                ? Math.round((item.value / [
                    conversionFunnel.leads,
                    conversionFunnel.contacted,
                    conversionFunnel.interested,
                    conversionFunnel.qualified,
                    conversionFunnel.deals,
                    conversionFunnel.won,
                  ][idx - 1]) * 100)
                : 100;

              return (
                <div key={item.label} className="text-center">
                  <div className={`text-2xl font-bold ${item.color || 'text-primary'}`}>
                    {item.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
                  {idx > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {conversionRate}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Indtægt efter kilde</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueBySourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueBySourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${(value / 1000).toFixed(0)}k`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueBySourceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => new Intl.NumberFormat('da-DK', {
                    style: 'currency',
                    currency: 'DKK',
                    notation: 'compact',
                  }).format(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Ingen vundne deals
              </p>
            )}
          </CardContent>
        </Card>

        {/* Win/Loss Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Win/Loss Analyse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Generel Win Rate</span>
              <Badge className="bg-green-100 text-green-800">{winRate}%</Badge>
            </div>

            {winReasons.size > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Vund-årsager
                </h4>
                <div className="space-y-1 text-xs">
                  {Array.from(winReasons.entries()).map(([reason, count]) => (
                    <div key={reason} className="flex justify-between">
                      <span>{reason}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lossReasons.size > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Tab-årsager
                </h4>
                <div className="space-y-1 text-xs">
                  {Array.from(lossReasons.entries()).map(([reason, count]) => (
                    <div key={reason} className="flex justify-between">
                      <span>{reason}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      {teamPerformanceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Salgs KPI pr. team member</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="deals" fill="#3b82f6" name="Deals" />
                <Bar dataKey="won" fill="#10b981" name="Vundet" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
