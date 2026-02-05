import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAutoDispatch, DispatchRecommendation } from '@/hooks/useAutoDispatch';
import { Truck, TrendingUp, MapPin, Sparkles, Check, X, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const priorityColors = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500'
};

const priorityLabels = {
  urgent: 'Urgent',
  high: 'Høj',
  medium: 'Medium',
  low: 'Lav'
};

export const AutoDispatchCard = () => {
  const { 
    recommendations, 
    searchDemand,
    isLoading, 
    isAnalyzing,
    analyzeAndRecommend,
    updateRecommendationStatus 
  } = useAutoDispatch();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Auto-Dispatch
          </CardTitle>
          <CardDescription>
            AI-drevne anbefalinger til flådeoptimering
          </CardDescription>
        </div>
        <Button 
          onClick={analyzeAndRecommend} 
          disabled={isAnalyzing}
          size="sm"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyserer...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Analysér flåde
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Demand Overview */}
        {searchDemand.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Efterspørgsel pr. lokation
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {searchDemand.slice(0, 4).map(demand => (
                <div 
                  key={demand.location_id}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium truncate max-w-[150px]">
                      {demand.location_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {demand.search_count} søgninger
                    </Badge>
                    <Badge 
                      variant={demand.available_count === 0 ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {demand.available_count} ledige
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Anbefalinger</h4>
            {recommendations.map(rec => (
              <RecommendationItem 
                key={rec.id} 
                recommendation={rec}
                onAccept={() => updateRecommendationStatus(rec.id, 'accepted')}
                onReject={() => updateRecommendationStatus(rec.id, 'rejected')}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Ingen anbefalinger lige nu</p>
            <p className="text-sm">Klik "Analysér flåde" for at få AI-drevne forslag</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface RecommendationItemProps {
  recommendation: DispatchRecommendation;
  onAccept: () => void;
  onReject: () => void;
}

const RecommendationItem: React.FC<RecommendationItemProps> = ({
  recommendation,
  onAccept,
  onReject
}) => {
  const priority = recommendation.priority as keyof typeof priorityColors;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${priorityColors[priority]}`} />
          <Badge variant="outline">{priorityLabels[priority]}</Badge>
          {recommendation.ai_confidence && (
            <Badge variant="secondary" className="text-xs">
              {Math.round(recommendation.ai_confidence * 100)}% sikkerhed
            </Badge>
          )}
        </div>
        {recommendation.expected_revenue_increase && (
          <span className="text-sm font-medium text-green-600">
            +{recommendation.expected_revenue_increase.toLocaleString('da-DK')} kr
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm">
        {recommendation.vehicle && (
          <span className="font-medium">
            {recommendation.vehicle.make} {recommendation.vehicle.model}
          </span>
        )}
        <span className="text-muted-foreground">→</span>
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span>{recommendation.from_location?.name || 'Ukendt'}</span>
        </div>
        <span className="text-muted-foreground">→</span>
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span>{recommendation.to_location?.name || 'Ukendt'}</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{recommendation.reason}</p>

      <div className="flex gap-2">
        <Button size="sm" onClick={onAccept} className="flex-1">
          <Check className="h-4 w-4 mr-1" />
          Acceptér
        </Button>
        <Button size="sm" variant="outline" onClick={onReject} className="flex-1">
          <X className="h-4 w-4 mr-1" />
          Afvis
        </Button>
      </div>
    </div>
  );
};
