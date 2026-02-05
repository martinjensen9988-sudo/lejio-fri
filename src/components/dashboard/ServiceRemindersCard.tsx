import { useState } from 'react';
import { useServiceReminders } from '@/hooks/useServiceReminders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Wrench, 
  Plus, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Calendar,
  Gauge
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from 'sonner';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  registration: string;
}

interface ServiceRemindersCardProps {
  vehicles: Vehicle[];
}

const ServiceRemindersCard = ({ vehicles }: ServiceRemindersCardProps) => {
  const { 
    reminders, 
    isLoading, 
    addReminder, 
    completeReminder,
    getOverdueReminders,
    getUpcomingReminders
  } = useServiceReminders();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({
    vehicle_id: '',
    service_type: '',
    due_date: '',
    due_km: '',
    current_km: '',
    notes: ''
  });

  const overdueReminders = getOverdueReminders();
  const upcomingReminders = getUpcomingReminders();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReminder.vehicle_id || !newReminder.service_type) {
      toast.error('Vælg venligst køretøj og servicetype');
      return;
    }

    await addReminder({
      vehicle_id: newReminder.vehicle_id,
      service_type: newReminder.service_type,
      due_date: newReminder.due_date || null,
      due_km: newReminder.due_km ? parseInt(newReminder.due_km) : null,
      current_km: newReminder.current_km ? parseInt(newReminder.current_km) : null,
      notes: newReminder.notes || null
    });

    setNewReminder({
      vehicle_id: '',
      service_type: '',
      due_date: '',
      due_km: '',
      current_km: '',
      notes: ''
    });
    setIsDialogOpen(false);
    toast.success('Servicepåmindelse oprettet');
  };

  const handleComplete = async (id: string) => {
    await completeReminder(id);
    toast.success('Service markeret som udført');
  };

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registration})` : 'Ukendt køretøj';
  };

  if (isLoading) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  const ReminderItem = ({ reminder, isOverdue = false }: { reminder: unknown, isOverdue?: boolean }) => (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${isOverdue ? 'border-red-500/30 bg-red-500/5' : 'border-border bg-card'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isOverdue ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
          {isOverdue ? (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          ) : (
            <Wrench className="w-5 h-5 text-yellow-600" />
          )}
        </div>
        <div>
          <p className="font-semibold">{reminder.service_type}</p>
          <p className="text-sm text-muted-foreground">{getVehicleInfo(reminder.vehicle_id)}</p>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            {reminder.due_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(reminder.due_date), 'dd. MMM yyyy', { locale: da })}
              </span>
            )}
            {reminder.due_km && (
              <span className="flex items-center gap-1">
                <Gauge className="w-3 h-3" />
                {reminder.due_km.toLocaleString('da-DK')} km
              </span>
            )}
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleComplete(reminder.id)}
        className="text-green-600 hover:text-green-700 hover:bg-green-500/10"
      >
        <CheckCircle className="w-4 h-4 mr-1" />
        Udført
      </Button>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Servicepåmindelser
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Tilføj
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ny servicepåmindelse</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Køretøj</Label>
                <Select
                  value={newReminder.vehicle_id}
                  onValueChange={(value) => setNewReminder(prev => ({ ...prev, vehicle_id: value }))}
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
              
              <div>
                <Label>Servicetype</Label>
                <Select
                  value={newReminder.service_type}
                  onValueChange={(value) => setNewReminder(prev => ({ ...prev, service_type: value }))}
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
                <div>
                  <Label>Forfaldsdato</Label>
                  <Input
                    type="date"
                    value={newReminder.due_date}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Ved km</Label>
                  <Input
                    type="number"
                    placeholder="f.eks. 50000"
                    value={newReminder.due_km}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, due_km: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Nuværende km-stand</Label>
                <Input
                  type="number"
                  placeholder="f.eks. 45000"
                  value={newReminder.current_km}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, current_km: e.target.value }))}
                />
              </div>

              <div>
                <Label>Noter (valgfrit)</Label>
                <Input
                  placeholder="Eventuelle noter..."
                  value={newReminder.notes}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <Button type="submit" className="w-full">
                Opret påmindelse
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {reminders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Ingen servicepåmindelser</p>
            <p className="text-sm">Tilføj en påmindelse for at holde styr på service</p>
          </div>
        ) : (
          <div className="space-y-3">
            {overdueReminders.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Forfaldne ({overdueReminders.length})
                </p>
                {overdueReminders.map(reminder => (
                  <ReminderItem key={reminder.id} reminder={reminder} isOverdue />
                ))}
              </div>
            )}

            {upcomingReminders.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-yellow-600 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Kommende ({upcomingReminders.length})
                </p>
                {upcomingReminders.map(reminder => (
                  <ReminderItem key={reminder.id} reminder={reminder} />
                ))}
              </div>
            )}

            {reminders.filter(r => 
              !overdueReminders.includes(r) && !upcomingReminders.includes(r)
            ).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Planlagte</p>
                {reminders
                  .filter(r => !overdueReminders.includes(r) && !upcomingReminders.includes(r))
                  .map(reminder => (
                    <ReminderItem key={reminder.id} reminder={reminder} />
                  ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceRemindersCard;
