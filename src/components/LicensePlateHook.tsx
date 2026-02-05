import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Car, Calendar, Fuel, ArrowRight, BadgeCheck } from "lucide-react";
import { useVehicleLookup, VehicleData } from "@/hooks/useVehicleLookup";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const LicensePlateHook = () => {
  const navigate = useNavigate();
  const [registration, setRegistration] = useState("");
  const { vehicle, isLoading, error, lookupVehicle, reset } = useVehicleLookup();

  const handleLookup = async () => {
    if (!registration.trim()) {
      toast.error("Indtast venligst en nummerplade");
      return;
    }
    
    const result = await lookupVehicle(registration);
    if (result) {
      toast.success(`${result.make} ${result.model} fundet!`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLookup();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegistration(e.target.value);
    if (vehicle) {
      reset();
    }
  };

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Bold background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 via-accent/10 to-mint/20" />
        
        {/* Large decorative shapes */}
        <div className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-secondary rounded-full blur-[100px] opacity-30" />
        <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-mint rounded-full blur-[120px] opacity-25" />
        
        {/* Small decorative elements */}
        <div className="absolute top-20 right-[20%] w-4 h-4 bg-accent rounded-full animate-bounce-soft" />
        <div className="absolute bottom-32 left-[15%] w-6 h-6 bg-primary rounded-lg rotate-45 animate-float" />
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/40 text-sm font-bold text-foreground mb-8 animate-scale-in">
            <BadgeCheck className="w-4 h-4 text-accent" />
            <span>Automatisk værdiberegning</span>
          </div>

          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black mb-4 animate-slide-up">
            Hvad kan du{" "}
            <span className="bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">tjene?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Indtast din nummerplade og se hvad dit køretøj kan indbringe.
          </p>

          {/* License Plate Input */}
          <div className="max-w-md mx-auto mb-10 animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="bg-card rounded-2xl p-3 shadow-2xl border-4 border-destructive/50 relative overflow-hidden hover:border-destructive/70 transition-colors">
              {/* EU stripe */}
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-primary flex flex-col items-center justify-center rounded-l-lg">
                <div className="text-[10px] text-primary-foreground font-bold">DK</div>
                <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-secondary" />
                  ))}
                </div>
              </div>
              
              <input 
                type="text" 
                placeholder="AB 12 345"
                value={registration}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="w-full bg-card text-foreground text-center text-4xl font-black py-6 pl-14 pr-4 rounded-xl outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/30 uppercase tracking-[0.2em]"
                maxLength={8}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-destructive text-sm mb-6 animate-fade-in font-medium">{error}</p>
          )}

          {/* Vehicle result */}
          {vehicle && (
            <VehicleCard vehicle={vehicle} />
          )}

          <Button 
            size="xl" 
            className="bg-gradient-to-r from-accent to-secondary text-accent-foreground font-bold text-lg group shadow-xl shadow-accent/30 hover:shadow-accent/50 transition-all animate-scale-in" 
            style={{ animationDelay: '0.3s' }}
            onClick={vehicle ? () => navigate('/auth') : handleLookup}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Henter data...
              </>
            ) : vehicle ? (
              <>
                Opret og tjen penge
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            ) : (
              <>
                Find mit køretøj
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </>
            )}
          </Button>

          <p className="text-sm text-muted-foreground mt-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            Data hentes automatisk via Motorregisteret. Det tager kun 2 sekunder.
          </p>
        </div>
      </div>
    </section>
  );
};

const VehicleCard = ({ vehicle }: { vehicle: VehicleData }) => {
  return (
    <div className="bg-card rounded-3xl p-8 shadow-2xl border-2 border-mint/40 mb-10 animate-scale-in text-left max-w-md mx-auto">
      <div className="flex items-center gap-5 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mint to-mint/60 flex items-center justify-center shadow-lg shadow-mint/30">
          <Car className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="font-display text-2xl font-bold text-foreground">
            {vehicle.make} {vehicle.model}
          </h3>
          {vehicle.variant && (
            <p className="text-muted-foreground">{vehicle.variant}</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        {vehicle.year > 0 && (
          <div className="bg-muted/30 rounded-xl p-3 text-center">
            <Calendar className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <span className="text-sm font-bold text-foreground">{vehicle.year}</span>
          </div>
        )}
        {vehicle.fuel_type && (
          <div className="bg-muted/30 rounded-xl p-3 text-center">
            <Fuel className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <span className="text-sm font-bold text-foreground capitalize">{vehicle.fuel_type}</span>
          </div>
        )}
        {vehicle.color && (
          <div className="bg-muted/30 rounded-xl p-3 text-center">
            <div className="w-5 h-5 rounded-full bg-muted border-2 border-border mx-auto mb-1" />
            <span className="text-sm font-bold text-foreground capitalize">{vehicle.color}</span>
          </div>
        )}
      </div>

      {/* Estimated earnings */}
      <div className="bg-gradient-to-r from-mint/10 to-accent/10 rounded-2xl p-5 border border-mint/30">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground font-medium">Estimeret indtjening</span>
          <span className="font-display text-3xl font-black text-mint">3.000+ kr/md</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Baseret på gennemsnitlig udlejning i dit område</p>
      </div>
    </div>
  );
};

export default LicensePlateHook;
