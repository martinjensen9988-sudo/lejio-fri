import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Loader2, CheckCircle, CreditCard, Car, Crown, Sparkles, Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface SubscriptionStatus {
  subscribed: boolean;
  tier: string | null;
  tier_name: string | null;
  max_vehicles: number;
  price?: number;
  subscription_end: string | null;
  stripe_customer_id: string | null;
  is_trial: boolean;
  trial_days_left: number;
  trial_ends_at: string | null;
}

const TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    subtitle: '1-5 biler',
    monthlyPrice: 349,
    yearlyPrice: 3560, // 349 * 12 * 0.85 = 3559.80
    maxVehicles: 5,
    features: [
      'Op til 5 køretøjer',
      'Ubegrænsede bookinger',
      'Digitale kontrakter',
      'Dashboard & statistik',
      '+ 3% kommission pr. booking',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    subtitle: '6-15 biler',
    monthlyPrice: 599,
    yearlyPrice: 6110, // 599 * 12 * 0.85 = 6109.80
    maxVehicles: 15,
    popular: true,
    features: [
      'Op til 15 køretøjer',
      'Ubegrænsede bookinger',
      'Digitale kontrakter',
      'Dashboard & statistik',
      'Prioriteret support',
      '+ 3% kommission pr. booking',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    subtitle: '16-35 biler',
    monthlyPrice: 899,
    yearlyPrice: 9170, // 899 * 12 * 0.85 = 9169.80
    maxVehicles: 35,
    features: [
      'Op til 35 køretøjer',
      'Ubegrænsede bookinger',
      'Digitale kontrakter',
      'Dashboard & statistik',
      'Dedikeret support',
      'API adgang',
      '+ 3% kommission pr. booking',
    ],
  },
];

interface ProSubscriptionCardProps {
  vehicleCount?: number;
}

const ProSubscriptionCard = ({ vehicleCount = 0 }: ProSubscriptionCardProps) => {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-pro-subscription');
      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();

    // Check for success/cancelled URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') === 'success') {
      toast.success('Abonnement aktiveret!', {
        description: 'Dit Pro-abonnement er nu aktivt.',
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh subscription status and send confirmation email
      setTimeout(async () => {
        await checkSubscription();
        sendSubscriptionConfirmationEmail();
      }, 2000);
    } else if (params.get('subscription') === 'cancelled') {
      toast.info('Abonnement afbrudt', {
        description: 'Du kan altid vende tilbage og aktivere dit abonnement.',
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const sendSubscriptionConfirmationEmail = async () => {
    try {
      // Get user profile for email details
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name, company_name')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // Get subscription info
      const { data: subData } = await supabase.functions.invoke('check-pro-subscription');
      if (!subData?.subscribed) return;

      const tier = subData.tier || 'starter';
      const startDate = format(new Date(), 'd. MMMM yyyy', { locale: da });
      const nextBillingDate = subData.subscription_end 
        ? format(new Date(subData.subscription_end), 'd. MMMM yyyy', { locale: da })
        : format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'd. MMMM yyyy', { locale: da });

      await supabase.functions.invoke('send-subscription-confirmation', {
        body: {
          email: profile.email,
          companyName: profile.company_name || 'Virksomhed',
          fullName: profile.full_name,
          tier: tier,
          amount: TIERS.find(t => t.id === tier)?.monthlyPrice || 299,
          subscriptionStartDate: startDate,
          nextBillingDate: nextBillingDate,
        },
      });
      console.log('Subscription confirmation email sent');
    } catch (error) {
      console.error('Failed to send subscription confirmation email:', error);
    }
  };

  const handleCheckout = async (tier: string) => {
    setCheckoutLoading(tier);
    try {
      const { data, error } = await supabase.functions.invoke('create-pro-checkout', {
        body: { tier, interval: billingInterval },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      console.error('Checkout error:', error);
      toast.error('Kunne ikke starte checkout', {
        description: error.message || 'Prøv igen senere',
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pro-customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      console.error('Portal error:', error);
      toast.error('Kunne ikke åbne kundeportal', {
        description: error.message || 'Prøv igen senere',
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const getRecommendedTier = () => {
    if (vehicleCount <= 5) return 'starter';
    if (vehicleCount <= 15) return 'standard';
    return 'enterprise';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // If user is in trial period, show trial info
  if (subscription?.is_trial && !subscription.subscribed) {
    return (
      <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Prøveperiode aktiv
              </CardTitle>
              <CardDescription>
                Udforsk alle Pro-funktioner
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-primary text-primary">
              {subscription.trial_days_left} dage tilbage
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="font-semibold text-primary">Prøveperiode</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Udløber</span>
              <span className="font-semibold">
                {subscription.trial_ends_at && format(new Date(subscription.trial_ends_at), 'd. MMMM yyyy', { locale: da })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Maks. køretøjer</span>
              <span className="font-semibold">{subscription.max_vehicles}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Dine køretøjer</span>
              <span className="font-semibold">{vehicleCount}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-start gap-2">
              <Car className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-yellow-600 mb-1">Bemærk: Dine biler er skjulte</p>
                <p>Under prøveperioden er dine biler ikke synlige for lejere. Aktivér dit abonnement for at gøre dem synlige.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-center text-muted-foreground mb-4">
              Vælg et abonnement for at fortsætte efter prøveperioden
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If user has active subscription, show management view
  if (subscription?.subscribed) {
    const currentTier = TIERS.find(t => t.id === subscription.tier) || TIERS[0];
    
    return (
      <Card className="border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Dit Pro-abonnement
              </CardTitle>
              <CardDescription>
                Administrer dit månedlige abonnement
              </CardDescription>
            </div>
            <Badge className="bg-primary">
              <CheckCircle className="w-3 h-3 mr-1" />
              Aktiv
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Nuværende plan</span>
              <span className="font-semibold">{subscription.tier_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pris</span>
              <span className="font-semibold">{currentTier.monthlyPrice} kr/md</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Maks. køretøjer</span>
              <span className="font-semibold">{subscription.max_vehicles === 999 ? 'Ubegrænset' : subscription.max_vehicles}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Dine køretøjer</span>
              <span className="font-semibold">{vehicleCount}</span>
            </div>
            {subscription.subscription_end && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Næste betaling</span>
                <span className="font-semibold">
                  {format(new Date(subscription.subscription_end), 'd. MMMM yyyy', { locale: da })}
                </span>
              </div>
            )}
          </div>

          <Button 
            onClick={handleManageSubscription} 
            variant="outline" 
            className="w-full"
            disabled={portalLoading}
          >
            {portalLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Settings className="w-4 h-4 mr-2" />
            )}
            Administrer abonnement
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Her kan du ændre betalingsmetode, opgradere/nedgradere eller annullere dit abonnement
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show subscription options
  const recommendedTier = getRecommendedTier();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            LEJIO Pro Abonnement
          </CardTitle>
          <CardDescription>
            Vælg det abonnement der passer til din flåde. Ingen bindingsperiode - annuller når som helst.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Billing Interval Toggle */}
          <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-muted/50">
            <Label 
              htmlFor="billing-toggle" 
              className={`text-sm font-medium cursor-pointer transition-colors ${billingInterval === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              Månedlig
            </Label>
            <Switch
              id="billing-toggle"
              checked={billingInterval === 'yearly'}
              onCheckedChange={(checked) => setBillingInterval(checked ? 'yearly' : 'monthly')}
            />
            <div className="flex items-center gap-2">
              <Label 
                htmlFor="billing-toggle" 
                className={`text-sm font-medium cursor-pointer transition-colors ${billingInterval === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                Årlig
              </Label>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Spar 15%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {TIERS.map((tier) => {
          const displayPrice = billingInterval === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
          const monthlyEquivalent = billingInterval === 'yearly' ? Math.round(tier.yearlyPrice / 12) : tier.monthlyPrice;
          const savings = billingInterval === 'yearly' ? Math.round(tier.monthlyPrice * 12 - tier.yearlyPrice) : 0;
          
          return (
            <Card 
              key={tier.id}
              className={`relative ${tier.id === recommendedTier ? 'border-primary shadow-lg' : ''}`}
            >
              {tier.id === recommendedTier && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Anbefalet
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                <CardDescription>{tier.subtitle}</CardDescription>
                <div className="pt-2">
                  {billingInterval === 'yearly' ? (
                    <>
                      <span className="text-3xl font-bold">{displayPrice}</span>
                      <span className="text-muted-foreground"> kr/år</span>
                      <div className="text-sm text-muted-foreground mt-1">
                        ({monthlyEquivalent} kr/md)
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                        Spar {savings} kr/år
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">{displayPrice}</span>
                      <span className="text-muted-foreground"> kr/md</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleCheckout(tier.id)}
                  disabled={checkoutLoading !== null}
                  className="w-full"
                  variant={tier.id === recommendedTier ? 'default' : 'outline'}
                >
                  {checkoutLoading === tier.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Vælg {tier.name}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        * Alle priser er ekskl. moms. Der tillægges 3% kommission pr. gennemført booking. Betalingen sker via Stripe. Du kan til enhver tid ændre eller annullere dit abonnement.
      </p>
    </div>
  );
};

export default ProSubscriptionCard;
