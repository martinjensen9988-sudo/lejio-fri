import { Calendar, Fuel, Clock, Weight, Users, Ruler, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, addDays, addWeeks, addMonths } from "date-fns";
import { da } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SearchFiltersState, RentalPeriodType } from "@/pages/Search";

interface SearchFiltersProps {
  filters: SearchFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<SearchFiltersState>>;
}

const TRAILER_TYPES = [
  { value: 'all', label: 'Alle typer' },
  { value: 'open', label: 'Åben trailer' },
  { value: 'closed', label: 'Lukket kassetrailer' },
  { value: 'horse', label: 'Hestetrailer' },
  { value: 'boat', label: 'Bådtrailer' },
  { value: 'auto', label: 'Auto-trailer' },
  { value: 'tipper', label: 'Tiptrailer' },
];

const SearchFilters = ({ filters, setFilters }: SearchFiltersProps) => {
  const handlePeriodChange = (type: RentalPeriodType, count: number) => {
    setFilters((prev) => {
      const newFilters = { ...prev, periodType: type, periodCount: count };
      
      if (prev.startDate) {
        let endDate: Date;
        switch (type) {
          case 'weekly':
            endDate = addWeeks(prev.startDate, count);
            break;
          case 'monthly':
            endDate = addMonths(prev.startDate, count);
            break;
          default:
            // For daily: 2 days from Jan 22 = return on Jan 24 (pickup Jan 22, return Jan 24)
            endDate = addDays(prev.startDate, count);
        }
        newFilters.endDate = endDate;
      }
      
      return newFilters;
    });
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setFilters((prev) => {
      const newFilters = { ...prev, startDate: date };
      
      if (date) {
        let endDate: Date;
        switch (prev.periodType) {
          case 'weekly':
            endDate = addWeeks(date, prev.periodCount);
            break;
          case 'monthly':
            endDate = addMonths(date, prev.periodCount);
            break;
          default:
            // For daily: 2 days from Jan 22 = return on Jan 24 (pickup Jan 22, return Jan 24)
            endDate = addDays(date, prev.periodCount);
        }
        newFilters.endDate = endDate;
      }
      
      return newFilters;
    });
  };

  const resetFilters = () => {
    setFilters({
      priceMin: 0,
      priceMax: 5000,
      fuelType: "all",
      startDate: undefined,
      endDate: undefined,
      periodType: 'daily',
      periodCount: 1,
      vehicleType: 'all',
      trailerType: 'all',
      maxWeight: undefined,
      minSleepingCapacity: undefined,
    });
  };

  return (
    <div className="py-4 sm:py-6 px-4 sm:px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Trailer-specific: Type filter */}
          {filters.vehicleType === 'trailer' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Trailer-type</Label>
              <Select
                value={filters.trailerType || 'all'}
                onValueChange={(value) => 
                  setFilters((prev) => ({ ...prev, trailerType: value }))
                }
              >
                <SelectTrigger className="bg-card">
                  <Ruler className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue />
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
          )}

          {/* Trailer/Campingvogn: Max Weight filter */}
          {(filters.vehicleType === 'trailer' || filters.vehicleType === 'campingvogn') && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Max totalvægt (kg)</Label>
              <div className="relative">
                <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={filters.maxWeight || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      maxWeight: Number(e.target.value) || undefined,
                    }))
                  }
                  className="pl-10 bg-card"
                  placeholder="750"
                />
              </div>
            </div>
          )}

          {/* Campingvogn: Sleeping capacity filter */}
          {filters.vehicleType === 'campingvogn' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Min. sovepladser</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={filters.minSleepingCapacity || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minSleepingCapacity: Number(e.target.value) || undefined,
                    }))
                  }
                  className="pl-10 bg-card"
                  placeholder="2"
                />
              </div>
            </div>
          )}

          {/* Rental Period Type */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Lejetype</Label>
            <Select
              value={filters.periodType}
              onValueChange={(value: RentalPeriodType) => handlePeriodChange(value, filters.periodCount)}
            >
              <SelectTrigger className="bg-card">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Dage</SelectItem>
                <SelectItem value="weekly">Uger</SelectItem>
                <SelectItem value="monthly">Måneder</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Period Count */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Antal {filters.periodType === 'daily' ? 'dage' : filters.periodType === 'weekly' ? 'uger' : 'måneder'}
            </Label>
            <Input
              type="number"
              min={1}
              max={filters.periodType === 'monthly' ? 12 : filters.periodType === 'weekly' ? 52 : 365}
              value={filters.periodCount}
              onChange={(e) => handlePeriodChange(filters.periodType, Math.max(1, Number(e.target.value) || 1))}
              className="bg-card"
            />
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Startdato</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-card"
                >
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  {filters.startDate ? (
                    format(filters.startDate, "dd. MMM yyyy", { locale: da })
                  ) : (
                    <span className="text-muted-foreground">Vælg dato</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.startDate}
                  onSelect={handleStartDateChange}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date Display */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Slutdato</Label>
            <div className="h-10 px-3 py-2 rounded-md border border-input bg-card text-sm flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              {filters.endDate ? (
                format(filters.endDate, "dd. MMM yyyy", { locale: da })
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>

          {/* Min Price */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Min pris/dag</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
              <Input
                type="number"
                value={filters.priceMin}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    priceMin: Number(e.target.value) || 0,
                  }))
                }
                className="pl-10 bg-card"
                placeholder="0"
              />
            </div>
          </div>

          {/* Max Price */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Max pris/dag</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
              <Input
                type="number"
                value={filters.priceMax}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    priceMax: Number(e.target.value) || 10000,
                  }))
                }
                className="pl-10 bg-card"
                placeholder="5000"
              />
            </div>
          </div>

          {/* Fuel Type - Only for Cars */}
          {filters.vehicleType === 'bil' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Brændstof</Label>
              <Select
                value={filters.fuelType}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, fuelType: value }))
                }
              >
                <SelectTrigger className="bg-card">
                  <Fuel className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Alle typer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle typer</SelectItem>
                  <SelectItem value="Benzin">Benzin</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="El">El</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reset Filters */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-transparent">Reset</Label>
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Nulstil
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;
