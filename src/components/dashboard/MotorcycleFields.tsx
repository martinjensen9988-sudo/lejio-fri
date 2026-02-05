import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Bike, Shield, Briefcase, Wrench, CloudRain, Thermometer } from 'lucide-react';

interface MotorcycleFieldsProps {
  formData: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}

const MC_CATEGORIES = [
  { value: 'scooter_30', label: 'Scooter 30', description: 'Max 30 km/t - Kræver knallertbevis' },
  { value: 'scooter_45', label: 'Scooter 45', description: 'Max 45 km/t - Kræver bil- eller MC-kørekort' },
  { value: 'a1', label: 'Let MC (A1)', description: 'Max 125cc / 11kW - Kræver A1 kørekort' },
  { value: 'a2', label: 'Mellem MC (A2)', description: 'Max 35kW - Kræver A2 kørekort' },
  { value: 'a', label: 'Stor MC (A)', description: 'Ingen begrænsning - Kræver A kørekort' },
];

const HELMET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const MotorcycleFields = ({ formData, onChange }: MotorcycleFieldsProps) => {
  const isA2Category = formData.mc_category === 'a2';
  const showKwWarning = isA2Category && formData.engine_kw && formData.engine_kw > 35;

  return (
    <div className="space-y-6">
      {/* Kategorisering */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bike className="w-5 h-5" />
            Kategorisering & Specifikationer
          </CardTitle>
          <CardDescription>
            Vælg kategori for at sikre korrekt kørekortvalidering
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Køretøjskategori *</Label>
            <Select 
              value={formData.mc_category || ''} 
              onValueChange={(v) => onChange('mc_category', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vælg kategori" />
              </SelectTrigger>
              <SelectContent>
                {MC_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{cat.label}</span>
                      <span className="text-xs text-muted-foreground">{cat.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Motorstørrelse (cc)</Label>
              <Input
                type="number"
                placeholder="F.eks. 650"
                value={formData.engine_cc || ''}
                onChange={(e) => onChange('engine_cc', e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Effekt (kW)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="F.eks. 35"
                value={formData.engine_kw || ''}
                onChange={(e) => onChange('engine_kw', e.target.value ? parseFloat(e.target.value) : null)}
              />
              {showKwWarning && (
                <p className="text-xs text-destructive">
                  ⚠️ A2-kategorien tillader max 35 kW
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Sædehøjde (mm)</Label>
              <Input
                type="number"
                placeholder="F.eks. 810"
                value={formData.seat_height_mm || ''}
                onChange={(e) => onChange('seat_height_mm', e.target.value ? parseInt(e.target.value) : null)}
              />
              <p className="text-xs text-muted-foreground">
                Vigtigt for kørere der skal kunne nå jorden
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>ABS-bremser</Label>
              <p className="text-xs text-muted-foreground">Har motorcyklen ABS?</p>
            </div>
            <Switch
              checked={formData.has_abs || false}
              onCheckedChange={(v) => onChange('has_abs', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Udstyr */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Udstyr & Tilbehør
          </CardTitle>
          <CardDescription>
            Angiv medfølgende udstyr - lejere søger ofte efter "klar til tur" pakker
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Hjelm */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Hjelm inkluderet</Label>
                <p className="text-xs text-muted-foreground">Tilbyd hjelm som en del af lejen</p>
              </div>
              <Switch
                checked={formData.helmet_included || false}
                onCheckedChange={(v) => onChange('helmet_included', v)}
              />
            </div>
            {formData.helmet_included && (
              <div className="space-y-2">
                <Label>Hjelmstørrelse</Label>
                <Select 
                  value={formData.helmet_size || ''} 
                  onValueChange={(v) => onChange('helmet_size', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg størrelse" />
                  </SelectTrigger>
                  <SelectContent>
                    {HELMET_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          {/* Låse */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Sikkerhed & Låse</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label className="text-sm">Skivebremselås</Label>
                <Switch
                  checked={formData.has_disc_lock || false}
                  onCheckedChange={(v) => onChange('has_disc_lock', v)}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label className="text-sm">Kædelås</Label>
                <Switch
                  checked={formData.has_chain_lock || false}
                  onCheckedChange={(v) => onChange('has_chain_lock', v)}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label className="text-sm">Styrlås</Label>
                <Switch
                  checked={formData.has_steering_lock || false}
                  onCheckedChange={(v) => onChange('has_steering_lock', v)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Opbevaring */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Opbevaring</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label className="text-sm">Topboks</Label>
                <Switch
                  checked={formData.has_top_box || false}
                  onCheckedChange={(v) => onChange('has_top_box', v)}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label className="text-sm">Sidetasker</Label>
                <Switch
                  checked={formData.has_side_bags || false}
                  onCheckedChange={(v) => onChange('has_side_bags', v)}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label className="text-sm">Tanktaske</Label>
                <Switch
                  checked={formData.has_tank_bag || false}
                  onCheckedChange={(v) => onChange('has_tank_bag', v)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Ekstraudstyr */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Ekstraudstyr</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label className="text-sm">Mobilholder</Label>
                <Switch
                  checked={formData.has_phone_mount || false}
                  onCheckedChange={(v) => onChange('has_phone_mount', v)}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label className="text-sm">USB-udtag</Label>
                <Switch
                  checked={formData.has_usb_outlet || false}
                  onCheckedChange={(v) => onChange('has_usb_outlet', v)}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label className="text-sm">Varmehåndtag</Label>
                <Switch
                  checked={formData.has_heated_grips || false}
                  onCheckedChange={(v) => onChange('has_heated_grips', v)}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label className="text-sm">Vindskærm</Label>
                <Switch
                  checked={formData.has_windscreen || false}
                  onCheckedChange={(v) => onChange('has_windscreen', v)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vedligeholdelse */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Dæk & Kæde Status
          </CardTitle>
          <CardDescription>
            Kritisk for sikkerheden - systemet sender påmindelser automatisk
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mønsterdybde forhjul (mm)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="F.eks. 4.5"
                value={formData.tire_tread_front_mm || ''}
                onChange={(e) => onChange('tire_tread_front_mm', e.target.value ? parseFloat(e.target.value) : null)}
              />
              {formData.tire_tread_front_mm && formData.tire_tread_front_mm < 1.6 && (
                <Badge variant="destructive">Skal skiftes!</Badge>
              )}
              {formData.tire_tread_front_mm && formData.tire_tread_front_mm >= 1.6 && formData.tire_tread_front_mm < 3 && (
                <Badge variant="secondary">Snart slidt</Badge>
              )}
            </div>
            <div className="space-y-2">
              <Label>Mønsterdybde baghjul (mm)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="F.eks. 4.0"
                value={formData.tire_tread_rear_mm || ''}
                onChange={(e) => onChange('tire_tread_rear_mm', e.target.value ? parseFloat(e.target.value) : null)}
              />
              {formData.tire_tread_rear_mm && formData.tire_tread_rear_mm < 1.6 && (
                <Badge variant="destructive">Skal skiftes!</Badge>
              )}
              {formData.tire_tread_rear_mm && formData.tire_tread_rear_mm >= 1.6 && formData.tire_tread_rear_mm < 3 && (
                <Badge variant="secondary">Snart slidt</Badge>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Lovkrav: Minimum 1.0 mm mønsterdybde. Anbefalet: Over 3 mm for sikker kørsel.
          </p>
        </CardContent>
      </Card>

      {/* Forretningslogik */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Forretningsregler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Daglig km-begrænsning</Label>
            <Input
              type="number"
              placeholder="F.eks. 200"
              value={formData.mc_daily_km_limit || 200}
              onChange={(e) => onChange('mc_daily_km_limit', e.target.value ? parseInt(e.target.value) : 200)}
            />
            <p className="text-xs text-muted-foreground">
              MC-motorer slides hurtigere - anbefalet max 200-300 km/dag
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <div className="flex items-center gap-3">
              <CloudRain className="w-5 h-5 text-blue-600" />
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Regnvejrs-garanti</Label>
                <p className="text-xs text-muted-foreground">
                  Lad lejere rykke dagsleje ved kraftig regn - øger bookinger!
                </p>
              </div>
            </div>
            <Switch
              checked={formData.rain_guarantee_enabled || false}
              onCheckedChange={(v) => onChange('rain_guarantee_enabled', v)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/30">
            <div className="flex items-center gap-3">
              <Thermometer className="w-5 h-5 text-amber-600" />
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Deaktiver i vintersæson</Label>
                <p className="text-xs text-muted-foreground">
                  Skjul automatisk annoncen fra november til marts
                </p>
              </div>
            </div>
            <Switch
              checked={formData.winter_deactivated || false}
              onCheckedChange={(v) => onChange('winter_deactivated', v)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MotorcycleFields;
