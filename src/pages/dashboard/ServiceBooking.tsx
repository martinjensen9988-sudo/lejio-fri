import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServiceBookings } from '@/hooks/useServiceBookings';
import { useVehicles } from '@/hooks/useVehicles';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Wrench, ArrowLeft, Car, Calendar, Loader2 } from 'lucide-react';

const TIME_SLOTS = [
  { value: 'morning', label: 'Formiddag (08:00-12:00)' },
  { value: 'afternoon', label: 'Eftermiddag (12:00-17:00)' },
  { value: 'full_day', label: 'Hele dagen' },
];

const ServiceBookingPage = () => {
  const navigate = useNavigate();
  const { createBooking, serviceTypes } = useServiceBookings();
  const { vehicles } = useVehicles();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    service_type: '',
    preferred_date: '',
    preferred_time_slot: '',
  });

  const selectedServiceType = serviceTypes.find(s => s.value === formData.service_type);

  const handleSubmit = async () => {
    if (!formData.vehicle_id || !formData.service_type || !formData.preferred_date) {
      return;
    }

    setIsSubmitting(true);
    const result = await createBooking({
      vehicle_id: formData.vehicle_id,
      service_type: formData.service_type,
      preferred_date: formData.preferred_date,
      preferred_time_slot: formData.preferred_time_slot || undefined,
    });

    if (result) {
      navigate('/dashboard/service');
    }
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
            <h2 className="text-2xl font-bold">Book værkstedstid</h2>
            <p className="text-muted-foreground">Vælg service type og foretrukken dato</p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              LEJIO Værksted
            </CardTitle>
            <CardDescription>
              Book service direkte hos LEJIOs eget værksted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Køretøj *</Label>
              <Select 
                value={formData.vehicle_id} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, vehicle_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vælg køretøj" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4" />
                        {v.registration} - {v.make} {v.model}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Service type *</Label>
              <Select 
                value={formData.service_type} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, service_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vælg service" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map(s => (
                    <SelectItem key={s.value} value={s.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{s.label}</span>
                        {s.estimated > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ca. {s.estimated} kr
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Foretrukken dato *</Label>
              <Input
                type="date"
                value={formData.preferred_date}
                onChange={(e) => setFormData(prev => ({ ...prev, preferred_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label>Foretrukket tidspunkt</Label>
              <Select 
                value={formData.preferred_time_slot} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, preferred_time_slot: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vælg tidspunkt (valgfrit)" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedServiceType && selectedServiceType.estimated > 0 && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Estimeret pris</p>
                <p className="text-xl font-bold">ca. {selectedServiceType.estimated} kr</p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/dashboard/service')}>
                Annuller
              </Button>
              <Button 
                className="flex-1"
                onClick={handleSubmit} 
                disabled={isSubmitting || !formData.vehicle_id || !formData.service_type || !formData.preferred_date}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Calendar className="w-4 h-4 mr-2" />
                )}
                Book tid
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ServiceBookingPage;
