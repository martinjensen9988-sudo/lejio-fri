import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, MapPin, Gauge, Fuel, Calendar, Plus } from 'lucide-react';
import { CorporateFleetVehicle, CorporateDepartment } from '@/hooks/useCorporateFleet';

interface CorporateFleetTabProps {
  vehicles: CorporateFleetVehicle[];
  departments: CorporateDepartment[];
  isAdmin: boolean;
  corporateAccountId?: string;
  onRefresh?: () => void;
}

const CorporateFleetTab = ({ 
  vehicles, 
  departments, 
  isAdmin, 
  corporateAccountId,
  onRefresh 
}: CorporateFleetTabProps) => {
  const navigate = useNavigate();

  const getDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return 'Ikke tildelt';
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || 'Ukendt';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Virksomhedens flåde</h2>
          <p className="text-muted-foreground">
            {vehicles.length} køretøjer tilgængelige for booking
          </p>
        </div>
        {isAdmin && corporateAccountId && (
          <Button onClick={() => navigate(`/corporate/add-vehicle?corporateAccountId=${corporateAccountId}`)}>
            <Plus className="w-4 h-4 mr-2" />
            Tilføj køretøj
          </Button>
        )}
      </div>

      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Car className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Ingen køretøjer endnu</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Der er endnu ikke tilknyttet nogen køretøjer til virksomhedens flåde.
              {isAdmin && ' Klik på "Tilføj køretøj" for at tilføje et.'}
            </p>
            {isAdmin && corporateAccountId && (
              <Button className="mt-4" onClick={() => navigate(`/corporate/add-vehicle?corporateAccountId=${corporateAccountId}`)}>
                <Plus className="w-4 h-4 mr-2" />
                Tilføj første køretøj
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <Car className="w-16 h-16 text-primary/40" />
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">Køretøj</h3>
                    <p className="text-sm text-muted-foreground">ID: {vehicle.id.slice(0, 8)}</p>
                  </div>
                  <Badge variant={vehicle.status === 'active' ? 'default' : 'secondary'}>
                    {vehicle.status === 'active' ? 'Tilgængelig' : 'Ikke tilgængelig'}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{getDepartmentName(vehicle.assigned_department_id)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Gauge className="w-4 h-4" />
                    <span>{vehicle.included_km_per_month} km/md inkluderet</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Fra {new Date(vehicle.start_date).toLocaleDateString('da-DK')}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Månedlig rate</p>
                    <p className="font-bold">{vehicle.monthly_rate.toLocaleString('da-DK')} kr</p>
                  </div>
                  <Button size="sm">
                    Book nu
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CorporateFleetTab;
