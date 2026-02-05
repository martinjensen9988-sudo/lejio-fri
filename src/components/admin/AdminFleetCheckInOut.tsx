import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Search, 
  Car, 
  LogIn, 
  LogOut, 
  CheckCircle, 
  Clock,
  MapPin,
  User,
  Calendar,
  Mail
} from 'lucide-react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { CheckInOutWizard } from '@/components/checkinout/CheckInOutWizard';

interface FleetBooking {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  renter_name: string | null;
  renter_email: string | null;
  renter_phone: string | null;
  lessor_id: string;
  renter_id: string | null;
  vehicle_id: string;
  vehicle: {
    id: string;
    registration: string;
    make: string;
    model: string;
    included_km: number | null;
    extra_km_price: number | null;
    latitude: number | null;
    longitude: number | null;
    exterior_cleaning_fee: number | null;
    interior_cleaning_fee: number | null;
  } | null;
  check_in_record?: {
    confirmed_odometer: number;
    confirmed_fuel_percent: number;
    created_at: string;
  } | null;
  check_out_record?: {
    confirmed_odometer: number;
    confirmed_fuel_percent: number;
    total_extra_charges: number | null;
    created_at: string;
  } | null;
  pickup_location?: {
    name: string;
    address: string;
    city: string;
  } | null;
}

export const AdminFleetCheckInOut = () => {
  const [bookings, setBookings] = useState<FleetBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedBooking, setSelectedBooking] = useState<FleetBooking | null>(null);
  const [wizardMode, setWizardMode] = useState<'check_in' | 'check_out'>('check_in');
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      // Get today's date range
      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfWeek = new Date(today.setDate(today.getDate() + 7)).toISOString();

      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          end_date,
          status,
          renter_name,
          renter_email,
          renter_phone,
          lessor_id,
          renter_id,
          vehicle_id,
          vehicle:vehicles(
            id,
            registration,
            make,
            model,
            included_km,
            extra_km_price,
            latitude,
            longitude,
            exterior_cleaning_fee,
            interior_cleaning_fee
          ),
          pickup_location:dealer_locations!bookings_pickup_location_id_fkey(
            name,
            address,
            city
          )
        `)
        .in('status', ['confirmed', 'active'])
        .order('start_date', { ascending: true });

      if (error) throw error;

      // Fetch check-in/out records for these bookings
      const bookingIds = bookingsData?.map(b => b.id) || [];
      
      interface CheckRecord {
        booking_id: string;
        confirmed_odometer: number | null;
        confirmed_fuel_percent: number | null;
        created_at: string;
      }
      const checkInRecords: Record<string, CheckRecord> = {};
      const checkOutRecords: Record<string, CheckRecord> = {};

      if (bookingIds.length > 0) {
        const { data: checkIns } = await supabase
          .from('check_in_out_records')
          .select('booking_id, confirmed_odometer, confirmed_fuel_percent, created_at')
          .in('booking_id', bookingIds)
          .eq('record_type', 'check_in');

        const { data: checkOuts } = await supabase
          .from('check_in_out_records')
          .select('booking_id, confirmed_odometer, confirmed_fuel_percent, total_extra_charges, created_at')
          .in('booking_id', bookingIds)
          .eq('record_type', 'check_out');

        checkIns?.forEach(r => {
          checkInRecords[r.booking_id] = r;
        });

        checkOuts?.forEach(r => {
          checkOutRecords[r.booking_id] = r;
        });
      }

      const enrichedBookings: FleetBooking[] = (bookingsData || []).map(b => ({
        ...b,
        vehicle: Array.isArray(b.vehicle) ? b.vehicle[0] : b.vehicle,
        pickup_location: Array.isArray(b.pickup_location) ? b.pickup_location[0] : b.pickup_location,
        check_in_record: checkInRecords[b.id] || null,
        check_out_record: checkOutRecords[b.id] || null,
      }));

      setBookings(enrichedBookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      toast.error('Kunne ikke hente bookinger');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = (booking: FleetBooking) => {
    setSelectedBooking(booking);
    setWizardMode('check_in');
    setWizardOpen(true);
  };

  const handleCheckOut = (booking: FleetBooking) => {
    setSelectedBooking(booking);
    setWizardMode('check_out');
    setWizardOpen(true);
  };

  const handleWizardComplete = () => {
    fetchBookings();
    setWizardOpen(false);
    setSelectedBooking(null);
    toast.success(wizardMode === 'check_in' ? 'Udlevering registreret' : 'Indlevering registreret');
  };

  const filteredBookings = bookings.filter(booking => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      booking.vehicle?.registration?.toLowerCase().includes(query) ||
      booking.vehicle?.make?.toLowerCase().includes(query) ||
      booking.vehicle?.model?.toLowerCase().includes(query) ||
      booking.renter_name?.toLowerCase().includes(query) ||
      booking.renter_email?.toLowerCase().includes(query);

    if (activeTab === 'pending') {
      // Awaiting check-in (no check-in record yet)
      return matchesSearch && !booking.check_in_record;
    } else if (activeTab === 'active') {
      // Checked in but not checked out
      return matchesSearch && booking.check_in_record && !booking.check_out_record;
    } else if (activeTab === 'completed') {
      // Both check-in and check-out completed
      return matchesSearch && booking.check_in_record && booking.check_out_record;
    }
    return matchesSearch;
  });

  const getStatusBadge = (booking: FleetBooking) => {
    if (booking.check_out_record) {
      return <Badge className="bg-mint/20 text-mint-foreground border-mint">Afsluttet</Badge>;
    }
    if (booking.check_in_record) {
      return <Badge className="bg-primary/20 text-primary border-primary/30">Aktiv</Badge>;
    }
    return <Badge variant="secondary">Afventer udlevering</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Fleet Check-in/Check-out
          </CardTitle>
          <CardDescription>
            Administrer udlevering og indlevering af fleet-køretøjer. Brug AI-assisteret dashboard-analyse til automatisk at registrere kilometerstand og brændstofniveau.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søg efter nummerplade, lejer eller køretøj..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Afventer udlevering
                <Badge variant="secondary" className="ml-1">
                  {bookings.filter(b => !b.check_in_record).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Aktive
                <Badge variant="secondary" className="ml-1">
                  {bookings.filter(b => b.check_in_record && !b.check_out_record).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Afsluttede
                <Badge variant="secondary" className="ml-1">
                  {bookings.filter(b => b.check_in_record && b.check_out_record).length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Car className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Ingen bookinger fundet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Køretøj</TableHead>
                      <TableHead>Lejer</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Lokation</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Handlinger</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <Car className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {booking.vehicle?.make} {booking.vehicle?.model}
                              </div>
                              <div className="text-sm text-muted-foreground font-mono">
                                {booking.vehicle?.registration}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{booking.renter_name || 'Ikke angivet'}</div>
                              <div className="text-sm text-muted-foreground">{booking.renter_phone}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm">
                              <div>{format(new Date(booking.start_date), 'd. MMM', { locale: da })}</div>
                              <div className="text-muted-foreground">
                                → {format(new Date(booking.end_date), 'd. MMM', { locale: da })}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {booking.pickup_location ? (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <div className="text-sm">
                                <div>{booking.pickup_location.name}</div>
                                <div className="text-muted-foreground">{booking.pickup_location.city}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(booking)}
                          {booking.check_in_record && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Udleveret: {format(new Date(booking.check_in_record.created_at), 'd. MMM HH:mm', { locale: da })}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!booking.check_in_record && (
                              <Button
                                size="sm"
                                onClick={() => handleCheckIn(booking)}
                              >
                                <LogIn className="h-4 w-4 mr-1" />
                                Udlever
                              </Button>
                            )}
                            {booking.check_in_record && !booking.check_out_record && (
                              <>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleCheckOut(booking)}
                                >
                                  <LogOut className="h-4 w-4 mr-1" />
                                  Indlever
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    toast(
                                      <div>
                                        <div className="font-medium mb-1">Kontakt lejer</div>
                                        <div className="mb-1">Email: <a href={`mailto:${booking.renter_email}`}>{booking.renter_email}</a></div>
                                        <div>Telefon: <a href={`tel:${booking.renter_phone}`}>{booking.renter_phone}</a></div>
                                      </div>,
                                      { duration: 10000 }
                                    );
                                  }}
                                >
                                  <Mail className="h-4 w-4 mr-1" />
                                  Kontakt lejer
                                </Button>
                              </>
                            )}
                            {booking.check_out_record && (
                              <Badge variant="outline" className="font-mono">
                                +{booking.check_out_record.total_extra_charges?.toLocaleString('da-DK') || 0} kr
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Check-in/out Wizard */}
      {selectedBooking && selectedBooking.vehicle && (
        <CheckInOutWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          mode={wizardMode}
          booking={{
            id: selectedBooking.id,
            vehicle_id: selectedBooking.vehicle_id,
            lessor_id: selectedBooking.lessor_id,
            renter_id: selectedBooking.renter_id || undefined,
            vehicle: {
              registration: selectedBooking.vehicle.registration,
              make: selectedBooking.vehicle.make,
              model: selectedBooking.vehicle.model,
              included_km: selectedBooking.vehicle.included_km || undefined,
              extra_km_price: selectedBooking.vehicle.extra_km_price || undefined,
              latitude: selectedBooking.vehicle.latitude || undefined,
              longitude: selectedBooking.vehicle.longitude || undefined,
              exterior_cleaning_fee: selectedBooking.vehicle.exterior_cleaning_fee || undefined,
              interior_cleaning_fee: selectedBooking.vehicle.interior_cleaning_fee || undefined,
            },
          }}
          checkInData={
            wizardMode === 'check_out' && selectedBooking.check_in_record
              ? {
                  confirmed_odometer: selectedBooking.check_in_record.confirmed_odometer,
                  confirmed_fuel_percent: selectedBooking.check_in_record.confirmed_fuel_percent,
                }
              : undefined
          }
          onComplete={handleWizardComplete}
        />
      )}
    </div>
  );
};
