import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useVehicles, Vehicle } from '@/hooks/useVehicles';
import { useBookings, Booking } from '@/hooks/useBookings';
import { useDamageReports } from '@/hooks/useDamageReports';
import { supabase } from '@/integrations/azure/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { VehicleDamageSelector } from '@/components/damage/VehicleDamageSelector';
import { useToast } from '@/hooks/use-toast';
import {
  Car,
  User,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Check,
  Download,
  Mail,
  Loader2,
  Plus,
  Trash2,
  Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DAMAGE_TYPES = [
  { value: 'scratch', label: 'Ridse' },
  { value: 'dent', label: 'Bule' },
  { value: 'crack', label: 'Revne' },
  { value: 'broken', label: 'Knækket/ødelagt' },
  { value: 'stain', label: 'Plet/mærke' },
  { value: 'missing', label: 'Manglende del' },
  { value: 'other', label: 'Andet' },
];

const SEVERITY_LEVELS = [
  { value: 'minor', label: 'Mindre', color: 'bg-yellow-500' },
  { value: 'moderate', label: 'Moderat', color: 'bg-orange-500' },
  { value: 'severe', label: 'Alvorlig', color: 'bg-red-500' },
];

interface DamageItem {
  id: string;
  position: string;
  damage_type: string;
  severity: string;
  description: string;
  photo_url?: string;
  photo_file?: File;
}

export const DamageRegistrationWizard = () => {
  const { user } = useAuth();
  const { vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { bookings, isLoading: bookingsLoading } = useBookings();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [damages, setDamages] = useState<DamageItem[]>([]);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [newDamage, setNewDamage] = useState({
    damage_type: '',
    severity: 'minor',
    description: '',
  });
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Get bookings for selected vehicle
  const vehicleBookings = selectedVehicle 
    ? bookings.filter(b => b.vehicle_id === selectedVehicle.id && ['confirmed', 'active', 'completed'].includes(b.status))
    : [];

  const handleSelectVehicle = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    setSelectedVehicle(vehicle || null);
    setSelectedBooking(null);
  };

  const handleSelectBooking = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    setSelectedBooking(booking || null);
  };

  const handleAddDamage = () => {
    if (!selectedPosition || !newDamage.damage_type) {
      toast({
        title: 'Udfyld alle felter',
        description: 'Vælg position og skadetype',
        variant: 'destructive',
      });
      return;
    }

    const damage: DamageItem = {
      id: crypto.randomUUID(),
      position: selectedPosition,
      damage_type: newDamage.damage_type,
      severity: newDamage.severity,
      description: newDamage.description,
    };

    setDamages(prev => [...prev, damage]);
    setNewDamage({ damage_type: '', severity: 'minor', description: '' });
    setSelectedPosition('');
  };

  const handleRemoveDamage = (id: string) => {
    setDamages(prev => prev.filter(d => d.id !== id));
  };

  const handlePhotoUpload = async (damageId: string, file: File) => {
    setDamages(prev => prev.map(d => 
      d.id === damageId ? { ...d, photo_file: file, photo_url: URL.createObjectURL(file) } : d
    ));
  };

  const saveReport = async (sendEmail: boolean) => {
    if (!user || !selectedVehicle || !selectedBooking) return;

    if (damages.length === 0) {
      toast({
        title: 'Ingen skader registreret',
        description: 'Tilføj mindst én skade før du gemmer',
        variant: 'destructive',
      });
      return;
    }

    if (sendEmail) {
      setSendingEmail(true);
    } else {
      setSaving(true);
    }

    try {
      // Create damage report
      const { data: report, error: reportError } = await supabase
        .from('damage_reports')
        .insert({
          booking_id: selectedBooking.id,
          vehicle_id: selectedVehicle.id,
          report_type: 'standalone',
          reported_by: user.id,
          notes,
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // Upload photos and create damage items
      for (const damage of damages) {
        let photoUrl = null;
        
        if (damage.photo_file) {
          const fileExt = damage.photo_file.name.split('.').pop();
          const fileName = `${report.id}/${damage.id}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('damage-photos')
            .upload(fileName, damage.photo_file);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('damage-photos')
              .getPublicUrl(fileName);
            photoUrl = publicUrl;
          }
        }

        await supabase
          .from('damage_items')
          .insert({
            damage_report_id: report.id,
            position: damage.position,
            damage_type: damage.damage_type,
            severity: damage.severity,
            description: damage.description,
            photo_url: photoUrl,
          });
      }

      // Generate PDF
      const { data: pdfData, error: pdfError } = await supabase.functions.invoke('generate-damage-report-pdf', {
        body: { reportId: report.id, bookingId: selectedBooking.id },
      });

      if (pdfError) throw pdfError;

      // Send email if requested
      if (sendEmail && selectedBooking.renter_email) {
        const { error: emailError } = await supabase.functions.invoke('send-damage-report', {
          body: {
            reportId: report.id,
            recipientEmail: selectedBooking.renter_email,
            recipientName: selectedBooking.renter_name || 'Kunde',
            pdfUrl: pdfData.signedUrl,
            vehicleName: `${selectedVehicle.make} ${selectedVehicle.model}`,
          },
        });

        if (emailError) {
          console.error('Email error:', emailError);
          toast({
            title: 'Rapport gemt',
            description: 'Rapporten er gemt, men email kunne ikke sendes',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Rapport sendt!',
            description: `Email sendt til ${selectedBooking.renter_email}`,
          });
        }
      }

      // Download PDF
      if (pdfData?.pdfBase64) {
        const byteCharacters = atob(pdfData.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = pdfData.filename || `skadesrapport-${report.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: 'Skadesrapport gemt!',
        description: 'PDF-rapporten er downloadet',
      });

      // Reset wizard
      setStep(1);
      setSelectedVehicle(null);
      setSelectedBooking(null);
      setDamages([]);
      setNotes('');

    } catch (error) {
      console.error('Error saving damage report:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke gemme skadesrapport',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setSendingEmail(false);
    }
  };

  const canProceedToStep2 = !!selectedVehicle;
  const canProceedToStep3 = !!selectedBooking;

  const POSITION_LABELS: Record<string, string> = {
    'front-left': 'Forfra venstre',
    'front-center': 'Forfra midt',
    'front-right': 'Forfra højre',
    'left-side': 'Venstre side',
    'right-side': 'Højre side',
    'rear-left': 'Bagfra venstre',
    'rear-center': 'Bagfra midt',
    'rear-right': 'Bagfra højre',
    'roof': 'Tag',
    'interior-front': 'Kabine foran',
    'interior-rear': 'Kabine bag',
    'trunk': 'Bagagerum',
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors',
                step === s
                  ? 'bg-primary text-primary-foreground'
                  : step > s
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {step > s ? <Check className="w-5 h-5" /> : s}
            </div>
            {s < 3 && (
              <div
                className={cn(
                  'w-12 h-1 mx-1 rounded transition-colors',
                  step > s ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        {step === 1 && 'Trin 1: Vælg køretøj'}
        {step === 2 && 'Trin 2: Vælg lejer'}
        {step === 3 && 'Trin 3: Registrer skader'}
      </div>

      {/* Step 1: Select Vehicle */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Vælg køretøj
            </CardTitle>
            <CardDescription>
              Vælg det køretøj du vil registrere skader på
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {vehiclesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : vehicles.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Du har ingen køretøjer endnu
              </p>
            ) : (
              <div className="grid gap-3">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className={cn(
                      'p-4 rounded-xl border-2 cursor-pointer transition-all',
                      selectedVehicle?.id === vehicle.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => handleSelectVehicle(vehicle.id)}
                  >
                    <div className="flex items-center gap-4">
                      {vehicle.image_url ? (
                        <img
                          src={vehicle.image_url}
                          alt={`${vehicle.make} ${vehicle.model}`}
                          className="w-20 h-14 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-14 bg-muted rounded-lg flex items-center justify-center">
                          <Car className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">
                          {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.registration}
                        </p>
                      </div>
                      {selectedVehicle?.id === vehicle.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
              >
                Næste
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Renter/Booking */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Vælg lejer
            </CardTitle>
            <CardDescription>
              Vælg den booking/lejer skaden skal tilknyttes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {bookingsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : vehicleBookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Ingen bookinger fundet for dette køretøj
              </p>
            ) : (
              <div className="grid gap-3">
                {vehicleBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className={cn(
                      'p-4 rounded-xl border-2 cursor-pointer transition-all',
                      selectedBooking?.id === booking.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => handleSelectBooking(booking.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {booking.renter_name || 'Ukendt lejer'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.renter_email || 'Ingen email'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(booking.start_date).toLocaleDateString('da-DK')} - {new Date(booking.end_date).toLocaleDateString('da-DK')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={booking.status === 'active' ? 'default' : 'secondary'}>
                          {booking.status === 'active' ? 'Aktiv' : booking.status === 'completed' ? 'Afsluttet' : 'Bekræftet'}
                        </Badge>
                        {selectedBooking?.id === booking.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Tilbage
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!canProceedToStep3}
              >
                Næste
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Register Damages */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Vehicle Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <Car className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-semibold">
                    {selectedVehicle?.make} {selectedVehicle?.model} ({selectedVehicle?.registration})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Lejer: {selectedBooking?.renter_name || 'Ukendt'} ({selectedBooking?.renter_email || 'Ingen email'})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Damage Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Registrer skade
              </CardTitle>
              <CardDescription>
                Klik på bilen for at vælge skadens position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <VehicleDamageSelector
                selectedPosition={selectedPosition}
                onSelectPosition={setSelectedPosition}
                existingDamages={damages.map(d => ({
                  id: d.id,
                  position: d.position,
                  severity: d.severity,
                  damage_type: d.damage_type,
                }))}
              />

              {selectedPosition && (
                <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {POSITION_LABELS[selectedPosition] || selectedPosition}
                    </Badge>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Skadetype</Label>
                      <Select
                        value={newDamage.damage_type}
                        onValueChange={(v) => setNewDamage(p => ({ ...p, damage_type: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Vælg type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DAMAGE_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Alvorlighed</Label>
                      <Select
                        value={newDamage.severity}
                        onValueChange={(v) => setNewDamage(p => ({ ...p, severity: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SEVERITY_LEVELS.map(level => (
                            <SelectItem key={level.value} value={level.value}>
                              <div className="flex items-center gap-2">
                                <span className={cn('w-3 h-3 rounded-full', level.color)} />
                                {level.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Beskrivelse (valgfrit)</Label>
                    <Textarea
                      value={newDamage.description}
                      onChange={(e) => setNewDamage(p => ({ ...p, description: e.target.value }))}
                      placeholder="Beskriv skaden..."
                      rows={2}
                    />
                  </div>

                  <Button onClick={handleAddDamage} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Tilføj skade
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registered Damages */}
          {damages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Registrerede skader ({damages.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {damages.map((damage) => (
                  <div
                    key={damage.id}
                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border"
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full mt-1',
                        damage.severity === 'severe' ? 'bg-red-500' :
                        damage.severity === 'moderate' ? 'bg-orange-500' : 'bg-yellow-500'
                      )}
                    />
                    <div className="flex-1">
                      <p className="font-medium">
                        {POSITION_LABELS[damage.position] || damage.position} - {DAMAGE_TYPES.find(t => t.value === damage.damage_type)?.label || damage.damage_type}
                      </p>
                      {damage.description && (
                        <p className="text-sm text-muted-foreground">{damage.description}</p>
                      )}
                      
                      {/* Photo upload */}
                      <div className="mt-2">
                        {damage.photo_url ? (
                          <img
                            src={damage.photo_url}
                            alt="Skade foto"
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ) : (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePhotoUpload(damage.id, file);
                              }}
                            />
                            <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                              <Camera className="w-4 h-4" />
                              Tilføj foto
                            </div>
                          </label>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveDamage(damage.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Ekstra noter</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tilføj eventuelle noter..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="sm:flex-1">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Tilbage
            </Button>
            <Button
              onClick={() => saveReport(false)}
              disabled={saving || sendingEmail || damages.length === 0}
              className="sm:flex-1"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Gem og hent
            </Button>
            <Button
              onClick={() => saveReport(true)}
              disabled={saving || sendingEmail || damages.length === 0 || !selectedBooking?.renter_email}
              variant="secondary"
              className="sm:flex-1"
            >
              {sendingEmail ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Gem, send email og hent
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DamageRegistrationWizard;
