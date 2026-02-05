import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SearchFilters from "@/components/search/SearchFilters";
import VehicleSearchCard from "@/components/search/VehicleSearchCard";
import VehicleCardSkeleton from "@/components/search/VehicleCardSkeleton";
import ActiveFilterPills from "@/components/search/ActiveFilterPills";
import EmptySearchState from "@/components/search/EmptySearchState";
import SearchMap from "@/components/search/SearchMap";
import { supabase } from '@/integrations/azure/client';
import { Car, ArrowUpDown, Search as SearchIcon, X, Truck, Tent, Sparkles, Filter, Grid3X3, List, Map, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc' | 'rating_desc';

export type VehicleTypeFilter = 'all' | 'bil' | 'trailer' | 'campingvogn' | 'motorcykel' | 'scooter';

// Public vehicle data - no sensitive fields like owner_id, vin, registration
export interface SearchVehicle {
  id: string;
  make: string;
  model: string;
  variant: string | null;
  year: number | null;
  daily_price: number | null;
  weekly_price: number | null;
  monthly_price: number | null;
  image_url: string | null;
  images?: string[]; // Multiple images from vehicle_images table
  fuel_type: string | null;
  color: string | null;
  included_km: number | null;
  extra_km_price: number | null;
  unlimited_km: boolean;
  features: string[] | null;
  deposit_required: boolean;
  deposit_amount: number | null;
  use_custom_location: boolean;
  location_address: string | null;
  location_postal_code: string | null;
  location_city: string | null;
  latitude: number | null;
  longitude: number | null;
  vehicle_type: 'bil' | 'trailer' | 'campingvogn' | 'motorcykel' | 'scooter';
  total_weight: number | null;
  requires_b_license: boolean;
  sleeping_capacity: number | null;
  has_kitchen: boolean;
  has_bathroom: boolean;
  has_awning: boolean;
  // New trailer fields
  trailer_type: string | null;
  internal_length_cm: number | null;
  internal_width_cm: number | null;
  internal_height_cm: number | null;
  plug_type: string | null;
  has_ramps: boolean;
  has_winch: boolean;
  has_tarpaulin: boolean;
  has_net: boolean;
  has_jockey_wheel: boolean;
  has_lock_included: boolean;
  has_adapter: boolean;
  tempo_approved: boolean;
  // New caravan fields
  adult_sleeping_capacity: number | null;
  child_sleeping_capacity: number | null;
  layout_type: string | null;
  has_fridge: boolean;
  has_freezer: boolean;
  has_gas_burner: boolean;
  has_toilet: boolean;
  has_shower: boolean;
  has_hot_water: boolean;
  has_mover: boolean;
  has_bike_rack: boolean;
  has_ac: boolean;
  has_floor_heating: boolean;
  has_tv: boolean;
  has_awning_tent: boolean;
  service_included: boolean;
  camping_furniture_included: boolean;
  gas_bottle_included: boolean;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  festival_use_allowed: boolean;
  // MC/Scooter fields
  mc_category: string | null;
  engine_cc: number | null;
  engine_kw: number | null;
  has_abs: boolean;
  seat_height_mm: number | null;
  helmet_included: boolean;
  helmet_size: string | null;
  rain_guarantee_enabled: boolean;
  // Display/owner fields
  display_address?: string | null;
  display_postal_code?: string | null;
  display_city?: string | null;
  owner_id?: string;
  owner_fleet_plan?: 'fleet_basic' | 'fleet_premium' | null;
  owner_lessor_status?: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
  owner_average_rating?: number | null;
  owner_company_name?: string | null;
  created_at?: string | null;
  lat?: number;
  lng?: number;
}

export type RentalPeriodType = 'daily' | 'weekly' | 'monthly';

export interface SearchFiltersState {
  priceMin: number;
  priceMax: number;
  fuelType: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  periodType: RentalPeriodType;
  periodCount: number;
  vehicleType: VehicleTypeFilter;
  trailerType?: string;
  maxWeight?: number;
  minSleepingCapacity?: number;
}

type ViewMode = 'grid' | 'list' | 'map';

const Search = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<SearchVehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<SearchVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFiltersState>({
    priceMin: 0,
    priceMax: 5000,
    fuelType: "all",
    startDate: undefined,
    endDate: undefined,
    periodType: 'daily',
    periodCount: 1,
    vehicleType: 'all',
  });

  // Check if unknown filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.priceMin > 0 ||
      filters.priceMax < 5000 ||
      filters.fuelType !== 'all' ||
      filters.startDate !== undefined ||
      filters.periodType !== 'daily' ||
      filters.periodCount !== 1 ||
      (filters.trailerType && filters.trailerType !== 'all') ||
      filters.maxWeight !== undefined ||
      filters.minSleepingCapacity !== undefined
    );
  }, [filters]);

  // Sort vehicles based on selected option
  const sortedVehicles = useMemo(() => {
    const sorted = [...filteredVehicles];
    switch (sortBy) {
      case 'price_asc':
        return sorted.sort((a, b) => (a.daily_price || 0) - (b.daily_price || 0));
      case 'price_desc':
        return sorted.sort((a, b) => (b.daily_price || 0) - (a.daily_price || 0));
      case 'date_asc':
        return sorted.sort((a, b) => 
          new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        );
      case 'date_desc':
        return sorted.sort((a, b) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
      case 'rating_desc':
        return sorted.sort((a, b) => (b.owner_average_rating || 0) - (a.owner_average_rating || 0));
      default:
        return sorted;
    }
  }, [filteredVehicles, sortBy]);

  // Fetch available vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      
      // Fetch vehicles
      const { data, error } = await supabase
        .from("vehicles_public")
        .select("*");

      if (error) {
        console.error("Error fetching vehicles:", error);
        setLoading(false);
        return;
      }

      // Fetch all vehicle images
      const vehicleIds = (data || []).map(v => v.id);
      
      // Group images by vehicle_id
      const imagesByVehicle: Record<string, string[]> = {};
      
      if (vehicleIds.length > 0) {
        const { data: imagesData } = await supabase
          .from('vehicle_images')
          .select('vehicle_id, image_url')
          .in('vehicle_id', vehicleIds)
          .order('display_order', { ascending: true });
        
        (imagesData || []).forEach((img: { vehicle_id: string; image_url: string }) => {
          if (!imagesByVehicle[img.vehicle_id]) {
            imagesByVehicle[img.vehicle_id] = [];
          }
          imagesByVehicle[img.vehicle_id].push(img.image_url);
        });
      }

      const vehiclesWithLocations = (data || []).map((vehicle) => {
        let lat = vehicle.latitude || 55.6761;
        let lng = vehicle.longitude || 12.5683;
        
        if (!vehicle.latitude || !vehicle.longitude) {
          const postalCode = vehicle.location_postal_code;
          if (postalCode) {
            const code = parseInt(postalCode);
            if (code >= 1000 && code <= 2999) {
              lat = 55.676 + (Math.random() - 0.5) * 0.1;
              lng = 12.568 + (Math.random() - 0.5) * 0.15;
            } else if (code >= 3000 && code <= 3699) {
              lat = 55.85 + (Math.random() - 0.5) * 0.2;
              lng = 12.35 + (Math.random() - 0.5) * 0.3;
            } else if (code >= 4000 && code <= 4999) {
              lat = 55.4 + (Math.random() - 0.5) * 0.3;
              lng = 11.8 + (Math.random() - 0.5) * 0.4;
            } else if (code >= 5000 && code <= 5999) {
              lat = 55.4 + (Math.random() - 0.5) * 0.15;
              lng = 10.4 + (Math.random() - 0.5) * 0.2;
            } else if (code >= 6000 && code <= 6999) {
              lat = 55.3 + (Math.random() - 0.5) * 0.3;
              lng = 9.5 + (Math.random() - 0.5) * 0.4;
            } else if (code >= 7000 && code <= 7999) {
              lat = 56.1 + (Math.random() - 0.5) * 0.3;
              lng = 9.5 + (Math.random() - 0.5) * 0.4;
            } else if (code >= 8000 && code <= 8999) {
              lat = 56.15 + (Math.random() - 0.5) * 0.2;
              lng = 10.2 + (Math.random() - 0.5) * 0.3;
            } else if (code >= 9000 && code <= 9999) {
              lat = 57.0 + (Math.random() - 0.5) * 0.3;
              lng = 10.0 + (Math.random() - 0.5) * 0.5;
            }
          } else {
            lat = 55.6 + (Math.random() - 0.5) * 1.5;
            lng = 10.5 + (Math.random() - 0.5) * 3;
          }
        }
        
        const v = vehicle;
        
        // Combine legacy image with new images
        const vehicleImages = imagesByVehicle[vehicle.id] || [];
        const allImages = [
          ...(vehicle.image_url ? [vehicle.image_url] : []),
          ...vehicleImages.filter((url: string) => url !== vehicle.image_url),
        ];
        
        return {
          ...vehicle,
          images: allImages,
          vehicle_type: vehicle.vehicle_type || 'bil',
          total_weight: vehicle.total_weight || null,
          requires_b_license: vehicle.requires_b_license ?? true,
          sleeping_capacity: vehicle.sleeping_capacity || null,
          has_kitchen: vehicle.has_kitchen || false,
          has_bathroom: vehicle.has_bathroom || false,
          has_awning: vehicle.has_awning || false,
          // MC/Scooter defaults (may not exist in view yet)
          mc_category: v.mc_category || null,
          engine_cc: v.engine_cc || null,
          engine_kw: v.engine_kw || null,
          has_abs: v.has_abs || false,
          seat_height_mm: v.seat_height_mm || null,
          helmet_included: v.helmet_included || false,
          helmet_size: v.helmet_size || null,
          rain_guarantee_enabled: v.rain_guarantee_enabled || false,
          lat,
          lng,
        } as SearchVehicle;
      });

      setVehicles(vehiclesWithLocations);
      setFilteredVehicles(vehiclesWithLocations);
      setLoading(false);
    };

    fetchVehicles();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...vehicles];

    if (filters.vehicleType !== "all") {
      result = result.filter((v) => v.vehicle_type === filters.vehicleType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((v) => {
        const make = (v.make || '').toLowerCase();
        const model = (v.model || '').toLowerCase();
        const variant = (v.variant || '').toLowerCase();
        return make.includes(query) || model.includes(query) || variant.includes(query);
      });
    }

    result = result.filter((v) => {
      const price = v.daily_price || 0;
      return price >= filters.priceMin && price <= filters.priceMax;
    });

    if (filters.maxWeight && (filters.vehicleType === 'trailer' || filters.vehicleType === 'campingvogn')) {
      result = result.filter((v) => !v.total_weight || v.total_weight <= filters.maxWeight!);
    }

    if (filters.minSleepingCapacity && filters.vehicleType === 'campingvogn') {
      const minCapacity = filters.minSleepingCapacity;
      result = result.filter((v) => {
        const totalCapacity = (v.adult_sleeping_capacity || 0) + (v.child_sleeping_capacity || 0) || v.sleeping_capacity || 0;
        return totalCapacity >= minCapacity;
      });
    }

    if (filters.trailerType && filters.trailerType !== 'all' && filters.vehicleType === 'trailer') {
      result = result.filter((v) => v.trailer_type === filters.trailerType);
    }

    setFilteredVehicles(result);
  }, [filters, vehicles, searchQuery]);

  const getVehicleTypeLabel = () => {
    switch (filters.vehicleType) {
      case 'bil': return 'biler';
      case 'trailer': return 'trailere';
      case 'campingvogn': return 'campingvogne';
      case 'motorcykel': return 'motorcykler';
      case 'scooter': return 'scootere';
      default: return 'køretøjer';
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
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

  const vehicleTypeButtons = [
    { value: 'all' as VehicleTypeFilter, label: 'Alle', icon: Sparkles, count: vehicles.length },
    { value: 'bil' as VehicleTypeFilter, label: 'Biler', icon: Car, count: vehicles.filter(v => v.vehicle_type === 'bil').length },
    { value: 'motorcykel' as VehicleTypeFilter, label: 'MC', icon: Bike, count: vehicles.filter(v => v.vehicle_type === 'motorcykel').length },
    { value: 'scooter' as VehicleTypeFilter, label: 'Scooter', icon: Bike, count: vehicles.filter(v => v.vehicle_type === 'scooter').length },
    { value: 'trailer' as VehicleTypeFilter, label: 'Trailere', icon: Truck, count: vehicles.filter(v => v.vehicle_type === 'trailer').length },
    { value: 'campingvogn' as VehicleTypeFilter, label: 'Camping', icon: Tent, count: vehicles.filter(v => v.vehicle_type === 'campingvogn').length },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero Header with premium styling */}
        <div className="relative overflow-hidden">
          {/* Premium background effects */}
          <div className="absolute inset-0 bg-mesh" />
          <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-primary rounded-full blur-[150px] opacity-[0.08]" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-accent rounded-full blur-[120px] opacity-[0.06]" />
          
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12 relative z-10">
            <div className="max-w-4xl">
              <h1 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-2 sm:mb-4 animate-slide-up">
                Find dit{" "}
                <span className="text-gradient">
                  perfekte køretøj
                </span>
              </h1>
              <p className="text-base sm:text-xl text-muted-foreground mb-4 sm:mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                {loading ? 'Henter køretøjer...' : `${filteredVehicles.length} ${getVehicleTypeLabel()} tilgængelige`}
              </p>

              {/* Premium Search Input */}
              <div className="relative animate-scale-in" style={{ animationDelay: '0.2s' }}>
                <div className="glass-strong rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-primary/30 glow-border">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-muted/30">
                      <SearchIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                      <input
                        type="text"
                        placeholder="Søg mærke, model..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm sm:text-base min-w-0"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <Button 
                      variant="hero"
                      size="default" 
                      className="font-bold px-3 sm:px-6 shrink-0"
                    >
                      <SearchIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline ml-2">Søg</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Vehicle Type Tabs + Filter Pills */}
        <div className="sticky top-16 z-30 glass-strong border-b border-border/50">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 sm:py-4 gap-3 sm:gap-4">
              {/* Vehicle type tabs - scrollable on mobile */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                {vehicleTypeButtons.map((type) => {
                  const Icon = type.icon;
                  const isActive = filters.vehicleType === type.value;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setFilters(prev => ({ ...prev, vehicleType: type.value }))}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full font-medium transition-all duration-300 whitespace-nowrap text-sm ${
                        isActive 
                          ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg glow-primary' 
                          : 'glass text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden xs:inline sm:inline">{type.label}</span>
                      <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-primary-foreground/20' : 'bg-muted/50'
                      }`}>
                        {type.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Filter button */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex-1 sm:flex-initial ${showFilters ? 'border-primary text-primary' : ''}`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtre
                  {hasActiveFilters && (
                    <span className="ml-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </Button>
              </div>
            </div>

            {/* Active Filter Pills */}
            {hasActiveFilters && (
              <div className="pb-4 -mt-1">
                <ActiveFilterPills filters={filters} setFilters={setFilters} />
              </div>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-b border-border/50 glass animate-fade-in">
            <SearchFilters filters={filters} setFilters={setFilters} />
          </div>
        )}

        {/* Results Section */}
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-lg sm:text-2xl font-bold">
                {loading ? 'Indlæser...' : `${filteredVehicles.length} ${getVehicleTypeLabel()}`}
              </h2>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Sort */}
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-[180px] bg-card text-sm">
                  <ArrowUpDown className="w-4 h-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Sorter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Nyeste først</SelectItem>
                  <SelectItem value="date_asc">Ældste først</SelectItem>
                  <SelectItem value="price_asc">Pris: Lav til høj</SelectItem>
                  <SelectItem value="price_desc">Pris: Høj til lav</SelectItem>
                  <SelectItem value="rating_desc">Bedst bedømt</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode - Desktop only */}
              <div className="hidden md:flex bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'map' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Map className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile View Toggle - Improved */}
          <div className="md:hidden flex gap-2 mb-4">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="flex-1 h-10"
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
              className="flex-1 h-10"
            >
              <Map className="w-4 h-4 mr-2" />
              Kort
            </Button>
          </div>

          {/* Loading State - Skeleton Loaders */}
          {loading ? (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <VehicleCardSkeleton key={i} viewMode={viewMode === 'list' ? 'list' : 'grid'} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Vehicle Grid/List */}
              <div className={`${viewMode === 'map' ? 'hidden lg:block lg:w-2/5' : 'w-full'}`}>
                {filteredVehicles.length === 0 ? (
                  <EmptySearchState 
                    vehicleType={filters.vehicleType}
                    onReset={resetFilters}
                    hasFilters={hasActiveFilters || searchQuery.length > 0}
                  />
                ) : (
                  <div className={`grid gap-6 ${
                    viewMode === 'grid' && !viewMode.includes('map') 
                      ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                      : viewMode === 'list' 
                        ? 'grid-cols-1' 
                        : 'grid-cols-1'
                  }`}>
                    {sortedVehicles.map((vehicle, index) => (
                      <div 
                        key={vehicle.id} 
                        className="animate-scale-in"
                        style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                      >
                        <VehicleSearchCard
                          vehicle={vehicle}
                          isSelected={selectedVehicle === vehicle.id}
                          onSelect={() => {
                            setSelectedVehicle(vehicle.id);
                            // Navigate to vehicle detail page
                            const params = new URLSearchParams();
                            if (filters.startDate) params.set('startDate', filters.startDate.toISOString());
                            if (filters.endDate) params.set('endDate', filters.endDate.toISOString());
                            params.set('periodType', filters.periodType);
                            params.set('periodCount', filters.periodCount.toString());
                            navigate(`/search/vehicle/${vehicle.id}?${params.toString()}`);
                          }}
                          filters={filters}
                          viewMode={viewMode}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Map View */}
              {viewMode === 'map' && (
                <div className="lg:w-3/5 lg:sticky lg:top-32 lg:h-[calc(100vh-10rem)]">
                  <div className="h-[500px] lg:h-full rounded-3xl overflow-hidden border-2 border-border shadow-xl">
                    <SearchMap
                      vehicles={filteredVehicles}
                      selectedVehicle={selectedVehicle}
                      onVehicleSelect={setSelectedVehicle}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default Search;
