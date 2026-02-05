import { Car, MapPin, User, Building2 } from "lucide-react";

const HeroVisual = () => {
  return (
    <div className="relative w-full aspect-square max-w-lg mx-auto">
      {/* Map Background */}
      <div className="absolute inset-4 rounded-2xl bg-card border border-border overflow-hidden">
        {/* Map grid lines */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Road lines */}
        <div className="absolute top-1/3 left-0 right-0 h-px bg-primary/30" />
        <div className="absolute top-2/3 left-0 right-0 h-px bg-primary/20" />
        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-primary/30" />
        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-primary/20" />
        
        {/* Map location dots */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 rounded-full bg-primary/40 animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-3 h-3 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/3 left-1/2 w-3 h-3 rounded-full bg-accent/40 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Central LEJIO Hub */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/30 z-20">
        <span className="font-display text-lg font-extrabold text-primary-foreground tracking-tight">LEJIO</span>
      </div>

      {/* Pro Car Marker */}
      <div className="absolute top-8 right-12 animate-float" style={{ animationDelay: '0s' }}>
        <div className="relative">
          <div className="w-14 h-14 rounded-xl bg-card border border-primary/50 flex items-center justify-center shadow-lg hover:border-primary hover:shadow-primary/20 transition-all cursor-pointer">
            <Car className="w-6 h-6 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Building2 className="w-3 h-3 text-primary-foreground" />
          </div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-primary font-medium whitespace-nowrap">Pro Partner</div>
        </div>
      </div>

      {/* Private Car Marker 1 */}
      <div className="absolute top-16 left-8 animate-float" style={{ animationDelay: '0.5s' }}>
        <div className="relative">
          <div className="w-14 h-14 rounded-xl bg-card border border-accent/50 flex items-center justify-center shadow-lg hover:border-accent hover:shadow-accent/20 transition-all cursor-pointer">
            <Car className="w-6 h-6 text-accent" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
            <User className="w-3 h-3 text-accent-foreground" />
          </div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-accent font-medium whitespace-nowrap">Privat</div>
        </div>
      </div>

      {/* Pro Car Marker 2 */}
      <div className="absolute bottom-16 left-16 animate-float" style={{ animationDelay: '1s' }}>
        <div className="relative">
          <div className="w-12 h-12 rounded-lg bg-card border border-primary/40 flex items-center justify-center shadow-lg hover:border-primary transition-all cursor-pointer">
            <Car className="w-5 h-5 text-primary/80" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary/80 flex items-center justify-center">
            <Building2 className="w-2.5 h-2.5 text-primary-foreground" />
          </div>
        </div>
      </div>

      {/* Private Car Marker 2 */}
      <div className="absolute bottom-12 right-16 animate-float" style={{ animationDelay: '1.5s' }}>
        <div className="relative">
          <div className="w-12 h-12 rounded-lg bg-card border border-accent/40 flex items-center justify-center shadow-lg hover:border-accent transition-all cursor-pointer">
            <Car className="w-5 h-5 text-accent/80" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent/80 flex items-center justify-center">
            <User className="w-2.5 h-2.5 text-accent-foreground" />
          </div>
        </div>
      </div>

      {/* Search Location Pin */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-lg bg-card/90 border border-border">
        <MapPin className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground">Din søgning</span>
      </div>

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
        <defs>
          <linearGradient id="proLine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(168 80% 50% / 0.4)" />
            <stop offset="100%" stopColor="hsl(168 80% 50% / 0.1)" />
          </linearGradient>
          <linearGradient id="p2pLine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(24 90% 58% / 0.4)" />
            <stop offset="100%" stopColor="hsl(24 90% 58% / 0.1)" />
          </linearGradient>
        </defs>
        {/* Lines from cars to center */}
        <line x1="200" y1="200" x2="320" y2="70" stroke="url(#proLine)" strokeWidth="1" strokeDasharray="4 4" className="animate-pulse-glow" />
        <line x1="200" y1="200" x2="80" y2="100" stroke="url(#p2pLine)" strokeWidth="1" strokeDasharray="4 4" className="animate-pulse-glow" style={{ animationDelay: '0.5s' }} />
        <line x1="200" y1="200" x2="110" y2="310" stroke="url(#proLine)" strokeWidth="1" strokeDasharray="4 4" className="animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <line x1="200" y1="200" x2="310" y2="320" stroke="url(#p2pLine)" strokeWidth="1" strokeDasharray="4 4" className="animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      </svg>
    </div>
  );
};

export default HeroVisual;
