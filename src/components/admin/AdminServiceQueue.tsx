import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Wrench, Droplets, Eye, RefreshCw, Plus, 
  MoreHorizontal, CheckCircle, Clock, AlertTriangle,
  Car, Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface ServiceQueueItem {
  id: string;
  vehicle_id: string;
  lessor_id: string;
  service_type: 'cleaning' | 'tire_change' | 'inspection' | 'maintenance' | 'repair';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  description: string | null;
  scheduled_date: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  vehicle?: {
    make: string;
    model: string;
    registration: string;
  };
  lessor?: {
    company_name: string | null;
    full_name: string | null;
  };
}

const SERVICE_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  cleaning: { label: 'Rengøring', icon: <Droplets className="w-4 h-4" />, color: 'bg-blue-500' },
  tire_change: { label: 'Dækskifte', icon: <RefreshCw className="w-4 h-4" />, color: 'bg-amber-500' },
  inspection: { label: 'Syn', icon: <Eye className="w-4 h-4" />, color: 'bg-purple-500' },
  maintenance: { label: 'Vedligeholdelse', icon: <Wrench className="w-4 h-4" />, color: 'bg-green-500' },
  repair: { label: 'Reparation', icon: <Wrench className="w-4 h-4" />, color: 'bg-red-500' },
};

const PRIORITY_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  low: { label: 'Lav', variant: 'outline' },
  normal: { label: 'Normal', variant: 'secondary' },
  high: { label: 'Høj', variant: 'default' },
  urgent: { label: 'Akut', variant: 'destructive' },
};

interface AdminServiceQueueProps {
  fleetVehicles: { id: string; registration: string; make: string; model: string; owner_id: string }[];
}

export const AdminServiceQueue = ({ fleetVehicles }: AdminServiceQueueProps) => {
  const [queue, setQueue] = useState<ServiceQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('pending');

  const [newTaskForm, setNewTaskForm] = useState({
    vehicle_id: '',
    service_type: 'maintenance' as const,
    priority: 'normal' as const,
    description: '',
    scheduled_date: '',
  });

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('fleet_service_queue')
        .select(`
          *,
          vehicle:vehicles(make, model, registration),
          lessor:profiles!fleet_service_queue_lessor_id_fkey(company_name, full_name)
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      if (filterType !== 'all') {
        query = query.eq('service_type', filterType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setQueue((data || []) as unknown as ServiceQueueItem[]);
    } catch (error) {
      console.error('Error fetching service queue:', error);
      toast.error('Kunne ikke hente servicekø');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [filterType, filterStatus, fetchQueue]);

  const handleAddTask = async () => {
    if (!newTaskForm.vehicle_id) {
      toast.error('Vælg et køretøj');
      return;
    }

    setIsSubmitting(true);
    try {
      const vehicle = fleetVehicles.find(v => v.id === newTaskForm.vehicle_id);
      if (!vehicle) throw new Error('Køretøj ikke fundet');

      const { error } = await supabase.from('fleet_service_queue').insert({
        vehicle_id: newTaskForm.vehicle_id,
        lessor_id: vehicle.owner_id,
        service_type: newTaskForm.service_type,
        priority: newTaskForm.priority,
        description: newTaskForm.description || null,
        scheduled_date: newTaskForm.scheduled_date || null,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Opgave tilføjet til servicekøen');
      setShowAddDialog(false);
      setNewTaskForm({
        vehicle_id: '',
        service_type: 'maintenance',
        priority: 'normal',
        description: '',
        scheduled_date: '',
      });
      fetchQueue();
    } catch (error) {
      console.error('Error adding service task:', error);
      toast.error('Kunne ikke tilføje opgave');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('fleet_service_queue')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Status opdateret');
      fetchQueue();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Kunne ikke opdatere status');
    }
  };

  const stats = {
    pending: queue.filter(q => q.status === 'pending').length,
    inProgress: queue.filter(q => q.status === 'in_progress').length,
    urgent: queue.filter(q => q.priority === 'urgent' && q.status !== 'completed').length,
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Servicekø
              </CardTitle>
              <CardDescription>
                Biler der skal til rengøring, dækskifte eller syn
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Clock className="w-3 h-3" />
                {stats.pending} afventer
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <RefreshCw className="w-3 h-3" />
                {stats.inProgress} i gang
              </Badge>
              {stats.urgent > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {stats.urgent} akutte
                </Badge>
              )}
              <Button size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Tilføj opgave
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-2 mb-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statusser</SelectItem>
                <SelectItem value="pending">Afventer</SelectItem>
                <SelectItem value="in_progress">I gang</SelectItem>
                <SelectItem value="completed">Afsluttet</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle typer</SelectItem>
                <SelectItem value="cleaning">Rengøring</SelectItem>
                <SelectItem value="tire_change">Dækskifte</SelectItem>
                <SelectItem value="inspection">Syn</SelectItem>
                <SelectItem value="maintenance">Vedligeholdelse</SelectItem>
                <SelectItem value="repair">Reparation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Henter servicekø...
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Ingen opgaver i køen</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Køretøj</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Prioritet</TableHead>
                  <TableHead>Planlagt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((item) => {
                  const typeInfo = SERVICE_TYPE_LABELS[item.service_type];
                  const priorityInfo = PRIORITY_LABELS[item.priority];
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {item.vehicle?.make} {item.vehicle?.model}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {item.vehicle?.registration}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full ${typeInfo.color} flex items-center justify-center text-white`}>
                            {typeInfo.icon}
                          </div>
                          <span>{typeInfo.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={priorityInfo.variant}>
                          {priorityInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.scheduled_date 
                          ? format(new Date(item.scheduled_date), 'd. MMM yyyy', { locale: da })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            item.status === 'completed' ? 'default' :
                            item.status === 'in_progress' ? 'secondary' : 'outline'
                          }
                        >
                          {item.status === 'pending' ? 'Afventer' :
                           item.status === 'in_progress' ? 'I gang' :
                           item.status === 'completed' ? 'Afsluttet' : 'Annulleret'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {item.status === 'pending' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(item.id, 'in_progress')}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Start opgave
                              </DropdownMenuItem>
                            )}
                            {item.status === 'in_progress' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(item.id, 'completed')}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Marker som afsluttet
                              </DropdownMenuItem>
                            )}
                            {item.status !== 'cancelled' && item.status !== 'completed' && (
                              <DropdownMenuItem 
                                onClick={() => handleUpdateStatus(item.id, 'cancelled')}
                                className="text-destructive"
                              >
                                Annuller
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Task Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tilføj serviceopgave</DialogTitle>
            <DialogDescription>
              Opret en ny opgave i servicekøen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Køretøj *</Label>
              <Select 
                value={newTaskForm.vehicle_id} 
                onValueChange={(v) => setNewTaskForm(prev => ({ ...prev, vehicle_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vælg køretøj" />
                </SelectTrigger>
                <SelectContent>
                  {fleetVehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.registration} - {v.make} {v.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select 
                  value={newTaskForm.service_type} 
                  onValueChange={(v: typeof newTaskForm.service_type) => setNewTaskForm(prev => ({ ...prev, service_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleaning">Rengøring</SelectItem>
                    <SelectItem value="tire_change">Dækskifte</SelectItem>
                    <SelectItem value="inspection">Syn</SelectItem>
                    <SelectItem value="maintenance">Vedligeholdelse</SelectItem>
                    <SelectItem value="repair">Reparation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioritet *</Label>
                <Select 
                  value={newTaskForm.priority} 
                  onValueChange={(v: typeof newTaskForm.priority) => setNewTaskForm(prev => ({ ...prev, priority: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Lav</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Høj</SelectItem>
                    <SelectItem value="urgent">Akut</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Planlagt dato</Label>
              <Input
                type="date"
                value={newTaskForm.scheduled_date}
                onChange={(e) => setNewTaskForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Beskrivelse</Label>
              <Textarea
                placeholder="Evt. yderligere detaljer..."
                value={newTaskForm.description}
                onChange={(e) => setNewTaskForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuller
            </Button>
            <Button onClick={handleAddTask} disabled={isSubmitting}>
              {isSubmitting ? 'Opretter...' : 'Tilføj opgave'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
