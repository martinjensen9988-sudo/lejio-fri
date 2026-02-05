import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, CalendarClock } from 'lucide-react';

export type PaymentPlan = 'upfront' | 'subscription';

interface PaymentPlanSelectorProps {
  selectedPlan: PaymentPlan;
  onPlanChange: (plan: PaymentPlan) => void;
  subscriptionAvailable: boolean;
  monthlyPrice?: number;
  className?: string;
}

export const PaymentPlanSelector = ({
  selectedPlan,
  onPlanChange,
  subscriptionAvailable,
  monthlyPrice,
  className = '',
}: PaymentPlanSelectorProps) => {
  // If subscription is not available, only show upfront option
  if (!subscriptionAvailable) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-base font-semibold">Betalingsplan</Label>
      <RadioGroup
        value={selectedPlan}
        onValueChange={(value) => onPlanChange(value as PaymentPlan)}
        className="space-y-2"
      >
        <div
          className={`flex items-center space-x-3 p-4 rounded-xl border cursor-pointer transition-colors ${
            selectedPlan === 'upfront'
              ? 'bg-primary/10 border-primary/30'
              : 'bg-muted/30 border-border hover:bg-muted/50'
          }`}
          onClick={() => onPlanChange('upfront')}
        >
          <RadioGroupItem value="upfront" id="payment_upfront" />
          <CreditCard className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <label htmlFor="payment_upfront" className="text-sm font-medium cursor-pointer block">
              Forudbetaling
            </label>
            <p className="text-xs text-muted-foreground">
              Lejer betaler hele lejeperioden på forhånd
            </p>
          </div>
        </div>

        <div
          className={`flex items-center space-x-3 p-4 rounded-xl border cursor-pointer transition-colors ${
            selectedPlan === 'subscription'
              ? 'bg-accent/10 border-accent/30'
              : 'bg-muted/30 border-border hover:bg-muted/50'
          }`}
          onClick={() => onPlanChange('subscription')}
        >
          <RadioGroupItem value="subscription" id="payment_subscription" />
          <CalendarClock className="w-5 h-5 text-accent" />
          <div className="flex-1">
            <label htmlFor="payment_subscription" className="text-sm font-medium cursor-pointer block">
              Månedlig opkrævning
            </label>
            <p className="text-xs text-muted-foreground">
              Automatisk trækning fra lejers kort hver måned
            </p>
            {monthlyPrice && (
              <p className="text-xs text-accent font-medium mt-1">
                {monthlyPrice.toLocaleString('da-DK')} kr/måned
              </p>
            )}
          </div>
        </div>
      </RadioGroup>
    </div>
  );
};
