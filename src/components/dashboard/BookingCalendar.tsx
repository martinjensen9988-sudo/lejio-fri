import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  parseISO
} from 'date-fns';
import { da } from 'date-fns/locale';

interface Booking {
  id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  status: string;
  renter_name?: string | null;
  renter_first_name?: string | null;
  renter_last_name?: string | null;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  registration: string;
}

interface BookingCalendarProps {
  bookings: Booking[];
  vehicles: Vehicle[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  active: 'bg-green-500',
  completed: 'bg-gray-400',
  cancelled: 'bg-red-400',
};

const statusLabels: Record<string, string> = {
  pending: 'Afventer',
  confirmed: 'Bekræftet',
  active: 'Aktiv',
  completed: 'Afsluttet',
  cancelled: 'Annulleret',
};

const BookingCalendar = ({ bookings, vehicles }: BookingCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedVehicle, setSelectedVehicle] = useState<string | 'all'>('all');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (selectedVehicle !== 'all' && b.vehicle_id !== selectedVehicle) return false;
      if (b.status === 'cancelled') return false;
      return true;
    });
  }, [bookings, selectedVehicle]);

  const getBookingsForDay = (day: Date) => {
    return filteredBookings.filter(booking => {
      const start = parseISO(booking.start_date);
      const end = parseISO(booking.end_date);
      return isWithinInterval(day, { start, end }) || isSameDay(day, start) || isSameDay(day, end);
    });
  };

  const getVehicleInfo = (vehicleId: string) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  const getRenterName = (booking: Booking) => {
    if (booking.renter_first_name && booking.renter_last_name) {
      return `${booking.renter_first_name} ${booking.renter_last_name}`;
    }
    return booking.renter_name || 'Ukendt lejer';
  };

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const weekDays = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-xl">Booking kalender</CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Vehicle filter */}
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Alle biler</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} {vehicle.model} ({vehicle.registration})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToToday}>
              I dag
            </Button>
          </div>
          <h2 className="text-lg font-semibold capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: da })}
          </h2>
        </div>
      </CardHeader>

      <CardContent>
        {/* Week day headers */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const dayBookings = getBookingsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] p-1.5 rounded-lg border transition-colors ${
                  isCurrentMonth 
                    ? 'bg-card border-border' 
                    : 'bg-muted/30 border-transparent'
                } ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                } ${isToday ? 'text-primary' : ''}`}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {dayBookings.slice(0, 3).map(booking => {
                    const vehicle = getVehicleInfo(booking.vehicle_id);
                    return (
                      <div
                        key={booking.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate text-white ${statusColors[booking.status] || 'bg-gray-500'}`}
                        title={`${vehicle?.make} ${vehicle?.model} - ${getRenterName(booking)} (${statusLabels[booking.status]})`}
                      >
                        {vehicle ? `${vehicle.registration}` : 'Bil'}
                      </div>
                    );
                  })}
                  {dayBookings.length > 3 && (
                    <div className="text-[10px] text-muted-foreground text-center">
                      +{dayBookings.length - 3} mere
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-border">
          {Object.entries(statusLabels).filter(([key]) => key !== 'cancelled').map(([status, label]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${statusColors[status]}`} />
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Summary */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Car className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Ingen bookinger i denne måned</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                {filteredBookings.filter(b => b.status === 'pending').length}
              </p>
              <p className="text-xs text-muted-foreground">Afventer</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                {filteredBookings.filter(b => b.status === 'confirmed').length}
              </p>
              <p className="text-xs text-muted-foreground">Bekræftet</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                {filteredBookings.filter(b => b.status === 'active').length}
              </p>
              <p className="text-xs text-muted-foreground">Aktive</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                {filteredBookings.filter(b => b.status === 'completed').length}
              </p>
              <p className="text-xs text-muted-foreground">Afsluttet</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingCalendar;
