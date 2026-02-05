import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServiceReminders } from '@/hooks/useServiceReminders';
import { useVehicles } from '@/hooks/useVehicles';
import { Wrench, ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ServiceRemindersAddPage = () => {
  const navigate = useNavigate();
  const { addReminder } = useServiceReminders();
  const { vehicles } = useVehicles();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    vehicle_id: '',
    service_type: '',
    due_date: '',
    due_km: '',
    current_km: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicle_id || !formData.service_type) {
      toast.error('Vælg venligst køretøj og servicetype');
      return;
    }

    setIsSubmitting(true);
    await addReminder({
      vehicle_id: formData.vehicle_id,
      service_type: formData.service_type,
      due_date: formData.due_date || null,
      due_km: formData.due_km ? parseInt(formData.due_km) : null,
      current_km: formData.current_km ? parseInt(formData.current_km) : null,
      notes: formData.notes || null
    });

    toast.success('Servicepåmindelse oprettet');
    navigate('/dashboard/inspections');
    setIsSubmitting(false);
  };

  return (
    <DashboardLayout activeTab="inspections">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/inspections')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbage
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Ny servicepåmindelse</h2>
            <p className="text-muted-foreground">Opret en ny servicepåmindelse</p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Servicepåmindelse
            </CardTitle>
            <CardDescription>
              Hold styr på kommende service for dine køretøjer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Køretøj *</Label>
                <Select
                  value={formData.vehicle_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg køretøj" />
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
              
              <div className="space-y-2">
                <Label>Servicetype *</Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, service_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg servicetype" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Olieskift">Olieskift</SelectItem>
                    <SelectItem value="Dækskift">Dækskift</SelectItem>
                    <SelectItem value="Bremseservice">Bremseservice</SelectItem>
                    <SelectItem value="Syn">Syn</SelectItem>
                    <SelectItem value="Serviceeftersyn">Serviceeftersyn</SelectItem>
                    <SelectItem value="Andet">Andet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Forfaldsdato</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ved km</Label>
                  <Input
                    type="number"
                    placeholder="f.eks. 50000"
                    value={formData.due_km}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_km: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nuværende km-stand</Label>
                <Input
                  type="number"
                  placeholder="f.eks. 45000"
                  value={formData.current_km}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_km: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Noter (valgfrit)</Label>
                <Input
                  placeholder="Eventuelle noter..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/dashboard/inspections')}>
                  Annuller
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Opret påmindelse
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ServiceRemindersAddPage;
