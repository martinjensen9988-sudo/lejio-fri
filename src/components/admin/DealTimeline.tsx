import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CRMDeal } from '@/hooks/useCRM';
import { Calendar, AlertCircle, TrendingUp } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { da } from 'date-fns/locale';

interface DealTimelineProps {
  deals: CRMDeal[];
}

export const DealTimeline = ({ deals }: DealTimelineProps) => {
  // Sort deals by expected close date
  const sortedDeals = [...deals]
    .filter(d => d.expected_close_date)
    .sort((a, b) => 
      new Date(a.expected_close_date || '').getTime() - 
      new Date(b.expected_close_date || '').getTime()
    );

  const getStatusColor = (stage: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      qualified: 'bg-purple-100 text-purple-800',
      proposal: 'bg-yellow-100 text-yellow-800',
      negotiation: 'bg-orange-100 text-orange-800',
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      new: 'Ny',
      qualified: 'Kvalificeret',
      proposal: 'Tilbud sendt',
      negotiation: 'Forhandling',
      won: 'Vundet',
      lost: 'Tabt',
    };
    return labels[stage] || stage;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Deal Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedDeals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Ingen deals med forventet slutdato
            </p>
          ) : (
            sortedDeals.map((deal, index) => {
              const closeDate = deal.expected_close_date 
                ? new Date(deal.expected_close_date)
                : null;
              const daysUntilClose = closeDate ? differenceInDays(closeDate, new Date()) : 0;
              const isOverdue = closeDate ? isPast(closeDate) && deal.stage !== 'won' && deal.stage !== 'lost' : false;
              const isUrgent = daysUntilClose <= 3 && daysUntilClose > 0;

              return (
                <div 
                  key={deal.id}
                  className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      isOverdue 
                        ? 'bg-red-500' 
                        : isUrgent 
                        ? 'bg-orange-500'
                        : 'bg-blue-500'
                    }`} />
                    {index < sortedDeals.length - 1 && (
                      <div className="w-0.5 h-12 bg-border mt-2" />
                    )}
                  </div>

                  {/* Deal info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-sm truncate">
                        {deal.title}
                      </h4>
                      <Badge className={getStatusColor(deal.stage)}>
                        {getStageLabel(deal.stage)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground mb-2">
                      {deal.company_name && (
                        <div>
                          <span className="font-semibold">Firma:</span> {deal.company_name}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold">Værdi:</span>{' '}
                        {new Intl.NumberFormat('da-DK', {
                          style: 'currency',
                          currency: 'DKK',
                        }).format(deal.value || 0)}
                      </div>
                      {deal.probability && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">Sandsynlighed:</span> {deal.probability}%
                        </div>
                      )}
                      {closeDate && (
                        <div>
                          <span className="font-semibold">Lukket:</span>{' '}
                          {format(closeDate, 'd. MMM yyyy', { locale: da })}
                        </div>
                      )}
                    </div>

                    {/* Close date indicator */}
                    {closeDate && (
                      <div className="flex items-center gap-2">
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Forfalden
                          </Badge>
                        )}
                        {isUrgent && !isOverdue && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {daysUntilClose} dage tilbage
                          </Badge>
                        )}
                        {!isOverdue && !isUrgent && (
                          <span className="text-xs text-muted-foreground">
                            {daysUntilClose > 0 ? `${daysUntilClose} dage` : 'I dag'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
