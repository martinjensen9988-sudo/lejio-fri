import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useServiceTasks, TASK_TYPES } from '@/hooks/useServiceTasks';
import { useVehicles } from '@/hooks/useVehicles';
import { useDealerLocations } from '@/hooks/useDealerLocations';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Wrench, Plus } from 'lucide-react';

const ServiceTaskAddPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { createTask } = useServiceTasks();
  const { vehicles } = useVehicles();
  const { locations } = useDealerLocations();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    task_type: 'service',
    title: '',
    description: '',
    priority: 'medium',
    scheduled_date: '',
    scheduled_time: '',
    km_trigger: '',
    location_id: '',
    auto_block_bookings: true,
    estimated_duration_minutes: 60
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubmitting(true);
    await createTask({
      vehicle_id: formData.vehicle_id,
      task_type: formData.task_type,
      title: formData.title || TASK_TYPES.find(t => t.value === formData.task_type)?.label || 'Service',
      description: formData.description || null,
      priority: formData.priority,
      status: formData.scheduled_date ? 'scheduled' : 'pending',
      assigned_to: null,
      scheduled_date: formData.scheduled_date || null,
      scheduled_time: formData.scheduled_time || null,
      km_trigger: formData.km_trigger ? parseInt(formData.km_trigger) : null,
      date_trigger: null,
      estimated_duration_minutes: formData.estimated_duration_minutes,
      location_id: formData.location_id || null,
      notes: null,
      auto_block_bookings: formData.auto_block_bookings,
      booking_block_start: null,
      booking_block_end: null,
      completed_at: null
    });

    setSubmitting(false);
    navigate('/dashboard/service');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <DashboardLayout activeTab="service">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/service')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbage
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Opret service-opgave</h2>
            <p className="text-muted-foreground">Planlæg service for et køretøj</p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Opgave detaljer
            </CardTitle>
            <CardDescription>
              Udfyld oplysningerne for den nye service-opgave
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Køretøj *</Label>
                <Select
                  value={formData.vehicle_id}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, vehicle_id: v }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg køretøj" />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Opgavetype *</Label>
                  <Select
                    value={formData.task_type}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, task_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioritet</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Lav</SelectItem>
                      <SelectItem value="medium">Normal</SelectItem>
                      <SelectItem value="high">Høj</SelectItem>
                      <SelectItem value="urgent">Kritisk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Titel (valgfrit)</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="F.eks. 'Årlig service'"
                />
              </div>

              <div className="space-y-2">
                <Label>Beskrivelse</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Yderligere detaljer..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Planlagt dato</Label>
                  <Input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tidspunkt</Label>
                  <Input
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Km-trigger (valgfrit)</Label>
                <Input
                  type="number"
                  value={formData.km_trigger}
                  onChange={(e) => setFormData(prev => ({ ...prev, km_trigger: e.target.value }))}
                  placeholder="Service ved x km"
                />
              </div>

              {locations.length > 0 && (
                <div className="space-y-2">
                  <Label>Lokation</Label>
                  <Select
                    value={formData.location_id}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, location_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vælg lokation" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label>Bloker bookinger automatisk</Label>
                  <p className="text-sm text-muted-foreground">
                    Bloker køretøjet for bookinger under service
                  </p>
                </div>
                <Switch
                  checked={formData.auto_block_bookings}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_block_bookings: checked }))}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/dashboard/service')}>
                  Annuller
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting || !formData.vehicle_id}>
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Opret opgave
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ServiceTaskAddPage;
