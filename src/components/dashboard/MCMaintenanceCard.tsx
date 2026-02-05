import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useMCMaintenance } from '@/hooks/useMCMaintenance';
import { Vehicle } from '@/hooks/useVehicles';
import { 
  Bike, 
  Link as LinkIcon, 
  CircleDot, 
  Wrench, 
  Plus, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface MCMaintenanceCardProps {
  vehicles: Vehicle[];
}

const MAINTENANCE_TYPES = [
  { value: 'chain_check', label: 'Kæde-tjek', icon: LinkIcon },
  { value: 'chain_service', label: 'Kæde-service (smøring/stramning)', icon: LinkIcon },
  { value: 'tire_check', label: 'Dæk-tjek', icon: CircleDot },
  { value: 'tire_change_front', label: 'Dækskift (for)', icon: CircleDot },
  { value: 'tire_change_rear', label: 'Dækskift (bag)', icon: CircleDot },
  { value: 'oil_change', label: 'Olieskift', icon: Wrench },
  { value: 'brake_service', label: 'Bremse-service', icon: Wrench },
  { value: 'general_service', label: 'Generel service', icon: Wrench },
  { value: 'battery_check', label: 'Batteri-tjek', icon: Wrench },
  { value: 'coolant_check', label: 'Kølevæske-tjek', icon: Wrench },
];

export const MCMaintenanceCard = ({ vehicles }: MCMaintenanceCardProps) => {
  const mcVehicles = vehicles.filter(v => v.vehicle_type === 'motorcykel' || v.vehicle_type === 'scooter');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(mcVehicles[0]?.id || null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    type: '',
    odometer: '',
    notes: '',
    nextServiceKm: '',
    nextServiceDate: '',
  });

  const { logs, isLoading, addMaintenanceLog, getMaintenanceStats } = useMCMaintenance(selectedVehicleId);
  const [stats, setStats] = useState<unknown>(null);

  useEffect(() => {
    if (selectedVehicleId) {
      getMaintenanceStats().then(setStats);
    }
  }, [selectedVehicleId, logs, getMaintenanceStats]);

  if (mcVehicles.length === 0) {
    return null;
  }

  const selectedVehicle = mcVehicles.find(v => v.id === selectedVehicleId);

  const handleAddMaintenance = async () => {
    if (!maintenanceForm.type) return;
    
    await addMaintenanceLog(
      maintenanceForm.type,
      maintenanceForm.odometer ? parseInt(maintenanceForm.odometer) : undefined,
      maintenanceForm.notes || undefined,
      maintenanceForm.nextServiceKm ? parseInt(maintenanceForm.nextServiceKm) : undefined,
      maintenanceForm.nextServiceDate || undefined
    );

    setMaintenanceForm({
      type: '',
      odometer: '',
      notes: '',
      nextServiceKm: '',
      nextServiceDate: '',
    });
    setAddDialogOpen(false);
  };

  const getMaintenanceTypeLabel = (type: string) => {
    return MAINTENANCE_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bike className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">MC/Scooter Vedligeholdelse</CardTitle>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="w-4 h-4" />
                Registrér
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrér vedligeholdelse</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Køretøj</Label>
                  <Select 
                    value={selectedVehicleId || ''} 
                    onValueChange={setSelectedVehicleId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vælg køretøj" />
                    </SelectTrigger>
                    <SelectContent>
                      {mcVehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.make} {v.model} ({v.registration})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Type vedligeholdelse *</Label>
                  <Select 
                    value={maintenanceForm.type} 
                    onValueChange={(v) => setMaintenanceForm(prev => ({ ...prev, type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vælg type" />
                    </SelectTrigger>
                    <SelectContent>
                      {MAINTENANCE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Kilometerstand</Label>
                  <Input
                    type="number"
                    placeholder="F.eks. 15000"
                    value={maintenanceForm.odometer}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, odometer: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Noter</Label>
                  <Textarea
                    placeholder="Evt. noter om service..."
                    value={maintenanceForm.notes}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Næste service (km)</Label>
                    <Input
                      type="number"
                      placeholder="F.eks. 20000"
                      value={maintenanceForm.nextServiceKm}
                      onChange={(e) => setMaintenanceForm(prev => ({ ...prev, nextServiceKm: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Næste service (dato)</Label>
                    <Input
                      type="date"
                      value={maintenanceForm.nextServiceDate}
                      onChange={(e) => setMaintenanceForm(prev => ({ ...prev, nextServiceDate: e.target.value }))}
                    />
                  </div>
                </div>

                <Button onClick={handleAddMaintenance} className="w-full" disabled={!maintenanceForm.type}>
                  Registrér vedligeholdelse
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          Track dæk, kæde og servicehistorik for dine MC'er og scootere
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vehicle selector */}
        {mcVehicles.length > 1 && (
          <Select value={selectedVehicleId || ''} onValueChange={setSelectedVehicleId}>
            <SelectTrigger>
              <SelectValue placeholder="Vælg køretøj" />
            </SelectTrigger>
            <SelectContent>
              {mcVehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.make} {v.model} ({v.registration})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedVehicle && (
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <Bike className="w-4 h-4" />
              <span className="font-medium">{selectedVehicle.make} {selectedVehicle.model}</span>
              <Badge variant="outline" className="ml-auto">{selectedVehicle.registration}</Badge>
            </div>
          </div>
        )}

        {/* Status alerts */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            {/* Chain status */}
            <div className={`p-3 rounded-lg border ${stats.chainServiceDue ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800' : 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'}`}>
              <div className="flex items-center gap-2 mb-1">
                <LinkIcon className={`w-4 h-4 ${stats.chainServiceDue ? 'text-amber-600' : 'text-green-600'}`} />
                <span className="text-sm font-medium">Kæde</span>
              </div>
              {stats.chainServiceDue ? (
                <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-3 h-3" />
                  Service påkrævet ({stats.kmSinceChainCheck} km siden tjek)
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  OK ({stats.kmSinceChainCheck || 0} km siden tjek)
                </div>
              )}
            </div>

            {/* Tire status */}
            <div className={`p-3 rounded-lg border ${
              stats.tireFrontStatus === 'critical' || stats.tireRearStatus === 'critical' 
                ? 'bg-destructive/10 border-destructive/30' 
                : stats.tireFrontStatus === 'warn' || stats.tireRearStatus === 'warn'
                  ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
                  : 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <CircleDot className={`w-4 h-4 ${
                  stats.tireFrontStatus === 'critical' || stats.tireRearStatus === 'critical' 
                    ? 'text-destructive' 
                    : stats.tireFrontStatus === 'warn' || stats.tireRearStatus === 'warn'
                      ? 'text-amber-600'
                      : 'text-green-600'
                }`} />
                <span className="text-sm font-medium">Dæk</span>
              </div>
              {(stats.tireFrontStatus === 'critical' || stats.tireRearStatus === 'critical') ? (
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <AlertTriangle className="w-3 h-3" />
                  Skal skiftes straks!
                </div>
              ) : (stats.tireFrontStatus === 'warn' || stats.tireRearStatus === 'warn') ? (
                <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                  <Clock className="w-3 h-3" />
                  Snart slidt
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  OK
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next service */}
        {stats?.nextServiceDate && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm">
              Næste service: {format(new Date(stats.nextServiceDate), 'dd. MMM yyyy', { locale: da })}
              {stats.nextServiceKm && ` eller ved ${stats.nextServiceKm.toLocaleString('da-DK')} km`}
            </span>
          </div>
        )}

        {/* Recent logs */}
        {logs.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Seneste vedligeholdelse</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {logs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-3 h-3 text-muted-foreground" />
                    <span>{getMaintenanceTypeLabel(log.maintenance_type)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {log.odometer_reading && <span>{log.odometer_reading.toLocaleString('da-DK')} km</span>}
                    <span>{format(new Date(log.performed_at), 'dd/MM/yy', { locale: da })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MCMaintenanceCard;
