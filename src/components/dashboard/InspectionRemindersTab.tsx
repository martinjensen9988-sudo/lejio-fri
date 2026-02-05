import { useState } from 'react';
import { Vehicle } from '@/hooks/useVehicles';
import { useInspectionReminders, InspectionReminder } from '@/hooks/useInspectionReminders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Shield, 
  Plus, 
  Car, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Loader2,
  Trash2,
  Calendar
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { da } from 'date-fns/locale';

interface InspectionRemindersTabProps {
  vehicles: Vehicle[];
}

const InspectionRemindersTab = ({ vehicles }: InspectionRemindersTabProps) => {
  const { 
    reminders, 
    isLoading, 
    addReminder, 
    completeInspection, 
    deleteReminder,
    getOverdueReminders,
    getUpcomingReminders,
    calculateNextInspectionDate 
  } = useInspectionReminders();
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<InspectionReminder | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');

  const [form, setForm] = useState({
    inspection_type: 'standard' as InspectionReminder['inspection_type'],
    due_date: '',
    last_inspection_date: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({
      inspection_type: 'standard',
      due_date: '',
      last_inspection_date: '',
      notes: '',
    });
    setSelectedVehicleId('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      // Auto-calculate next inspection date if year is available
      if (vehicle.year) {
        const firstRegDate = `${vehicle.year}-01-01`;
        const nextDate = calculateNextInspectionDate(firstRegDate, vehicle.vehicle_type);
        setForm(prev => ({ ...prev, due_date: nextDate }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedVehicleId || !form.due_date) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addReminder({
        vehicle_id: selectedVehicleId,
        inspection_type: form.inspection_type,
        due_date: form.due_date,
        last_inspection_date: form.last_inspection_date || null,
        notes: form.notes || null,
      });
      
      setAddDialogOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedReminder) return;

    setIsSubmitting(true);
    try {
      await completeInspection(selectedReminder.id, newDueDate || undefined);
      setCompleteDialogOpen(false);
      setSelectedReminder(null);
      setNewDueDate('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenComplete = (reminder: InspectionReminder) => {
    setSelectedReminder(reminder);
    // Calculate next due date (2 years from now for standard inspections)
    const nextDate = new Date();
    nextDate.setFullYear(nextDate.getFullYear() + 2);
    setNewDueDate(nextDate.toISOString().split('T')[0]);
    setCompleteDialogOpen(true);
  };

  const getStatusBadge = (reminder: InspectionReminder) => {
    const daysUntil = differenceInDays(parseISO(reminder.due_date), new Date());
    
    if (daysUntil < 0) {
      return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><AlertTriangle className="w-3 h-3 mr-1" /> Overskredet</Badge>;
    } else if (daysUntil <= 30) {
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> Snart</Badge>;
    } else if (daysUntil <= 60) {
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Calendar className="w-3 h-3 mr-1" /> Planlagt</Badge>;
    }
    return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> OK</Badge>;
  };

  const getInspectionTypeLabel = (type: InspectionReminder['inspection_type']) => {
    switch (type) {
      case 'first_registration':
        return 'Første syn (4 år)';
      case 'trailer':
        return 'Trailer syn';
      case 'caravan':
        return 'Campingvogn syn';
      default:
        return 'Periodisk syn';
    }
  };

  const overdueReminders = getOverdueReminders();
  const upcomingReminders = getUpcomingReminders(60);

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-2xl border border-border">
        <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          Ingen køretøjer
        </h3>
        <p className="text-muted-foreground">
          Tilføj køretøjer for at administrere deres synspåmindelser.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Synspåmindelser</h2>
          <p className="text-sm text-muted-foreground">Hold styr på synsdatoer for dine køretøjer</p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Tilføj påmindelse
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueReminders.length}</p>
                <p className="text-sm text-muted-foreground">Overskredet</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingReminders.length}</p>
                <p className="text-sm text-muted-foreground">Næste 60 dage</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reminders.length - overdueReminders.length - upcomingReminders.length}</p>
                <p className="text-sm text-muted-foreground">OK</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alerts */}
      {overdueReminders.length > 0 && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Overskredet syn!
            </CardTitle>
            <CardDescription>
              Disse køretøjer har overskredet deres synsdato og må ikke køre
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueReminders.map((reminder) => {
                const vehicle = vehicles.find(v => v.id === reminder.vehicle_id);
                if (!vehicle) return null;
                
                return (
                  <div key={reminder.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-red-500/20">
                    <div className="flex items-center gap-3">
                      <Car className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                        <p className="text-sm text-muted-foreground">{vehicle.registration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">
                          Forfalden: {format(parseISO(reminder.due_date), 'd. MMM yyyy', { locale: da })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.abs(differenceInDays(parseISO(reminder.due_date), new Date()))} dage siden
                        </p>
                      </div>
                      <Button size="sm" onClick={() => handleOpenComplete(reminder)}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Marker gennemført
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Reminders */}
      <div className="space-y-4">
        {reminders.map((reminder) => {
          const vehicle = vehicles.find(v => v.id === reminder.vehicle_id);
          if (!vehicle) return null;

          const daysUntil = differenceInDays(parseISO(reminder.due_date), new Date());

          return (
            <Card key={reminder.id} className={daysUntil < 0 ? 'border-red-500/30' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Shield className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{vehicle.make} {vehicle.model}</h3>
                        {getStatusBadge(reminder)}
                      </div>
                      <p className="text-sm text-muted-foreground">{vehicle.registration}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">
                        {format(parseISO(reminder.due_date), 'd. MMMM yyyy', { locale: da })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {daysUntil < 0 
                          ? `${Math.abs(daysUntil)} dage overskredet` 
                          : daysUntil === 0 
                            ? 'I dag!' 
                            : `Om ${daysUntil} dage`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenComplete(reminder)}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Gennemført
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-destructive"
                        onClick={() => deleteReminder(reminder.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {reminder.notes && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-muted-foreground">{reminder.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {reminders.length === 0 && (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              Ingen synspåmindelser
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Tilføj påmindelser for at holde styr på synsdatoer
            </p>
            <Button onClick={handleOpenAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Tilføj påmindelse
            </Button>
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tilføj synspåmindelse</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Køretøj</Label>
              <Select value={selectedVehicleId} onValueChange={handleVehicleSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg køretøj..." />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.make} {v.model} ({v.registration})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Synstype</Label>
              <Select 
                value={form.inspection_type} 
                onValueChange={(value: InspectionReminder['inspection_type']) => setForm(prev => ({ ...prev, inspection_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_registration">Første syn (4 år efter reg.)</SelectItem>
                  <SelectItem value="standard">Periodisk syn (hver 2. år)</SelectItem>
                  <SelectItem value="trailer">Trailer syn</SelectItem>
                  <SelectItem value="caravan">Campingvogn syn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Synsdato *</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Sidste syn (valgfrit)</Label>
              <Input
                type="date"
                value={form.last_inspection_date}
                onChange={(e) => setForm(prev => ({ ...prev, last_inspection_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Noter</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Eventuelle bemærkninger..."
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setAddDialogOpen(false)}>
                Annuller
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedVehicleId || !form.due_date}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Gemmer...
                  </>
                ) : (
                  'Tilføj påmindelse'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Marker syn som gennemført</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Når du markerer synet som gennemført, oprettes automatisk en ny påmindelse for næste syn.
            </p>

            <div className="space-y-2">
              <Label>Næste synsdato</Label>
              <Input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Standard er 2 år fra i dag for personbiler
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setCompleteDialogOpen(false)}>
                Annuller
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleComplete}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Gemmer...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marker gennemført
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InspectionRemindersTab;
