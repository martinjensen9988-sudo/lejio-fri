import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Receipt, Fuel, Car, AlertTriangle, CheckCircle2, Wallet, FileText, Edit2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { useBookings, Booking } from '@/hooks/useBookings';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface CheckInData {
  confirmed_odometer: number | null;
  confirmed_fuel_percent: number | null;
}

interface CheckOutData {
  km_overage: number | null;
  km_overage_fee: number | null;
  fuel_fee: number | null;
  total_extra_charges: number | null;
  confirmed_odometer: number | null;
  confirmed_fuel_percent: number | null;
  fuel_start_percent: number | null;
  km_driven: number | null;
  exterior_clean: boolean | null;
  interior_clean: boolean | null;
  exterior_cleaning_fee: number | null;
  interior_cleaning_fee: number | null;
}

interface Fine {
  id: string;
  fine_type: string;
  fine_amount: number;
  admin_fee: number;
  total_amount: number;
  fine_date: string;
  status: string;
  description: string | null;
}

interface SettlementSummary {
  rentalPrice: number;
  kmOverageFee: number;
  fuelFee: number;
  exteriorCleaningFee: number;
  interiorCleaningFee: number;
  finesTotal: number;
  totalCharges: number;
  depositAmount: number;
  depositRefund: number;
  amountDueFromRenter: number;
}

interface ManualInput {
  startOdometer: number;
  endOdometer: number;
  startFuelPercent: number;
  endFuelPercent: number;
  exteriorClean: boolean;
  interiorClean: boolean;
}

const SettlementPage = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const { bookings, updateBookingStatus, refetch } = useBookings();

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkInData, setCheckInData] = useState<CheckInData | null>(null);
  const [checkOutData, setCheckOutData] = useState<CheckOutData | null>(null);
  const [fines, setFines] = useState<Fine[]>([]);
  const [settlement, setSettlement] = useState<SettlementSummary | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualInput, setManualInput] = useState<ManualInput>({
    startOdometer: 0,
    endOdometer: 0,
    startFuelPercent: 100,
    endFuelPercent: 100,
    exteriorClean: true,
    interiorClean: true,
  });

  const booking = bookings.find(b => b.id === bookingId);

  const includedKm = booking?.included_km || 0;
  const extraKmRate = booking?.extra_km_price || 2;
  const fuelTankSize = 50;
  const fuelPricePerLiter = 15;
  const fuelMissingFee = 150;
  const exteriorCleaningFeeRate = booking?.vehicle?.exterior_cleaning_fee || 350;
  const interiorCleaningFeeRate = booking?.vehicle?.interior_cleaning_fee || 500;

  useEffect(() => {
    if (booking) {
      fetchSettlementData();
    }
  }, [booking]);

  useEffect(() => {
    if (isManualMode) {
      calculateManualSettlement();
    }
  }, [manualInput, isManualMode, fines]);

  const fetchSettlementData = async () => {
    if (!booking) return;
    setIsLoading(true);
    try {
      const { data: checkInRecord } = await supabase
        .from('check_in_out_records')
        .select('confirmed_odometer, confirmed_fuel_percent')
        .eq('booking_id', booking.id)
        .eq('record_type', 'check_in')
        .maybeSingle();

      setCheckInData(checkInRecord);

      const { data: checkOutRecord } = await supabase
        .from('check_in_out_records')
        .select('km_overage, km_overage_fee, fuel_fee, total_extra_charges, confirmed_odometer, confirmed_fuel_percent, fuel_start_percent, km_driven, exterior_clean, interior_clean, exterior_cleaning_fee, interior_cleaning_fee')
        .eq('booking_id', booking.id)
        .eq('record_type', 'check_out')
        .maybeSingle();

      setCheckOutData(checkOutRecord as CheckOutData | null);

      const { data: bookingFines } = await supabase
        .from('fines')
        .select('id, fine_type, fine_amount, admin_fee, total_amount, fine_date, status, description')
        .eq('booking_id', booking.id)
        .neq('status', 'paid');

      setFines(bookingFines || []);

      if (!checkOutRecord) {
        setIsManualMode(true);
        if (checkInRecord) {
          setManualInput(prev => ({
            ...prev,
            startOdometer: checkInRecord.confirmed_odometer || 0,
            startFuelPercent: checkInRecord.confirmed_fuel_percent || 100,
          }));
        }
        calculateManualSettlement();
      } else {
        calculateSettlementFromCheckOut(checkOutRecord as CheckOutData, bookingFines || []);
      }
    } catch (err) {
      console.error('Error fetching settlement data:', err);
      toast.error('Kunne ikke hente afregningsdata');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSettlementFromCheckOut = (checkOut: CheckOutData, bookingFines: Fine[]) => {
    if (!booking) return;
    const kmOverageFee = checkOut?.km_overage_fee || 0;
    const fuelFee = checkOut?.fuel_fee || 0;
    const exteriorCleaningFee = checkOut?.exterior_cleaning_fee || 0;
    const interiorCleaningFee = checkOut?.interior_cleaning_fee || 0;
    const finesTotal = bookingFines.reduce((sum, fine) => sum + (fine.total_amount || 0), 0);
    const totalCharges = kmOverageFee + fuelFee + exteriorCleaningFee + interiorCleaningFee + finesTotal;
    const depositAmount = booking.deposit_amount || 0;

    const depositRefund = Math.max(0, depositAmount - totalCharges);
    const amountDueFromRenter = Math.max(0, totalCharges - depositAmount);

    setSettlement({
      rentalPrice: booking.total_price,
      kmOverageFee,
      fuelFee,
      exteriorCleaningFee,
      interiorCleaningFee,
      finesTotal,
      totalCharges,
      depositAmount,
      depositRefund,
      amountDueFromRenter,
    });
  };

  const calculateManualSettlement = () => {
    if (!booking) return;
    const kmDriven = Math.max(0, manualInput.endOdometer - manualInput.startOdometer);
    const kmOverage = Math.max(0, kmDriven - includedKm);
    const kmOverageFee = kmOverage * extraKmRate;

    const fuelDiff = manualInput.startFuelPercent - manualInput.endFuelPercent;
    const fuelTolerance = 5;
    let fuelFee = 0;

    if (fuelDiff > fuelTolerance) {
      const fuelMissingLiters = (fuelDiff / 100) * fuelTankSize;
      fuelFee = (fuelMissingLiters * fuelPricePerLiter) + fuelMissingFee;
    }

    const exteriorCleaningFee = !manualInput.exteriorClean ? exteriorCleaningFeeRate : 0;
    const interiorCleaningFee = !manualInput.interiorClean ? interiorCleaningFeeRate : 0;

    const finesTotal = fines.reduce((sum, fine) => sum + (fine.total_amount || 0), 0);
    const totalCharges = kmOverageFee + fuelFee + exteriorCleaningFee + interiorCleaningFee + finesTotal;
    const depositAmount = booking.deposit_amount || 0;

    const depositRefund = Math.max(0, depositAmount - totalCharges);
    const amountDueFromRenter = Math.max(0, totalCharges - depositAmount);

    setSettlement({
      rentalPrice: booking.total_price,
      kmOverageFee,
      fuelFee,
      exteriorCleaningFee,
      interiorCleaningFee,
      finesTotal,
      totalCharges,
      depositAmount,
      depositRefund,
      amountDueFromRenter,
    });
  };

  const handleCompleteRental = async () => {
    if (!settlement || !booking) return;

    setIsProcessing(true);
    try {
      if (settlement.totalCharges > 0 || settlement.depositRefund > 0) {
        await supabase.functions.invoke('generate-settlement-invoice', {
          body: {
            bookingId: booking.id,
            settlement: {
              rentalPrice: settlement.rentalPrice,
              kmOverageFee: settlement.kmOverageFee,
              fuelFee: settlement.fuelFee,
              finesTotal: settlement.finesTotal,
              totalCharges: settlement.totalCharges,
              depositAmount: settlement.depositAmount,
              depositRefund: settlement.depositRefund,
              amountDueFromRenter: settlement.amountDueFromRenter,
              fines: fines.map(f => ({
                type: f.fine_type,
                amount: f.fine_amount,
                adminFee: f.admin_fee,
                total: f.total_amount,
                date: f.fine_date,
                description: f.description
              }))
            }
          }
        });

        if (fines.length > 0) {
          const fineIds = fines.map(f => f.id);
          await supabase
            .from('fines')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .in('id', fineIds);
        }

        if (checkOutData) {
          await supabase
            .from('check_in_out_records')
            .update({ settlement_status: 'settled' })
            .eq('booking_id', booking.id)
            .eq('record_type', 'check_out');
        }
      }

      if (booking.renter_email) {
        await supabase.functions.invoke('send-settlement-email', {
          body: {
            renterEmail: booking.renter_email,
            renterName: booking.renter_name || 'Lejer',
            vehicleName: `${booking.vehicle?.make || ''} ${booking.vehicle?.model || ''}`.trim(),
            vehicleRegistration: booking.vehicle?.registration || '',
            settlement: settlement,
            fines: fines.map(f => ({
              type: f.fine_type,
              amount: f.total_amount,
              date: f.fine_date
            }))
          }
        });
      }

      await updateBookingStatus(booking.id, 'completed');
      await refetch();

      toast.success('Lejeaftale afsluttet - afregning gennemført');
      navigate('/dashboard/bookings');
    } catch (err) {
      console.error('Error completing rental:', err);
      toast.error('Kunne ikke afslutte lejeaftale');
    } finally {
      setIsProcessing(false);
    }
  };

  const fineTypeLabels: Record<string, string> = {
    parking: 'P-afgift',
    speed: 'Fartbøde',
    toll: 'Vejafgift',
    other: 'Andet'
  };

  if (!booking) {
    return (
      <DashboardLayout activeTab="bookings">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Booking ikke fundet</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="bookings">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/bookings')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Receipt className="w-6 h-6" />
              Afslut leje - Afregning
            </h2>
            <p className="text-muted-foreground">
              {booking.vehicle?.make} {booking.vehicle?.model} • {booking.renter_name}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : settlement ? (
          <div className="space-y-4">
            {/* Booking info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Bookingoplysninger
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">{booking.vehicle?.make} {booking.vehicle?.model}</p>
                <p className="text-muted-foreground font-mono">{booking.vehicle?.registration}</p>
                <p className="text-muted-foreground">
                  {format(new Date(booking.start_date), 'd. MMM', { locale: da })} - {format(new Date(booking.end_date), 'd. MMM yyyy', { locale: da })}
                </p>
                <p>Lejer: {booking.renter_name || 'Ukendt'}</p>
                {includedKm > 0 && (
                  <p className="text-muted-foreground">Inkluderet km: {includedKm} km</p>
                )}
              </CardContent>
            </Card>

            {/* Manual input section */}
            {isManualMode && (
              <Card className="border-yellow-500/50 bg-yellow-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-yellow-600" />
                    Indtast km-stand og brændstof
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Der er ikke registreret check-in/check-out data. Indtast venligst km-stand og brændstofniveau manuelt.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startOdometer" className="text-xs">Km-stand ved start</Label>
                      <Input
                        id="startOdometer"
                        type="number"
                        value={manualInput.startOdometer}
                        onChange={(e) => setManualInput(prev => ({ ...prev, startOdometer: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endOdometer" className="text-xs">Km-stand ved slut</Label>
                      <Input
                        id="endOdometer"
                        type="number"
                        value={manualInput.endOdometer}
                        onChange={(e) => setManualInput(prev => ({ ...prev, endOdometer: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startFuel" className="text-xs">Brændstof ved start (%)</Label>
                      <Input
                        id="startFuel"
                        type="number"
                        min="0"
                        max="100"
                        value={manualInput.startFuelPercent}
                        onChange={(e) => setManualInput(prev => ({ ...prev, startFuelPercent: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endFuel" className="text-xs">Brændstof ved slut (%)</Label>
                      <Input
                        id="endFuel"
                        type="number"
                        min="0"
                        max="100"
                        value={manualInput.endFuelPercent}
                        onChange={(e) => setManualInput(prev => ({ ...prev, endFuelPercent: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs">Rengøringsstatus</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="exteriorClean"
                          checked={manualInput.exteriorClean}
                          onCheckedChange={(checked) => setManualInput(prev => ({ ...prev, exteriorClean: !!checked }))}
                        />
                        <Label htmlFor="exteriorClean" className="text-sm">Udvendig ren</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="interiorClean"
                          checked={manualInput.interiorClean}
                          onCheckedChange={(checked) => setManualInput(prev => ({ ...prev, interiorClean: !!checked }))}
                        />
                        <Label htmlFor="interiorClean" className="text-sm">Indvendig ren</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fines section */}
            {fines.length > 0 && (
              <Card className="border-destructive/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    Ubetalte bøder ({fines.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {fines.map((fine) => (
                    <div key={fine.id} className="flex justify-between text-sm p-2 rounded bg-muted/50">
                      <div>
                        <span className="font-medium">{fineTypeLabels[fine.fine_type] || fine.fine_type}</span>
                        <span className="text-muted-foreground ml-2">
                          {format(new Date(fine.fine_date), 'd. MMM', { locale: da })}
                        </span>
                      </div>
                      <span className="font-semibold">{fine.total_amount} kr</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Settlement summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Afregningsoversigt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  {settlement.kmOverageFee > 0 && (
                    <div className="flex justify-between">
                      <span>Overkørte km</span>
                      <span className="font-medium">{settlement.kmOverageFee.toFixed(0)} kr</span>
                    </div>
                  )}
                  {settlement.fuelFee > 0 && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <Fuel className="w-3 h-3" /> Manglende brændstof
                      </span>
                      <span className="font-medium">{settlement.fuelFee.toFixed(0)} kr</span>
                    </div>
                  )}
                  {settlement.exteriorCleaningFee > 0 && (
                    <div className="flex justify-between">
                      <span>Udvendig rengøring</span>
                      <span className="font-medium">{settlement.exteriorCleaningFee} kr</span>
                    </div>
                  )}
                  {settlement.interiorCleaningFee > 0 && (
                    <div className="flex justify-between">
                      <span>Indvendig rengøring</span>
                      <span className="font-medium">{settlement.interiorCleaningFee} kr</span>
                    </div>
                  )}
                  {settlement.finesTotal > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>Bøder</span>
                      <span className="font-medium">{settlement.finesTotal.toFixed(0)} kr</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between font-medium">
                    <span>Ekstraomkostninger i alt</span>
                    <span>{settlement.totalCharges.toFixed(0)} kr</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Depositum indbetalt</span>
                    <span>{settlement.depositAmount} kr</span>
                  </div>
                </div>

                <Separator />

                {settlement.depositRefund > 0 && (
                  <div className="flex justify-between text-mint font-semibold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Depositum retur til lejer
                    </span>
                    <span>{settlement.depositRefund.toFixed(0)} kr</span>
                  </div>
                )}
                {settlement.amountDueFromRenter > 0 && (
                  <div className="flex justify-between text-destructive font-semibold">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Beløb til opkrævning
                    </span>
                    <span>{settlement.amountDueFromRenter.toFixed(0)} kr</span>
                  </div>
                )}
                {settlement.totalCharges === 0 && settlement.depositAmount > 0 && (
                  <div className="flex justify-between text-mint font-semibold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Fuldt depositum retur
                    </span>
                    <span>{settlement.depositAmount} kr</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => navigate('/dashboard/bookings')} className="flex-1">
                Annuller
              </Button>
              <Button onClick={handleCompleteRental} disabled={isProcessing} className="flex-1">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Behandler...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Afslut og send afregning
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default SettlementPage;
