import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Building2, User } from 'lucide-react';
import { FLEET_PLANS } from '@/hooks/useFleetPlan';
import { cn } from '@/lib/utils';

interface FleetPlanCardProps {
  planType: 'fleet_private' | 'fleet_basic' | 'fleet_premium';
  isActive: boolean;
  onSelect: (plan: 'fleet_private' | 'fleet_basic' | 'fleet_premium') => void;
  isLoading?: boolean;
}

export const FleetPlanCard = ({ planType, isActive, onSelect, isLoading }: FleetPlanCardProps) => {
  const plan = FLEET_PLANS[planType];
  const isPremium = planType === 'fleet_premium';
  const isPrivate = planType === 'fleet_private';

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all',
        isActive && 'ring-2 ring-primary',
        isPremium && 'border-accent'
      )}
    >
      {isPremium && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-accent to-primary text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
          <Sparkles className="w-3 h-3 inline mr-1" />
          Populær
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isPrivate ? (
            <User className="w-5 h-5 text-primary" />
          ) : (
            <Building2 className={cn('w-5 h-5', isPremium ? 'text-accent' : 'text-primary')} />
          )}
          {plan.name}
        </CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center py-4">
          <span className="text-4xl font-bold">{plan.commissionRate}%</span>
          <span className="text-muted-foreground ml-1">af omsætning</span>
        </div>

        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {isActive ? (
          <Badge variant="default" className="w-full justify-center py-2">
            Aktiv plan
          </Badge>
        ) : (
          <Button
            className="w-full"
            variant={isPremium ? 'default' : 'outline'}
            onClick={() => onSelect(planType)}
            disabled={isLoading}
          >
            Vælg {plan.name}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};