import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

const TrialStatusCard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (profile?.trial_ends_at) {
      const trialEnd = parseISO(profile.trial_ends_at);
      const days = differenceInDays(trialEnd, new Date());
      setDaysRemaining(days);
    }
  }, [profile?.trial_ends_at]);

  // Only show for professional users
  if (profile?.user_type !== 'professionel') {
    return null;
  }

  // Check if user has active subscription
  const hasActiveSubscription = profile?.subscription_status === 'active';

  // Don't show if subscribed
  if (hasActiveSubscription) {
    return null;
  }

  const isTrialExpired = daysRemaining !== null && daysRemaining < 0;
  const isTrialEnding = daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= 0;

  // Trial expired
  if (isTrialExpired) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-foreground mb-1">
              Din prøveperiode er udløbet
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              For at fortsætte med at oprette nye bookinger og have dine biler synlige på platformen, skal du aktivere dit abonnement.
            </p>
            <Button 
              onClick={() => navigate('/settings?tab=subscription')}
              className="bg-primary hover:bg-primary/90"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Aktiver abonnement
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Trial ending soon (3 days or less)
  if (isTrialEnding) {
    return (
      <div className="bg-accent/10 border border-accent/30 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-foreground mb-1">
              Din prøveperiode udløber snart
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {daysRemaining === 0 
                ? 'Din prøveperiode udløber i dag!' 
                : `Du har ${daysRemaining} dag${daysRemaining === 1 ? '' : 'e'} tilbage af din prøveperiode.`
              }
              {' '}Aktiver dit abonnement nu for at sikre uafbrudt adgang.
            </p>
            <Button 
              onClick={() => navigate('/settings?tab=subscription')}
              variant="outline"
              className="border-accent text-accent hover:bg-accent/10"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Se abonnementer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Active trial with more than 3 days
  if (daysRemaining !== null && daysRemaining > 3) {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-foreground mb-1">
              Du er på prøveperiode
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Du har {daysRemaining} dage tilbage af din prøveperiode. Dine biler er skjulte for lejere indtil du aktiverer dit abonnement.
            </p>
            <Button 
              onClick={() => navigate('/settings?tab=subscription')}
              variant="ghost"
              className="text-primary hover:bg-primary/10"
            >
              Se abonnementer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TrialStatusCard;
