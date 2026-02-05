import { Booking } from '@/hooks/useBookings';
import { Contract } from '@/hooks/useContracts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RenterRatingBadge } from '@/components/ratings/RenterRatingBadge';
import DriverLicenseStatusBadge from '@/components/dashboard/DriverLicenseStatusBadge';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { 
  Car, Calendar, FileText, FileCheck, Check, X, Loader2, 
  ScanLine, Camera, ClipboardCheck, History, ChevronRight,
  MoreHorizontal, Star, Banknote, CreditCard, Smartphone, Building2, CheckCircle2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MobileBookingCardProps {
  booking: Booking;
  contract?: Contract;
  isGenerating: boolean;
  isConfirming: boolean;
  hasBeenRated: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onStartRental: () => void;
  onCompleteRental: () => void;
  onViewContract: () => void;
  onGenerateContract: () => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onPickupReport: () => void;
  onReturnReport: () => void;
  onViewHistory: () => void;
  onRateRenter: () => void;
  onSwapVehicle?: () => void;
  onMarkPaymentReceived?: () => void;
}

const statusConfig: Record<Booking['status'], { label: string; color: string }> = {
  pending: { label: 'Afventer', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  confirmed: { label: 'Bekræftet', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  active: { label: 'Aktiv', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  completed: { label: 'Afsluttet', color: 'bg-muted text-muted-foreground border-border' },
  cancelled: { label: 'Annulleret', color: 'bg-destructive/10 text-destructive border-destructive/30' },
};

const paymentMethodLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  cash: { label: 'Kontant', icon: <Banknote className="w-4 h-4" /> },
  bank_transfer: { label: 'Bankoverførsel', icon: <Building2 className="w-4 h-4" /> },
  mobilepay: { label: 'MobilePay', icon: <Smartphone className="w-4 h-4" /> },
  card: { label: 'Kort', icon: <CreditCard className="w-4 h-4" /> },
};

export const MobileBookingCard = ({
  booking,
  contract,
  isGenerating,
  isConfirming,
  hasBeenRated,
  onConfirm,
  onCancel,
  onStartRental,
  onCompleteRental,
  onViewContract,
  onGenerateContract,
  onCheckIn,
  onCheckOut,
  onPickupReport,
  onReturnReport,
  onViewHistory,
  onRateRenter,
  onSwapVehicle,
  onMarkPaymentReceived,
}: MobileBookingCardProps) => {
  const status = statusConfig[booking.status];
  const paymentMethod = booking.payment_method ? paymentMethodLabels[booking.payment_method] : null;

  return (
    <Card className="overflow-hidden border-2 border-border/50 hover:border-border transition-colors">
      <CardContent className="p-0">
        {/* Header with vehicle info and status */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground truncate">
                  {booking.vehicle?.make} {booking.vehicle?.model}
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {booking.vehicle?.registration}
                </p>
              </div>
            </div>
            <Badge className={`${status.color} border shrink-0`}>
              {status.label}
            </Badge>
          </div>
        </div>

        {/* Renter info */}
        <div className="p-4 bg-muted/30">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">
                {booking.renter_name || 'Ukendt lejer'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {booking.renter_email}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {booking.renter_email && (
                <RenterRatingBadge renterEmail={booking.renter_email} size="sm" />
              )}
              <DriverLicenseStatusBadge 
                renterEmail={booking.renter_email} 
                renterId={booking.renter_id}
                renterLicenseNumber={booking.renter_license_number}
                size="sm" 
              />
            </div>
          </div>
        </div>

        {/* Dates and price */}
        <div className="p-4 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground">
                {format(new Date(booking.start_date), 'd. MMM', { locale: da })}
              </p>
              <p className="text-muted-foreground text-xs">
                til {format(new Date(booking.end_date), 'd. MMM', { locale: da })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-foreground">
              {booking.total_price.toLocaleString('da-DK')} kr
            </p>
            <p className="text-xs text-muted-foreground">Total pris</p>
          </div>
        </div>

        {/* Payment method and status */}
        {paymentMethod && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-2">
                {paymentMethod.icon}
                <span className="text-sm">{paymentMethod.label}</span>
              </div>
              {booking.payment_received ? (
                <Badge variant="default" className="bg-mint text-white">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Modtaget
                </Badge>
              ) : onMarkPaymentReceived ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={onMarkPaymentReceived}
                >
                  Marker modtaget
                </Button>
              ) : null}
            </div>
          </div>
        )}

        {/* Contract status */}
        <div className="px-4 pb-3">
          {contract ? (
            <button
              onClick={onViewContract}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                {contract.status === 'signed' ? (
                  <FileCheck className="w-5 h-5 text-mint" />
                ) : (
                  <FileText className="w-5 h-5 text-accent" />
                )}
                <span className={contract.status === 'signed' ? 'text-mint' : 'text-accent'}>
                  Kontrakt {contract.status === 'signed' ? 'underskrevet' : 'afventer'}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={onGenerateContract}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Opretter...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Opret kontrakt
                </>
              )}
            </Button>
          )}
        </div>

        {/* Actions based on status */}
        <div className="p-4 pt-0 flex gap-2">
          {booking.status === 'pending' && (
            <>
              <Button
                className="flex-1 bg-gradient-to-r from-mint to-mint/80"
                onClick={onConfirm}
                disabled={isConfirming}
              >
                {isConfirming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Bekræft
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={onCancel}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}

          {booking.status === 'confirmed' && (
            <>
              <Button className="flex-1" onClick={onStartRental}>
                Start udlejning
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={onCheckIn}>
                    <ScanLine className="w-4 h-4 mr-2" />
                    AR Check-in
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onPickupReport}>
                    <Camera className="w-4 h-4 mr-2" />
                    Udleveringsrapport
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {booking.status === 'active' && (
            <>
              <Button className="flex-1" onClick={onCompleteRental}>
                Afslut udlejning
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={onCheckOut}>
                    <ScanLine className="w-4 h-4 mr-2" />
                    AR Check-out
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onReturnReport}>
                    <ClipboardCheck className="w-4 h-4 mr-2" />
                    Indleveringsrapport
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onViewHistory}>
                    <History className="w-4 h-4 mr-2" />
                    Skanningshistorik
                  </DropdownMenuItem>
                  {onSwapVehicle && (
                    <DropdownMenuItem onClick={onSwapVehicle}>
                      <Car className="w-4 h-4 mr-2" />
                      Byt køretøj
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {booking.status === 'completed' && !hasBeenRated && (
            <Button variant="outline" className="flex-1" onClick={onRateRenter}>
              <Star className="w-4 h-4 mr-2" />
              Bedøm lejer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileBookingCard;
