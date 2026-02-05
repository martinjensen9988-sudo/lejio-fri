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

const LAYOUT_TYPES = [
  { value: 'double_bed', label: 'Dobbeltseng' },
  { value: 'single_beds', label: 'Enkeltsenge' },
  { value: 'french_bed', label: 'Fransk seng' },
  { value: 'round_seating', label: 'Rundsiddegruppe' },
];

interface CaravanFieldsProps {
  vehicleDetails: Record<string, unknown>;
  setVehicleDetails: (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => void;
}

export const CaravanFields = ({ vehicleDetails, setVehicleDetails }: CaravanFieldsProps) => {
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Campingvogn-specifikationer</Label>
      
      {/* Sleeping Capacity */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Sovepladser</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Voksne</Label>
            <Input
              type="number"
              value={(vehicleDetails.adult_sleeping_capacity as number) || ''}
              onChange={(e) => setVehicleDetails((prev) => ({ ...prev, adult_sleeping_capacity: parseInt(e.target.value) || undefined }))}
              placeholder="2"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Børn/køjer</Label>
            <Input
              type="number"
              value={(vehicleDetails.child_sleeping_capacity as number) || ''}
              onChange={(e) => setVehicleDetails((prev) => ({ ...prev, child_sleeping_capacity: parseInt(e.target.value) || undefined }))}
              placeholder="2"
            />
          </div>
        </div>
      </div>

      {/* Layout Type */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Indretning</Label>
        <Select
          value={(vehicleDetails.layout_type as string) || ''}
          onValueChange={(value) => setVehicleDetails((prev) => ({ ...prev, layout_type: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Vælg indretning" />
          </SelectTrigger>
          <SelectContent>
            {LAYOUT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kitchen & Bath */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Køkken & Bad</Label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'has_fridge', label: 'Køleskab' },
            { key: 'has_freezer', label: 'Fryser' },
            { key: 'has_gas_burner', label: 'Gasblus' },
            { key: 'has_toilet', label: 'Toilet' },
            { key: 'has_shower', label: 'Brusebad' },
            { key: 'has_hot_water', label: 'Varmt vand' },
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

      {/* Equipment */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Udstyr</Label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'has_awning_tent', label: 'Fortelt' },
            { key: 'has_awning', label: 'Markise' },
            { key: 'has_mover', label: 'Mover' },
            { key: 'has_bike_rack', label: 'Cykelstativ' },
            { key: 'has_ac', label: 'Aircondition' },
            { key: 'has_floor_heating', label: 'Gulvvarme' },
            { key: 'has_tv', label: 'TV' },
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

      {/* Included Items */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Medfølger</Label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'service_included', label: 'Service/bestik' },
            { key: 'camping_furniture_included', label: 'Campingmøbler' },
            { key: 'gas_bottle_included', label: 'Gasflaske inkl.' },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center space-x-2 p-2 rounded-lg bg-mint/10 border border-mint/20 cursor-pointer"
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

      {/* Rules */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Regler</Label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'pets_allowed', label: 'Husdyr tilladt' },
            { key: 'smoking_allowed', label: 'Rygning tilladt' },
            { key: 'festival_use_allowed', label: 'Festival tilladt' },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center space-x-2 p-2 rounded-lg bg-coral/10 border border-coral/20 cursor-pointer"
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
