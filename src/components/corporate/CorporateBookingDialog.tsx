import { useState } from 'react';
import { Car, Calendar, MapPin, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, differenceInDays } from 'date-fns';
import { da } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/azure/client';

interface CorporateBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fleetVehicles: unknown[];
  corporateAccountId: string;
  currentEmployeeId: string;
  departmentId: string | null;
  onSuccess: () => void;
}

const CorporateBookingDialog = ({
  open,
  onOpenChange,
  fleetVehicles,
  corporateAccountId,
  currentEmployeeId,
  departmentId,
  onSuccess,
}: CorporateBookingDialogProps) => {
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
      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Kunne ikke oprette booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedVehicle('');
    setStartDate(undefined);
    setEndDate(undefined);
    setPurpose('');
    setDestination('');
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Book firmabil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Vehicle Selection */}
          <div>
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
            <div>
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
            <div>
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
          <div>
            <Label>Formål (valgfrit)</Label>
            <Input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="F.eks. kundemøde, konference..."
            />
          </div>

          {/* Destination */}
          <div>
            <Label>Destination (valgfrit)</Label>
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="F.eks. Aarhus, København..."
            />
          </div>

          {/* Cost Estimate */}
          {getEstimatedCost() && (
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

          {/* Submit Button */}
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
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
      </DialogContent>
    </Dialog>
  );
};

export default CorporateBookingDialog;
