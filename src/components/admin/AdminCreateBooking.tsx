import { useState, useEffect } from 'react';
import { Loader2, Calendar, Car, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';

interface Vehicle {
  id: string;
  registration: string;
  make: string;
  model: string;
  owner_id: string;
  daily_price: number | null;
}

interface AdminCreateBookingProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AdminCreateBooking = ({ open, onClose, onSuccess }: AdminCreateBookingProps) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    start_date: '',
    end_date: '',
    renter_name: '',
    renter_email: '',
    renter_phone: '',
    total_price: '',
    pickup_time: '10:00',
    dropoff_time: '08:00',
  });

  useEffect(() => {
    if (open) {
      fetchVehicles();
    }
  }, [open]);

  const fetchVehicles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, registration, make, model, owner_id, daily_price')
      .order('make', { ascending: true });

    if (error) {
      console.error('Error fetching vehicles:', error);
    } else {
      setVehicles(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicle_id || !formData.start_date || !formData.end_date || !formData.renter_name) {
      toast.error('Udfyld alle påkrævede felter');
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id);
    if (!selectedVehicle) {
      toast.error('Vælg et køretøj');
      return;
    }

    setCreating(true);

    const bookingData = {
      vehicle_id: formData.vehicle_id,
      lessor_id: selectedVehicle.owner_id,
      start_date: formData.start_date,
      end_date: formData.end_date,
      renter_name: formData.renter_name,
      renter_email: formData.renter_email || null,
      renter_phone: formData.renter_phone || null,
      total_price: parseFloat(formData.total_price) || 0,
      status: 'pending' as const,
      pickup_time: formData.pickup_time,
      dropoff_time: formData.dropoff_time,
    };
    const { error } = await supabase.from('bookings').insert(bookingData);

    if (error) {
      console.error('Error creating booking:', error);
      toast.error('Kunne ikke oprette booking');
      setCreating(false);
      return;
    }

    toast.success('Booking oprettet!');
    setFormData({
      vehicle_id: '',
      start_date: '',
      end_date: '',
      renter_name: '',
      renter_email: '',
      renter_phone: '',
      total_price: '',
      pickup_time: '10:00',
      dropoff_time: '08:00',
    });
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Opret booking
          </DialogTitle>
          <DialogDescription>
            Opret en booking på vegne af en kunde
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.registration})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Startdato *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Slutdato *</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Afhentning kl.
                </Label>
                <Input
                  type="time"
                  value={formData.pickup_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, pickup_time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Aflevering senest kl.
                </Label>
                <Input
                  type="time"
                  value={formData.dropoff_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, dropoff_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Lejerens navn *</Label>
              <Input
                value={formData.renter_name}
                onChange={(e) => setFormData(prev => ({ ...prev, renter_name: e.target.value }))}
                placeholder="Fulde navn"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Lejerens email</Label>
              <Input
                type="email"
                value={formData.renter_email}
                onChange={(e) => setFormData(prev => ({ ...prev, renter_email: e.target.value }))}
                placeholder="email@eksempel.dk"
              />
            </div>

            <div className="space-y-2">
              <Label>Lejerens telefon</Label>
              <Input
                type="tel"
                value={formData.renter_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, renter_phone: e.target.value }))}
                placeholder="+45 12 34 56 78"
              />
            </div>

            <div className="space-y-2">
              <Label>Total pris (DKK) *</Label>
              <Input
                type="number"
                value={formData.total_price}
                onChange={(e) => setFormData(prev => ({ ...prev, total_price: e.target.value }))}
                placeholder="0"
                min={0}
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Annuller
              </Button>
              <Button type="submit" className="flex-1" disabled={creating}>
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Calendar className="w-4 h-4 mr-2" />
                )}
                Opret booking
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminCreateBooking;
