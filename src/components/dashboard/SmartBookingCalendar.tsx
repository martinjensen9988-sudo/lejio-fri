import { useState, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Car,
  Calendar,
  List,
  Grid3x3,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  DollarSign,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
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
  parseISO,
  addDays,
  startOfWeek as startOfTheWeek,
  endOfWeek as endOfTheWeek,
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
  total_price?: number;
  renter_email?: string | null;
  renter_phone?: string | null;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  registration: string;
}

interface SmartBookingCalendarProps {
  bookings: Booking[];
  vehicles: Vehicle[];
  onReschedule?: (bookingId: string, newStartDate: Date, newEndDate: Date) => Promise<void>;
  onEdit?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => Promise<void>;
}

type ViewType = 'month' | 'week' | 'list';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-400',
  confirmed: 'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-400',
  active: 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-400',
  completed: 'bg-gray-500/20 border-gray-500 text-gray-700 dark:text-gray-400',
  cancelled: 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-400',
};

const statusBgColors: Record<string, string> = {
  pending: 'bg-yellow-100 dark:bg-yellow-900/30',
  confirmed: 'bg-blue-100 dark:bg-blue-900/30',
  active: 'bg-green-100 dark:bg-green-900/30',
  completed: 'bg-gray-100 dark:bg-gray-900/30',
  cancelled: 'bg-red-100 dark:bg-red-900/30',
};

const statusLabels: Record<string, string> = {
  pending: 'Afventer',
  confirmed: 'Bekræftet',
  active: 'Aktiv',
  completed: 'Afsluttet',
  cancelled: 'Annulleret',
};

const SmartBookingCalendar = ({
  bookings,
  vehicles,
  onReschedule,
  onEdit,
  onCancel
}: SmartBookingCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedVehicle, setSelectedVehicle] = useState<string | 'all'>('all');
  const [viewType, setViewType] = useState<ViewType>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [draggedBooking, setDraggedBooking] = useState<Booking | null>(null);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (selectedVehicle !== 'all' && b.vehicle_id !== selectedVehicle) return false;
      if (b.status === 'cancelled') return false;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const renterName = b.renter_first_name && b.renter_last_name
          ? `${b.renter_first_name} ${b.renter_last_name}`.toLowerCase()
          : (b.renter_name || '').toLowerCase();
        return renterName.includes(searchLower) ||
               (b.renter_email?.toLowerCase().includes(searchLower)) ||
               vehicles.find(v => v.id === b.vehicle_id)?.registration.toLowerCase().includes(searchLower);
      }
      return true;
    });
  }, [bookings, selectedVehicle, searchTerm, vehicles]);

  // Calendar calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Week calculations
  const weekStart = startOfTheWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfTheWeek(currentDate, { weekStartsOn: 1 });
  
  // Generate week days array
  const weekDaysArray: Date[] = [];
  for (let i = 0; i < 7; i++) {
    weekDaysArray.push(addDays(weekStart, i));
  }

  const weekDayLabels = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

  const getBookingsForDay = (day: Date) => {
    return filteredBookings.filter(booking => {
      const start = parseISO(booking.start_date);
      const end = parseISO(booking.end_date);
      return isWithinInterval(day, { start, end }) || isSameDay(day, start) || isSameDay(day, end);
    });
  };

  const getBookingsForRange = (startDate: Date, endDate: Date) => {
    return filteredBookings.filter(booking => {
      const bookingStart = parseISO(booking.start_date);
      const bookingEnd = parseISO(booking.end_date);
      return isWithinInterval(bookingStart, { start: startDate, end: endDate }) ||
             isWithinInterval(bookingEnd, { start: startDate, end: endDate }) ||
             (bookingStart <= startDate && bookingEnd >= endDate);
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

  const handleDragStart = (e: React.DragEvent, booking: Booking) => {
    setDraggedBooking(booking);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = useCallback(async (e: React.DragEvent, newDate: Date) => {
    e.preventDefault();
    if (!draggedBooking || !onReschedule) return;

    const start = parseISO(draggedBooking.start_date);
    const end = parseISO(draggedBooking.end_date);
    const duration = end.getTime() - start.getTime();
    const newEnd = new Date(newDate.getTime() + duration);

    try {
      await onReschedule(draggedBooking.id, newDate, newEnd);
      toast.success('Booking rykket');
    } catch (error) {
      toast.error('Kunne ikke flytte booking');
    } finally {
      setDraggedBooking(null);
    }
  }, [draggedBooking, onReschedule]);

  // Navigation
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToPreviousWeek = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextWeek = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const weekDayLabelsShort = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

  // Month view
  const renderMonthView = () => (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekDayLabelsShort.map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthDays.map(day => {
          const dayBookings = getBookingsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
              className={`min-h-[120px] p-2 rounded-lg border-2 transition-all ${
                isCurrentMonth
                  ? 'bg-card border-border hover:border-primary/50'
                  : 'bg-muted/30 border-transparent'
              } ${isToday ? 'ring-2 ring-primary' : ''}`}
            >
              <div className={`text-sm font-semibold mb-2 ${
                isToday ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {format(day, 'd')}
              </div>

              <div className="space-y-1">
                {dayBookings.slice(0, 2).map(booking => {
                  const vehicle = getVehicleInfo(booking.vehicle_id);
                  return (
                    <div
                      key={booking.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, booking)}
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowBookingDetails(true);
                      }}
                      className={`text-xs px-2 py-1 rounded border cursor-move hover:shadow-md transition-all ${
                        statusColors[booking.status] || 'bg-gray-500'
                      }`}
                      title={`${vehicle?.make} ${vehicle?.model}`}
                    >
                      <GripVertical className="w-3 h-3 inline mr-1 opacity-50" />
                      {vehicle?.registration}
                    </div>
                  );
                })}
                {dayBookings.length > 2 && (
                  <div className="text-[10px] text-muted-foreground text-center">
                    +{dayBookings.length - 2}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Week view
  const renderWeekView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2">
        {weekDayLabelsShort.map((dayName, idx) => {
          const day = weekDaysArray[idx];
          const dayBookings = getBookingsForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
              className={`rounded-lg border-2 p-3 min-h-[300px] ${
                isToday
                  ? 'bg-primary/5 border-primary ring-2 ring-primary'
                  : 'bg-card border-border hover:border-primary/50'
              }`}
            >
              <div className="font-semibold text-sm mb-3">
                <div className={isToday ? 'text-primary' : 'text-foreground'}>
                  {format(day, 'EEE', { locale: da })}
                </div>
                <div className={`text-xs ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                  {format(day, 'd. MMM', { locale: da })}
                </div>
              </div>

              <div className="space-y-2">
                {dayBookings.map(booking => {
                  const vehicle = getVehicleInfo(booking.vehicle_id);
                  const renterName = getRenterName(booking);

                  return (
                    <div
                      key={booking.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, booking)}
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowBookingDetails(true);
                      }}
                      className={`p-2 rounded border-l-4 cursor-move hover:shadow-lg transition-all ${
                        statusBgColors[booking.status]
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-1">
                        <GripVertical className="w-3 h-3 mt-1 opacity-50 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs truncate">
                            {vehicle?.registration}
                          </div>
                          <Badge variant="outline" className="text-[10px] mt-1">
                            {statusLabels[booking.status]}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground ml-5">
                        {renterName}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // List view
  const renderListView = () => (
    <div className="space-y-3">
      {filteredBookings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Car className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Ingen bookinger</p>
        </div>
      ) : (
        filteredBookings
          .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
          .map(booking => {
            const vehicle = getVehicleInfo(booking.vehicle_id);
            const renterName = getRenterName(booking);
            const start = parseISO(booking.start_date);
            const end = parseISO(booking.end_date);

            return (
              <Card
                key={booking.id}
                className={`p-4 cursor-pointer hover:shadow-lg transition-all border-l-4 ${
                  statusBgColors[booking.status]
                }`}
                onClick={() => {
                  setSelectedBooking(booking);
                  setShowBookingDetails(true);
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-semibold">
                        {vehicle?.make} {vehicle?.model}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {statusLabels[booking.status]}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="truncate">{renterName}</span>
                      </div>
                      {booking.renter_phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span className="truncate">{booking.renter_phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(start, 'd. MMM', { locale: da })}
                      </div>
                      <span className="text-muted-foreground">→</span>
                      <div>
                        {format(end, 'd. MMM', { locale: da })}
                      </div>
                      {booking.total_price && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <div className="flex items-center gap-1 font-semibold text-primary">
                            <DollarSign className="w-4 h-4" />
                            {booking.total_price.toLocaleString('da-DK')} kr
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm">
                        ⋮
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit?.(booking.id)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Rediger
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onCancel?.(booking.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Annuller
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            );
          })
      )}
    </div>
  );

  // Booking details modal
  const renderBookingDetails = () => {
    if (!selectedBooking) return null;

    const vehicle = getVehicleInfo(selectedBooking.vehicle_id);
    const renterName = getRenterName(selectedBooking);
    const start = parseISO(selectedBooking.start_date);
    const end = parseISO(selectedBooking.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    return (
      <Dialog open={showBookingDetails} onOpenChange={setShowBookingDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking detaljer</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Vehicle info */}
            <div className="space-y-2">
              <div className="font-semibold text-sm text-muted-foreground">KØRETØj</div>
              <div className={`p-3 rounded-lg ${statusBgColors[selectedBooking.status]}`}>
                <div className="font-semibold">{vehicle?.make} {vehicle?.model}</div>
                <div className="text-sm text-muted-foreground">{vehicle?.registration}</div>
              </div>
            </div>

            {/* Renter info */}
            <div className="space-y-2">
              <div className="font-semibold text-sm text-muted-foreground">LEJER</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{renterName}</span>
                </div>
                {selectedBooking.renter_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${selectedBooking.renter_phone}`} className="text-primary hover:underline">
                      {selectedBooking.renter_phone}
                    </a>
                  </div>
                )}
                {selectedBooking.renter_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${selectedBooking.renter_email}`} className="text-primary hover:underline">
                      {selectedBooking.renter_email}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Period and pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="font-semibold text-sm text-muted-foreground">START</div>
                <div>
                  <div className="font-medium">{format(start, 'd. MMM yyyy', { locale: da })}</div>
                  <div className="text-sm text-muted-foreground">{format(start, 'HH:mm', { locale: da })}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-semibold text-sm text-muted-foreground">SLUT</div>
                <div>
                  <div className="font-medium">{format(end, 'd. MMM yyyy', { locale: da })}</div>
                  <div className="text-sm text-muted-foreground">{format(end, 'HH:mm', { locale: da })}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="font-semibold text-sm text-muted-foreground">VARIGHED</div>
                <div className="font-medium">{days} dage</div>
              </div>
              {selectedBooking.total_price && (
                <div className="space-y-2">
                  <div className="font-semibold text-sm text-muted-foreground">PRIS</div>
                  <div className="font-bold text-lg text-primary">
                    {selectedBooking.total_price.toLocaleString('da-DK')} kr
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <div className="font-semibold text-sm text-muted-foreground">STATUS</div>
              <Badge className="w-fit">
                {statusLabels[selectedBooking.status]}
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => {
                  onEdit?.(selectedBooking.id);
                  setShowBookingDetails(false);
                }}
                variant="outline"
                className="flex-1"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Rediger
              </Button>
              <Button
                onClick={() => {
                  onCancel?.(selectedBooking.id);
                  setShowBookingDetails(false);
                }}
                variant="destructive"
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Annuller
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Statistics
  const stats = {
    pending: filteredBookings.filter(b => b.status === 'pending').length,
    confirmed: filteredBookings.filter(b => b.status === 'confirmed').length,
    active: filteredBookings.filter(b => b.status === 'active').length,
    completed: filteredBookings.filter(b => b.status === 'completed').length,
    revenue: filteredBookings.reduce((sum, b) => sum + (b.total_price || 0), 0),
  };

  return (
    <div className="space-y-4">
      {/* Header and controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <CardTitle className="text-xl">Smart Booking-kalender</CardTitle>

            <div className="flex items-center gap-2">
              {/* View type selector */}
              <div className="flex gap-1 bg-muted p-1 rounded-lg">
                <Button
                  size="sm"
                  variant={viewType === 'month' ? 'default' : 'ghost'}
                  onClick={() => setViewType('month')}
                  title="Måned"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewType === 'week' ? 'default' : 'ghost'}
                  onClick={() => setViewType('week')}
                  title="Uge"
                >
                  <Calendar className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewType === 'list' ? 'default' : 'ghost'}
                  onClick={() => setViewType('list')}
                  title="Liste"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Search and filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Input
                placeholder="Søg efter lejer, email eller reg..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            </div>

            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Alle biler</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} {vehicle.model} ({vehicle.registration})
                </option>
              ))}
            </select>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={viewType === 'month' ? goToPreviousMonth : goToPreviousWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={viewType === 'month' ? goToNextMonth : goToNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs">
                I dag
              </Button>
            </div>
            <h2 className="text-lg font-semibold capitalize">
              {viewType === 'month'
                ? format(currentDate, 'MMMM yyyy', { locale: da })
                : viewType === 'week'
                ? `Uge ${format(weekStart, 'w', { locale: da })} - ${format(weekStart, 'd. MMM', { locale: da })} til ${format(addDays(weekStart, 6), 'd. MMM', { locale: da })}`
                : 'Alle bookinger'
              }
            </h2>
          </div>
        </CardHeader>

        {/* Statistics */}
        <CardContent className="pb-6 pt-0">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pending}</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500">Afventer</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.confirmed}</p>
              <p className="text-xs text-blue-600 dark:text-blue-500">Bekræftet</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.active}</p>
              <p className="text-xs text-green-600 dark:text-green-500">Aktive</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-900/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-400">{stats.completed}</p>
              <p className="text-xs text-gray-600 dark:text-gray-500">Afsluttet</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-primary">{(stats.revenue / 1000).toFixed(0)}k</p>
              <p className="text-xs text-primary/70">Indtægt</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main calendar content */}
      <Card>
        <CardContent className="pt-6">
          {viewType === 'month' && renderMonthView()}
          {viewType === 'week' && renderWeekView()}
          {viewType === 'list' && renderListView()}

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-border">
            {Object.entries(statusLabels).filter(([key]) => key !== 'cancelled').map(([status, label]) => (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  status === 'pending' ? 'bg-yellow-500' :
                  status === 'confirmed' ? 'bg-blue-500' :
                  status === 'active' ? 'bg-green-500' :
                  'bg-gray-500'
                }`} />
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 ml-auto">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Træk for at flytte</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking details modal */}
      {renderBookingDetails()}
    </div>
  );
};

export default SmartBookingCalendar;
