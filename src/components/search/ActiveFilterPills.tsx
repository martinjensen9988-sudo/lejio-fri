import { X, Calendar, Fuel, Weight, Users, Clock, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchFiltersState, RentalPeriodType } from "@/pages/Search";
import { format } from "date-fns";
import { da } from "date-fns/locale";

interface ActiveFilterPillsProps {
  filters: SearchFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<SearchFiltersState>>;
}

const TRAILER_TYPE_LABELS: Record<string, string> = {
  'open': 'Åben trailer',
  'closed': 'Kassetrailer',
  'horse': 'Hestetrailer',
  'boat': 'Bådtrailer',
  'auto': 'Auto-trailer',
  'tipper': 'Tiptrailer',
};

const ActiveFilterPills = ({ filters, setFilters }: ActiveFilterPillsProps) => {
  const activeFilters: { key: string; label: string; icon: React.ReactNode; onRemove: () => void }[] = [];

  // Period type filter
  if (filters.periodType !== 'daily' || filters.periodCount !== 1) {
    const periodLabel = filters.periodType === 'monthly' 
      ? `${filters.periodCount} md` 
      : filters.periodType === 'weekly' 
        ? `${filters.periodCount} uger` 
        : `${filters.periodCount} dage`;
    activeFilters.push({
      key: 'period',
      label: periodLabel,
      icon: <Clock className="w-3 h-3" />,
      onRemove: () => setFilters(prev => ({ ...prev, periodType: 'daily', periodCount: 1 })),
    });
  }

  // Date filter
  if (filters.startDate) {
    activeFilters.push({
      key: 'dates',
      label: format(filters.startDate, "d. MMM", { locale: da }),
      icon: <Calendar className="w-3 h-3" />,
      onRemove: () => setFilters(prev => ({ ...prev, startDate: undefined, endDate: undefined })),
    });
  }

  // Price filters
  if (filters.priceMin > 0) {
    activeFilters.push({
      key: 'priceMin',
      label: `Min ${filters.priceMin} kr`,
      icon: null,
      onRemove: () => setFilters(prev => ({ ...prev, priceMin: 0 })),
    });
  }

  if (filters.priceMax < 5000) {
    activeFilters.push({
      key: 'priceMax',
      label: `Max ${filters.priceMax} kr`,
      icon: null,
      onRemove: () => setFilters(prev => ({ ...prev, priceMax: 5000 })),
    });
  }

  // Fuel type filter (for cars)
  if (filters.fuelType !== 'all' && filters.vehicleType === 'bil') {
    activeFilters.push({
      key: 'fuel',
      label: filters.fuelType,
      icon: <Fuel className="w-3 h-3" />,
      onRemove: () => setFilters(prev => ({ ...prev, fuelType: 'all' })),
    });
  }

  // Trailer type filter
  if (filters.trailerType && filters.trailerType !== 'all' && filters.vehicleType === 'trailer') {
    activeFilters.push({
      key: 'trailerType',
      label: TRAILER_TYPE_LABELS[filters.trailerType] || filters.trailerType,
      icon: <Ruler className="w-3 h-3" />,
      onRemove: () => setFilters(prev => ({ ...prev, trailerType: 'all' })),
    });
  }

  // Max weight filter
  if (filters.maxWeight && (filters.vehicleType === 'trailer' || filters.vehicleType === 'campingvogn')) {
    activeFilters.push({
      key: 'weight',
      label: `Max ${filters.maxWeight} kg`,
      icon: <Weight className="w-3 h-3" />,
      onRemove: () => setFilters(prev => ({ ...prev, maxWeight: undefined })),
    });
  }

  // Sleeping capacity filter
  if (filters.minSleepingCapacity && filters.vehicleType === 'campingvogn') {
    activeFilters.push({
      key: 'sleeping',
      label: `Min ${filters.minSleepingCapacity} sovepl.`,
      icon: <Users className="w-3 h-3" />,
      onRemove: () => setFilters(prev => ({ ...prev, minSleepingCapacity: undefined })),
    });
  }

  if (activeFilters.length === 0) return null;

  const clearAllFilters = () => {
    setFilters({
      priceMin: 0,
      priceMax: 5000,
      fuelType: "all",
      startDate: undefined,
      endDate: undefined,
      periodType: 'daily',
      periodCount: 1,
      vehicleType: filters.vehicleType, // Keep vehicle type
      trailerType: 'all',
      maxWeight: undefined,
      minSleepingCapacity: undefined,
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {activeFilters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="pl-2.5 pr-1.5 py-1.5 gap-1.5 text-sm font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer group"
          onClick={filter.onRemove}
        >
          {filter.icon}
          {filter.label}
          <X className="w-3.5 h-3.5 ml-0.5 opacity-60 group-hover:opacity-100 transition-opacity" />
        </Badge>
      ))}
      
      {activeFilters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="text-muted-foreground hover:text-foreground text-xs h-7 px-2"
        >
          Ryd alle
        </Button>
      )}
    </div>
  );
};

export default ActiveFilterPills;
