import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  useRenterWarnings, 
  CreateWarningInput, 
  WarningReason,
  WARNING_REASON_LABELS 
} from '@/hooks/useRenterWarnings';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';

const CreateWarningPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const { createWarning } = useRenterWarnings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateWarningInput>({
    renter_email: searchParams.get('renterEmail') || '',
    renter_phone: searchParams.get('renterPhone') || '',
    renter_name: searchParams.get('renterName') || '',
    renter_license_number: searchParams.get('renterLicenseNumber') || '',
    booking_id: searchParams.get('bookingId') || undefined,
    reason: 'other',
    description: '',
    severity: 3,
    damage_amount: 0,
    unpaid_amount: 0,
  });

  const handleSubmit = async () => {
    if (!formData.renter_email || !formData.description) {
      return;
    }

    setIsSubmitting(true);
    const result = await createWarning(formData);
    setIsSubmitting(false);

    if (result) {
      navigate('/dashboard/bookings');
    }
  };

  const getSeverityLabel = (severity: number) => {
    if (severity <= 1) return 'Meget lav';
    if (severity <= 2) return 'Lav';
    if (severity <= 3) return 'Middel';
    if (severity <= 4) return 'Høj';
    return 'Meget høj';
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 1) return 'text-green-600';
    if (severity <= 2) return 'text-yellow-600';
    if (severity <= 3) return 'text-orange-500';
    if (severity <= 4) return 'text-red-500';
    return 'text-red-700';
  };

  return (
    <DashboardLayout activeTab="bookings">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tilbage
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <CardTitle>Opret advarsel om lejer</CardTitle>
                <CardDescription>
                  Advarslen vil være synlig for andre udlejere. Lejeren vil blive notificeret og kan klage.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Renter Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="renter_email">Email *</Label>
                <Input
                  id="renter_email"
                  type="email"
                  value={formData.renter_email}
                  onChange={(e) => setFormData(d => ({ ...d, renter_email: e.target.value }))}
                  placeholder="lejer@email.dk"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="renter_name">Navn</Label>
                <Input
                  id="renter_name"
                  value={formData.renter_name || ''}
                  onChange={(e) => setFormData(d => ({ ...d, renter_name: e.target.value }))}
                  placeholder="Lejerens navn"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="renter_phone">Telefon</Label>
                <Input
                  id="renter_phone"
                  value={formData.renter_phone || ''}
                  onChange={(e) => setFormData(d => ({ ...d, renter_phone: e.target.value }))}
                  placeholder="+45 12345678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="renter_license">Kørekortnummer</Label>
                <Input
                  id="renter_license"
                  value={formData.renter_license_number || ''}
                  onChange={(e) => setFormData(d => ({ ...d, renter_license_number: e.target.value }))}
                  placeholder="Kørekortnummer"
                />
              </div>
            </div>

            {/* Warning Details */}
            <div className="space-y-2">
              <Label htmlFor="reason">Årsag *</Label>
              <Select
                value={formData.reason}
                onValueChange={(value) => setFormData(d => ({ ...d, reason: value as WarningReason }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(WARNING_REASON_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(d => ({ ...d, description: e.target.value }))}
                placeholder="Beskriv hvad der skete..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Alvorlighed</Label>
                <span className={`text-sm font-medium ${getSeverityColor(formData.severity || 3)}`}>
                  {getSeverityLabel(formData.severity || 3)}
                </span>
              </div>
              <Slider
                value={[formData.severity || 3]}
                onValueChange={([value]) => setFormData(d => ({ ...d, severity: value }))}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mindre</span>
                <span>Alvorlig</span>
              </div>
            </div>

            {/* Financial Impact */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="damage_amount">Skadebeløb (kr)</Label>
                <Input
                  id="damage_amount"
                  type="number"
                  min="0"
                  value={formData.damage_amount || ''}
                  onChange={(e) => setFormData(d => ({ ...d, damage_amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unpaid_amount">Ubetalt beløb (kr)</Label>
                <Input
                  id="unpaid_amount"
                  type="number"
                  min="0"
                  value={formData.unpaid_amount || ''}
                  onChange={(e) => setFormData(d => ({ ...d, unpaid_amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <p className="text-sm text-foreground">
                <strong>Vigtigt:</strong> Lejeren vil modtage en email om advarslen og kan klage. 
                LEJIO vil behandle eventuelle klager. Advarslen gemmes i op til 5 år.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                Annuller
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.renter_email || !formData.description}
                variant="destructive"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Opret advarsel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateWarningPage;
