import { useState } from 'react';
import { useServiceBookings } from '@/hooks/useServiceBookings';
import { useVehicles } from '@/hooks/useVehicles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Wrench, Calendar, Clock, Car, MapPin, Phone, X } from 'lucide-react';

const TIME_SLOTS = [
  { value: 'morning', label: 'Formiddag (08:00-12:00)' },
  { value: 'afternoon', label: 'Eftermiddag (12:00-17:00)' },
  { value: 'full_day', label: 'Hele dagen' },
];

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Afventer bekræftelse', variant: 'secondary' },
  confirmed: { label: 'Bekræftet', variant: 'default' },
  completed: { label: 'Udført', variant: 'outline' },
  cancelled: { label: 'Annulleret', variant: 'destructive' },
};

interface ServiceBookingCardProps {
  vehicleId?: string;
  serviceReminderId?: string;
  onBooked?: () => void;
}

export const ServiceBookingCard = ({ vehicleId, serviceReminderId, onBooked }: ServiceBookingCardProps) => {
  const { bookings, createBooking, cancelBooking, getUpcomingBookings, serviceTypes, isLoading } = useServiceBookings();
  const { vehicles } = useVehicles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: vehicleId || '',
    service_type: '',
    preferred_date: '',
    preferred_time_slot: '',
  });

  const upcomingBookings = getUpcomingBookings();

  const handleSubmit = async () => {
    if (!formData.vehicle_id || !formData.service_type || !formData.preferred_date) {
      return;
    }

    const result = await createBooking({
      vehicle_id: formData.vehicle_id,
      service_reminder_id: serviceReminderId,
      service_type: formData.service_type,
      preferred_date: formData.preferred_date,
      preferred_time_slot: formData.preferred_time_slot || undefined,
    });

    if (result) {
      setIsDialogOpen(false);
      setFormData({
        vehicle_id: '',
        service_type: '',
        preferred_date: '',
        preferred_time_slot: '',
      });
      onBooked?.();
    }
  };

  const selectedServiceType = serviceTypes.find(s => s.value === formData.service_type);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" />
          LEJIO Værksted
        </CardTitle>
        <CardDescription>
          Book service direkte hos LEJIOs eget værksted med et klik
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Workshop Info */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-primary" />
            <span>LEJIO Værksted, Industrivej 12, 2630 Taastrup</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-primary" />
            <span>+45 70 20 30 40</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-primary" />
            <span>Man-Fre: 08:00-17:00</span>
          </div>
        </div>

        {/* Upcoming Bookings */}
        {upcomingBookings.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Kommende bookinger</h4>
            {upcomingBookings.map(booking => (
              <div 
                key={booking.id} 
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {serviceTypes.find(s => s.value === booking.service_type)?.label}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{format(new Date(booking.preferred_date), 'dd. MMM yyyy', { locale: da })}</span>
                      {booking.preferred_time_slot && (
                        <>
                          <span>•</span>
                          <span>{TIME_SLOTS.find(t => t.value === booking.preferred_time_slot)?.label}</span>
                        </>
                      )}
                    </div>
                    {booking.vehicle && (
                      <p className="text-xs text-muted-foreground">
                        {booking.vehicle.registration} - {booking.vehicle.make} {booking.vehicle.model}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_CONFIG[booking.status]?.variant}>
                    {STATUS_CONFIG[booking.status]?.label}
                  </Badge>
                  {booking.status === 'pending' && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => cancelBooking(booking.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Book Service Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2">
              <Calendar className="w-4 h-4" />
              Book værkstedstid
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Book værkstedstid hos LEJIO</DialogTitle>
              <DialogDescription>
                Vælg service type og foretrukken dato
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
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

              <Button 
                onClick={handleSubmit} 
                className="w-full"
                disabled={!formData.vehicle_id || !formData.service_type || !formData.preferred_date}
              >
                Book tid
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ServiceBookingCard;
