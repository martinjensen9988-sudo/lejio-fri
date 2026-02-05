import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, MapPin, Plus } from 'lucide-react';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  registration: string;
  owner_id: string;
}

interface Profile {
  id: string;
  email: string;
  company_name: string | null;
  full_name: string | null;
}

const GPS_PROVIDERS = [
  { value: 'generic', label: 'Generic GPS' },
  { value: 'teltonika', label: 'Teltonika' },
  { value: 'queclink', label: 'Queclink' },
  { value: 'ruptela', label: 'Ruptela' },
  { value: 'other', label: 'Anden' },
];

const GpsAddPage = () => {
  const navigate = useNavigate();
  const { hasAccess, isLoading: authLoading } = useAdminAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    device_id: '',
    device_name: '',
    provider: 'generic',
    webhook_secret: '',
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, company_name, full_name')
      .order('email');

    if (!error) {
      setProfiles(data || []);
    }
  };

  const fetchUserVehicles = async (userId: string) => {
    const { data } = await supabase
      .from('vehicles')
      .select('id, make, model, registration, owner_id')
      .eq('owner_id', userId)
      .order('make');

    setVehicles(data || []);
  };

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    setFormData(prev => ({ ...prev, vehicle_id: '' }));
    fetchUserVehicles(userId);
  };

  const generateWebhookSecret = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const secret = Array.from(array, byte => 
      byte.toString(16).padStart(2, '0')
    ).join('');
    setFormData(prev => ({ ...prev, webhook_secret: secret }));
  };

  const handleSubmit = async () => {
    if (!formData.vehicle_id || !formData.device_id) {
      toast.error('Vælg køretøj og indtast device ID');
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('gps_devices')
      .insert({
        vehicle_id: formData.vehicle_id,
        device_id: formData.device_id,
        device_name: formData.device_name || null,
        provider: formData.provider,
        webhook_secret: formData.webhook_secret || null,
      });

    if (error) {
      console.error('Error adding device:', error);
      toast.error('Kunne ikke tilføje GPS-enhed');
    } else {
      toast.success('GPS-enhed tilføjet!');
      navigate('/admin/gps');
    }

    setSaving(false);
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
    <AdminDashboardLayout activeTab="gps">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/gps')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbage
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Tilføj GPS-enhed</h2>
            <p className="text-muted-foreground">Tilføj en ny GPS-tracker til en udlejers køretøj</p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              GPS-enhed detaljer
            </CardTitle>
            <CardDescription>
              Udfyld oplysningerne for den nye GPS-enhed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Vælg udlejer *</Label>
              <Select value={selectedUserId} onValueChange={handleUserChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg udlejer..." />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.company_name || profile.full_name || profile.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUserId && (
              <div className="space-y-2">
                <Label>Vælg køretøj *</Label>
                <Select 
                  value={formData.vehicle_id} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, vehicle_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg køretøj..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.registration})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>GPS-udbyder</Label>
              <Select 
                value={formData.provider} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, provider: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GPS_PROVIDERS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Device ID *</Label>
              <Input
                value={formData.device_id}
                onChange={(e) => setFormData(prev => ({ ...prev, device_id: e.target.value }))}
                placeholder="Unikt device ID fra trackeren"
              />
            </div>

            <div className="space-y-2">
              <Label>Enhedsnavn (valgfrit)</Label>
              <Input
                value={formData.device_name}
                onChange={(e) => setFormData(prev => ({ ...prev, device_name: e.target.value }))}
                placeholder="F.eks. 'Tracker 1'"
              />
            </div>

            <div className="space-y-2">
              <Label>Webhook Secret (valgfrit)</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.webhook_secret}
                  onChange={(e) => setFormData(prev => ({ ...prev, webhook_secret: e.target.value }))}
                  placeholder="Til sikker webhook-validering"
                />
                <Button type="button" variant="outline" onClick={generateWebhookSecret}>
                  Generer
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/admin/gps')}>
                Annuller
              </Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Tilføj GPS-enhed
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

export default GpsAddPage;
