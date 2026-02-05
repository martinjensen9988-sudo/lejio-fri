import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDealerLocations, CreateLocationInput } from '@/hooks/useDealerLocations';

const LocationAddPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createLocation } = useDealerLocations(user?.id || '');
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState<CreateLocationInput>({
    partner_id: user?.id || '',
    name: '',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    email: '',
    is_headquarters: false,
    preparation_time_minutes: 120,
    notes: '',
  });

  const handleSubmit = async () => {
    if (!form.name || !form.address || !form.city || !form.postal_code) {
      return;
    }

    setIsSaving(true);
    await createLocation({ ...form, partner_id: user?.id || '' });
    setIsSaving(false);
    navigate('/dashboard/locations');
  };

  const isValid = form.name && form.address && form.city && form.postal_code;

  return (
    <DashboardLayout activeTab="locations">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/locations')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tilbage til lokationer
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Tilføj ny lokation</CardTitle>
                <CardDescription>Opret en ny afdeling eller udleveringssted</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Navn *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="F.eks. Aalborg afdeling"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Adresse *</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Vejnavn 123"
                />
              </div>
              <div>
                <Label>Postnummer *</Label>
                <Input
                  value={form.postal_code}
                  onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                  placeholder="9000"
                />
              </div>
              <div>
                <Label>By *</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Aalborg"
                />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input
                  value={form.phone || ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+45 12 34 56 78"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={form.email || ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="afdeling@firma.dk"
                />
              </div>
              <div>
                <Label>Klargøringstid (minutter)</Label>
                <Input
                  type="number"
                  value={form.preparation_time_minutes || 120}
                  onChange={(e) => setForm({ ...form, preparation_time_minutes: parseInt(e.target.value) || 120 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tid til klargøring mellem bookinger
                </p>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={form.is_headquarters}
                  onCheckedChange={(checked) => setForm({ ...form, is_headquarters: checked })}
                />
                <Label>Hovedkontor</Label>
              </div>
              <div className="md:col-span-2">
                <Label>Noter</Label>
                <Textarea
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Interne noter..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard/locations')}
                className="flex-1"
              >
                Annuller
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isValid || isSaving}
                className="flex-1"
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Opret lokation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LocationAddPage;
