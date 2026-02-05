import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Car, Fuel, AlertTriangle, Save, Loader2, ArrowLeft } from 'lucide-react';
import { useDamageReports, CreateDamageReportInput, CreateDamageItemInput } from '@/hooks/useDamageReports';
import { toast } from 'sonner';

const VEHICLE_POSITIONS = [
  { value: 'front-left', label: 'Forfra venstre' },
  { value: 'front-center', label: 'Forfra midt' },
  { value: 'front-right', label: 'Forfra højre' },
  { value: 'left-side', label: 'Venstre side' },
  { value: 'right-side', label: 'Højre side' },
  { value: 'rear-left', label: 'Bagfra venstre' },
  { value: 'rear-center', label: 'Bagfra midt' },
  { value: 'rear-right', label: 'Bagfra højre' },
  { value: 'roof', label: 'Tag' },
  { value: 'interior-front', label: 'Kabine foran' },
  { value: 'interior-rear', label: 'Kabine bag' },
  { value: 'trunk', label: 'Bagagerum' },
];

const DAMAGE_TYPES = [
  { value: 'scratch', label: 'Ridse' },
  { value: 'dent', label: 'Bule' },
  { value: 'crack', label: 'Revne' },
  { value: 'stain', label: 'Plet' },
  { value: 'tear', label: 'Flaenge' },
  { value: 'missing', label: 'Mangler' },
  { value: 'broken', label: 'Oedelagt' },
  { value: 'other', label: 'Andet' },
];

const FUEL_LEVELS = [
  { value: 'empty', label: 'Tom' },
  { value: 'quarter', label: '1/4' },
  { value: 'half', label: '1/2' },
  { value: 'three_quarters', label: '3/4' },
  { value: 'full', label: 'Fuld' },
];

interface DamageItemDraft {
  position: string;
  damage_type: string;
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
  photo_url?: string;
}

const DamageReportPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reportType = (searchParams.get('type') as 'pickup' | 'return') || 'pickup';
  const vehicleId = searchParams.get('vehicleId') || '';
  const contractId = searchParams.get('contractId') || undefined;

  const { reports, createReport, updateReport, addDamageItem, isLoading } = useDamageReports(bookingId);
  const [isSaving, setIsSaving] = useState(false);
  
  const existingReport = reports.find(r => r.report_type === reportType);

  const [formData, setFormData] = useState({
    odometer_reading: '',
    fuel_level: 'full' as 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full',
    exterior_clean: true,
    interior_clean: true,
    notes: '',
  });

  const [damageItems, setDamageItems] = useState<DamageItemDraft[]>([]);

  useEffect(() => {
    if (existingReport) {
      setFormData({
        odometer_reading: existingReport.odometer_reading?.toString() || '',
        fuel_level: existingReport.fuel_level || 'full',
        exterior_clean: existingReport.exterior_clean ?? true,
        interior_clean: existingReport.interior_clean ?? true,
        notes: existingReport.notes || '',
      });
      if (existingReport.damage_items) {
        setDamageItems(existingReport.damage_items.map(item => ({
          position: item.position,
          damage_type: item.damage_type,
          severity: item.severity,
          description: item.description || '',
          photo_url: item.photo_url || undefined,
        })));
      }
    }
  }, [existingReport]);

  const addDamageItemDraft = () => {
    setDamageItems([...damageItems, {
      position: '',
      damage_type: '',
      severity: 'minor',
      description: '',
    }]);
  };

  const removeDamageItem = (index: number) => {
    setDamageItems(damageItems.filter((_, i) => i !== index));
  };

  const updateDamageItemDraft = (index: number, field: keyof DamageItemDraft, value: string) => {
    const updated = [...damageItems];
    updated[index] = { ...updated[index], [field]: value };
    setDamageItems(updated);
  };

  const handleSubmit = async () => {
    if (!bookingId || !vehicleId) {
      toast.error('Manglende booking eller køretøj information');
      return;
    }

    setIsSaving(true);

    try {
      const reportData: CreateDamageReportInput = {
        booking_id: bookingId,
        vehicle_id: vehicleId,
        contract_id: contractId,
        report_type: reportType,
        odometer_reading: formData.odometer_reading ? parseInt(formData.odometer_reading) : undefined,
        fuel_level: formData.fuel_level,
        exterior_clean: formData.exterior_clean,
        interior_clean: formData.interior_clean,
        notes: formData.notes || undefined,
      };

      if (existingReport) {
        await updateReport(existingReport.id, reportData);
      } else {
        const newReport = await createReport(reportData);
        
        // Add damage items if report was created
        if (newReport) {
          const validDamageItems = damageItems.filter(item => 
            item.position && item.damage_type && item.severity
          );
          
          for (const item of validDamageItems) {
            await addDamageItem({
              damage_report_id: newReport.id,
              position: item.position,
              damage_type: item.damage_type,
              severity: item.severity,
              description: item.description || undefined,
              photo_url: item.photo_url,
            });
          }
        }
      }

      toast.success('Skaderapport gemt');
      navigate(-1);
    } catch (error) {
      console.error('Error saving damage report:', error);
      toast.error('Kunne ikke gemme skaderapport');
    } finally {
      setIsSaving(false);
    }
  };

  if (!bookingId) {
    return (
      <DashboardLayout activeTab="bookings">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Booking ikke fundet</h2>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbage
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="bookings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Car className="w-6 h-6 text-primary" />
              {reportType === 'pickup' ? 'Afhentningsrapport' : 'Afleveringsrapport'}
            </h1>
            <p className="text-muted-foreground">
              {existingReport ? 'Rediger eksisterende rapport' : 'Opret ny skaderapport'}
            </p>
          </div>
        </div>

        {/* Vehicle Condition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="w-5 h-5" />
              Køretøjets tilstand
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kilometerstand</Label>
                <Input
                  type="number"
                  value={formData.odometer_reading}
                  onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value })}
                  placeholder="123456"
                />
              </div>
              <div className="space-y-2">
                <Label>Brændstofniveau</Label>
                <Select
                  value={formData.fuel_level}
                  onValueChange={(value: 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full') => setFormData({ ...formData, fuel_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FUEL_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="exterior_clean"
                  checked={formData.exterior_clean}
                  onCheckedChange={(checked) => setFormData({ ...formData, exterior_clean: checked === true })}
                />
                <Label htmlFor="exterior_clean">Udvendig ren</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="interior_clean"
                  checked={formData.interior_clean}
                  onCheckedChange={(checked) => setFormData({ ...formData, interior_clean: checked === true })}
                />
                <Label htmlFor="interior_clean">Indvendig ren</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Damage Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Skader ({damageItems.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addDamageItemDraft}>
              <Plus className="w-4 h-4 mr-2" />
              Tilføj skade
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {damageItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Ingen skader registreret. Klik "Tilføj skade" for at registrere en skade.
              </p>
            ) : (
              damageItems.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Skade #{index + 1}</h4>
                    <Button variant="ghost" size="icon" onClick={() => removeDamageItem(index)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Select
                        value={item.position}
                        onValueChange={(value) => updateDamageItemDraft(index, 'position', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Vælg position" />
                        </SelectTrigger>
                        <SelectContent>
                          {VEHICLE_POSITIONS.map(pos => (
                            <SelectItem key={pos.value} value={pos.value}>
                              {pos.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={item.damage_type}
                        onValueChange={(value) => updateDamageItemDraft(index, 'damage_type', value)}
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
                        value={item.severity}
                        onValueChange={(value) => updateDamageItemDraft(index, 'severity', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minor">Mindre</SelectItem>
                          <SelectItem value="moderate">Moderat</SelectItem>
                          <SelectItem value="severe">Alvorlig</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Beskrivelse</Label>
                    <Textarea
                      value={item.description || ''}
                      onChange={(e) => updateDamageItemDraft(index, 'description', e.target.value)}
                      placeholder="Beskriv skaden..."
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Bemærkninger</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Yderligere bemærkninger..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Annuller
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Gemmer...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Gem rapport
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DamageReportPage;
