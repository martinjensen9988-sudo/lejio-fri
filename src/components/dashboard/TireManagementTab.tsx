import { useState } from 'react';
import { Vehicle } from '@/hooks/useVehicles';
import { useTireSets, TireSet } from '@/hooks/useTireSets';
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
  CircleDot, 
  Plus, 
  Car, 
  MapPin, 
  Trash2, 
  CheckCircle, 
  Sun, 
  Snowflake, 
  ThermometerSun,
  Loader2,
  Edit
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';

interface TireManagementTabProps {
  vehicles: Vehicle[];
}

const TireManagementTab = ({ vehicles }: TireManagementTabProps) => {
  const { tireSets, isLoading, addTireSet, updateTireSet, deleteTireSet, mountTireSet } = useTireSets();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingTireSet, setEditingTireSet] = useState<TireSet | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    tire_type: 'summer' as TireSet['tire_type'],
    brand: '',
    model: '',
    size: '',
    dot_code: '',
    purchase_date: '',
    tread_depth_mm: '',
    storage_location: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({
      tire_type: 'summer',
      brand: '',
      model: '',
      size: '',
      dot_code: '',
      purchase_date: '',
      tread_depth_mm: '',
      storage_location: '',
      notes: '',
    });
    setSelectedVehicleId('');
    setEditingTireSet(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  const handleEdit = (tireSet: TireSet) => {
    setEditingTireSet(tireSet);
    setSelectedVehicleId(tireSet.vehicle_id);
    setForm({
      tire_type: tireSet.tire_type,
      brand: tireSet.brand || '',
      model: tireSet.model || '',
      size: tireSet.size,
      dot_code: tireSet.dot_code || '',
      purchase_date: tireSet.purchase_date || '',
      tread_depth_mm: tireSet.tread_depth_mm?.toString() || '',
      storage_location: tireSet.storage_location || '',
      notes: tireSet.notes || '',
    });
    setAddDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedVehicleId || !form.size) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        vehicle_id: selectedVehicleId,
        tire_type: form.tire_type,
        brand: form.brand || null,
        model: form.model || null,
        size: form.size,
        dot_code: form.dot_code || null,
        purchase_date: form.purchase_date || null,
        tread_depth_mm: form.tread_depth_mm ? parseFloat(form.tread_depth_mm) : null,
        storage_location: form.storage_location || null,
        notes: form.notes || null,
        is_mounted: false,
      };

      if (editingTireSet) {
        await updateTireSet(editingTireSet.id, data);
      } else {
        await addTireSet(data);
      }
      
      setAddDialogOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMount = async (tireSet: TireSet) => {
    await mountTireSet(tireSet.id, tireSet.vehicle_id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Er du sikker på at du vil slette dette dæksæt?')) {
      await deleteTireSet(id);
    }
  };

  const getTireTypeIcon = (type: TireSet['tire_type']) => {
    switch (type) {
      case 'summer':
        return <Sun className="w-4 h-4 text-yellow-500" />;
      case 'winter':
        return <Snowflake className="w-4 h-4 text-blue-500" />;
      case 'all_season':
        return <ThermometerSun className="w-4 h-4 text-green-500" />;
    }
  };

  const getTireTypeBadge = (type: TireSet['tire_type']) => {
    switch (type) {
      case 'summer':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">☀️ Sommer</Badge>;
      case 'winter':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">❄️ Vinter</Badge>;
      case 'all_season':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">🌡️ Helår</Badge>;
    }
  };

  const groupedTireSets = vehicles.reduce((acc, vehicle) => {
    acc[vehicle.id] = tireSets.filter(ts => ts.vehicle_id === vehicle.id);
    return acc;
  }, {} as Record<string, TireSet[]>);

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-2xl border border-border">
        <CircleDot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          Ingen køretøjer
        </h3>
        <p className="text-muted-foreground">
          Tilføj køretøjer for at administrere deres dæk.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Dækstyring</h2>
          <p className="text-sm text-muted-foreground">Administrer sommer- og vinterdæk for dine køretøjer</p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Tilføj dæksæt
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Sun className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tireSets.filter(ts => ts.tire_type === 'summer').length}</p>
                <p className="text-sm text-muted-foreground">Sommerdæk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Snowflake className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tireSets.filter(ts => ts.tire_type === 'winter').length}</p>
                <p className="text-sm text-muted-foreground">Vinterdæk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <ThermometerSun className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tireSets.filter(ts => ts.tire_type === 'all_season').length}</p>
                <p className="text-sm text-muted-foreground">Helårsdæk</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles with Tires */}
      <div className="space-y-4">
        {vehicles.map((vehicle) => {
          const vehicleTires = groupedTireSets[vehicle.id] || [];
          const mountedTire = vehicleTires.find(t => t.is_mounted);

          return (
            <Card key={vehicle.id}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <Car className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{vehicle.make} {vehicle.model}</CardTitle>
                      <CardDescription>{vehicle.registration}</CardDescription>
                    </div>
                  </div>
                  {mountedTire && (
                    <Badge variant="outline" className="gap-1">
                      {getTireTypeIcon(mountedTire.tire_type)}
                      Monteret: {mountedTire.size}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {vehicleTires.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Ingen dæksæt registreret for dette køretøj
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {vehicleTires.map((tireSet) => (
                      <div 
                        key={tireSet.id} 
                        className={`p-4 rounded-xl border ${tireSet.is_mounted ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {getTireTypeBadge(tireSet.tire_type)}
                            <div>
                              <p className="font-medium">
                                {tireSet.brand} {tireSet.model}
                                {tireSet.is_mounted && (
                                  <Badge variant="default" className="ml-2 text-xs">Monteret</Badge>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {tireSet.size}
                                {tireSet.dot_code && ` • DOT: ${tireSet.dot_code}`}
                                {tireSet.tread_depth_mm && ` • ${tireSet.tread_depth_mm}mm`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {tireSet.storage_location && (
                              <Badge variant="outline" className="gap-1">
                                <MapPin className="w-3 h-3" />
                                {tireSet.storage_location}
                              </Badge>
                            )}
                            {!tireSet.is_mounted && (
                              <Button size="sm" variant="outline" onClick={() => handleMount(tireSet)}>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Monter
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(tireSet)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(tireSet.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTireSet ? 'Rediger dæksæt' : 'Tilføj dæksæt'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Køretøj</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
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
              <Label>Dæktype</Label>
              <Select 
                value={form.tire_type} 
                onValueChange={(value: TireSet['tire_type']) => setForm(prev => ({ ...prev, tire_type: value }))}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mærke</Label>
                <Input
                  value={form.brand}
                  onChange={(e) => setForm(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="f.eks. Michelin"
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={form.model}
                  onChange={(e) => setForm(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="f.eks. Pilot Sport 4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Størrelse *</Label>
              <Input
                value={form.size}
                onChange={(e) => setForm(prev => ({ ...prev, size: e.target.value }))}
                placeholder="f.eks. 225/45 R17"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>DOT-kode</Label>
                <Input
                  value={form.dot_code}
                  onChange={(e) => setForm(prev => ({ ...prev, dot_code: e.target.value }))}
                  placeholder="f.eks. 2023"
                />
              </div>
              <div className="space-y-2">
                <Label>Mønsterdybde (mm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.tread_depth_mm}
                  onChange={(e) => setForm(prev => ({ ...prev, tread_depth_mm: e.target.value }))}
                  placeholder="f.eks. 7.5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Opbevaringssted</Label>
              <Input
                value={form.storage_location}
                onChange={(e) => setForm(prev => ({ ...prev, storage_location: e.target.value }))}
                placeholder="f.eks. Dækhotel ABC, Garage"
              />
            </div>

            <div className="space-y-2">
              <Label>Købsdato</Label>
              <Input
                type="date"
                value={form.purchase_date}
                onChange={(e) => setForm(prev => ({ ...prev, purchase_date: e.target.value }))}
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
                disabled={isSubmitting || !selectedVehicleId || !form.size}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Gemmer...
                  </>
                ) : (
                  editingTireSet ? 'Gem ændringer' : 'Tilføj dæksæt'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TireManagementTab;
