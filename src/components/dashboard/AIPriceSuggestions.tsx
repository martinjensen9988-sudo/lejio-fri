import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Loader2, Check, AlertCircle, Lightbulb } from 'lucide-react';
import { Vehicle } from '@/hooks/useVehicles';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';

interface PriceSuggestion {
  vehicleId: string;
  suggestedDailyPrice: number;
  suggestedWeeklyPrice: number;
  suggestedMonthlyPrice: number;
  reasoning: string;
  confidence: 'høj' | 'middel' | 'lav';
  seasonalTip: string;
}

interface AIPriceSuggestionsProps {
  vehicles: Vehicle[];
  onApplyPrice: (vehicleId: string, updates: { daily_price?: number; weekly_price?: number; monthly_price?: number }) => Promise<boolean>;
}

export const AIPriceSuggestions = ({ vehicles, onApplyPrice }: AIPriceSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<PriceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [seasonInfo, setSeasonInfo] = useState<{ season: string; month: string } | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const fetchSuggestions = async () => {
    if (vehicles.length === 0) {
      toast.error('Tilføj køretøjer først for at få prisforslag');
      return;
    }

    setIsLoading(true);
    setSuggestions([]);
    setAppliedIds(new Set());

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-price-suggestion`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            vehicles: vehicles.map(v => ({
              id: v.id,
              make: v.make,
              model: v.model,
              year: v.year,
              fuel_type: v.fuel_type,
              vehicle_type: v.vehicle_type,
              daily_price: v.daily_price,
              weekly_price: v.weekly_price,
              monthly_price: v.monthly_price,
              features: v.features,
            })),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kunne ikke hente prisforslag');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setSeasonInfo({ season: data.season, month: data.month });
      toast.success('AI prisforslag klar!');
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error(error instanceof Error ? error.message : 'Kunne ikke hente prisforslag');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPrice = async (suggestion: PriceSuggestion) => {
    const success = await onApplyPrice(suggestion.vehicleId, {
      daily_price: suggestion.suggestedDailyPrice,
      weekly_price: suggestion.suggestedWeeklyPrice,
      monthly_price: suggestion.suggestedMonthlyPrice,
    });

    if (success) {
      setAppliedIds(prev => new Set(prev).add(suggestion.vehicleId));
      toast.success('Priser opdateret!');
    }
  };

  const getVehicleById = (id: string) => vehicles.find(v => v.id === id);

  const getConfidenceBadgeVariant = (confidence: string) => {
    switch (confidence) {
      case 'høj': return 'default';
      case 'middel': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Prisforslag</CardTitle>
              <CardDescription>
                Få intelligente prisanbefalinger baseret på marked og sæson
              </CardDescription>
            </div>
          </div>
          <Button 
            onClick={fetchSuggestions} 
            disabled={isLoading || vehicles.length === 0}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyserer...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                Få prisforslag
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {seasonInfo && (
          <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-accent shrink-0" />
            <p className="text-sm text-muted-foreground">
              Det er {seasonInfo.month} ({seasonInfo.season}) - priserne er justeret efter sæsonen
            </p>
          </div>
        )}

        {suggestions.length === 0 && !isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Klik på "Få prisforslag" for at analysere dine køretøjer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion) => {
              const vehicle = getVehicleById(suggestion.vehicleId);
              if (!vehicle) return null;

              const isApplied = appliedIds.has(suggestion.vehicleId);
              const hasPriceChange = 
                vehicle.daily_price !== suggestion.suggestedDailyPrice ||
                vehicle.weekly_price !== suggestion.suggestedWeeklyPrice ||
                vehicle.monthly_price !== suggestion.suggestedMonthlyPrice;

              return (
                <div
                  key={suggestion.vehicleId}
                  className={`p-4 rounded-xl border transition-all ${
                    isApplied 
                      ? 'bg-primary/5 border-primary/30' 
                      : 'bg-card border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-foreground">
                          {vehicle.make} {vehicle.model}
                        </h4>
                        <Badge variant={getConfidenceBadgeVariant(suggestion.confidence)}>
                          {suggestion.confidence} sikkerhed
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <PriceBox
                          label="Dagspris"
                          current={vehicle.daily_price}
                          suggested={suggestion.suggestedDailyPrice}
                        />
                        <PriceBox
                          label="Ugepris"
                          current={vehicle.weekly_price}
                          suggested={suggestion.suggestedWeeklyPrice}
                        />
                        <PriceBox
                          label="Månedspris"
                          current={vehicle.monthly_price}
                          suggested={suggestion.suggestedMonthlyPrice}
                        />
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {suggestion.reasoning}
                      </p>

                      {suggestion.seasonalTip && (
                        <div className="flex items-start gap-1.5 text-xs text-accent">
                          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span>{suggestion.seasonalTip}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant={isApplied ? 'outline' : 'default'}
                      disabled={isApplied || !hasPriceChange}
                      onClick={() => handleApplyPrice(suggestion)}
                      className="shrink-0"
                    >
                      {isApplied ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Anvendt
                        </>
                      ) : (
                        'Anvend priser'
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface PriceBoxProps {
  label: string;
  current: number | null;
  suggested: number;
}

const PriceBox = ({ label, current, suggested }: PriceBoxProps) => {
  const diff = current ? suggested - current : null;
  const percentChange = current ? ((suggested - current) / current * 100).toFixed(0) : null;

  return (
    <div className="p-2 rounded-lg bg-muted/50">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-bold text-foreground">{suggested.toLocaleString()} kr</p>
      {diff !== null && diff !== 0 && (
        <p className={`text-xs ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {diff > 0 ? '+' : ''}{percentChange}%
        </p>
      )}
      {current && (
        <p className="text-xs text-muted-foreground">Nu: {current.toLocaleString()} kr</p>
      )}
    </div>
  );
};
