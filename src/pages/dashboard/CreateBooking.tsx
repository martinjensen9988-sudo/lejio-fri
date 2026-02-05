import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useVehicles, Vehicle } from '@/hooks/useVehicles';
import { useDealerLocations } from '@/hooks/useDealerLocations';
import { useVehicleBookedDates } from '@/hooks/useVehicleBookedDates';
import { supabase } from '@/integrations/azure/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, CalendarIcon, ArrowLeft, MapPin, AlertTriangle } from 'lucide-react';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { da } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SubscriptionStatus {
  subscribed: boolean;
  is_trial: boolean;
  trial_expired: boolean;
  can_create_bookings: boolean;
}

const CreateBookingPage = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { vehicles } = useVehicles();
  const { locations } = useDealerLocations(user?.id);
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  
  const [formData, setFormData] = useState({
    vehicle_id: '',
    pickup_location_id: '',
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    renter_name: '',
    renter_email: '',
    renter_phone: '',
    notes: '',
  });

  // Get booked dates for selected vehicle
  const { disabledMatcher, isRangeOverlapping, bookedDates } = useVehicleBookedDates(formData.vehicle_id || null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || profile?.user_type !== 'professionel') {
        if (profile?.user_type === 'privat') {
          setSubscriptionStatus({ subscribed: false, is_trial: false, trial_expired: false, can_create_bookings: true });
        }
        return;
      }

      setCheckingSubscription(true);
      try {
        const { data, error } = await supabase.functions.invoke('check-pro-subscription');
        if (error) throw error;
        setSubscriptionStatus(data);
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkSubscription();
  }, [user, profile?.user_type]);

  const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id);
  
  const calculatePrice = () => {
    if (!formData.start_date || !formData.end_date || !selectedVehicle) return 0;
    
    // differenceInDays gives us the number of rental days (nights)
    // Jan 22 to Jan 24 = 2 days (pickup on 22, return on 24)
    const days = Math.max(1, differenceInDays(formData.end_date, formData.start_date));
    
    if (days >= 30 && selectedVehicle.monthly_price) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      return (months * selectedVehicle.monthly_price) + 
             (remainingDays * (selectedVehicle.daily_price || 0));
    }
    
    if (days >= 7 && selectedVehicle.weekly_price) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      return (weeks * selectedVehicle.weekly_price) + 
             (remainingDays * (selectedVehicle.daily_price || 0));
    }
    
    return days * (selectedVehicle.daily_price || 0);
  };

  const totalPrice = calculatePrice();
  const days = formData.start_date && formData.end_date 
    ? Math.max(1, differenceInDays(formData.end_date, formData.start_date))
    : 0;

  const handleSubmit = async () => {
    if (!user || !formData.vehicle_id || !formData.start_date || !formData.end_date || !formData.renter_name) {
      toast.error('Udfyld venligst alle påkrævede felter');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('bookings').insert({
        vehicle_id: formData.vehicle_id,
        lessor_id: user.id,
        start_date: format(formData.start_date, 'yyyy-MM-dd'),
        end_date: format(formData.end_date, 'yyyy-MM-dd'),
        renter_name: formData.renter_name,
        renter_email: formData.renter_email || null,
        renter_phone: formData.renter_phone || null,
        notes: formData.notes || null,
        total_price: totalPrice,
        status: 'confirmed',
        pickup_location_id: formData.pickup_location_id || null,
        dropoff_location_id: formData.pickup_location_id || null,
      });

      if (error) throw error;

      toast.success('Booking oprettet!');
      navigate('/dashboard/bookings');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Kunne ikke oprette booking');
    } finally {
      setIsLoading(false);
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

  const availableVehicles = vehicles.filter(v => v.is_available);

  return (
    <DashboardLayout activeTab="bookings">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/bookings')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Opret manuel booking</h2>
            <p className="text-muted-foreground">Tilføj en ny booking manuelt</p>
          </div>
        </div>

        {checkingSubscription && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {!checkingSubscription && subscriptionStatus?.trial_expired && !subscriptionStatus?.can_create_bookings && (
          <Card className="mb-6">
            <CardContent className="py-6 space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
                <div>
                  <p className="font-semibold text-destructive">Prøveperiode udløbet</p>
                  <p className="text-sm text-muted-foreground">
                    Din prøveperiode er udløbet. Aktivér et abonnement for at oprette nye bookinger.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/settings?tab=subscription')}
                className="w-full"
              >
                Aktivér abonnement
              </Button>
            </CardContent>
          </Card>
        )}

        {!checkingSubscription && (subscriptionStatus?.can_create_bookings !== false) && (
          <Card>
            <CardHeader>
              <CardTitle>Booking detaljer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Vehicle Selection */}
              <div className="space-y-2">
                <Label>Vælg bil *</Label>
                <Select
                  value={formData.vehicle_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg en bil" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {availableVehicles.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.registration})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Selection */}
              {locations.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Afhentningssted
                  </Label>
                  <Select
                    value={formData.pickup_location_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, pickup_location_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vælg lokation (valgfrit)" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {locations.filter(l => l.is_active).map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} - {location.address}, {location.postal_code} {location.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Startdato *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.start_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.start_date 
                          ? format(formData.start_date, "d. MMM yyyy", { locale: da })
                          : "Vælg dato"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.start_date}
                        onSelect={(date) => setFormData(prev => ({ 
                          ...prev, 
                          start_date: date,
                          end_date: prev.end_date && date && prev.end_date < date ? date : prev.end_date
                        }))}
                        disabled={disabledMatcher}
                        modifiers={{ booked: bookedDates }}
                        modifiersStyles={{ booked: { backgroundColor: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))' } }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                      {bookedDates.length > 0 && (
                        <p className="text-xs text-muted-foreground p-2 border-t">
                          Røde datoer er allerede booket
                        </p>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Slutdato *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.end_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.end_date 
                          ? format(formData.end_date, "d. MMM yyyy", { locale: da })
                          : "Vælg dato"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.end_date}
                        onSelect={(date) => setFormData(prev => ({ ...prev, end_date: date }))}
                        disabled={(date) => {
                          if (date < (formData.start_date || new Date())) return true;
                          return disabledMatcher(date);
                        }}
                        modifiers={{ booked: bookedDates }}
                        modifiersStyles={{ booked: { backgroundColor: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))' } }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                      {bookedDates.length > 0 && (
                        <p className="text-xs text-muted-foreground p-2 border-t">
                          Røde datoer er allerede booket
                        </p>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Price Summary */}
              {selectedVehicle && days > 0 && (
                <div className="p-4 rounded-xl bg-mint/10 border border-mint/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">{days} dag{days > 1 ? 'e' : ''}</p>
                      <p className="font-display font-bold text-lg">{totalPrice.toLocaleString('da-DK')} kr</p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {selectedVehicle.daily_price && <p>{selectedVehicle.daily_price} kr/dag</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Renter Info */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Lejer information</Label>
                
                <div className="space-y-2">
                  <Label>Navn *</Label>
                  <Input
                    value={formData.renter_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, renter_name: e.target.value }))}
                    placeholder="Kundens fulde navn"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.renter_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, renter_email: e.target.value }))}
                      placeholder="kunde@email.dk"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefon</Label>
                    <Input
                      type="tel"
                      value={formData.renter_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, renter_phone: e.target.value }))}
                      placeholder="+45 12 34 56 78"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Noter</Label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Eventuelle noter til bookingen..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => navigate('/dashboard/bookings')}
                >
                  Annuller
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleSubmit}
                  disabled={isLoading || !formData.vehicle_id || !formData.start_date || !formData.end_date || !formData.renter_name}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Opret booking'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CreateBookingPage;
