import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMCMaintenance } from '@/hooks/useMCMaintenance';
import { useVehicles } from '@/hooks/useVehicles';
import { Bike, ArrowLeft, Link as LinkIcon, CircleDot, Wrench, Loader2 } from 'lucide-react';

const MAINTENANCE_TYPES = [
  { value: 'chain_check', label: 'Kæde-tjek', icon: LinkIcon },
  { value: 'chain_service', label: 'Kæde-service (smøring/stramning)', icon: LinkIcon },
  { value: 'tire_check', label: 'Dæk-tjek', icon: CircleDot },
  { value: 'tire_change_front', label: 'Dækskift (for)', icon: CircleDot },
  { value: 'tire_change_rear', label: 'Dækskift (bag)', icon: CircleDot },
  { value: 'oil_change', label: 'Olieskift', icon: Wrench },
  { value: 'brake_service', label: 'Bremse-service', icon: Wrench },
  { value: 'general_service', label: 'Generel service', icon: Wrench },
  { value: 'battery_check', label: 'Batteri-tjek', icon: Wrench },
  { value: 'coolant_check', label: 'Kølevæske-tjek', icon: Wrench },
];

const MCMaintenancePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vehicleIdFromUrl = searchParams.get('vehicleId');
  const { vehicles } = useVehicles();
  const mcVehicles = vehicles.filter(v => v.vehicle_type === 'motorcykel' || v.vehicle_type === 'scooter');
  
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicleIdFromUrl || mcVehicles[0]?.id || '');
  const { addMaintenanceLog } = useMCMaintenance(selectedVehicleId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    type: '',
    odometer: '',
    notes: '',
    nextServiceKm: '',
    nextServiceDate: '',
  });

  const handleSubmit = async () => {
    if (!formData.type || !selectedVehicleId) return;
    
    setIsSubmitting(true);
    await addMaintenanceLog(
      formData.type,
      formData.odometer ? parseInt(formData.odometer) : undefined,
      formData.notes || undefined,
      formData.nextServiceKm ? parseInt(formData.nextServiceKm) : undefined,
      formData.nextServiceDate || undefined
    );

    navigate('/dashboard/service');
    setIsSubmitting(false);
  };

  return (
    <DashboardLayout activeTab="service">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/service')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbage
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Registrér vedligeholdelse</h2>
            <p className="text-muted-foreground">MC/Scooter vedligeholdelseslog</p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bike className="w-5 h-5" />
              MC/Scooter Vedligeholdelse
            </CardTitle>
            <CardDescription>
              Registrér vedligeholdelse for dine motorcykler og scootere
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Køretøj</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg køretøj" />
                </SelectTrigger>
                <SelectContent>
                  {mcVehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.make} {v.model} ({v.registration})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type vedligeholdelse *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vælg type" />
                </SelectTrigger>
                <SelectContent>
                  {MAINTENANCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kilometerstand</Label>
              <Input
                type="number"
                placeholder="F.eks. 15000"
                value={formData.odometer}
                onChange={(e) => setFormData(prev => ({ ...prev, odometer: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Noter</Label>
              <Textarea
                placeholder="Evt. noter om service..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Næste service (km)</Label>
                <Input
                  type="number"
                  placeholder="F.eks. 20000"
                  value={formData.nextServiceKm}
                  onChange={(e) => setFormData(prev => ({ ...prev, nextServiceKm: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Næste service (dato)</Label>
                <Input
                  type="date"
                  value={formData.nextServiceDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, nextServiceDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/dashboard/service')}>
                Annuller
              </Button>
              <Button 
                className="flex-1"
                onClick={handleSubmit} 
                disabled={isSubmitting || !formData.type}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Wrench className="w-4 h-4 mr-2" />
                )}
                Registrér vedligeholdelse
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MCMaintenancePage;
