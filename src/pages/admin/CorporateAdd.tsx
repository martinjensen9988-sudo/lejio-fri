import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Plus, Building2, FileText, Car } from 'lucide-react';

const FLEET_MODELS = [
  {
    id: 'partner_starter',
    name: 'Partner Starter',
    commission: 15,
    description: 'Basis platformadgang, standard support',
  },
  {
    id: 'fleet_basic',
    name: 'Fleet Basic',
    commission: 25,
    description: 'Udvidet synlighed, prioriteret support, analyserapporter',
  },
  {
    id: 'fleet_premium',
    name: 'Fleet Premium',
    commission: 35,
    description: 'Maksimal synlighed, dedikeret account manager, API-adgang, co-branding',
  },
];

const CorporateAddPage = () => {
  const navigate = useNavigate();
  const { hasAccess, isLoading: authLoading } = useAdminAuth();
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    cvr_number: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    ean_number: '',
    billing_address: '',
    billing_city: '',
    billing_postal_code: '',
    monthly_budget: '',
    fleet_model: 'partner_starter',
    initial_vehicle_count: '',
    notes: '',
  });

  const handleCreate = async () => {
    if (!formData.company_name || !formData.cvr_number || !formData.contact_name || !formData.contact_email) {
      toast.error('Udfyld venligst alle påkrævede felter');
      return;
    }

    if (!formData.initial_vehicle_count || parseInt(formData.initial_vehicle_count) < 1) {
      toast.error('Angiv venligst antal køretøjer');
      return;
    }

    setCreating(true);
    
    try {
      // Get commission rate from selected model
      const selectedModel = FLEET_MODELS.find(m => m.id === formData.fleet_model);
      const commissionRate = selectedModel?.commission || 15;

      // Create the corporate account
      const { data: account, error } = await supabase.from('corporate_accounts').insert({
        company_name: formData.company_name,
        cvr_number: formData.cvr_number,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone || null,
        ean_number: formData.ean_number || null,
        billing_address: formData.billing_address || null,
        billing_city: formData.billing_city || null,
        billing_postal_code: formData.billing_postal_code || null,
        monthly_budget: formData.monthly_budget ? parseFloat(formData.monthly_budget) : null,
        commission_rate: commissionRate,
        fleet_model: formData.fleet_model,
        initial_vehicle_count: parseInt(formData.initial_vehicle_count),
        notes: formData.notes || null,
        status: 'active',
        contract_start_date: new Date().toISOString().split('T')[0],
      }).select().single();

      if (error) {
        throw error;
      }

      // Generate the fleet partner contract
      const { data: contractResult, error: contractError } = await supabase.functions.invoke(
        'generate-fleet-partner-contract',
        {
          body: { corporateAccountId: account.id },
        }
      );

      if (contractError) {
        console.error('Contract generation error:', contractError);
        toast.warning('Virksomhedskonto oprettet, men kontrakt kunne ikke genereres');
      } else {
        toast.success(`Virksomhedskonto og Fleet Partneraftale (${contractResult.contractNumber}) oprettet!`);
      }

      navigate('/admin/corporate');
    } catch (err) {
      console.error(err);
      toast.error('Kunne ikke oprette virksomhedskonto');
    } finally {
      setCreating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    navigate('/admin');
    return null;
  }

  return (
    <AdminDashboardLayout activeTab="corporate">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/corporate')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbage
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Opret Fleet Partner</h2>
            <p className="text-muted-foreground">Tilføj en ny corporate fleet-kunde med automatisk partneraftale</p>
          </div>
        </div>

        <div className="grid gap-6 max-w-4xl">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Virksomhedsoplysninger
              </CardTitle>
              <CardDescription>
                Grundlæggende oplysninger om fleet-partneren
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Virksomhedsnavn *</Label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="ACME Biludlejning ApS"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CVR-nummer *</Label>
                  <Input
                    value={formData.cvr_number}
                    onChange={(e) => setFormData({ ...formData, cvr_number: e.target.value })}
                    placeholder="12345678"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kontaktperson *</Label>
                  <Input
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="Hans Hansen"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kontakt e-mail *</Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="hans@acme.dk"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="+45 12 34 56 78"
                  />
                </div>
                <div className="space-y-2">
                  <Label>EAN-nummer</Label>
                  <Input
                    value={formData.ean_number}
                    onChange={(e) => setFormData({ ...formData, ean_number: e.target.value })}
                    placeholder="5790001234567"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Faktureringsadresse</Label>
                <Input
                  value={formData.billing_address}
                  onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                  placeholder="Hovedgaden 1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>By</Label>
                  <Input
                    value={formData.billing_city}
                    onChange={(e) => setFormData({ ...formData, billing_city: e.target.value })}
                    placeholder="København"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Postnummer</Label>
                  <Input
                    value={formData.billing_postal_code}
                    onChange={(e) => setFormData({ ...formData, billing_postal_code: e.target.value })}
                    placeholder="1000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fleet Model Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Fleet Model *
              </CardTitle>
              <CardDescription>
                Vælg den kommissionsmodel der passer til partneren
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.fleet_model}
                onValueChange={(value) => setFormData({ ...formData, fleet_model: value })}
                className="grid gap-4"
              >
                {FLEET_MODELS.map((model) => (
                  <div
                    key={model.id}
                    className={`flex items-start space-x-4 rounded-lg border p-4 cursor-pointer transition-colors ${
                      formData.fleet_model === model.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setFormData({ ...formData, fleet_model: model.id })}
                  >
                    <RadioGroupItem value={model.id} id={model.id} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={model.id} className="text-base font-semibold cursor-pointer">
                          {model.name}
                        </Label>
                        <span className="text-lg font-bold text-primary">{model.commission}%</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {model.description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Vehicle Count */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5" />
                Antal Køretøjer *
              </CardTitle>
              <CardDescription>
                Hvor mange køretøjer har partneren ved aftalens start?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="1"
                  value={formData.initial_vehicle_count}
                  onChange={(e) => setFormData({ ...formData, initial_vehicle_count: e.target.value })}
                  placeholder="Antal køretøjer"
                  className="max-w-[200px]"
                />
                <span className="text-muted-foreground">køretøjer</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Dette antal registreres i Fleet Partneraftalen som "Antal køretøjer ved aftalens start"
              </p>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle>Yderligere Oplysninger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Månedligt budget (DKK)</Label>
                <Input
                  type="number"
                  value={formData.monthly_budget}
                  onChange={(e) => setFormData({ ...formData, monthly_budget: e.target.value })}
                  placeholder="50000"
                />
              </div>
              <div className="space-y-2">
                <Label>Noter</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Eventuelle noter om aftalen..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Info box */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold text-primary">Automatisk Fleet Partneraftale</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Når du opretter fleet-kunden, genereres der automatisk en Fleet Partneraftale (PDF) 
                  baseret på de indtastede oplysninger og den valgte kommissionsmodel. Aftalen inkluderer 
                  alle vilkår fra LEJIOs standard Fleet Partneraftale med 6 måneders bindingsperiode.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/admin/corporate')}>
              Annuller
            </Button>
            <Button className="flex-1" onClick={handleCreate} disabled={creating}>
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Opret Fleet Partner & Generer Aftale
            </Button>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default CorporateAddPage;
