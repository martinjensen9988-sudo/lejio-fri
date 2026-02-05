import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Car, Search, Loader2, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  registration: string;
  owner_id: string;
}

const AddFleetVehiclePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const corporateAccountId = searchParams.get('corporateAccountId') || '';

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [departments, setDepartments] = useState<unknown[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    monthly_rate: '',
    included_km_per_month: '2000',
    extra_km_rate: '2.5',
    department_id: '',
    start_date: new Date().toISOString().split('T')[0],
    is_exclusive: true,
  });

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!corporateAccountId) return;
      
      const { data } = await supabase
        .from('corporate_departments')
        .select('*')
        .eq('corporate_account_id', corporateAccountId);
      
      if (data) setDepartments(data);
    };
    
    fetchDepartments();
  }, [corporateAccountId]);

  // Search vehicles
  useEffect(() => {
    const searchVehicles = async () => {
      if (searchQuery.length < 2) {
        setVehicles([]);
        return;
      }
      
      setLoading(true);
      const { data } = await supabase
        .from('vehicles')
        .select('id, make, model, year, registration, owner_id')
        .or(`registration.ilike.%${searchQuery}%,make.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%`)
        .limit(10);
      
      setVehicles(data || []);
      setLoading(false);
    };

    const debounce = setTimeout(searchVehicles, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVehicle || !formData.monthly_rate) {
      toast.error('Vælg køretøj og angiv månedlig rate');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from('corporate_fleet_vehicles')
      .insert({
        corporate_account_id: corporateAccountId,
        vehicle_id: selectedVehicle.id,
        lessor_id: selectedVehicle.owner_id,
        monthly_rate: parseFloat(formData.monthly_rate),
        included_km_per_month: parseInt(formData.included_km_per_month),
        extra_km_rate: parseFloat(formData.extra_km_rate),
        assigned_department_id: formData.department_id || null,
        start_date: formData.start_date,
        is_exclusive: formData.is_exclusive,
        status: 'active',
      });

    if (error) {
      console.error('Error adding fleet vehicle:', error);
      toast.error('Kunne ikke tilføje køretøj');
    } else {
      toast.success('Køretøj tilføjet til flåden!');
      navigate('/corporate');
    }

    setSubmitting(false);
  };

  if (!corporateAccountId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Manglende firma-ID</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/corporate')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tilbage til firmakonto
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Tilføj køretøj til flåde</CardTitle>
                <CardDescription>
                  Søg efter og tilføj et køretøj til firmaflåden
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Vehicle Search */}
              <div className="space-y-2">
                <Label>Søg efter køretøj</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Søg på nummerplade, mærke eller model..."
                    className="pl-10"
                  />
                </div>
                
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Søger...
                  </div>
                )}
                
                {vehicles.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                    {vehicles.map((vehicle) => (
                      <button
                        key={vehicle.id}
                        type="button"
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          setSearchQuery('');
                          setVehicles([]);
                        }}
                        className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                      >
                        <div className="font-medium">
                          {vehicle.make} {vehicle.model} ({vehicle.year})
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {vehicle.registration}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Vehicle */}
              {selectedVehicle && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-3">
                    <Car className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">
                        {selectedVehicle.make} {selectedVehicle.model}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedVehicle.registration} • {selectedVehicle.year}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Månedlig rate (kr) *</Label>
                  <Input
                    type="number"
                    value={formData.monthly_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthly_rate: e.target.value }))}
                    placeholder="8.000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Inkl. km/måned</Label>
                  <Input
                    type="number"
                    value={formData.included_km_per_month}
                    onChange={(e) => setFormData(prev => ({ ...prev, included_km_per_month: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ekstra km rate (kr)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.extra_km_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, extra_km_rate: e.target.value }))}
                />
              </div>

              {/* Department */}
              {departments.length > 0 && (
                <div className="space-y-2">
                  <Label>Afdeling (valgfrit)</Label>
                  <Select
                    value={formData.department_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, department_id: value }))}
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

              {/* Start Date */}
              <div className="space-y-2">
                <Label>Startdato</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/corporate')}>
                  Annuller
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={submitting || !selectedVehicle}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Tilføj til flåde
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddFleetVehiclePage;
