import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminCreateBooking from '@/components/admin/AdminCreateBooking';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Loader2, Plus, Pencil, XCircle, MoreHorizontal, Trash2, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/azure/client';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface AdminBooking {
  id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  status: string;
  total_price: number;
  renter_name: string | null;
  renter_email: string | null;
  renter_phone: string | null;
  created_at: string;
  vehicle?: {
    registration: string;
    make: string;
    model: string;
  };
  contract?: {
    id: string;
    contract_number: string;
    status: string;
  };
  lessor?: {
    full_name: string | null;
    email: string;
  };
}

interface AdminVehicle {
  id: string;
  registration: string;
  make: string;
  model: string;
  year: number | null;
  daily_price: number | null;
  is_available: boolean;
  owner_id: string;
  owner?: {
    full_name: string | null;
    email: string;
    company_name: string | null;
  };
}

const AdminBookingsPage = () => {
  const navigate = useNavigate();
  const { user, hasAccess, isLoading } = useAdminAuth();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showCreateBooking, setShowCreateBooking] = useState(false);
  
  // Edit booking state
  const [showEditBooking, setShowEditBooking] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [editForm, setEditForm] = useState({
    start_date: '',
    end_date: '',
    renter_name: '',
    renter_email: '',
    renter_phone: '',
    total_price: '',
    status: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Cancel booking state
  const [showCancelBooking, setShowCancelBooking] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<AdminBooking | null>(null);
  
  // Delete vehicle state
  const [showDeleteVehicle, setShowDeleteVehicle] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<AdminVehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !hasAccess)) {
      navigate('/admin');
    }
  }, [user, hasAccess, isLoading, navigate]);

  useEffect(() => {
    if (hasAccess) {
      fetchBookings();
      fetchVehicles();
    }
  }, [hasAccess]);

  const fetchBookings = async () => {
    setLoadingData(true);
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, vehicle_id, start_date, end_date, status, total_price, 
        renter_name, renter_email, renter_phone, created_at, lessor_id,
        vehicle_id
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching admin bookings:', error);
      toast.error('Kunne ikke hente bookinger: ' + error.message);
      setBookings([]);
    } else {
      // Fetch vehicles separately to avoid unknown relationship-cache dependencies
      const vehicleIds = Array.from(new Set((data || []).map((b: unknown) => b.vehicle_id).filter(Boolean)));
      const vehicleMap = new Map<string, { registration: string; make: string; model: string }>();

      if (vehicleIds.length > 0) {
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, registration, make, model')
          .in('id', vehicleIds);

        if (vehiclesError) {
          console.error('Error fetching booking vehicles:', vehiclesError);
        } else {
          (vehiclesData || []).forEach((v: unknown) => {
            vehicleMap.set(v.id, { registration: v.registration, make: v.make, model: v.model });
          });
        }
      }

      // Fetch contracts for the bookings (so admins can open / generate contract)
      const bookingIds = Array.from(new Set((data || []).map((b: unknown) => b.id).filter(Boolean)));
      const contractMap = new Map<string, { id: string; contract_number: string; status: string }>();

      if (bookingIds.length > 0) {
        const { data: contractsData, error: contractsError } = await supabase
          .from('contracts')
          .select('id, booking_id, contract_number, status')
          .in('booking_id', bookingIds);

        if (contractsError) {
          console.error('Error fetching booking contracts:', contractsError);
        } else {
          (contractsData || []).forEach((c: unknown) => {
            contractMap.set(c.booking_id, { id: c.id, contract_number: c.contract_number, status: c.status });
          });
        }
      }

      // Fetch lessor profiles separately to avoid reliance on schema relationship cache
      const lessorIds = Array.from(new Set((data || []).map((b: unknown) => b.lessor_id).filter(Boolean)));
      const lessorMap = new Map<string, { full_name: string | null; email: string }>();

      if (lessorIds.length > 0) {
        const { data: lessorsData, error: lessorsError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', lessorIds);

        if (lessorsError) {
          console.error('Error fetching lessor profiles:', lessorsError);
        } else {
          (lessorsData || []).forEach((p: unknown) => {
            lessorMap.set(p.id, { full_name: p.full_name, email: p.email });
          });
        }
      }

      setBookings((data || []).map((b: unknown) => ({
        ...b,
        vehicle: b.vehicle_id ? (vehicleMap.get(b.vehicle_id)) : undefined,
        contract: contractMap.get(b.id),
        lessor: b.lessor_id ? (lessorMap.get(b.lessor_id)) : undefined,
      })));
    }
    setLoadingData(false);
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);

    if (error) {
      console.error('Error updating booking status:', error);
      toast.error('Kunne ikke opdatere status: ' + error.message);
      return false;
    }

    toast.success('Status opdateret');
    await fetchBookings();
    return true;
  };

  const ensureContractForBooking = async (booking: AdminBooking) => {
    if (booking.contract?.id) return booking.contract;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Du skal være logget ind som admin');
        navigate('/admin');
        return null;
      }

      const { data, error } = await supabase.functions.invoke('generate-contract', {
        body: {
          bookingId: booking.id,
          vehicleValue: 150000,
          depositAmount: 2500,
        },
      });

      if (error) {
        // 403 typically means missing/invalid session token
        console.error('generate-contract invoke error:', error);
        toast.error(error.message || 'Kunne ikke oprette lejekontrakt');
        return null;
      }
      if ((data)?.error) throw new Error((data).error);

      await fetchBookings();
      return (data)?.contract as AdminBooking['contract'];
    } catch (err) {
      console.error('Error generating contract (admin):', err);
      toast.error('Kunne ikke oprette lejekontrakt');
      return null;
    }
  };

  const openContract = async (booking: AdminBooking) => {
    const contract = await ensureContractForBooking(booking);
    if (!contract?.id) return;
    navigate(`/dashboard/contract/sign/${contract.id}`);
  };

  const fetchVehicles = async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        id, registration, make, model, year, daily_price, is_available, owner_id
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Error fetching admin vehicles:', error);
      toast.error('Kunne ikke hente køretøjer: ' + error.message);
      setVehicles([]);
    } else {
      // Fetch owner profiles separately to avoid relationship cache issues
      const ownerIds = Array.from(new Set((data || []).map((v: unknown) => v.owner_id).filter(Boolean)));
      const ownerMap = new Map<string, { full_name: string | null; email: string; company_name: string | null }>();

      if (ownerIds.length > 0) {
        const { data: ownersData, error: ownersError } = await supabase
          .from('profiles')
          .select('id, full_name, email, company_name')
          .in('id', ownerIds);

        if (ownersError) {
          console.error('Error fetching owner profiles:', ownersError);
        } else {
          (ownersData || []).forEach((p: unknown) => {
            ownerMap.set(p.id, { full_name: p.full_name, email: p.email, company_name: p.company_name });
          });
        }
      }

      setVehicles((data || []).map((v: unknown) => ({
        ...v,
        owner: v.owner_id ? (ownerMap.get(v.owner_id)) : undefined,
      })));
    }
  };

  const openEditBooking = (booking: AdminBooking) => {
    setSelectedBooking(booking);
    setEditForm({
      start_date: booking.start_date,
      end_date: booking.end_date,
      renter_name: booking.renter_name || '',
      renter_email: booking.renter_email || '',
      renter_phone: booking.renter_phone || '',
      total_price: booking.total_price.toString(),
      status: booking.status,
    });
    setShowEditBooking(true);
  };

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;
    setIsUpdating(true);

    const { error } = await supabase
      .from('bookings')
      .update({
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        renter_name: editForm.renter_name || null,
        renter_email: editForm.renter_email || null,
        renter_phone: editForm.renter_phone || null,
        total_price: parseFloat(editForm.total_price) || 0,
        status: editForm.status,
      })
      .eq('id', selectedBooking.id);

    if (error) {
      console.error('Error updating booking:', error);
      toast.error('Kunne ikke opdatere booking: ' + error.message);
    } else {
      toast.success('Booking opdateret');
      setShowEditBooking(false);
      setSelectedBooking(null);
      fetchBookings();
    }

    setIsUpdating(false);
  };

  const openCancelBooking = (booking: AdminBooking) => {
    setBookingToCancel(booking);
    setShowCancelBooking(true);
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
    setIsUpdating(true);

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingToCancel.id);

    if (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Kunne ikke annullere booking');
    } else {
      toast.success('Booking annulleret');
      setShowCancelBooking(false);
      setBookingToCancel(null);
      fetchBookings();
    }

    setIsUpdating(false);
  };

  const openDeleteVehicle = (vehicle: AdminVehicle) => {
    setVehicleToDelete(vehicle);
    setShowDeleteVehicle(true);
  };

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    setIsDeleting(true);

    // First delete all bookings for this vehicle
    const { error: bookingsError } = await supabase
      .from('bookings')
      .delete()
      .eq('vehicle_id', vehicleToDelete.id);

    if (bookingsError) {
      console.error('Error deleting vehicle bookings:', bookingsError);
      toast.error('Kunne ikke slette køretøjets bookinger');
      setIsDeleting(false);
      return;
    }

    // Then delete the vehicle
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleToDelete.id);

    if (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Kunne ikke slette køretøj: ' + error.message);
    } else {
      toast.success('Køretøj og tilhørende bookinger slettet');
      setShowDeleteVehicle(false);
      setVehicleToDelete(null);
      fetchVehicles();
      fetchBookings();
    }

    setIsDeleting(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      confirmed: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
      completed: 'outline',
    };
    const labels: Record<string, string> = {
      confirmed: 'Bekræftet',
      pending: 'Afventer',
      cancelled: 'Annulleret',
      completed: 'Afsluttet',
    };
    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AdminDashboardLayout activeTab="bookings">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Bookinger & Køretøjer</h2>
            <p className="text-muted-foreground">Administrer alle bookinger og køretøjer på platformen</p>
          </div>
          <Button onClick={() => setShowCreateBooking(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Opret booking
          </Button>
        </div>

        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bookings">Bookinger</TabsTrigger>
            <TabsTrigger value="vehicles">Alle køretøjer</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Alle bookinger</CardTitle>
                <CardDescription>De seneste 100 bookinger - rediger eller annuller på vegne af udlejere</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Køretøj</TableHead>
                        <TableHead>Udlejer</TableHead>
                        <TableHead>Lejer</TableHead>
                        <TableHead>Periode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pris</TableHead>
                        <TableHead className="w-[80px]">Handlinger</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                            Ingen bookinger fundet (eller du mangler adgang).
                          </TableCell>
                        </TableRow>
                      ) : (
                        bookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">
                                  {booking.vehicle?.make} {booking.vehicle?.model}
                                </p>
                                <p className="text-xs text-muted-foreground">{booking.vehicle?.registration}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{booking.lessor?.full_name || 'Ukendt'}</p>
                                <p className="text-xs text-muted-foreground">{booking.lessor?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{booking.renter_name || 'Ukendt'}</p>
                                <p className="text-xs text-muted-foreground">{booking.renter_email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(booking.start_date), 'd. MMM', { locale: da })} - {format(new Date(booking.end_date), 'd. MMM', { locale: da })}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(booking.status)}
                            </TableCell>
                            <TableCell>{booking.total_price.toLocaleString('da-DK')} kr</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditBooking(booking)}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Rediger booking
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  {booking.status === 'pending' && (
                                    <DropdownMenuItem
                                      onClick={async () => {
                                        const contract = await ensureContractForBooking(booking);
                                        if (!contract?.id) return;
                                        await updateBookingStatus(booking.id, 'confirmed');
                                      }}
                                    >
                                      <Car className="w-4 h-4 mr-2" />
                                      Godkend leje (opret kontrakt)
                                    </DropdownMenuItem>
                                  )}

                                  {booking.status === 'confirmed' && (
                                    <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'active')}>
                                      <Car className="w-4 h-4 mr-2" />
                                      Udlever bil (marker aktiv)
                                    </DropdownMenuItem>
                                  )}

                                  <DropdownMenuItem onClick={() => openContract(booking)}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    {booking.contract?.id ? 'Se lejekontrakt' : 'Opret og se lejekontrakt'}
                                  </DropdownMenuItem>
                                  {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => openCancelBooking(booking)}
                                        className="text-destructive"
                                      >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Annuller booking
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Alle køretøjer
                </CardTitle>
                <CardDescription>Alle køretøjer på platformen - slet på vegne af udlejere</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Køretøj</TableHead>
                      <TableHead>Ejer</TableHead>
                      <TableHead>Dagspris</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]">Handlinger</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                          Ingen køretøjer fundet (eller du mangler adgang).
                        </TableCell>
                      </TableRow>
                    ) : (
                      vehicles.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{vehicle.make} {vehicle.model}</p>
                              <p className="text-xs text-muted-foreground">{vehicle.registration} • {vehicle.year}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{vehicle.owner?.full_name || vehicle.owner?.company_name || 'Ukendt'}</p>
                              <p className="text-xs text-muted-foreground">{vehicle.owner?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {vehicle.daily_price ? `${vehicle.daily_price.toLocaleString('da-DK')} kr` : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={vehicle.is_available ? 'default' : 'secondary'}>
                              {vehicle.is_available ? 'Tilgængelig' : 'Ikke tilgængelig'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => openDeleteVehicle(vehicle)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Booking Dialog */}
        <AdminCreateBooking 
          open={showCreateBooking} 
          onClose={() => setShowCreateBooking(false)}
          onSuccess={() => {
            setShowCreateBooking(false);
            fetchBookings();
          }}
        />

        {/* Edit Booking Dialog */}
        <Dialog open={showEditBooking} onOpenChange={setShowEditBooking}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Rediger booking</DialogTitle>
              <DialogDescription>
                Rediger bookingdetaljer på vegne af udlejeren
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Startdato</Label>
                  <Input
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slutdato</Label>
                  <Input
                    type="date"
                    value={editForm.end_date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Lejerens navn</Label>
                <Input
                  value={editForm.renter_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, renter_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Lejerens email</Label>
                <Input
                  type="email"
                  value={editForm.renter_email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, renter_email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Lejerens telefon</Label>
                <Input
                  type="tel"
                  value={editForm.renter_phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, renter_phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Total pris (DKK)</Label>
                <Input
                  type="number"
                  value={editForm.total_price}
                  onChange={(e) => setEditForm(prev => ({ ...prev, total_price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="pending">Afventer</option>
                  <option value="confirmed">Bekræftet</option>
                  <option value="cancelled">Annulleret</option>
                  <option value="completed">Afsluttet</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditBooking(false)}>
                Annuller
              </Button>
              <Button onClick={handleUpdateBooking} disabled={isUpdating}>
                {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Gem ændringer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Booking Dialog */}
        <AlertDialog open={showCancelBooking} onOpenChange={setShowCancelBooking}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Annuller booking?</AlertDialogTitle>
              <AlertDialogDescription>
                Er du sikker på at du vil annullere denne booking for {bookingToCancel?.renter_name}? 
                Denne handling kan ikke fortrydes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Fortryd</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelBooking}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Annuller booking
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Vehicle Dialog */}
        <AlertDialog open={showDeleteVehicle} onOpenChange={setShowDeleteVehicle}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Slet køretøj?</AlertDialogTitle>
              <AlertDialogDescription>
                Er du sikker på at du vil slette {vehicleToDelete?.make} {vehicleToDelete?.model} ({vehicleToDelete?.registration})? 
                Dette vil også slette alle bookinger for dette køretøj. Denne handling kan ikke fortrydes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Fortryd</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteVehicle}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Slet køretøj
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminBookingsPage;
