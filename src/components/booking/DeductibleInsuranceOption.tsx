import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, Check, AlertTriangle } from 'lucide-react';

interface DeductibleInsuranceOptionProps {
  periodType: 'daily' | 'weekly' | 'monthly';
  periodCount: number;
  originalDeductible?: number;
  onSelect: (selected: boolean, price: number) => void;
}

const DAILY_RATE = 49;
const MONTHLY_CAP = 400;

export const DeductibleInsuranceOption = ({
  periodType,
  periodCount,
  originalDeductible = 5000,
  onSelect,
}: DeductibleInsuranceOptionProps) => {
  const [selected, setSelected] = useState(false);

  const pricing = useMemo(() => {
    let totalDays = 0;
    
    switch (periodType) {
      case 'monthly':
        totalDays = periodCount * 30;
        break;
      case 'weekly':
        totalDays = periodCount * 7;
        break;
      default:
        totalDays = periodCount;
    }

    // Calculate monthly equivalent for cap
    const months = Math.ceil(totalDays / 30);
    const rawPrice = totalDays * DAILY_RATE;
    const cappedPrice = Math.min(rawPrice, months * MONTHLY_CAP);

    return {
      totalDays,
      months,
      dailyRate: DAILY_RATE,
      rawPrice,
      finalPrice: cappedPrice,
      savings: rawPrice - cappedPrice,
      pricePerDay: cappedPrice / totalDays,
    };
  }, [periodType, periodCount]);

  const handleChange = (checked: boolean) => {
    setSelected(checked);
    onSelect(checked, checked ? pricing.finalPrice : 0);
  };

  return (
    <Card className={`transition-all ${selected ? 'border-primary shadow-lg' : 'border-border'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Checkbox
            id="deductible-insurance"
            checked={selected}
            onCheckedChange={handleChange}
            className="mt-1"
          />
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <Label 
                  htmlFor="deductible-insurance" 
                  className="font-semibold text-base cursor-pointer flex items-center gap-2"
                >
                  <Shield className="w-5 h-5 text-primary" />
                  Nul selvrisiko-forsikring
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Reducer din selvrisiko fra {originalDeductible.toLocaleString()} kr til 0 kr
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  {pricing.savings > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Spar {pricing.savings} kr
                    </Badge>
                  )}
                  <span className="text-xl font-bold text-primary">
                    {pricing.finalPrice} kr
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {pricing.dailyRate} kr/dag (max {MONTHLY_CAP} kr/md)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>Reduceret selvrisiko</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>Ingen ekstra omkostninger</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>Gælder hele lejeperioden</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>Ro i sindet</span>
              </div>
            </div>

            {!selected && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Uden forsikring hæfter du for op til {originalDeductible.toLocaleString()} kr ved skader på køretøjet
                </p>
              </div>
            )}

            {selected && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <p className="text-xs text-green-700 dark:text-green-400">
                  Du har tilvalgt reduceret selvrisiko! Ved eventuelle skader betaler du kun 0 kr i selvrisiko til udlejer.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeductibleInsuranceOption;
