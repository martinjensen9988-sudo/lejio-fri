import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Repeat, CreditCard } from 'lucide-react';

interface SubscriptionFieldsProps {
  subscriptionAvailable: boolean;
  subscriptionMonthlyPrice: number | undefined;
  onSubscriptionAvailableChange: (value: boolean) => void;
  onSubscriptionMonthlyPriceChange: (value: number | undefined) => void;
}

const SubscriptionFields = ({
  subscriptionAvailable,
  subscriptionMonthlyPrice,
  onSubscriptionAvailableChange,
  onSubscriptionMonthlyPriceChange,
}: SubscriptionFieldsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Repeat className="w-4 h-4 text-primary" />
        <Label className="text-base font-semibold">Abonnementsudlejning</Label>
      </div>
      
      <div 
        className="flex items-center space-x-3 p-4 rounded-xl bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors"
        onClick={() => onSubscriptionAvailableChange(!subscriptionAvailable)}
      >
        <Checkbox
          id="subscription_available"
          checked={subscriptionAvailable}
          onCheckedChange={(checked) => onSubscriptionAvailableChange(!!checked)}
        />
        <div className="flex-1">
          <label htmlFor="subscription_available" className="text-sm font-medium cursor-pointer select-none block">
            Tilbyd som abonnement
          </label>
          <p className="text-xs text-muted-foreground mt-1">
            Lejere kan leje bilen på månedsbasis med automatisk kortbetaling
          </p>
        </div>
      </div>

      {subscriptionAvailable && (
        <div className="space-y-3 p-4 rounded-xl bg-muted/50 border border-border animate-in slide-in-from-top-2">
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Månedlig abonnementspris (kr)
            </Label>
            <Input
              type="number"
              value={subscriptionMonthlyPrice || ''}
              onChange={(e) => onSubscriptionMonthlyPriceChange(parseFloat(e.target.value) || undefined)}
              placeholder="F.eks. 4.995"
            />
            <p className="text-xs text-muted-foreground">
              Prisen trækkes automatisk fra lejerens kort hver måned
            </p>
          </div>

          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-start gap-2">
              <div className="text-green-600 text-lg">💳</div>
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-green-600 mb-1">Automatisk betaling</p>
                <p>Når en lejer tilmelder sig abonnement, trækkes den månedlige pris automatisk via Stripe. Du modtager betaling direkte på din konto.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionFields;
