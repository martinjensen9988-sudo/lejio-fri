import { useState } from "react";
import { Car, Bell, MapPin, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface EmptySearchStateProps {
  vehicleType: string;
  onReset: () => void;
  hasFilters: boolean;
}

const EmptySearchState = ({ vehicleType, onReset, hasFilters }: EmptySearchStateProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getVehicleLabel = () => {
    switch (vehicleType) {
      case 'bil': return 'biler';
      case 'trailer': return 'trailere';
      case 'campingvogn': return 'campingvogne';
      default: return 'køretøjer';
    }
  };

  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    
    // Simulate API call - in production this would save to database
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Du er tilmeldt! 🎉",
      description: `Vi sender dig en besked, når der kommer nye ${getVehicleLabel()} i dit område.`,
    });
    
    setEmail("");
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
          <Car className="w-16 h-16 text-primary/60" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-muted rounded-full flex items-center justify-center border-4 border-background">
          <Search className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      {/* Text */}
      <h3 className="font-display text-2xl font-bold text-foreground mb-2 text-center">
        Ingen {getVehicleLabel()} fundet
      </h3>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        {hasFilters 
          ? `Vi kunne ikke finde ${getVehicleLabel()}, der matcher dine filtre. Prøv at justere dine søgekriterier.`
          : `Der er i øjeblikket ingen ${getVehicleLabel()} tilgængelige. Men bare rolig – nye kommer snart!`
        }
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        {hasFilters && (
          <Button variant="outline" onClick={onReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Nulstil filtre
          </Button>
        )}
        <Button variant="outline" className="gap-2">
          <MapPin className="w-4 h-4" />
          Se alle i Danmark
        </Button>
      </div>

      {/* Lead capture */}
      <div className="w-full max-w-md bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 border border-primary/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Få besked om nye {getVehicleLabel()}</h4>
            <p className="text-sm text-muted-foreground">Vi notificerer dig straks, når der kommer noget nyt</p>
          </div>
        </div>
        
        <form onSubmit={handleNotifyMe} className="flex gap-2">
          <Input
            type="email"
            placeholder="Din email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-background"
            required
          />
          <Button type="submit" disabled={isSubmitting} className="bg-primary shrink-0">
            {isSubmitting ? "..." : "Tilmeld"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EmptySearchState;
