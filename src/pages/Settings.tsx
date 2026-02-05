import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';
import { supabase } from '@/integrations/azure/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import LejioLogo from '@/components/LejioLogo';
import {
  ArrowLeft,
  User,
  Building2,
  CreditCard,
  Shield,
  Loader2,
  Save,
  Eye,
  EyeOff,
  Smartphone,
  Banknote,
  Wallet,
  Upload,
  Image,
  Truck,
  AlertTriangle,
  Crown,
  Bell,
  Gift,
} from 'lucide-react';
import { FleetDashboard } from '@/components/fleet/FleetDashboard';
import { LessorRatingsCard } from '@/components/ratings/LessorRatingsCard';
import { DamageRegistrationWizard } from '@/components/settings/DamageRegistrationWizard';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import ProSubscriptionCard from '@/components/settings/ProSubscriptionCard';
import UpgradeToProCard from '@/components/settings/UpgradeToProCard';
import PushNotificationSettings from '@/components/settings/PushNotificationSettings';
import ReferralCard from '@/components/settings/ReferralCard';

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  postal_code: string;
  city: string;
  company_name: string;
  cvr_number: string;
  insurance_company: string;
  insurance_policy_number: string;
  accepted_payment_methods: string[];
  mobilepay_number: string;
  bank_account_number: string;
  bank_reg_number: string;
  roadside_assistance_provider: string;
  roadside_assistance_phone: string;
  fuel_policy_enabled: boolean;
  fuel_missing_fee: number;
  fuel_price_per_liter: number;
  fine_admin_fee: number;
  company_logo_url: string;
}

interface PaymentFormData {
  payment_gateway: string;
  gateway_api_key: string;
  gateway_merchant_id: string;
  bank_account: string;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Kontant', description: 'Betaling ved afhentning' },
  { value: 'bank_transfer', label: 'Bankoverførsel', description: 'Direkte til din konto' },
  { value: 'mobilepay', label: 'MobilePay', description: 'Via dit MobilePay nummer' },
  { value: 'gateway', label: 'Betalingsgateway', description: 'Kortbetaling via gateway' },
];

const PAYMENT_GATEWAYS = [
  { value: 'none', label: 'Ingen (P2P via LEJIO)' },
  { value: 'quickpay', label: 'Quickpay' },
  { value: 'pensopay', label: 'PensoPay' },
  { value: 'reepay', label: 'Reepay' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'onpay', label: 'OnPay' },
];

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { paymentSettings, updatePaymentSettings, loading: paymentLoading } = usePaymentSettings();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    postal_code: '',
    city: '',
    company_name: '',
    cvr_number: '',
    insurance_company: '',
    insurance_policy_number: '',
    accepted_payment_methods: ['cash', 'bank_transfer', 'mobilepay'],
    mobilepay_number: '',
    bank_account_number: '',
    bank_reg_number: '',
    roadside_assistance_provider: '',
    roadside_assistance_phone: '',
    fuel_policy_enabled: false,
    fuel_missing_fee: 0,
    fuel_price_per_liter: 0,
    fine_admin_fee: 500,
    company_logo_url: '',
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData>({
    payment_gateway: 'none',
    gateway_api_key: '',
    gateway_merchant_id: '',
    bank_account: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        postal_code: profile.postal_code || '',
        city: profile.city || '',
        company_name: profile.company_name || '',
        cvr_number: profile.cvr_number || '',
        insurance_company: profile.insurance_company || '',
        insurance_policy_number: profile.insurance_policy_number || '',
        accepted_payment_methods: (profile).accepted_payment_methods || ['cash', 'bank_transfer', 'mobilepay'],
        mobilepay_number: (profile).mobilepay_number || '',
        bank_account_number: (profile).bank_account_number || '',
        bank_reg_number: (profile).bank_reg_number || '',
        roadside_assistance_provider: (profile).roadside_assistance_provider || '',
        roadside_assistance_phone: (profile).roadside_assistance_phone || '',
        fuel_policy_enabled: (profile).fuel_policy_enabled || false,
        fuel_missing_fee: (profile).fuel_missing_fee || 0,
        fuel_price_per_liter: (profile).fuel_price_per_liter || 0,
        fine_admin_fee: (profile).fine_admin_fee || 500,
        company_logo_url: (profile).company_logo_url || '',
      });
    }
  }, [profile]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Ugyldig filtype',
        description: 'Upload venligst et billede (JPG, PNG, GIF eller WebP)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Fil for stor',
        description: 'Logo må max være 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingLogo(true);
    try {
      // Read file as base64 (data URL)
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Kunne ikke læse filen'));
        reader.readAsDataURL(file);
      });

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';

      // Upload via backend function (bypasses storage RLS safely)
      const { data, error } = await supabase.functions.invoke('upload-company-logo', {
        body: {
          imageBase64: dataUrl,
          contentType: file.type,
          fileExt,
        },
      });

      if (error) {
        console.error('Upload company logo function error:', error);
        throw error;
      }

      const publicUrl = (data)?.publicUrl as string | undefined;
      if (!publicUrl) throw new Error('Upload lykkedes ikke (mangler URL)');

      // Add cache-busting timestamp
      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;
      
      setFormData(p => ({ ...p, company_logo_url: urlWithTimestamp }));
      toast({
        title: 'Logo uploadet',
        description: 'Dit virksomhedslogo er blevet uploadet',
      });
    } catch (error: unknown) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Fejl ved upload',
        description: error?.message || 'Kunne ikke uploade logo. Prøv igen.',
        variant: 'destructive',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  useEffect(() => {
    if (paymentSettings) {
      setPaymentFormData({
        payment_gateway: paymentSettings.payment_gateway || 'none',
        gateway_api_key: paymentSettings.gateway_api_key || '',
        gateway_merchant_id: paymentSettings.gateway_merchant_id || '',
        bank_account: paymentSettings.bank_account || '',
      });
    }
  }, [paymentSettings]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // 1) Save profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          postal_code: formData.postal_code,
          city: formData.city,
          company_name: formData.company_name,
          cvr_number: formData.cvr_number,
          insurance_company: formData.insurance_company || null,
          insurance_policy_number: formData.insurance_policy_number || null,
          accepted_payment_methods: formData.accepted_payment_methods,
          mobilepay_number: formData.mobilepay_number || null,
          bank_account_number: formData.bank_account_number || null,
          bank_reg_number: formData.bank_reg_number || null,
          roadside_assistance_provider: formData.roadside_assistance_provider || null,
          roadside_assistance_phone: formData.roadside_assistance_phone || null,
          fuel_policy_enabled: formData.fuel_policy_enabled,
          fuel_missing_fee: formData.fuel_missing_fee || 0,
          fuel_price_per_liter: formData.fuel_price_per_liter || 0,
          fine_admin_fee: formData.fine_admin_fee || 500,
          company_logo_url: formData.company_logo_url || null,
        })
        .eq('id', user.id);

      if (profileError) {
        throw new Error(`PROFIL: ${profileError.message}`);
      }

      // 2) Save payment settings separately
      const { error: paymentError } = await updatePaymentSettings({
        payment_gateway: paymentFormData.payment_gateway === 'none' ? null : paymentFormData.payment_gateway,
        gateway_api_key: paymentFormData.gateway_api_key || null,
        gateway_merchant_id: paymentFormData.gateway_merchant_id || null,
        bank_account: paymentFormData.bank_account || null,
      });

      if (paymentError) {
        // paymentError may be an Error-like object from invoke(); normalize message
        const pe = paymentError as unknown as { message?: string };
        throw new Error(`BETALING: ${pe?.message || 'Ukendt fejl'}`);
      }

      toast({
        title: 'Indstillinger gemt',
        description: 'Dine profiloplysninger er blevet opdateret',
      });
    } catch (error) {
      console.error('Error saving profile:', error);

      const msg =
        error && typeof error === 'object'
          ? ((error).message || (error).details || (error).hint || 'Ukendt fejl')
          : 'Ukendt fejl';

      toast({
        title: 'Fejl',
        description: `Kunne ikke gemme indstillinger: ${msg}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const isProfessional = profile?.user_type === 'professionel';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="shrink-0">
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Tilbage</span>
              </Button>
              <div className="hidden sm:block h-6 w-px bg-border" />
              <div className="hidden sm:block"><LejioLogo size="sm" /></div>
            </div>
            <h1 className="font-display font-bold text-foreground text-sm sm:text-base truncate">Indstillinger</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
          {/* Mobile-friendly scrollable tabs */}
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className={cn("w-max sm:w-full inline-flex sm:grid", isProfessional ? "sm:grid-cols-8" : "sm:grid-cols-7")}>
              <TabsTrigger value="profile" className="gap-1.5 px-2 sm:px-3 text-xs sm:text-sm">
                <User className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Profil</span>
              </TabsTrigger>
              <TabsTrigger value="referral" className="gap-1.5 px-2 sm:px-3 text-xs sm:text-sm">
                <Gift className="w-4 h-4" />
                <span className="hidden sm:inline">Henvisning</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1.5 px-2 sm:px-3 text-xs sm:text-sm">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifikationer</span>
              </TabsTrigger>
              {isProfessional && (
                <TabsTrigger value="subscription" className="gap-1.5 px-2 sm:px-3 text-xs sm:text-sm">
                  <Crown className="w-4 h-4" />
                  <span className="hidden sm:inline">Abonnement</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="payment" className="gap-1.5 px-2 sm:px-3 text-xs sm:text-sm">
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Betaling</span>
              </TabsTrigger>
              <TabsTrigger value="insurance" className="gap-1.5 px-2 sm:px-3 text-xs sm:text-sm">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Kontrakt</span>
              </TabsTrigger>
              <TabsTrigger value="damages" className="gap-1.5 px-2 sm:px-3 text-xs sm:text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Skader</span>
              </TabsTrigger>
              <TabsTrigger value="fleet" className="gap-1.5 px-2 sm:px-3 text-xs sm:text-sm">
                <Truck className="w-4 h-4" />
                <span className="hidden sm:inline">Fleet</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Referral Tab */}
          <TabsContent value="referral" className="space-y-6">
            <ReferralCard />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Upgrade to Pro Card for Private Users */}
            {!isProfessional && (
              <UpgradeToProCard />
            )}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personlige oplysninger
                </CardTitle>
                <CardDescription>
                  Dine grundlæggende kontaktoplysninger
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Fulde navn</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="Dit navn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={formData.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+45 12 34 56 78"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_account">Bankkonto (til udbetalinger)</Label>
                    <Input
                      id="bank_account"
                      value={paymentFormData.bank_account}
                      onChange={(e) => setPaymentFormData(p => ({ ...p, bank_account: e.target.value }))}
                      placeholder="1234-0012345678"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                    placeholder="Vejnavn og husnummer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postnummer</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => setFormData(p => ({ ...p, postal_code: e.target.value }))}
                      placeholder="1234"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">By</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
                      placeholder="By"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {isProfessional && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Virksomhedsoplysninger
                  </CardTitle>
                  <CardDescription>
                    Kun for forhandlere med CVR
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Virksomhedsnavn</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => setFormData(p => ({ ...p, company_name: e.target.value }))}
                        placeholder="Dit firma ApS"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvr_number">CVR-nummer</Label>
                      <Input
                        id="cvr_number"
                        value={formData.cvr_number}
                        onChange={(e) => setFormData(p => ({ ...p, cvr_number: e.target.value }))}
                        placeholder="12345678"
                      />
                    </div>
                  </div>

                  {/* Company Logo Upload */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <Label className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Virksomhedslogo
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Dit logo vises på lejekontrakter i stedet for LEJIO-logoet
                    </p>
                    
                    <div className="flex items-center gap-4">
                      {formData.company_logo_url ? (
                        <div className="relative">
                          <img 
                            src={formData.company_logo_url} 
                            alt="Virksomhedslogo" 
                            className="h-16 max-w-[200px] object-contain rounded border border-border bg-white p-2"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0"
                            onClick={() => setFormData(p => ({ ...p, company_logo_url: '' }))}
                          >
                            ×
                          </Button>
                        </div>
                      ) : (
                        <div className="h-16 w-32 border-2 border-dashed border-border rounded flex items-center justify-center text-muted-foreground text-xs">
                          Intet logo
                        </div>
                      )}
                      
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label htmlFor="logo-upload">
                          <Button variant="outline" size="sm" asChild disabled={uploadingLogo}>
                            <span className="cursor-pointer">
                              {uploadingLogo ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4 mr-2" />
                              )}
                              {uploadingLogo ? 'Uploader...' : 'Upload logo'}
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>

                    <div className="p-3 bg-accent/10 rounded-lg border border-accent/30">
                      <p className="text-xs text-foreground">
                        <strong>Tip:</strong> Brug et logo med transparent baggrund (PNG) for bedste resultat. Anbefalet størrelse: 300x100 pixels.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <PushNotificationSettings />
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-6">
            {/* Accepted Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Accepterede betalingsmetoder
                </CardTitle>
                <CardDescription>
                  Vælg hvilke betalingsmetoder du accepterer fra lejere
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {PAYMENT_METHODS.map((method) => (
                    <div
                      key={method.value}
                      className={`flex items-start space-x-3 p-4 rounded-xl border transition-colors ${
                        formData.accepted_payment_methods.includes(method.value)
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card'
                      }`}
                    >
                      <Checkbox
                        id={`method-${method.value}`}
                        checked={formData.accepted_payment_methods.includes(method.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData(p => ({
                              ...p,
                              accepted_payment_methods: [...p.accepted_payment_methods, method.value]
                            }));
                          } else {
                            setFormData(p => ({
                              ...p,
                              accepted_payment_methods: p.accepted_payment_methods.filter(m => m !== method.value)
                            }));
                          }
                        }}
                      />
                      <div className="space-y-1">
                        <label
                          htmlFor={`method-${method.value}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {method.label}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {method.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* MobilePay settings */}
                {formData.accepted_payment_methods.includes('mobilepay') && (
                  <div className="space-y-2 pt-4 border-t border-border">
                    <Label htmlFor="mobilepay_number" className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      MobilePay nummer
                    </Label>
                    <Input
                      id="mobilepay_number"
                      value={formData.mobilepay_number}
                      onChange={(e) => setFormData(p => ({ ...p, mobilepay_number: e.target.value }))}
                      placeholder="+45 12 34 56 78"
                    />
                    <p className="text-xs text-muted-foreground">
                      Dit MobilePay nummer som lejere kan betale til
                    </p>
                  </div>
                )}

                {/* Bank transfer settings */}
                {formData.accepted_payment_methods.includes('bank_transfer') && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <Label className="flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      Bankoplysninger
                    </Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bank_reg_number">Reg.nr.</Label>
                        <Input
                          id="bank_reg_number"
                          value={formData.bank_reg_number}
                          onChange={(e) => setFormData(p => ({ ...p, bank_reg_number: e.target.value }))}
                          placeholder="1234"
                          maxLength={4}
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="bank_account_number">Kontonummer</Label>
                        <Input
                          id="bank_account_number"
                          value={formData.bank_account_number}
                          onChange={(e) => setFormData(p => ({ ...p, bank_account_number: e.target.value }))}
                          placeholder="0012345678"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Kontooplysninger som lejere kan overføre til
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Gateway */}
            {formData.accepted_payment_methods.includes('gateway') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Betalingsgateway
                  </CardTitle>
                  <CardDescription>
                    Tilslut din betalingsgateway for at modtage kortbetalinger
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment_gateway">Vælg gateway</Label>
                    <Select
                      value={paymentFormData.payment_gateway}
                      onValueChange={(v) => setPaymentFormData(p => ({ ...p, payment_gateway: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vælg betalingsgateway" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_GATEWAYS.filter(gw => gw.value !== 'none').map(gw => (
                          <SelectItem key={gw.value} value={gw.value}>
                            {gw.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentFormData.payment_gateway && paymentFormData.payment_gateway !== 'none' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="gateway_api_key">API-nøgle</Label>
                        <div className="relative">
                          <Input
                            id="gateway_api_key"
                            type={showApiKey ? 'text' : 'password'}
                            value={paymentFormData.gateway_api_key}
                            onChange={(e) => setPaymentFormData(p => ({ ...p, gateway_api_key: e.target.value }))}
                            placeholder="Din API-nøgle fra gateway"
                            className="pr-10"
                            autoComplete="off"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Find din API-nøgle i din {PAYMENT_GATEWAYS.find(g => g.value === paymentFormData.payment_gateway)?.label} konto
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gateway_merchant_id">Merchant ID</Label>
                        <Input
                          id="gateway_merchant_id"
                          value={paymentFormData.gateway_merchant_id}
                          onChange={(e) => setPaymentFormData(p => ({ ...p, gateway_merchant_id: e.target.value }))}
                          placeholder="Dit Merchant ID"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Insurance Tab */}
          <TabsContent value="insurance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Forsikringsoplysninger
                </CardTitle>
                <CardDescription>
                  Disse oplysninger bruges i lejekontrakterne
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="insurance_company">Forsikringsselskab</Label>
                  <Input
                    id="insurance_company"
                    value={formData.insurance_company}
                    onChange={(e) => setFormData(p => ({ ...p, insurance_company: e.target.value }))}
                    placeholder="F.eks. Tryg, Alm. Brand, Codan..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insurance_policy_number">Policenummer</Label>
                  <Input
                    id="insurance_policy_number"
                    value={formData.insurance_policy_number}
                    onChange={(e) => setFormData(p => ({ ...p, insurance_policy_number: e.target.value }))}
                    placeholder="Dit policenummer"
                  />
                </div>

                <div className="p-4 bg-accent/10 rounded-xl border border-accent/30">
                  <p className="text-sm text-foreground">
                    <strong>Vigtigt:</strong> Sørg for at din bilforsikring dækker udlejning til tredjemand. 
                    Kontakt dit forsikringsselskab for at bekræfte dette.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Roadside Assistance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Vejhjælp
                </CardTitle>
                <CardDescription>
                  Oplysninger om vejhjælp der vises i lejekontrakten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roadside_assistance_provider">Vejhjælp udbyder</Label>
                  <Input
                    id="roadside_assistance_provider"
                    value={formData.roadside_assistance_provider}
                    onChange={(e) => setFormData(p => ({ ...p, roadside_assistance_provider: e.target.value }))}
                    placeholder="F.eks. Falck, SOS, Viking..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roadside_assistance_phone">Telefonnummer til vejhjælp</Label>
                  <Input
                    id="roadside_assistance_phone"
                    value={formData.roadside_assistance_phone}
                    onChange={(e) => setFormData(p => ({ ...p, roadside_assistance_phone: e.target.value }))}
                    placeholder="+45 70 10 20 30"
                  />
                </div>

                <div className="p-4 bg-accent/10 rounded-xl border border-accent/30">
                  <p className="text-sm text-foreground">
                    <strong>Tip:</strong> Disse oplysninger vises i lejekontrakten så lejeren ved hvem de skal kontakte ved behov for vejhjælp.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Fuel Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Brændstofpolitik
                </CardTitle>
                <CardDescription>
                  Indstillinger for brændstofniveau ved aflevering
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="fuel_policy_enabled"
                    checked={formData.fuel_policy_enabled}
                    onCheckedChange={(checked) => 
                      setFormData(p => ({ ...p, fuel_policy_enabled: checked === true }))
                    }
                  />
                  <div className="space-y-1">
                    <label
                      htmlFor="fuel_policy_enabled"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Aktiver brændstofpolitik
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Bilen udlejes med fuld tank og skal afleveres med fuld tank
                    </p>
                  </div>
                </div>

                {formData.fuel_policy_enabled && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fuel_missing_fee">Gebyr ved manglende tank (kr)</Label>
                        <Input
                          id="fuel_missing_fee"
                          type="number"
                          min="0"
                          value={formData.fuel_missing_fee || ''}
                          onChange={(e) => setFormData(p => ({ ...p, fuel_missing_fee: parseFloat(e.target.value) || 0 }))}
                          placeholder="F.eks. 250"
                        />
                        <p className="text-xs text-muted-foreground">
                          Fast gebyr hvis tanken ikke er fyldt op
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fine_admin_fee">Administrationsgebyr for bøder (kr)</Label>
                        <Input
                          id="fine_admin_fee"
                          type="number"
                          min="0"
                          max="800"
                          value={formData.fine_admin_fee || ''}
                          onChange={(e) => setFormData(p => ({ ...p, fine_admin_fee: parseFloat(e.target.value) || 0 }))}
                          placeholder="Standard: 500"
                        />
                        <p className="text-xs text-muted-foreground">
                          Dit gebyr ved videresendelse af bøder (0-800 kr.)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fuel_price_per_liter">Pris pr. liter brændstof (kr)</Label>
                        <Input
                          id="fuel_price_per_liter"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.fuel_price_per_liter || ''}
                          onChange={(e) => setFormData(p => ({ ...p, fuel_price_per_liter: parseFloat(e.target.value) || 0 }))}
                          placeholder="F.eks. 18.50"
                        />
                        <p className="text-xs text-muted-foreground">
                          Pris pr. liter manglende brændstof
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-accent/10 rounded-xl border border-accent/30">
                      <p className="text-sm text-foreground">
                        <strong>Eksempel:</strong> Hvis tanken ikke er fuld ved aflevering, betaler lejeren {formData.fuel_missing_fee || 0} kr i gebyr plus {formData.fuel_price_per_liter || 0} kr pr. manglende liter.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Damages Tab */}
          <TabsContent value="damages" className="space-y-6">
            <DamageRegistrationWizard />
          </TabsContent>

          {/* Subscription Tab (Pro only) */}
          {isProfessional && (
            <TabsContent value="subscription" className="space-y-6">
              <ProSubscriptionCard vehicleCount={0} />
            </TabsContent>
          )}

          {/* Fleet Tab - Available for all users */}
          <TabsContent value="fleet" className="space-y-6">
            <FleetDashboard />
            
            {/* Lessor Rating Card */}
            {user && <LessorRatingsCard lessorId={user.id} />}
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end mt-8">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Gem indstillinger
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Settings;
