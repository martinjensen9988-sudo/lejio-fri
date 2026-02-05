import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TRAILER_TYPES = [
  { value: 'open', label: 'Åben trailer' },
  { value: 'closed', label: 'Lukket kassetrailer' },
  { value: 'horse', label: 'Hestetrailer' },
  { value: 'boat', label: 'Bådtrailer' },
  { value: 'auto', label: 'Auto-trailer' },
  { value: 'tipper', label: 'Tiptrailer' },
];

const PLUG_TYPES = [
  { value: '7-pin', label: '7-polet' },
  { value: '13-pin', label: '13-polet' },
];

interface TrailerFieldsProps {
  vehicleDetails: Record<string, unknown>;
  setVehicleDetails: (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => void;
}

export const TrailerFields = ({ vehicleDetails, setVehicleDetails }: TrailerFieldsProps) => {
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Trailer-specifikationer</Label>
      
      {/* Trailer Type */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Trailer-type</Label>
        <Select
          value={(vehicleDetails.trailer_type as string) || ''}
          onValueChange={(value) => setVehicleDetails((prev) => ({ ...prev, trailer_type: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Vælg type" />
          </SelectTrigger>
          <SelectContent>
            {TRAILER_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Internal Dimensions */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Ladmål (indvendigt i cm)</Label>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Længde</Label>
            <Input
              type="number"
              value={(vehicleDetails.internal_length_cm as number) || ''}
              onChange={(e) => setVehicleDetails((prev) => ({ ...prev, internal_length_cm: parseInt(e.target.value) || undefined }))}
              placeholder="300"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bredde</Label>
            <Input
              type="number"
              value={(vehicleDetails.internal_width_cm as number) || ''}
              onChange={(e) => setVehicleDetails((prev) => ({ ...prev, internal_width_cm: parseInt(e.target.value) || undefined }))}
              placeholder="150"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Højde</Label>
            <Input
              type="number"
              value={(vehicleDetails.internal_height_cm as number) || ''}
              onChange={(e) => setVehicleDetails((prev) => ({ ...prev, internal_height_cm: parseInt(e.target.value) || undefined }))}
              placeholder="100"
            />
          </div>
        </div>
      </div>

      {/* Plug Type */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Stiktype</Label>
        <Select
          value={(vehicleDetails.plug_type as string) || ''}
          onValueChange={(value) => setVehicleDetails((prev) => ({ ...prev, plug_type: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Vælg stiktype" />
          </SelectTrigger>
          <SelectContent>
            {PLUG_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tempo Approved */}
      <div 
        className="flex items-center space-x-3 p-3 rounded-xl bg-mint/10 border border-mint/20 cursor-pointer"
        onClick={() => setVehicleDetails((prev) => ({ ...prev, tempo_approved: !prev.tempo_approved }))}
      >
        <Checkbox
          id="tempo_approved"
          checked={(vehicleDetails.tempo_approved as boolean) || false}
          onCheckedChange={(checked) => setVehicleDetails((prev) => ({ ...prev, tempo_approved: !!checked }))}
        />
        <label htmlFor="tempo_approved" className="text-sm font-medium cursor-pointer select-none">
          Tempo 100-godkendt (må køre 100 km/t)
        </label>
      </div>

      {/* B-License */}
      <div 
        className="flex items-center space-x-3 p-3 rounded-xl bg-lavender/10 border border-lavender/20 cursor-pointer"
        onClick={() => setVehicleDetails((prev) => ({ ...prev, requires_b_license: !prev.requires_b_license }))}
      >
        <Checkbox
          id="requires_b_license"
          checked={(vehicleDetails.requires_b_license as boolean) ?? true}
          onCheckedChange={(checked) => setVehicleDetails((prev) => ({ ...prev, requires_b_license: !!checked }))}
        />
        <label htmlFor="requires_b_license" className="text-sm font-medium cursor-pointer select-none">
          Kan trækkes med B-kørekort (under 750 kg)
        </label>
      </div>

      {/* Accessories */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Tilbehør</Label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'has_ramps', label: 'Ramper' },
            { key: 'has_winch', label: 'Spil' },
            { key: 'has_tarpaulin', label: 'Presenning' },
            { key: 'has_net', label: 'Net' },
            { key: 'has_jockey_wheel', label: 'Næsehjul' },
            { key: 'has_lock_included', label: 'Lås inkluderet' },
            { key: 'has_adapter', label: 'Adapter' },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center space-x-2 p-2 rounded-lg bg-muted/50 border border-border cursor-pointer"
              onClick={() => setVehicleDetails((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
            >
              <Checkbox
                id={item.key}
                checked={(vehicleDetails[item.key] as boolean) || false}
                onCheckedChange={(checked) => setVehicleDetails((prev) => ({ ...prev, [item.key]: !!checked }))}
              />
              <label htmlFor={item.key} className="text-xs cursor-pointer select-none">
                {item.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
