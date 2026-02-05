

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useFleetPremiumVehicles } from '@/hooks/useFleetPremiumVehicles';
import { useSubscriptionBilling } from '@/hooks/useSubscriptionBilling';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '@/hooks/useAuth';




// Dynamisk Stripe public key (hentes fra Supabase for valgt bil/forhandler)
let stripePromise: unknown = null;

function SubscriptionForm({
  vehicles,
  isLoading,
}: {
  vehicles: unknown[];
  isLoading: boolean;
}) {
  const { user } = useAuth();
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [price, setPrice] = useState(3999);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const stripe = useStripe();
  const elements = useElements();
  const { createSubscription, subscriptions, fetchSubscriptions, isLoading: isSubsLoading, cancelSubscription } = useSubscriptionBilling();

  // Hent abonnementer ved mount
  React.useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);


  // Stripe settings for valgt bil/forhandler
  const [stripeSettings, setStripeSettings] = useState<unknown>(null);
  const plans = stripeSettings ? [
    { id: 'standard', name: 'Standard', price: 3999, priceId: stripeSettings.stripe_price_id_standard, description: 'Fri km, service og forsikring inkl.' },
    { id: 'premium', name: 'Premium', price: 4999, priceId: stripeSettings.stripe_price_id_premium, description: 'Inkl. ekstra forsikring og vejhjælp.' },
  ] : [];

  // Hent Stripe settings når bil vælges
  React.useEffect(() => {
    const fetchStripeSettings = async () => {
      if (!selectedVehicleId) return;
      const res = await fetch(`/api/dealer-stripe-settings?vehicleId=${selectedVehicleId}`);
      const data = await res.json();
      setStripeSettings(data);
      if (data && data.stripe_public_key) {
        stripePromise = loadStripe(data.stripe_public_key);
      }
    };
    fetchStripeSettings();
  }, [selectedVehicleId]);

  const handlePlanChange = (planId: string) => {
    setSelectedPlan(planId);
    const plan = plans.find(p => p.id === planId);
    if (plan) setPrice(plan.price);
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    if (!user || !user.email) {
      setError('Du skal være logget ind.');
      setLoading(false);
      return;
    }
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan || !selectedVehicleId) {
      setError('Vælg bil og abonnement.');
      setLoading(false);
      return;
    }
    // Kald edge function for at oprette subscription og få client secret
    const res = await fetch('/functions/v1/create-subscription-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`,
      },
      body: JSON.stringify({ email: user.email, vehicleId: selectedVehicleId, plan: selectedPlan }),
    });
    const data = await res.json();
    if (!data.clientSecret) {
      setError('Kunne ikke starte betaling.');
      setLoading(false);
      return;
    }
    setClientSecret(data.clientSecret);
    setLoading(false);
  };

  const handleStripeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Kortfelt mangler.');
      setLoading(false);
      return;
    }
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    });
    if (stripeError) {
      setError(stripeError.message || 'Betaling fejlede.');
      setLoading(false);
      return;
    }
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Gem abonnement i Supabase
      const plan = plans.find(p => p.id === selectedPlan);
      const dailyRate = plan ? Math.round(plan.price / 30) : 0;
      const sub = await createSubscription({
        vehicle_id: selectedVehicleId,
        renter_id: user.id,
        subscription_type: 'monthly',
        daily_rate: dailyRate,
        start_date: new Date().toISOString().split('T')[0],
        payment_method: 'stripe',
      });
      if (sub) {
        setSuccess(true);
      } else {
        setError('Abonnement blev betalt, men kunne ikke gemmes. Kontakt support.');
      }
    }
    setLoading(false);
  };

  // Map vehicle_id til bilnavn
  const vehicleMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    vehicles.forEach(v => {
      map[v.id] = `${v.make} ${v.model} (${v.registration})`;
    });
    return map;
  }, [vehicles]);

  // Annuller abonnement
  const handleCancel = async (subId: string) => {
    if (window.confirm('Vil du annullere dette abonnement?')) {
      await cancelSubscription(subId);
      fetchSubscriptions();
    }
  };

  return (
    <>
      <div className="bg-white rounded shadow p-6 mb-8">
        <form onSubmit={clientSecret ? handleStripeSubmit : handleCreateSubscription}>
        <label className="block mb-2 font-medium">Vælg bil</label>
        {isLoading ? (
          <div className="mb-4">Indlæser biler...</div>
        ) : (
          <select
            className="mb-4 w-full border rounded p-2"
            value={selectedVehicleId}
            onChange={e => setSelectedVehicleId(e.target.value)}
          >
            <option value="">Vælg en bil</option>
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.make} {vehicle.model} ({vehicle.registration})
              </option>
            ))}
          </select>
        )}

        <label className="block mb-2 font-medium">Vælg abonnementstype</label>
        <div className="flex gap-4 mb-4">
          {plans.map(plan => (
            <button
              key={plan.id}
              type="button"
              className={`border rounded px-4 py-2 ${selectedPlan === plan.id ? 'border-primary bg-primary/10' : 'border-gray-200'}`}
              onClick={() => handlePlanChange(plan.id)}
            >
              <div className="font-semibold">{plan.name}</div>
              <div className="text-sm text-gray-500">{plan.description}</div>
              <div className="mt-1 font-bold">{plan.price} kr./md.</div>
            </button>
          ))}
        </div>

        {clientSecret && (
          <div className="mb-4">
            <label className="block mb-2 font-medium">Betalingskort</label>
            <CardElement options={{ hidePostalCode: true }} className="border rounded p-2" />
          </div>
        )}

        {error && <div className="text-red-600 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">Betaling gennemført! Abonnement oprettet.</div>}

        <button
          className="btn btn-primary w-full"
          type="submit"
          disabled={loading || (!clientSecret && (!selectedVehicleId || !selectedPlan))}
        >
          {loading ? 'Behandler...' : clientSecret ? 'Betal og opret abonnement' : 'Opret abonnement'}
        </button>
        </form>
      </div>

      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold mb-4">Dine aktive abonnementer</h2>
        {isSubsLoading ? (
          <div>Indlæser abonnementer...</div>
        ) : subscriptions && subscriptions.length > 0 ? (
          <ul className="divide-y">
            {subscriptions.filter(sub => sub.status === 'active').map(sub => (
              <li key={sub.id} className="py-2 flex items-center justify-between">
                <span>
                  Bil: {vehicleMap[sub.vehicle_id] || sub.vehicle_id} &ndash; {sub.subscription_type} &ndash; {sub.billing_amount} kr/md &ndash; Start: {sub.start_date}
                </span>
                <button
                  className="ml-4 text-red-600 underline text-sm"
                  onClick={() => handleCancel(sub.id)}
                >Annuller</button>
              </li>
            ))}
          </ul>
        ) : (
          <div>Ingen aktive abonnementer.</div>
        )}
      </div>
    </>
  );
}


export default function SubscriptionRental() {
  const { vehicles, isLoading } = useFleetPremiumVehicles();
  // Stripe Elements skal re-instansieres når public key skifter
  const [stripeKey, setStripeKey] = useState('');
  React.useEffect(() => {
    if (vehicles.length > 0) {
      // Optionelt: Sæt default public key fra første bils forhandler
    }
  }, [vehicles]);
  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        Abonnementsudlejning
        <Badge variant="outline" className="ml-2">sp,m beta</Badge>
      </h1>
      <p className="mb-6 text-gray-600">
        Tilbyd månedlig bilabonnement med automatisk kortbetaling. Denne funktion er i beta.
      </p>
      {/* Stripe Elements initialiseres dynamisk i SubscriptionForm */}
      <SubscriptionForm vehicles={vehicles} isLoading={isLoading} />
    </div>
  );
}
