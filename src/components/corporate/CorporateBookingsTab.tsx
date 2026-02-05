import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Calendar, Search, MapPin, Car, User, Clock, Plus } from 'lucide-react';
import { CorporateBooking, CorporateEmployee, CorporateFleetVehicle } from '@/hooks/useCorporateFleet';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface CorporateBookingsTabProps {
  bookings: CorporateBooking[];
  employees: CorporateEmployee[];
  vehicles: CorporateFleetVehicle[];
  corporateAccountId?: string;
  currentEmployeeId?: string;
  currentDepartmentId?: string | null;
  onRefresh?: () => void;
}

const CorporateBookingsTab = ({ 
  bookings, 
  employees, 
  vehicles,
  corporateAccountId,
  currentEmployeeId,
  currentDepartmentId,
  onRefresh 
}: CorporateBookingsTabProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp?.full_name || 'Ukendt';
  };

  const filteredBookings = bookings.filter(booking => {
    const employeeName = getEmployeeName(booking.corporate_employee_id);
    return (
      employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.destination?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bookinger</h2>
          <p className="text-muted-foreground">
            {bookings.length} bookinger i alt
          </p>
        </div>
        {corporateAccountId && currentEmployeeId && vehicles.length > 0 && (
          <Button onClick={() => navigate(`/corporate/booking?corporateAccountId=${corporateAccountId}&employeeId=${currentEmployeeId}&departmentId=${currentDepartmentId || ''}&fleetVehicles=${encodeURIComponent(JSON.stringify(vehicles))}`)}>
            <Plus className="w-4 h-4 mr-2" />
            Ny booking
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Søg efter medarbejder, formål eller destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Ingen bookinger</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Ingen bookinger matcher din søgning' : 'Der er endnu ingen bookinger'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dato</TableHead>
                    <TableHead>Medarbejder</TableHead>
                    <TableHead>Formål</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Km kørt</TableHead>
                    <TableHead className="text-right">Omkostning</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {format(new Date(booking.created_at), 'dd. MMM yyyy', { locale: da })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{getEmployeeName(booking.corporate_employee_id)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.purpose || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {booking.destination ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            {booking.destination}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {booking.km_driven ? (
                          `${booking.km_driven.toLocaleString('da-DK')} km`
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {booking.cost_allocated ? (
                          `${booking.cost_allocated.toLocaleString('da-DK')} kr`
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CorporateBookingsTab;
