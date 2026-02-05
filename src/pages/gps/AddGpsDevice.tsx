import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGpsDevices } from '@/hooks/useGpsDevices';
import { useVehicles } from '@/hooks/useVehicles';
import { ArrowLeft, Loader2, Satellite, Save } from 'lucide-react';

const GPS_PROVIDERS = [
  { value: 'teltonika', label: 'Teltonika' },
  { value: 'ruptela', label: 'Ruptela' },
  { value: 'autopi', label: 'AutoPi' },
  { value: 'generic', label: 'Generisk / Anden' },
];

const AddGpsDevicePage = () => {
  const navigate = useNavigate();
  const { addDevice } = useGpsDevices();
  const { vehicles } = useVehicles();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    vehicle_id: '',
    device_id: '',
    provider: 'generic',
    device_name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicle_id || !formData.device_id) return;
    
    setIsSubmitting(true);
    await addDevice.mutateAsync({
      vehicle_id: formData.vehicle_id,
      device_id: formData.device_id,
      provider: formData.provider,
      device_name: formData.device_name || undefined,
    });
    setIsSubmitting(false);

    navigate('/gps');
  };

  return (
    <DashboardLayout activeTab="vehicles">
      <div className="max-w-lg mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/gps')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tilbage til GPS
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Satellite className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Tilføj GPS-enhed</CardTitle>
                <CardDescription>
                  Tilknyt en GPS-tracker til et af dine køretøjer
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Køretøj *</Label>
                <Select
                  value={formData.vehicle_id}
                  onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg køretøj" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.registration})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Enheds-ID *</Label>
                <Input
                  value={formData.device_id}
                  onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                  placeholder="f.eks. 123456789"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  IMEI-nummer eller unikt enheds-ID fra din GPS-udbyder
                </p>
              </div>

              <div className="space-y-2">
                <Label>GPS-udbyder</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => setFormData({ ...formData, provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GPS_PROVIDERS.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Enhedsnavn (valgfrit)</Label>
                <Input
                  value={formData.device_name}
                  onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                  placeholder="f.eks. Bil 1 tracker"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/gps')}>
                  Annuller
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={isSubmitting || !formData.vehicle_id || !formData.device_id}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Tilføj enhed
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AddGpsDevicePage;
