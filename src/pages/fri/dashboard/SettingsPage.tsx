import React, { useEffect, useMemo, useState } from 'react';
import FriDashboardLayout from '@/components/fri/FriDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useFriAuthContext } from '@/providers/FriAuthProvider';
import { useFriSettings } from '@/hooks/useFriSettings';
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  Bell, 
  Shield, 
  Palette, 
  FileText, 
  Save, 
  Upload,
  MapPin,
  Clock,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

export function FriSettingsPage() {
  const { user } = useFriAuthContext();
  const { account, updateSubscriptionTier } = useFriSettings(user?.id || null);
  const [saving, setSaving] = useState(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [plans, setPlans] = useState<Array<{ id: string; name: string; description: string; price_monthly: number; category: string }>>([]);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [updatingPlan, setUpdatingPlan] = useState(false);

  // Company settings
  const [companyName, setCompanyName] = useState(user?.company_name || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [cvr, setCvr] = useState('');

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [bookingAlerts, setBookingAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  useEffect(() => {
    if (!account?.subscription_tier) return;
    setSelectedPlan(account.subscription_tier);
  }, [account?.subscription_tier]);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setPlansError(null);
        const res = await fetch('/api/get-subscription-plans');
        if (!res.ok) throw new Error('Kunne ikke hente abonnementsplaner');
        const data = await res.json();
        const list = Array.isArray(data?.plans) ? data.plans : [];
        console.log('[SettingsPage] Loaded plans:', list);
        setPlans(list);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Planer kunne ikke hentes';
        console.error('[SettingsPage] Error loading plans:', msg);
        setPlansError(msg);
      }
    };

    loadPlans();
  }, []); 

  const currentPlan = useMemo(() => {
    if (!plans.length || !account?.subscription_tier) return null;
    return plans.find((plan) => plan.id === account.subscription_tier) || null;
  }, [plans, account?.subscription_tier]);

  const planLabel = currentPlan?.name || 'Pro Plan';
  const planPrice = currentPlan
    ? `kr ${Number(currentPlan.price_monthly).toLocaleString('da-DK')}/måned`
    : 'kr 499/måned';

  const handleUpdatePlan = async () => {
    console.log('[Plan Update] Clicked with selectedPlan:', selectedPlan);
    if (!selectedPlan) {
      console.warn('[Plan Update] No plan selected');
      return;
    }
    try {
      setUpdatingPlan(true);
      console.log('[Plan Update] Calling updateSubscriptionTier...');
      await updateSubscriptionTier({ subscription_tier: selectedPlan });
      console.log('[Plan Update] Success, closing plan picker');
      setShowPlanPicker(false);
      toast.success('Plan opdateret');
    } catch (err) {
      console.error('[Plan Update] Error:', err);
      toast.error(err instanceof Error ? err.message : 'Kunne ikke opdatere plan');
    } finally {
      setUpdatingPlan(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Connect to API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Indstillinger gemt');
    } catch {
      toast.error('Kunne ikke gemme indstillinger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FriDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Indstillinger</h1>
          <p className="text-gray-500 mt-1">Konfigurer din virksomhedsprofil og præferencer</p>
        </div>

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="bg-gray-100 p-1">
            <TabsTrigger value="company" className="data-[state=active]:bg-white">
              <Building2 className="w-4 h-4 mr-2" />
              Virksomhed
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-white">
              <Bell className="w-4 h-4 mr-2" />
              Notifikationer
            </TabsTrigger>
            <TabsTrigger value="branding" className="data-[state=active]:bg-white">
              <Palette className="w-4 h-4 mr-2" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-white">
              <CreditCard className="w-4 h-4 mr-2" />
              Abonnement
            </TabsTrigger>
          </TabsList>

          {/* Company Settings */}
          <TabsContent value="company">
            <div className="grid gap-6">
              <Card className="border-gray-100">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-pink-500" />
                    Virksomhedsoplysninger
                  </CardTitle>
                  <CardDescription>Grundlæggende information om din virksomhed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-gray-700">Virksomhedsnavn</Label>
                      <Input
                        id="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Din Virksomhed ApS"
                        className="border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvr" className="text-gray-700">CVR-nummer</Label>
                      <Input
                        id="cvr"
                        value={cvr}
                        onChange={(e) => setCvr(e.target.value)}
                        placeholder="12345678"
                        className="border-gray-200"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Kontakt Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="kontakt@firma.dk"
                        className="border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-700">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Telefon
                      </Label>
                      <Input
                        id="phone"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+45 12 34 56 78"
                        className="border-gray-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-gray-700">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Adresse
                    </Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Vestergade 1, 1000 København"
                      className="border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-gray-700">
                      <Globe className="w-4 h-4 inline mr-1" />
                      Hjemmeside
                    </Label>
                    <Input
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://www.ditfirma.dk"
                      className="border-gray-200"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-100">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-pink-500" />
                    Åbningstider
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'].map((day) => (
                      <div key={day} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <span className="font-medium text-gray-700">{day}</span>
                        <div className="flex items-center gap-2">
                          <Input className="w-20 text-center border-gray-200" placeholder="08:00" />
                          <span className="text-gray-400">-</span>
                          <Input className="w-20 text-center border-gray-200" placeholder="17:00" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-pink-600 hover:bg-pink-700 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Gemmer...' : 'Gem Ændringer'}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card className="border-gray-100">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-pink-500" />
                  Notifikationspræferencer
                </CardTitle>
                <CardDescription>Vælg hvilke notifikationer du vil modtage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifikationer</p>
                    <p className="text-sm text-gray-500">Modtag vigtige opdateringer på email</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Booking Alerts</p>
                    <p className="text-sm text-gray-500">Få besked når du modtager nye bookinger</p>
                  </div>
                  <Switch checked={bookingAlerts} onCheckedChange={setBookingAlerts} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Betalingsnotifikationer</p>
                    <p className="text-sm text-gray-500">Få besked ved indgående betalinger</p>
                  </div>
                  <Switch checked={paymentAlerts} onCheckedChange={setPaymentAlerts} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Ugentlig Rapport</p>
                    <p className="text-sm text-gray-500">Modtag en ugentlig oversigt over din virksomhed</p>
                  </div>
                  <Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={saving} className="bg-pink-600 hover:bg-pink-700 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Gemmer...' : 'Gem Præferencer'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Settings */}
          <TabsContent value="branding">
            <Card className="border-gray-100">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-pink-500" />
                  Branding & Udseende
                </CardTitle>
                <CardDescription>Tilpas dit brand og din kundevendte side</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-gray-700">Logo</Label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-pink-300 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Klik for at uploade dit logo</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG eller SVG (max 2MB)</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Primær Farve</Label>
                    <div className="flex items-center gap-3">
                      <input type="color" defaultValue="#ec4899" className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                      <Input defaultValue="#ec4899" className="border-gray-200 font-mono" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Sekundær Farve</Label>
                    <div className="flex items-center gap-3">
                      <input type="color" defaultValue="#3b82f6" className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                      <Input defaultValue="#3b82f6" className="border-gray-200 font-mono" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={saving} className="bg-pink-600 hover:bg-pink-700 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Gemmer...' : 'Gem Branding'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Settings */}
          <TabsContent value="billing">
            <Card className="border-gray-100">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-pink-500" />
                  Abonnement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge className="bg-white/20 text-white border-0 mb-2">{planLabel}</Badge>
                      <h3 className="text-2xl font-bold">{planPrice}</h3>
                      <p className="text-pink-100 mt-1">Alle funktioner inkluderet</p>
                    </div>
                    <div className="text-right">
                      <p className="text-pink-100 text-sm">Næste betaling</p>
                      <p className="text-white font-semibold">1. marts 2026</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-sm text-gray-500">Køretøjer inkluderet</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">Ubegrænset</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-sm text-gray-500">Team medlemmer</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">Op til 10</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-sm text-gray-500">API adgang</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">Fuld adgang</p>
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-200 text-gray-700"
                    onClick={() => setShowPlanPicker(!showPlanPicker)}
                  >
                    {showPlanPicker ? 'Luk' : 'Skift plan'}
                  </Button>
                  <Button variant="outline" className="border-gray-200 text-gray-700">
                    Fakturahistorik
                  </Button>
                </div>

                {showPlanPicker && (
                  <Card className="border-gray-200 bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-lg">Vælg ny plan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {plansError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                          {plansError}
                        </div>
                      )}
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {plans.map((plan) => (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedPlan(plan.id)}
                            className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all ${
                              selectedPlan === plan.id
                                ? 'border-pink-500 bg-pink-50'
                                : 'border-gray-200 bg-white hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-semibold text-gray-900">{plan.name}</p>
                                <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                              </div>
                              <div className="font-semibold text-gray-900 whitespace-nowrap">
                                kr {Number(plan.price_monthly).toLocaleString('da-DK')}/md
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                        <Button
                          variant="outline"
                          className="border-gray-200"
                          onClick={() => setShowPlanPicker(false)}
                        >
                          Annuller
                        </Button>
                        <Button
                          className="bg-pink-600 hover:bg-pink-700 text-white"
                          onClick={handleUpdatePlan}
                          disabled={updatingPlan || !selectedPlan}
                        >
                          {updatingPlan ? 'Opdaterer...' : 'Bekræft'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </FriDashboardLayout>
  );
}

export default FriSettingsPage;
