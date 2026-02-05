import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Camera, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  MapPin, 
  Fuel, 
  Gauge,
  AlertTriangle,
  Edit2,
  Car,
  ScanLine
} from 'lucide-react';
import { useCheckInOut } from '@/hooks/useCheckInOut';
import { useVehicleScan } from '@/hooks/useVehicleScan';
import { ARDamageScanner } from '@/components/damage/ARDamageScanner';
import { toast } from 'sonner';

interface CheckInOutWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'check_in' | 'check_out';
  booking: {
    id: string;
    vehicle_id: string;
    lessor_id: string;
    renter_id?: string;
    vehicle?: {
      registration: string;
      make: string;
      model: string;
      fuel_tank_size?: number;
      included_km?: number;
      extra_km_price?: number;
      latitude?: number;
      longitude?: number;
      exterior_cleaning_fee?: number;
      interior_cleaning_fee?: number;
    };
  };
  checkInData?: {
    confirmed_odometer: number;
    confirmed_fuel_percent: number;
  };
  fuelSettings?: {
    fuel_price_per_liter: number;
    fuel_missing_fee: number;
  };
  onComplete: () => void;
}

type Step = 'plate' | 'damage-scan' | 'dashboard' | 'confirm' | 'settlement';

export const CheckInOutWizard = ({
  open,
  onOpenChange,
  mode,
  booking,
  checkInData,
  fuelSettings,
  onComplete
}: CheckInOutWizardProps) => {
  const [step, setStep] = useState<Step>('plate');
  const [plateInput, setPlateInput] = useState('');
  const [plateVerified, setPlateVerified] = useState(false);
  const [dashboardImage, setDashboardImage] = useState<string | null>(null);
  const [aiOdometer, setAiOdometer] = useState<number | null>(null);
  const [aiFuelPercent, setAiFuelPercent] = useState<number | null>(null);
  const [confirmedOdometer, setConfirmedOdometer] = useState<number>(0);
  const [confirmedFuelPercent, setConfirmedFuelPercent] = useState<number>(100);
  const [wasManuallyAdjusted, setWasManuallyAdjusted] = useState(false);
  const [manualReason, setManualReason] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showDamageScanner, setShowDamageScanner] = useState(false);
  const [damageResults, setDamageResults] = useState<unknown[]>([]);
  const [scanSessionId, setScanSessionId] = useState<string | null>(null);
  const [exteriorClean, setExteriorClean] = useState(true);
  const [interiorClean, setInteriorClean] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const {
    isAnalyzing,
    isSubmitting,
    analyzeDashboard,
    verifyPlate,
    createCheckInRecord,
    createCheckOutRecord,
  } = useCheckInOut();

  const { createScanSession, saveScanResults, isSaving } = useVehicleScan();

  const expectedPlate = booking.vehicle?.registration || '';

  useEffect(() => {
    if (open) {
      // Get current location
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn('Could not get location:', err)
      );
    }
    return () => {
      stopCamera();
    };
  }, [open]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Kunne ikke starte kamera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const captureImage = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handlePlateVerify = () => {
    const isValid = verifyPlate(plateInput, expectedPlate);
    setPlateVerified(isValid);
    if (isValid) {
      stopCamera();
      setStep('damage-scan');
    } else {
      toast.error('Nummerpladen matcher ikke den bookede bil');
    }
  };

  const handleDamageScanComplete = async (results: unknown[]) => {
    setDamageResults(results);
    setShowDamageScanner(false);
    
    // Save scan results to database
    if (results.length > 0) {
      const sessionId = await createScanSession({
        bookingId: booking.id,
        vehicleId: booking.vehicle_id,
        lessorId: booking.lessor_id,
        renterId: booking.renter_id,
        scanType: mode,
      });

      if (sessionId) {
        setScanSessionId(sessionId);
        await saveScanResults(sessionId, results);
        toast.success('Skadesscanning gemt');
      }
    }
    
    setStep('dashboard');
  };

  const handleSkipDamageScan = () => {
    setStep('dashboard');
  };

  const handleDashboardCapture = async () => {
    const image = captureImage();
    if (!image) {
      toast.error('Kunne ikke tage billede');
      return;
    }

    setDashboardImage(image);
    stopCamera();

    // Analyze with AI
    const result = await analyzeDashboard(image);
    if (result) {
      setAiOdometer(result.odometer);
      setAiFuelPercent(result.fuel_percent);
      setConfirmedOdometer(result.odometer || 0);
      setConfirmedFuelPercent(result.fuel_percent || 100);
    }
    
    setStep('confirm');
  };

  const handleManualAdjust = () => {
    setIsEditing(true);
    setWasManuallyAdjusted(true);
  };

  const handleConfirmReadings = () => {
    if (mode === 'check_out' && checkInData) {
      setStep('settlement');
    } else {
      handleSubmit();
    }
  };

  const calculateSettlement = () => {
    if (!checkInData || mode !== 'check_out') return null;

    const kmDriven = confirmedOdometer - checkInData.confirmed_odometer;
    const includedKm = booking.vehicle?.included_km || 0;
    const kmOverage = Math.max(0, kmDriven - includedKm);
    const extraKmRate = booking.vehicle?.extra_km_price || 2.5;
    const kmOverageFee = kmOverage * extraKmRate;

    const fuelDiff = checkInData.confirmed_fuel_percent - confirmedFuelPercent;
    const fuelTolerance = 5;
    let fuelFee = 0;
    let fuelMissingLiters = 0;

    if (fuelDiff > fuelTolerance) {
      const tankSize = booking.vehicle?.fuel_tank_size || 50;
      fuelMissingLiters = (fuelDiff / 100) * tankSize;
      const pricePerLiter = fuelSettings?.fuel_price_per_liter || 12;
      const missingFee = fuelSettings?.fuel_missing_fee || 100;
      fuelFee = (fuelMissingLiters * pricePerLiter) + missingFee;
    }

    // Cleaning fees
    const exteriorCleaningFee = !exteriorClean ? (booking.vehicle?.exterior_cleaning_fee || 350) : 0;
    const interiorCleaningFee = !interiorClean ? (booking.vehicle?.interior_cleaning_fee || 500) : 0;

    return {
      kmDriven,
      kmOverage,
      kmOverageFee,
      fuelDiff,
      fuelMissingLiters,
      fuelFee,
      exteriorClean,
      interiorClean,
      exteriorCleaningFee,
      interiorCleaningFee,
      total: kmOverageFee + fuelFee + exteriorCleaningFee + interiorCleaningFee
    };
  };

  const handleSubmit = async () => {
    const params = {
      bookingId: booking.id,
      vehicleId: booking.vehicle_id,
      lessorId: booking.lessor_id,
      renterId: booking.renter_id,
      expectedPlate,
      scannedPlate: plateInput,
      confirmedOdometer,
      confirmedFuelPercent,
      wasManuallyAdjusted,
      latitude: location?.lat,
      longitude: location?.lng,
      expectedLatitude: booking.vehicle?.latitude,
      expectedLongitude: booking.vehicle?.longitude,
    };

    let result;
    if (mode === 'check_in') {
      result = await createCheckInRecord({
        ...params,
        aiOdometer: aiOdometer || undefined,
        aiFuelPercent: aiFuelPercent || undefined,
      });
    } else {
      result = await createCheckOutRecord({
        ...params,
        aiOdometer: aiOdometer || undefined,
        aiFuelPercent: aiFuelPercent || undefined,
        checkInOdometer: checkInData?.confirmed_odometer || 0,
        checkInFuelPercent: checkInData?.confirmed_fuel_percent || 100,
        includedKm: booking.vehicle?.included_km || 0,
        extraKmRate: booking.vehicle?.extra_km_price || 2.5,
        fuelTankSize: booking.vehicle?.fuel_tank_size || 50,
        fuelPricePerLiter: fuelSettings?.fuel_price_per_liter || 12,
        fuelMissingFee: fuelSettings?.fuel_missing_fee || 100,
      });
    }

    if (result) {
      onComplete();
      onOpenChange(false);
    }
  };

  const settlement = mode === 'check_out' ? calculateSettlement() : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            {mode === 'check_in' ? 'Check-in' : 'Check-out'}
            {' - '}{booking.vehicle?.make} {booking.vehicle?.model}
          </DialogTitle>
        </DialogHeader>

        <canvas ref={canvasRef} className="hidden" />

        {/* Step 1: Plate Verification */}
        {step === 'plate' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Scan eller indtast nummerpladen for at verificere bilen
              </p>
              <Badge variant="outline" className="text-lg px-4 py-2">
                Forventet: {expectedPlate}
              </Badge>
            </div>

            {cameraActive ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  Luk kamera
                </Button>
              </div>
            ) : (
              <Button onClick={startCamera} variant="outline" className="w-full">
                <Camera className="mr-2 h-4 w-4" />
                Åbn kamera
              </Button>
            )}

            <div className="space-y-2">
              <Label>Indtast nummerplade</Label>
              <Input
                value={plateInput}
                onChange={(e) => setPlateInput(e.target.value.toUpperCase())}
                placeholder="AB 12 345"
                className="text-center text-lg font-mono"
              />
            </div>

            <Button 
              onClick={handlePlateVerify}
              disabled={!plateInput}
              className="w-full"
            >
              Verificer nummerplade
            </Button>

            {plateVerified === false && plateInput && (
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-4 w-4" />
                <span>Nummerpladen matcher ikke</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: AR Damage Scan */}
        {step === 'damage-scan' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 mb-4">
              <CheckCircle className="h-5 w-5" />
              <span>Nummerplade verificeret</span>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <ScanLine className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AR Skadesscanner</h3>
                <p className="text-muted-foreground text-sm">
                  Scan bilen med kameraet for automatisk at dokumentere skader
                </p>
              </div>
            </div>

            {damageResults.length > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>
                    {damageResults.length} områder scannet, 
                    {damageResults.reduce((acc, r) => acc + (r.damages?.length || 0), 0)} skader fundet
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSkipDamageScan} className="flex-1">
                Spring over
              </Button>
              <Button onClick={() => setShowDamageScanner(true)} className="flex-1">
                <ScanLine className="mr-2 h-4 w-4" />
                Start scanning
              </Button>
            </div>

            <ARDamageScanner
              open={showDamageScanner}
              onOpenChange={setShowDamageScanner}
              vehicleInfo={{
                id: booking.vehicle_id,
                make: booking.vehicle?.make || '',
                model: booking.vehicle?.model || '',
                registration: expectedPlate,
              }}
              mode={mode}
              onComplete={handleDamageScanComplete}
            />
          </div>
        )}

        {/* Step 3: Dashboard Capture */}
        {step === 'dashboard' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 mb-4">
              <CheckCircle className="h-5 w-5" />
              <span>Nummerplade verificeret</span>
            </div>

            <p className="text-muted-foreground text-center">
              Tag et billede af instrumentbrættet med tændt kontakt
            </p>

            {!cameraActive && !dashboardImage && (
              <Button onClick={startCamera} className="w-full">
                <Camera className="mr-2 h-4 w-4" />
                Start kamera
              </Button>
            )}

            {cameraActive && (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <Button 
                  onClick={handleDashboardCapture}
                  className="w-full"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyserer...
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" />
                      Tag billede
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirm Readings */}
        {step === 'confirm' && (
          <div className="space-y-4">
            {dashboardImage && (
              <img 
                src={dashboardImage} 
                alt="Dashboard" 
                className="w-full rounded-lg"
              />
            )}

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Kilometerstand</Label>
                  <Input
                    type="number"
                    value={confirmedOdometer}
                    onChange={(e) => setConfirmedOdometer(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Brændstofniveau (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={confirmedFuelPercent}
                    onChange={(e) => setConfirmedFuelPercent(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Årsag til rettelse</Label>
                  <Textarea
                    value={manualReason}
                    onChange={(e) => setManualReason(e.target.value)}
                    placeholder="Beskriv hvorfor AI-aflæsningen blev rettet..."
                  />
                </div>
                <Button onClick={() => setIsEditing(false)} className="w-full">
                  Bekræft rettelser
                </Button>
              </div>
            ) : (
              <>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-5 w-5 text-muted-foreground" />
                        <span>Kilometerstand</span>
                      </div>
                      <span className="font-bold">{confirmedOdometer.toLocaleString()} km</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Fuel className="h-5 w-5 text-muted-foreground" />
                        <span>Brændstof</span>
                      </div>
                      <span className="font-bold">{confirmedFuelPercent}%</span>
                    </div>
                    {location && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          <span>Position</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Cleaning status - only for check-out */}
                {mode === 'check_out' && (
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <h4 className="font-medium text-sm">Rengøringsstatus</h4>
                      <div 
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => setExteriorClean(!exteriorClean)}
                      >
                        <span className="text-sm">Udvendig ren</span>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${exteriorClean ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                          {exteriorClean && <CheckCircle className="w-4 h-4 text-primary-foreground" />}
                        </div>
                      </div>
                      <div 
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => setInteriorClean(!interiorClean)}
                      >
                        <span className="text-sm">Indvendig ren</span>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${interiorClean ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                          {interiorClean && <CheckCircle className="w-4 h-4 text-primary-foreground" />}
                        </div>
                      </div>
                      {(!exteriorClean || !interiorClean) && (
                        <div className="text-xs text-muted-foreground pt-2 border-t">
                          {!exteriorClean && <p>Udvendig rengøring: {booking.vehicle?.exterior_cleaning_fee || 350} kr</p>}
                          {!interiorClean && <p>Indvendig rengøring: {booking.vehicle?.interior_cleaning_fee || 500} kr</p>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {wasManuallyAdjusted && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Manuelt rettet - kræver gennemgang</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleManualAdjust}
                    className="flex-1"
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Ret tal
                  </Button>
                  <Button 
                    onClick={handleConfirmReadings}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Bekræft
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 4: Settlement (Check-out only) */}
        {step === 'settlement' && settlement && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Automatisk afregning</h3>

            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Kilometer</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Kørt:</span>
                    <span>{settlement.kmDriven} km</span>
                    <span className="text-muted-foreground">Inkluderet:</span>
                    <span>{booking.vehicle?.included_km || 0} km</span>
                    {settlement.kmOverage > 0 && (
                      <>
                        <span className="text-destructive">Overkørsel:</span>
                        <span className="text-destructive">{settlement.kmOverage} km</span>
                        <span className="text-destructive">Gebyr:</span>
                        <span className="text-destructive font-bold">{settlement.kmOverageFee.toFixed(2)} kr</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Brændstof</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Start:</span>
                    <span>{checkInData?.confirmed_fuel_percent}%</span>
                    <span className="text-muted-foreground">Slut:</span>
                    <span>{confirmedFuelPercent}%</span>
                    {settlement.fuelFee > 0 && (
                      <>
                        <span className="text-destructive">Mangler:</span>
                        <span className="text-destructive">{settlement.fuelMissingLiters.toFixed(1)} liter</span>
                        <span className="text-destructive">Gebyr:</span>
                        <span className="text-destructive font-bold">{settlement.fuelFee.toFixed(2)} kr</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Cleaning fees section */}
                {(settlement.exteriorCleaningFee > 0 || settlement.interiorCleaningFee > 0) && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Rengøring</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {settlement.exteriorCleaningFee > 0 && (
                        <>
                          <span className="text-destructive">Udvendig rengøring:</span>
                          <span className="text-destructive font-bold">{settlement.exteriorCleaningFee.toFixed(2)} kr</span>
                        </>
                      )}
                      {settlement.interiorCleaningFee > 0 && (
                        <>
                          <span className="text-destructive">Indvendig rengøring:</span>
                          <span className="text-destructive font-bold">{settlement.interiorCleaningFee.toFixed(2)} kr</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total ekstra opkrævning:</span>
                    <span className={settlement.total > 0 ? 'text-destructive' : 'text-primary'}>
                      {settlement.total.toFixed(2)} kr
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handleSubmit}
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Afslut check-out
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
