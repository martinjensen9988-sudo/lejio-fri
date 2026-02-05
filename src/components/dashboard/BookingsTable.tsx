import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Booking, useBookings } from '@/hooks/useBookings';
import { Contract, useContracts } from '@/hooks/useContracts';
import { useRenterRatings } from '@/hooks/useRenterRatings';
import { useAuth } from '@/hooks/useAuth';
import { useVehicles } from '@/hooks/useVehicles';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/azure/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RenterRatingBadge } from '@/components/ratings/RenterRatingBadge';
import DriverLicenseStatusBadge from '@/components/dashboard/DriverLicenseStatusBadge';
import MobileBookingCard from '@/components/dashboard/MobileBookingCard';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Check, X, Car, Calendar, FileText, Loader2, FileCheck, Camera, ClipboardCheck, Star, ScanLine, History, ArrowRightLeft, Banknote, CreditCard, Smartphone, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BookingsTableProps {
  bookings: Booking[];
  onUpdateStatus: (id: string, status: Booking['status']) => Promise<boolean>;
}

const statusConfig: Record<Booking['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Afventer', variant: 'outline' },
  confirmed: { label: 'Bekræftet', variant: 'default' },
  active: { label: 'Aktiv', variant: 'default' },
  completed: { label: 'Afsluttet', variant: 'secondary' },
  cancelled: { label: 'Annulleret', variant: 'destructive' },
};

const paymentMethodLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  cash: { label: 'Kontant', icon: <Banknote className="w-4 h-4" /> },
  bank_transfer: { label: 'Bankoverførsel', icon: <Building2 className="w-4 h-4" /> },
  mobilepay: { label: 'MobilePay', icon: <Smartphone className="w-4 h-4" /> },
  card: { label: 'Kort', icon: <CreditCard className="w-4 h-4" /> },
};

const BookingsTable = ({ bookings, onUpdateStatus }: BookingsTableProps) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { vehicles } = useVehicles();
  const { refetch: refetchBookings, markPaymentReceived } = useBookings();
  const isMobile = useIsMobile();
  const { contracts, generateContract, isLoading: contractsLoading } = useContracts();
  const [generatingContractFor, setGeneratingContractFor] = useState<string | null>(null);
  const [confirmingBooking, setConfirmingBooking] = useState<string | null>(null);
  
  const { hasRatedBooking } = useRenterRatings();
  const [ratedBookings, setRatedBookings] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkRatedBookings = async () => {
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const rated = new Set<string>();
      for (const booking of completedBookings) {
        const isRated = await hasRatedBooking(booking.id);
        if (isRated) rated.add(booking.id);
      }
      setRatedBookings(rated);
    };
    checkRatedBookings();
  }, [bookings, hasRatedBooking]);

  const handleConfirmBooking = async (booking: Booking) => {
    setConfirmingBooking(booking.id);
    try {
      setGeneratingContractFor(booking.id);
      const contract = await generateContract(booking.id, { vehicleValue: 150000, depositAmount: 2500 });
      setGeneratingContractFor(null);
      if (!contract) { toast.error('Kunne ikke oprette kontrakt'); setConfirmingBooking(null); return; }
      const success = await onUpdateStatus(booking.id, 'confirmed');
      if (success && booking.renter_email && booking.renter_name) {
        await supabase.functions.invoke('send-booking-confirmation', {
          body: {
            renterEmail: booking.renter_email, renterName: booking.renter_name,
            lessorName: profile?.full_name || 'Udlejer', lessorPhone: profile?.phone, lessorEmail: profile?.email,
            vehicleMake: booking.vehicle?.make || '', vehicleModel: booking.vehicle?.model || '',
            vehicleRegistration: booking.vehicle?.registration || '',
            startDate: format(new Date(booking.start_date), 'd. MMMM yyyy', { locale: da }),
            endDate: format(new Date(booking.end_date), 'd. MMMM yyyy', { locale: da }),
            totalPrice: booking.total_price, contractId: contract.id, contractNumber: contract.contract_number,
          },
        });
        toast.success('Booking bekræftet og email sendt');
      }
    } catch (error) { console.error(error); toast.error('Der opstod en fejl'); }
    finally { setConfirmingBooking(null); }
  };

  const handleGenerateContract = async (booking: Booking) => {
    setGeneratingContractFor(booking.id);
    await generateContract(booking.id, { vehicleValue: 150000, depositAmount: 2500 });
    setGeneratingContractFor(null);
  };

  const getContractForBooking = (bookingId: string) => contracts.find(c => c.booking_id === bookingId);
  const handleViewContract = (contract: Contract) => navigate(`/dashboard/contract/sign/${contract.id}`);

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-2xl border border-border">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-lg font-semibold text-foreground mb-2">Ingen bookinger endnu</h3>
        <p className="text-muted-foreground text-sm">Dine bookinger vil blive vist her.</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {bookings.map((booking) => {
          const contract = getContractForBooking(booking.id);
          const currentVehicle = vehicles.find(v => v.id === booking.vehicle_id);
          return (
            <MobileBookingCard
              key={booking.id}
              booking={booking}
              contract={contract}
              isGenerating={generatingContractFor === booking.id}
              isConfirming={confirmingBooking === booking.id}
              hasBeenRated={ratedBookings.has(booking.id)}
              onConfirm={() => handleConfirmBooking(booking)}
              onCancel={() => onUpdateStatus(booking.id, 'cancelled')}
              onStartRental={() => onUpdateStatus(booking.id, 'active')}
              onCompleteRental={() => navigate(`/dashboard/settlement/${booking.id}`)}
              onViewContract={() => contract && handleViewContract(contract)}
              onGenerateContract={() => handleGenerateContract(booking)}
              onCheckIn={() => navigate(`/dashboard/checkinout/${booking.id}?mode=check_in`)}
              onCheckOut={() => navigate(`/dashboard/checkinout/${booking.id}?mode=check_out`)}
              onPickupReport={() => navigate(`/dashboard/damage-report/${booking.id}?type=pickup`)}
              onReturnReport={() => navigate(`/dashboard/damage-report/${booking.id}?type=return`)}
              onViewHistory={() => navigate(`/dashboard/scan-history/${booking.id}`)}
              onRateRenter={() => navigate(`/dashboard/rate-renter/${booking.id}`)}
              onSwapVehicle={currentVehicle ? () => navigate(`/dashboard/vehicle-swap/${booking.id}`) : undefined}
              onMarkPaymentReceived={() => markPaymentReceived(booking.id)}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bil</TableHead>
            <TableHead>Lejer</TableHead>
            <TableHead>Periode</TableHead>
            <TableHead>Pris</TableHead>
            <TableHead>Betaling</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Kontrakt</TableHead>
            <TableHead className="text-right">Handlinger</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => {
            const contract = getContractForBooking(booking.id);
            const isGenerating = generatingContractFor === booking.id;
            const paymentMethod = booking.payment_method ? paymentMethodLabels[booking.payment_method] : null;
            return (
              <TableRow key={booking.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{booking.vehicle?.make} {booking.vehicle?.model}</p>
                      <p className="text-xs text-muted-foreground font-mono">{booking.vehicle?.registration}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{booking.renter_name || 'Ukendt'}</p>
                    <p className="text-xs text-muted-foreground">{booking.renter_email}</p>
                    <div className="flex flex-wrap gap-1">
                      {booking.renter_email && <RenterRatingBadge renterEmail={booking.renter_email} size="sm" />}
                      <DriverLicenseStatusBadge renterEmail={booking.renter_email} renterId={booking.renter_id} renterLicenseNumber={booking.renter_license_number} size="sm" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p className="text-foreground">{format(new Date(booking.start_date), 'd. MMM', { locale: da })}</p>
                    <p className="text-muted-foreground">til {format(new Date(booking.end_date), 'd. MMM yyyy', { locale: da })}</p>
                  </div>
                </TableCell>
                <TableCell><span className="font-semibold text-foreground">{booking.total_price} kr</span></TableCell>
                <TableCell>
                  {paymentMethod ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{paymentMethod.icon}<span>{paymentMethod.label}</span></div>
                      {booking.payment_received ? (
                        <Badge variant="default" className="bg-mint text-white"><CheckCircle2 className="w-3 h-3 mr-1" />Modtaget</Badge>
                      ) : (
                        <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => markPaymentReceived(booking.id)}>Marker modtaget</Button>
                      )}
                    </div>
                  ) : <span className="text-xs text-muted-foreground">-</span>}
                </TableCell>
                <TableCell><Badge variant={statusConfig[booking.status].variant}>{statusConfig[booking.status].label}</Badge></TableCell>
                <TableCell>
                  {contract ? (
                    <Button size="sm" variant="ghost" className="gap-1" onClick={() => handleViewContract(contract)}>
                      {contract.status === 'signed' ? <><FileCheck className="w-4 h-4 text-mint" /><span className="text-mint">Underskrevet</span></> : <><FileText className="w-4 h-4 text-accent" /><span className="text-accent">Afventer</span></>}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => handleGenerateContract(booking)} disabled={isGenerating || contractsLoading}>
                      {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />Opretter...</> : <><FileText className="w-4 h-4" />Opret kontrakt</>}
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {booking.status === 'pending' && (
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" className="text-mint hover:text-mint" onClick={() => handleConfirmBooking(booking)} disabled={confirmingBooking === booking.id}>
                        {confirmingBooking === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onUpdateStatus(booking.id, 'cancelled')}><X className="w-4 h-4" /></Button>
                    </div>
                  )}
                  {booking.status === 'confirmed' && (
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/checkinout/${booking.id}?mode=check_in`)} title="AR Check-in"><ScanLine className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/damage-report/${booking.id}?type=pickup&vehicleId=${booking.vehicle_id}`)} title="Udleveringsrapport"><Camera className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => onUpdateStatus(booking.id, 'active')}>Start</Button>
                    </div>
                  )}
                  {booking.status === 'active' && (
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/vehicle-swap/${booking.id}`)} title="Udskift køretøj"><ArrowRightLeft className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/checkinout/${booking.id}?mode=check_out`)} title="AR Check-out"><ScanLine className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/damage-report/${booking.id}?type=return&vehicleId=${booking.vehicle_id}`)} title="Indleveringsrapport"><ClipboardCheck className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/scan-history/${booking.id}`)} title="Skanningshistorik"><History className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/settlement/${booking.id}`)}>Afslut</Button>
                    </div>
                  )}
                  {booking.status === 'completed' && booking.renter_email && (
                    <div className="flex items-center gap-1">
                      {ratedBookings.has(booking.id) ? (
                        <Badge variant="outline" className="text-mint"><Star className="w-3 h-3 mr-1 fill-mint" />Vurderet</Badge>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/rate-renter/${booking.id}`)} title="Vurder lejeren"><Star className="w-4 h-4 mr-1" />Vurder</Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-accent hover:text-accent hover:bg-accent/10" onClick={() => {
                        const params = new URLSearchParams({ renterEmail: booking.renter_email || '', renterName: booking.renter_name || '', renterPhone: booking.renter_phone || '', renterLicenseNumber: booking.renter_license_number || '', bookingId: booking.id });
                        navigate(`/dashboard/warnings/create?${params.toString()}`);
                      }} title="Opret advarsel"><AlertCircle className="w-4 h-4" /></Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default BookingsTable;
