import { useState, useEffect } from 'react';
import { Car, Plus, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';

interface AddFleetVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  corporateAccountId: string;
  departments: unknown[];
  onSuccess: () => void;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  registration: string;
  owner_id: string;
}

const AddFleetVehicleDialog = ({
  open,
  onOpenChange,
  corporateAccountId,
  departments,
  onSuccess,
}: AddFleetVehicleDialogProps) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    monthly_rate: '',
    included_km_per_month: '2000',
    extra_km_rate: '2.5',
    department_id: '',
    is_exclusive: false,
  });

  useEffect(() => {
    if (open && searchQuery.length >= 2) {
      searchVehicles();
    }
  }, [searchQuery, open]);

  const searchVehicles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, make, model, year, registration, owner_id')
      .or(`registration.ilike.%${searchQuery}%,make.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%`)
      .eq('is_available', true)
      .limit(10);

    if (error) {
      console.error('Error searching vehicles:', error);
    } else {
      setVehicles(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedVehicle) {
      toast.error('Vælg et køretøj');
      return;
    }

    if (!formData.monthly_rate) {
      toast.error('Angiv månedlig pris');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('corporate_fleet_vehicles').insert({
        corporate_account_id: corporateAccountId,
        vehicle_id: selectedVehicle.id,
        lessor_id: selectedVehicle.owner_id,
        monthly_rate: parseFloat(formData.monthly_rate),
        included_km_per_month: parseInt(formData.included_km_per_month) || 2000,
        extra_km_rate: parseFloat(formData.extra_km_rate) || 2.5,
        assigned_department_id: formData.department_id || null,
        is_exclusive: formData.is_exclusive,
        start_date: new Date().toISOString().split('T')[0],
        status: 'active',
      });

      if (error) throw error;

      toast.success('Køretøj tilføjet til flåden');
      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Error adding fleet vehicle:', error);
      toast.error('Kunne ikke tilføje køretøj');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedVehicle(null);
    setSearchQuery('');
    setVehicles([]);
    setFormData({
      monthly_rate: '',
      included_km_per_month: '2000',
      extra_km_rate: '2.5',
      department_id: '',
      is_exclusive: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Tilføj køretøj til flåden
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Vehicle Search */}
          {!selectedVehicle ? (
            <>
              <div>
                <Label>Søg efter køretøj</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Søg på reg.nr, mærke eller model..."
                    className="pl-9"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : vehicles.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {vehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      onClick={() => setSelectedVehicle(vehicle)}
                      className="w-full p-3 rounded-lg border hover:bg-muted transition-colors text-left flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Car className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.registration} • {vehicle.year}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <p className="text-center text-muted-foreground py-8">
                  Ingen køretøjer fundet
                </p>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Indtast mindst 2 tegn for at søge
                </p>
              )}
            </>
          ) : (
            <>
              {/* Selected Vehicle */}
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Car className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{selectedVehicle.make} {selectedVehicle.model}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedVehicle.registration} • {selectedVehicle.year}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedVehicle(null)}>
                    Skift
                  </Button>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Månedlig pris (DKK) *</Label>
                  <Input
                    type="number"
                    value={formData.monthly_rate}
                    onChange={(e) => setFormData({ ...formData, monthly_rate: e.target.value })}
                    placeholder="5000"
                  />
                </div>
                <div>
                  <Label>Inkl. km/måned</Label>
                  <Input
                    type="number"
                    value={formData.included_km_per_month}
                    onChange={(e) => setFormData({ ...formData, included_km_per_month: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Ekstra km pris (DKK)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.extra_km_rate}
                  onChange={(e) => setFormData({ ...formData, extra_km_rate: e.target.value })}
                />
              </div>

              {/* Department */}
              {departments.length > 0 && (
                <div>
                  <Label>Tilknyt afdeling (valgfrit)</Label>
                  <Select 
                    value={formData.department_id} 
                    onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vælg afdeling" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Submit */}
              <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Tilføjer...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Tilføj til flåden
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddFleetVehicleDialog;
