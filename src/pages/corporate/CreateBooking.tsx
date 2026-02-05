import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Car, Calendar, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, differenceInDays } from 'date-fns';
import { da } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/azure/client';

const CorporateCreateBookingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const corporateAccountId = searchParams.get('corporateAccountId') || '';
  const currentEmployeeId = searchParams.get('employeeId') || '';
  const departmentId = searchParams.get('departmentId') || null;
  const fleetVehiclesParam = searchParams.get('fleetVehicles') || '[]';
  
  let fleetVehicles: Record<string, unknown>[] = [];
  try {
    fleetVehicles = JSON.parse(fleetVehiclesParam) as Record<string, unknown>[];
  } catch (e) {
    console.error('Error parsing fleet vehicles:', e);
  }

  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [purpose, setPurpose] = useState('');
  const [destination, setDestination] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedVehicle || !startDate || !endDate) {
      toast.error('Vælg køretøj og datoer');
      return;
    }

    setIsSubmitting(true);
    try {
      const fleetVehicle = fleetVehicles.find(v => v.id === selectedVehicle);
      if (!fleetVehicle) {
        toast.error('Køretøj ikke fundet');
        return;
      }

      const days = differenceInDays(endDate, startDate) + 1;
      const dailyRate = fleetVehicle.monthly_rate / 30;
      const estimatedCost = Math.round(dailyRate * days);

      // Create a booking in the bookings table first
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          vehicle_id: fleetVehicle.vehicle_id,
          lessor_id: fleetVehicle.lessor_id,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          total_price: estimatedCost,
          status: 'confirmed',
          notes: `Firmabooking: ${purpose || 'Ingen formål angivet'}`,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create corporate booking link
      const { error: corporateBookingError } = await supabase
        .from('corporate_bookings')
        .insert({
          corporate_account_id: corporateAccountId,
          corporate_employee_id: currentEmployeeId,
          department_id: departmentId,
          fleet_vehicle_id: fleetVehicle.id,
          booking_id: bookingData.id,
          purpose,
          destination,
          cost_allocated: estimatedCost,
        });

      if (corporateBookingError) throw corporateBookingError;

      toast.success('Booking oprettet!');
      navigate('/corporate');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Kunne ikke oprette booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEstimatedCost = () => {
    if (!selectedVehicle || !startDate || !endDate) return null;
    const vehicle = fleetVehicles.find(v => v.id === selectedVehicle);
    if (!vehicle) return null;
    const days = differenceInDays(endDate, startDate) + 1;
    const dailyRate = vehicle.monthly_rate / 30;
    return Math.round(dailyRate * days);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/corporate')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tilbage til firmakonto
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Book firmabil</CardTitle>
                <CardDescription>
                  Opret en ny booking fra firmaflåden
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Vehicle Selection */}
            <div className="space-y-2">
              <Label>Vælg køretøj</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg et køretøj fra flåden" />
                </SelectTrigger>
                <SelectContent>
                  {fleetVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4" />
                        <span>
                          Køretøj #{vehicle.id.slice(0, 8)} - {vehicle.monthly_rate.toLocaleString('da-DK')} kr/md
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Startdato</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "d. MMM yyyy", { locale: da }) : "Vælg dato"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        if (date && (!endDate || endDate < date)) {
                          setEndDate(addDays(date, 1));
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Slutdato</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "d. MMM yyyy", { locale: da }) : "Vælg dato"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => date < (startDate || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Purpose */}
            <div className="space-y-2">
              <Label>Formål (valgfrit)</Label>
              <Input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="F.eks. kundemøde, konference..."
              />
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <Label>Destination (valgfrit)</Label>
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="F.eks. Aarhus, København..."
              />
            </div>

            {/* Cost Estimate */}
            {getEstimatedCost() && startDate && endDate && (
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estimeret pris</span>
                  <span className="text-lg font-bold">{getEstimatedCost()?.toLocaleString('da-DK')} kr</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Baseret på {differenceInDays(endDate!, startDate!) + 1} dage
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/corporate')}>
                Annuller
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Opretter booking...
                  </>
                ) : (
                  'Book nu'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CorporateCreateBookingPage;
