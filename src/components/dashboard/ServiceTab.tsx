import { useState } from 'react';
import { Vehicle } from '@/hooks/useVehicles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Car, 
  Gauge, 
  Calendar,
  CircleDot,
  MapPin,
  Plus,
  Edit,
  ClipboardList
} from 'lucide-react';
import { format, differenceInDays, parseISO, addMonths } from 'date-fns';
import { da } from 'date-fns/locale';
import { ServiceTasksCard } from './ServiceTasksCard';

interface ServiceTabProps {
  vehicles: Vehicle[];
  onUpdate: (id: string, updates: Partial<Vehicle>) => Promise<boolean>;
}

const ServiceTab = ({ vehicles, onUpdate }: ServiceTabProps) => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [logServiceOpen, setLogServiceOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [serviceForm, setServiceForm] = useState({
    service_interval_km: 15000,
    service_interval_months: 12,
    current_odometer: 0,
    next_inspection_date: '',
    tire_type: 'summer' as 'summer' | 'winter' | 'all_season',
    tire_size: '',
    tire_hotel_location: '',
  });

  const [serviceLogForm, setServiceLogForm] = useState({
    service_type: 'regular_service',
    odometer_reading: 0,
    description: '',
    cost: 0,
    performed_by: '',
  });

  const getServiceStatus = (vehicle: Vehicle) => {
    const status = vehicle.service_status || 'ok';
    
    // Check if service is due based on odometer
    if (vehicle.service_interval_km && vehicle.current_odometer && vehicle.last_service_odometer) {
      const kmSinceService = vehicle.current_odometer - vehicle.last_service_odometer;
      const kmUntilService = vehicle.service_interval_km - kmSinceService;
      
      if (kmUntilService <= 0) return 'service_required';
      if (kmUntilService <= 500) return 'service_soon';
    }
    
    // Check if service is due based on time
    if (vehicle.service_interval_months && vehicle.last_service_date) {
      const nextServiceDate = addMonths(parseISO(vehicle.last_service_date), vehicle.service_interval_months);
      const daysUntilService = differenceInDays(nextServiceDate, new Date());
      
      if (daysUntilService <= 0) return 'service_required';
      if (daysUntilService <= 30) return 'service_soon';
    }
    
    // Check inspection date
    if (vehicle.next_inspection_date) {
      const daysUntilInspection = differenceInDays(parseISO(vehicle.next_inspection_date), new Date());
      if (daysUntilInspection <= 0) return 'blocked';
      if (daysUntilInspection <= 30) return 'service_soon';
    }
    
    return status;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> OK</Badge>;
      case 'service_soon':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> Snart service</Badge>;
      case 'service_required':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20"><Wrench className="w-3 h-3 mr-1" /> Service påkrævet</Badge>;
      case 'blocked':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><AlertTriangle className="w-3 h-3 mr-1" /> Spærret</Badge>;
      default:
        return <Badge variant="secondary">Ukendt</Badge>;
    }
  };

  const getTireTypeBadge = (tireType: string) => {
    switch (tireType) {
      case 'summer':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">☀️ Sommerdæk</Badge>;
      case 'winter':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600">❄️ Vinterdæk</Badge>;
      case 'all_season':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600">🌡️ Helårsdæk</Badge>;
      default:
        return null;
    }
  };

  const handleEditService = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setServiceForm({
      service_interval_km: vehicle.service_interval_km || 15000,
      service_interval_months: vehicle.service_interval_months || 12,
      current_odometer: vehicle.current_odometer || 0,
      next_inspection_date: vehicle.next_inspection_date || '',
      tire_type: vehicle.tire_type || 'summer',
      tire_size: vehicle.tire_size || '',
      tire_hotel_location: vehicle.tire_hotel_location || '',
    });
    setEditOpen(true);
  };

  const handleSaveService = async () => {
    if (!selectedVehicle) return;
    
    setIsLoading(true);
    try {
      const success = await onUpdate(selectedVehicle.id, {
        service_interval_km: serviceForm.service_interval_km,
        service_interval_months: serviceForm.service_interval_months,
        current_odometer: serviceForm.current_odometer,
        next_inspection_date: serviceForm.next_inspection_date || null,
        tire_type: serviceForm.tire_type,
        tire_size: serviceForm.tire_size || null,
        tire_hotel_location: serviceForm.tire_hotel_location || null,
      });
      
      if (success) {
        toast.success('Serviceoplysninger opdateret');
        setEditOpen(false);
      }
    } catch (err) {
      console.error('Error updating service info:', err);
      toast.error('Kunne ikke opdatere serviceoplysninger');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogService = async () => {
    if (!selectedVehicle) return;
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Ikke logget ind');

      // Insert service log
      const { error: logError } = await supabase
        .from('vehicle_service_logs')
        .insert({
          vehicle_id: selectedVehicle.id,
          service_type: serviceLogForm.service_type,
          odometer_reading: serviceLogForm.odometer_reading,
          description: serviceLogForm.description,
          cost: serviceLogForm.cost,
          performed_by: serviceLogForm.performed_by,
          created_by: user.id,
        });

      if (logError) throw logError;

      // Update vehicle with new service date and odometer
      await onUpdate(selectedVehicle.id, {
        last_service_date: new Date().toISOString().split('T')[0],
        last_service_odometer: serviceLogForm.odometer_reading,
        current_odometer: serviceLogForm.odometer_reading,
        service_status: 'ok',
      });

      toast.success('Service registreret');
      setLogServiceOpen(false);
      setServiceLogForm({
        service_type: 'regular_service',
        odometer_reading: 0,
        description: '',
        cost: 0,
        performed_by: '',
      });
    } catch (err) {
      console.error('Error logging service:', err);
      toast.error('Kunne ikke registrere service');
    } finally {
      setIsLoading(false);
    }
  };

  const openLogService = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setServiceLogForm({
      ...serviceLogForm,
      odometer_reading: vehicle.current_odometer || 0,
    });
    setLogServiceOpen(true);
  };

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-2xl border border-border">
        <Wrench className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          Ingen køretøjer
        </h3>
        <p className="text-muted-foreground">
          Tilføj køretøjer for at administrere deres service og vedligeholdelse.
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview" className="gap-2">
          <Car className="w-4 h-4" />
          Køretøjer
        </TabsTrigger>
        <TabsTrigger value="tasks" className="gap-2">
          <ClipboardList className="w-4 h-4" />
          Opgaver
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vehicles.filter(v => getServiceStatus(v) === 'ok').length}</p>
                <p className="text-sm text-muted-foreground">OK</p>
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
                <p className="text-2xl font-bold">{vehicles.filter(v => getServiceStatus(v) === 'service_soon').length}</p>
                <p className="text-sm text-muted-foreground">Snart service</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vehicles.filter(v => getServiceStatus(v) === 'service_required').length}</p>
                <p className="text-sm text-muted-foreground">Kræver service</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vehicles.filter(v => getServiceStatus(v) === 'blocked').length}</p>
                <p className="text-sm text-muted-foreground">Spærret</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle List */}
      <div className="space-y-4">
        {vehicles.map((vehicle) => {
          const status = getServiceStatus(vehicle);
          
          return (
            <Card key={vehicle.id} className={status === 'blocked' ? 'border-red-500/30 bg-red-500/5' : ''}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Car className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{vehicle.make} {vehicle.model}</h3>
                        {getStatusBadge(status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{vehicle.registration}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-muted-foreground" />
                      <span>{vehicle.current_odometer?.toLocaleString() || '—'} km</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {vehicle.next_inspection_date 
                          ? format(parseISO(vehicle.next_inspection_date), 'dd. MMM yyyy', { locale: da })
                          : '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CircleDot className="w-4 h-4 text-muted-foreground" />
                      {getTireTypeBadge(vehicle.tire_type)}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate max-w-[100px]">{vehicle.tire_hotel_location || '—'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openLogService(vehicle)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Log service
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditService(vehicle)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Rediger
                    </Button>
                  </div>
                </div>

                {/* Service interval info */}
                {(vehicle.service_interval_km || vehicle.service_interval_months) && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {vehicle.service_interval_km && (
                        <span>Service hver {vehicle.service_interval_km.toLocaleString()} km</span>
                      )}
                      {vehicle.service_interval_months && (
                        <span>Service hver {vehicle.service_interval_months} mdr.</span>
                      )}
                      {vehicle.last_service_date && (
                        <span>Sidst serviceret: {format(parseISO(vehicle.last_service_date), 'dd. MMM yyyy', { locale: da })}</span>
                      )}
                      {vehicle.last_service_odometer && (
                        <span>Ved {vehicle.last_service_odometer.toLocaleString()} km</span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Service Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Rediger serviceoplysninger
              {selectedVehicle && ` - ${selectedVehicle.make} ${selectedVehicle.model}`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Serviceinterval (km)</Label>
                <Input
                  type="number"
                  value={serviceForm.service_interval_km}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, service_interval_km: parseInt(e.target.value) || 0 }))}
                  placeholder="15000"
                />
              </div>
              <div className="space-y-2">
                <Label>Serviceinterval (mdr.)</Label>
                <Input
                  type="number"
                  value={serviceForm.service_interval_months}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, service_interval_months: parseInt(e.target.value) || 0 }))}
                  placeholder="12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nuværende km-tal</Label>
              <Input
                type="number"
                value={serviceForm.current_odometer}
                onChange={(e) => setServiceForm(prev => ({ ...prev, current_odometer: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Næste syn</Label>
              <Input
                type="date"
                value={serviceForm.next_inspection_date}
                onChange={(e) => setServiceForm(prev => ({ ...prev, next_inspection_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Dæktype</Label>
              <Select
                value={serviceForm.tire_type}
                onValueChange={(value: 'summer' | 'winter' | 'all_season') => setServiceForm(prev => ({ ...prev, tire_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summer">☀️ Sommerdæk</SelectItem>
                  <SelectItem value="winter">❄️ Vinterdæk</SelectItem>
                  <SelectItem value="all_season">🌡️ Helårsdæk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dækstørrelse</Label>
              <Input
                value={serviceForm.tire_size}
                onChange={(e) => setServiceForm(prev => ({ ...prev, tire_size: e.target.value }))}
                placeholder="205/55 R16"
              />
            </div>

            <div className="space-y-2">
              <Label>Dækhotel lokation</Label>
              <Input
                value={serviceForm.tire_hotel_location}
                onChange={(e) => setServiceForm(prev => ({ ...prev, tire_hotel_location: e.target.value }))}
                placeholder="F.eks. Hylde 4B, Lager Aarhus"
              />
            </div>

            <Button onClick={handleSaveService} disabled={isLoading} className="w-full">
              {isLoading ? 'Gemmer...' : 'Gem ændringer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Service Dialog */}
      <Dialog open={logServiceOpen} onOpenChange={setLogServiceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Registrer service
              {selectedVehicle && ` - ${selectedVehicle.make} ${selectedVehicle.model}`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Servicetype</Label>
              <Select
                value={serviceLogForm.service_type}
                onValueChange={(value) => setServiceLogForm(prev => ({ ...prev, service_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular_service">Almindelig service</SelectItem>
                  <SelectItem value="oil_change">Olieskift</SelectItem>
                  <SelectItem value="tire_change">Dækskifte</SelectItem>
                  <SelectItem value="brake_service">Bremseservice</SelectItem>
                  <SelectItem value="inspection">Syn</SelectItem>
                  <SelectItem value="repair">Reparation</SelectItem>
                  <SelectItem value="other">Andet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Km-tal ved service</Label>
              <Input
                type="number"
                value={serviceLogForm.odometer_reading}
                onChange={(e) => setServiceLogForm(prev => ({ ...prev, odometer_reading: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Beskrivelse</Label>
              <Input
                value={serviceLogForm.description}
                onChange={(e) => setServiceLogForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Hvad blev udført..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pris (kr)</Label>
                <Input
                  type="number"
                  value={serviceLogForm.cost}
                  onChange={(e) => setServiceLogForm(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Udført af</Label>
                <Input
                  value={serviceLogForm.performed_by}
                  onChange={(e) => setServiceLogForm(prev => ({ ...prev, performed_by: e.target.value }))}
                  placeholder="Værksted/mekaniker"
                />
              </div>
            </div>

            <Button onClick={handleLogService} disabled={isLoading} className="w-full">
              {isLoading ? 'Gemmer...' : 'Registrer service'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </TabsContent>

      <TabsContent value="tasks">
        <ServiceTasksCard />
      </TabsContent>
    </Tabs>
  );
};

export default ServiceTab;
