import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useFriAuth } from '@/hooks/useFriAuth';
import { createLessorAccount } from '@/hooks/useLessorAccount';
import { Crown, CheckCircle2 } from 'lucide-react';

type PackageOption = {
  id: string;
  name: string;
  price: string;
  description: string;
};

type PackageGroup = {
  id: string;
  label: string;
  options: PackageOption[];
};

const fallbackPackageGroups: PackageGroup[] = [
  {
    id: 'dealer',
    label: 'Bilforhandler',
    options: [
      {
        id: 'dealer_start',
        name: 'Bilforhandler Start',
        price: 'kr. 599/md',
        description: 'Basis salg, leads og kampagner.',
      },
      {
        id: 'dealer_plus',
        name: 'Bilforhandler Plus',
        price: 'kr. 899/md',
        description: 'Avanceret salgsflow + kontrakter.',
      },
      {
        id: 'dealer_pro',
        name: 'Bilforhandler Pro',
        price: 'kr. 1.199/md',
        description: 'Team, pipeline og performance dashboards.',
      },
      {
        id: 'dealer_elite',
        name: 'Bilforhandler Elite',
        price: 'kr. 1.699/md',
        description: 'Premium support og full automation.',
      },
    ],
  },
  {
    id: 'rental',
    label: 'Biludlejning',
    options: [
      {
        id: 'rental_start',
        name: 'Biludlejning Start',
        price: 'kr. 499/md',
        description: 'Bookinger, fleet og betalinger.',
      },
      {
        id: 'rental_growth',
        name: 'Biludlejning Growth',
        price: 'kr. 899/md',
        description: 'Automatisering, depot og kundeportal.',
      },
    ],
  },
  {
    id: 'workshop',
    label: 'Autovaerksted',
    options: [
      {
        id: 'workshop_start',
        name: 'Autovaerksted Start',
        price: 'kr. 599/md',
        description: 'Opgaver, tider og kundekontakt.',
      },
      {
        id: 'workshop_flow',
        name: 'Autovaerksted Flow',
        price: 'kr. 999/md',
        description: 'Fakturering, reservedele og lager.',
      },
      {
        id: 'workshop_scale',
        name: 'Autovaerksted Scale',
        price: 'kr. 1.399/md',
        description: 'Integrationer, KPI og driftsoverblik.',
      },
    ],
  },
  {
    id: 'custom',
    label: 'Bland selv',
    options: [
      {
        id: 'custom_mix',
        name: 'Bland selv',
        price: 'fra kr. 299/md',
        description: 'Vaelg kun de moduler du vil have.',
      },
    ],
  },
];

const addonOptions = [
  { id: 'financing', name: 'Finansiering', description: 'Ansogninger, status og integrationer.' },
  { id: 'placards', name: 'Bilsalg Skilte', description: 'Printklar A4/A5 med QR.' },
  { id: 'trade_in', name: 'Trade-in / Byttebil', description: 'Vurdering og tilbud.' },
  { id: 'insurance', name: 'Forsikring', description: 'Tilbud og dokumentation.' },
  { id: 'warranty', name: 'Garanti-pakker', description: 'Udvidet garanti og vilkar.' },
  { id: 'credit', name: 'Kreditvurdering', description: 'KYC/AML og score flow.' },
  { id: 'contracts', name: 'Kontrakter', description: 'E-sign og auto faktura.' },
  { id: 'delivery', name: 'Leveringsplan', description: 'Afhentning/levering + checkliste.' },
  { id: 'prep', name: 'Service & Klargoring', description: 'Opgaver for klargoring.' },
  { id: 'leasing_calc', name: 'Leasing-beregner', description: 'Ydelse og lobetid.' },
  { id: 'crm', name: 'Lead-tracking (CRM)', description: 'Pipeline og paamindelser.' },
  { id: 'ads_sync', name: 'Annonce-synk', description: 'Eksport til Bilbasen/DBA.' },
  {
    id: 'loyalty_bundle',
    name: 'Kundekort / loyalitetskort / rabatkode',
    description: 'Loyalitet, rabatter og kampagner samlet i et flow.',
    buyPrice: 'kr. 1.999 engang',
    leasePrice: 'kr. 199/md',
  },
];

export function FriSignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, user } = useFriAuth();

  const selectedTier = searchParams.get('tier') || 'dealer_plus';

  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    cvr: '',
    domain: '',
    primaryColor: '#0066cc',
    packageTier: selectedTier,
    selectedModules: [] as string[],
    acceptTerms: false,
    paymentMethod: 'invoice',
  });

  const [packageGroups, setPackageGroups] = useState<PackageGroup[]>(fallbackPackageGroups);
  const [packagesError, setPackagesError] = useState<string | null>(null);

  const selectedPackage = packageGroups
    .flatMap((group) => group.options)
    .find((pkg) => pkg.id === formData.packageTier) || packageGroups[0].options[1];

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setPackagesError(null);
        const res = await fetch('/api/get-subscription-plans');
        if (!res.ok) throw new Error('Kunne ikke hente abonnementsplaner');
        const data = await res.json();
        const plans = Array.isArray(data?.plans) ? data.plans : [];
        if (!plans.length) return;

        const labelMap: Record<string, string> = {
          dealer: 'Bilforhandler',
          rental: 'Biludlejning',
          workshop: 'Autovaerksted',
          custom: 'Bland selv',
        };

        const grouped = plans.reduce<Record<string, PackageOption[]>>((acc, plan) => {
          const price = `kr. ${Number(plan.price_monthly).toLocaleString('da-DK')}/md`;
          const option: PackageOption = {
            id: plan.id,
            name: plan.name,
            price,
            description: plan.description || '',
          };
          const key = plan.category || 'custom';
          acc[key] = acc[key] ? [...acc[key], option] : [option];
          return acc;
        }, {});

        const groups: PackageGroup[] = Object.keys(grouped).map((key) => ({
          id: key,
          label: labelMap[key] || key,
          options: grouped[key],
        }));

        setPackageGroups(groups);
      } catch (err) {
        setPackagesError(err instanceof Error ? err.message : 'Planer kunne ikke hentes');
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    const allOptions = packageGroups.flatMap((group) => group.options);
    if (!allOptions.length) return;
    const exists = allOptions.some((option) => option.id === formData.packageTier);
    if (!exists) {
      setFormData((prev) => ({ ...prev, packageTier: allOptions[0].id }));
    }
  }, [packageGroups, formData.packageTier]);

  const [step, setStep] = useState<'credentials' | 'package' | 'addons' | 'accept'>('credentials');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signUp(formData.email, formData.password);
      setStep('package');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.packageTier) {
      setError('Vaelg en pakke for at fortsaette');
      return;
    }
    setError(null);
    setStep('addons');
  };

  const handleAddonsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStep('accept');
  };

  const handleAcceptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!user) throw new Error('No user found');

      if (!formData.companyName) {
        setError('Virksomhedsnavn er paakraevet');
        setLoading(false);
        return;
      }
      if (!formData.domain) {
        setError('Domaene er paakraevet');
        setLoading(false);
        return;
      }
      if (!formData.acceptTerms) {
        setError('Du skal acceptere vilkaar for at fortsaette');
        setLoading(false);
        return;
      }

      // Create lessor account
      await createLessorAccount({
        user_id: user.id,
        company_name: formData.companyName,
        custom_domain: formData.domain,
        cvr_number: formData.cvr || undefined,
        primary_color: formData.primaryColor,
        subscription_tier: formData.packageTier,
        selected_modules: formData.selectedModules,
      });

      // Redirect to dashboard
      navigate('/fri/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center px-4 py-8 relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_45%)]" />
      
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/fri" className="inline-flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.35)]">
              <Crown className="h-6 w-6 text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Din platform</h1>
          <p className="text-amber-200/80">Kom i gang med din bilutlejningsplatform</p>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">
              {step === 'credentials' && 'Opret konto'}
              {step === 'package' && 'Vaelg pakke'}
              {step === 'addons' && 'Tilvalg af funktioner'}
              {step === 'accept' && 'Accept og betaling'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 1: Credentials + Company */}
            {step === 'credentials' && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label htmlFor="signup-email" className="block text-sm font-medium text-white/80 mb-1">
                    Email
                  </label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="din@email.dk"
                    required
                    autoComplete="email"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                <div>
                  <label htmlFor="signup-password" className="block text-sm font-medium text-white/80 mb-1">
                    Adgangskode
                  </label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Minimum 8 tegn"
                    required
                    autoComplete="new-password"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-sm text-amber-100">
                    ✓ <strong>14 dages gratis prøveperiode</strong> inkluderet
                  </p>
                  <p className="text-sm text-amber-200/80 mt-1">
                    Plan: <strong>{selectedPackage.name} ({selectedPackage.price})</strong>
                  </p>
                </div>

                <div className="border border-white/10 rounded-lg p-4 bg-white/5">
                  <p className="text-sm text-white/70 mb-3">Virksomhedsinfo</p>

                  <div className="space-y-3">
                    <div>
                      <label htmlFor="company-name" className="block text-sm font-medium text-white/80 mb-1">
                        Virksomhedsnavn
                      </label>
                      <Input
                        id="company-name"
                        name="company-name"
                        type="text"
                        value={formData.companyName}
                        onChange={(e) =>
                          setFormData({ ...formData, companyName: e.target.value })
                        }
                        placeholder="f.eks. Biluthyr ApS"
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>

                    <div>
                      <label htmlFor="domain" className="block text-sm font-medium text-white/80 mb-1">
                        Dit domæne
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="domain"
                          name="domain"
                          type="text"
                          value={formData.domain}
                          onChange={(e) =>
                            setFormData({ ...formData, domain: e.target.value })
                          }
                          placeholder="biluthyr"
                          required
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                        <span className="text-white/60">.ditdomæne.dk</span>
                      </div>
                      <p className="text-xs text-white/50 mt-1">
                        Dit dashboard bliver: biluthyr.ditdomæne.dk
                      </p>
                    </div>

                    <div>
                      <label htmlFor="cvr" className="block text-sm font-medium text-white/80 mb-1">
                        CVR-nummer (valgfrit)
                      </label>
                      <Input
                        id="cvr"
                        name="cvr"
                        type="text"
                        value={formData.cvr}
                        onChange={(e) =>
                          setFormData({ ...formData, cvr: e.target.value })
                        }
                        placeholder="12345678"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>

                    <div>
                      <label htmlFor="primary-color" className="block text-sm font-medium text-white/80 mb-1">
                        Primaer farve
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          id="primary-color"
                          name="primary-color"
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) =>
                            setFormData({ ...formData, primaryColor: e.target.value })
                          }
                          className="w-12 h-12 border border-white/20 rounded cursor-pointer bg-transparent"
                        />
                        <span className="text-white/70 text-sm">{formData.primaryColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded text-red-200 text-sm p-3">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-brown-900 hover:brightness-110" disabled={loading}>
                  {loading ? 'Opretter...' : 'Næste'}
                </Button>
              </form>
            )}

            {/* Step 2: Package */}
            {step === 'package' && (
              <form onSubmit={handlePackageSubmit} className="space-y-4">
                <div className="space-y-5">
                  {packagesError && (
                    <div className="bg-amber-500/20 border border-amber-500/30 rounded text-amber-100 text-sm p-3">
                      {packagesError}
                    </div>
                  )}
                  {packageGroups.map((group) => (
                    <div key={group.id} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold text-white/80">{group.label}</h3>
                        <div className="h-px flex-1 bg-white/10" />
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {group.options.map((pkg) => (
                          <button
                            key={pkg.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, packageTier: pkg.id })}
                            className={`text-left rounded-xl border px-4 py-4 transition-all ${
                              formData.packageTier === pkg.id
                                ? 'border-amber-400/80 bg-amber-400/10'
                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white font-semibold">{pkg.name}</p>
                                <p className="text-white/60 text-sm">{pkg.description}</p>
                              </div>
                              <div className="text-amber-200 font-semibold">{pkg.price}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded text-red-200 text-sm p-3">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                    onClick={() => setStep('credentials')}
                  >
                    Tilbage
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-brown-900 hover:brightness-110">
                    Næste
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3: Add-ons */}
            {step === 'addons' && (
              <form onSubmit={handleAddonsSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addonOptions.map((addon) => {
                    const selected = formData.selectedModules.includes(addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => {
                          const next = selected
                            ? formData.selectedModules.filter((id) => id !== addon.id)
                            : [...formData.selectedModules, addon.id];
                          setFormData({ ...formData, selectedModules: next });
                        }}
                        className={`text-left rounded-xl border px-4 py-4 transition-all ${
                          selected
                            ? 'border-amber-400/80 bg-amber-400/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-white font-medium">{addon.name}</p>
                            <p className="text-white/60 text-xs mt-1">{addon.description}</p>
                            {(addon.buyPrice || addon.leasePrice) && (
                              <div className="flex flex-wrap gap-2 mt-2 text-xs text-white/70">
                                {addon.buyPrice && (
                                  <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10">
                                    Kob: {addon.buyPrice}
                                  </span>
                                )}
                                {addon.leasePrice && (
                                  <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10">
                                    Leje: {addon.leasePrice}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {selected && <CheckCircle2 className="h-4 w-4 text-amber-300" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                    onClick={() => setStep('package')}
                  >
                    Tilbage
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-brown-900 hover:brightness-110">
                    Næste
                  </Button>
                </div>
              </form>
            )}

            {/* Step 4: Accept + Payment */}
            {step === 'accept' && (
              <form onSubmit={handleAcceptSubmit} className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <p className="text-sm text-white/70 mb-2">Valgt pakke</p>
                  <div className="flex items-center justify-between">
                    <div className="text-white font-semibold">{selectedPackage.name}</div>
                    <div className="text-amber-200 font-semibold">{selectedPackage.price}</div>
                  </div>
                </div>

                {formData.selectedModules.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <p className="text-sm text-white/70 mb-3">Valgte tilvalg</p>
                    <div className="space-y-3">
                      {formData.selectedModules.map((moduleId) => {
                        const addon = addonOptions.find((option) => option.id === moduleId);
                        if (!addon) return null;
                        const hasPricing = addon.buyPrice || addon.leasePrice;
                        return (
                          <div key={addon.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                            <div className="text-sm font-medium text-white">{addon.name}</div>
                            <div className="text-xs text-white/60 mt-1">{addon.description}</div>
                            {hasPricing && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                                {addon.buyPrice && (
                                  <div className="rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2">
                                    <p className="text-[11px] uppercase tracking-wide text-amber-200/80">Kob</p>
                                    <p className="text-sm font-semibold text-amber-100">{addon.buyPrice}</p>
                                  </div>
                                )}
                                {addon.leasePrice && (
                                  <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                                    <p className="text-[11px] uppercase tracking-wide text-white/60">Leje</p>
                                    <p className="text-sm font-semibold text-white">{addon.leasePrice}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <p className="text-sm text-white/70 mb-3">Betaling</p>
                  <div className="space-y-2">
                    {[
                      { id: 'invoice', label: 'Faktura (B2B)' },
                      { id: 'card', label: 'Kortbetaling' },
                      { id: 'mobilepay', label: 'MobilePay' },
                    ].map((option) => (
                      <label key={option.id} className="flex items-center gap-3 text-sm text-white/80">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={option.id}
                          checked={formData.paymentMethod === option.id}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                          className="accent-amber-400"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>

                <label className="flex items-start gap-3 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                    className="mt-1 accent-amber-400"
                  />
                  <span>
                    Jeg accepterer vilkår og privatlivspolitik.
                  </span>
                </label>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded text-red-200 text-sm p-3">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                    onClick={() => setStep('addons')}
                  >
                    Tilbage
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-brown-900 hover:brightness-110" disabled={loading}>
                    {loading ? 'Opretter...' : 'Godkend og betal'}
                  </Button>
                </div>
              </form>
            )}


            {/* Footer */}
            <div className="mt-6 text-center text-sm text-white/70">
              Har du allerede en konto?{' '}
              <button
                onClick={() => navigate('/fri/login')}
                className="text-amber-300 hover:underline font-medium"
              >
                Log ind her
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
