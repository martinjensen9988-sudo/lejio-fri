import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useServiceTasks, TASK_TYPES, ServiceTask } from '@/hooks/useServiceTasks';
import { useVehicles } from '@/hooks/useVehicles';
import { useDealerLocations } from '@/hooks/useDealerLocations';
import { Wrench, Plus, Calendar, AlertTriangle, Check, Clock, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const statusLabels = {
  pending: 'Afventer',
  scheduled: 'Planlagt',
  in_progress: 'I gang',
  completed: 'Afsluttet',
  cancelled: 'Annulleret'
};

export const ServiceTasksCard = () => {
  const { tasks, isLoading, createTask, completeTask, deleteTask, getUpcomingTasks, getOverdueTasks } = useServiceTasks();
  const { vehicles } = useVehicles();
  const { locations } = useDealerLocations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  const upcomingTasks = getUpcomingTasks();
  const overdueTasks = getOverdueTasks();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

    setIsDialogOpen(false);
    setFormData({
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
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Service-Logistik
          </CardTitle>
          <CardDescription>
            Automatisk service-planlægning og transport
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ny opgave
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Opret service-opgave</DialogTitle>
            </DialogHeader>
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
                    {vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.make} {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Opgavetype *</Label>
                <Select
                  value={formData.task_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, task_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.icon} {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Titel</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Efterlad tom for standard titel"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dato</Label>
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
                <Label>Eller trigger ved km</Label>
                <Input
                  type="number"
                  value={formData.km_trigger}
                  onChange={(e) => setFormData(prev => ({ ...prev, km_trigger: e.target.value }))}
                  placeholder="f.eks. 15000"
                />
              </div>

              <div className="space-y-2">
                <Label>Lokation</Label>
                <Select
                  value={formData.location_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, location_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg værksted/lokation" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(l => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}, {l.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Beskrivelse</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Yderligere detaljer..."
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-block">Blokér automatisk bookinger</Label>
                <Switch
                  id="auto-block"
                  checked={formData.auto_block_bookings}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_block_bookings: checked }))}
                />
              </div>

              <Button type="submit" className="w-full" disabled={!formData.vehicle_id}>
                Opret opgave
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overdue tasks */}
        {overdueTasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Overskredet ({overdueTasks.length})
            </h4>
            {overdueTasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onComplete={() => completeTask(task.id)}
                onDelete={() => deleteTask(task.id)}
                isOverdue
              />
            ))}
          </div>
        )}

        {/* Upcoming tasks */}
        {upcomingTasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Kommende ({upcomingTasks.length})
            </h4>
            {upcomingTasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task}
                onComplete={() => completeTask(task.id)}
                onDelete={() => deleteTask(task.id)}
              />
            ))}
          </div>
        )}

        {/* All tasks summary */}
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Ingen service-opgaver</p>
            <p className="text-sm">Opret en opgave for at komme i gang</p>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length} aktive opgaver
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface TaskItemProps {
  task: ServiceTask;
  onComplete: () => void;
  onDelete: () => void;
  isOverdue?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onComplete, onDelete, isOverdue }) => {
  const taskType = TASK_TYPES.find(t => t.value === task.task_type);
  const status = task.status as keyof typeof statusColors;

  return (
    <div className={`border rounded-lg p-3 ${isOverdue ? 'border-red-300 bg-red-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{taskType?.icon || '🔧'}</span>
          <div>
            <p className="font-medium text-sm">{task.title}</p>
            {task.vehicle && (
              <p className="text-xs text-muted-foreground">
                {task.vehicle.make} {task.vehicle.model}
              </p>
            )}
          </div>
        </div>
        <Badge className={statusColors[status]}>
          {statusLabels[status]}
        </Badge>
      </div>

      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        {task.scheduled_date && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(task.scheduled_date), 'd. MMM', { locale: da })}
            {task.scheduled_time && ` kl. ${task.scheduled_time.slice(0, 5)}`}
          </span>
        )}
        {task.km_trigger && (
          <span>Ved {task.km_trigger.toLocaleString('da-DK')} km</span>
        )}
        {task.location && (
          <span>{task.location.name}</span>
        )}
      </div>

      {task.status !== 'completed' && task.status !== 'cancelled' && (
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="outline" onClick={onComplete} className="flex-1">
            <Check className="h-3 w-3 mr-1" />
            Afslut
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};
