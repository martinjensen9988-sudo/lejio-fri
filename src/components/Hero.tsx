import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Search, ArrowRight, Sparkles, Car, Shield, Star, CheckCircle2, Zap } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import { cn } from "@/lib/utils";
const Hero = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (startDate) params.set("startDate", startDate.toISOString());
    navigate(`/search?${params.toString()}`);
  };
  return <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20 pb-12">
      {/* Clean light background with subtle gradient */}
      <div className="absolute inset-0 bg-background">
        {/* Subtle mesh overlay with pink tones */}
        <div className="absolute inset-0 opacity-30" style={{
          background: 'radial-gradient(ellipse at 30% 20%, hsl(330 70% 50% / 0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, hsl(330 60% 55% / 0.04) 0%, transparent 50%)'
        }} />
        
        {/* Soft floating orbs */}
        <motion.div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[180px]" animate={{
          scale: [1, 1.15, 1],
          opacity: [0.06, 0.12, 0.06]
        }} transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }} />
        <motion.div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-primary/6 rounded-full blur-[150px]" animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.04, 0.10, 0.04]
        }} transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }} />
        
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(hsl(0 0% 50% / 0.15) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 50% / 0.15) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => <motion.div key={i} className={`absolute w-1.5 h-1.5 rounded-full ${i % 2 === 0 ? 'bg-primary/30' : 'bg-primary/20'}`} style={{
          left: `${15 + i * 15}%`,
          top: `${20 + i % 3 * 25}%`
        }} animate={{
          y: [-20, 20, -20],
          opacity: [0.15, 0.4, 0.15]
        }} transition={{
          duration: 4 + i,
          repeat: Infinity,
          delay: i * 0.5
        }} />)}
      </div>

      <div className="container mx-auto px-6 relative z-10 w-full">
        <div className="w-full">
          {/* Main content */}
          <div className="text-center mb-12">
            {/* Badge */}
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5
          }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-primary/30 text-sm font-medium text-foreground mb-8">
              <Zap className="w-4 h-4 text-primary" />
              <span>Danmarks smarteste udlejningsplatform</span>
            </motion.div>

            {/* Bold headline */}
            <motion.h1 initial={{
            opacity: 0,
            y: 30
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6,
            delay: 0.1
          }} className="font-display text-5xl sm:text-7xl lg:text-[5.5rem] font-bold leading-[0.95] mb-6 tracking-tight">
              <span className="block text-foreground">LEJ DIT NÆSTE</span>
              <span className="block text-gradient-premium py-2">
                EVENTYR
              </span>
            </motion.h1>

            <motion.p initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: 0.2
          }} className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 font-medium">
              Den nye, intelligente vej til leje af biler, trailere og campingvogne. 
              Book hurtigt, få skarpe priser og kom afsted med det samme.
            </motion.p>

            {/* Search Box - Premium glass design */}
            <motion.div initial={{
            opacity: 0,
            y: 30,
            scale: 0.95
          }} animate={{
            opacity: 1,
            y: 0,
            scale: 1
          }} transition={{
            duration: 0.6,
            delay: 0.3
          }} className="glass-strong rounded-2xl p-4 shadow-2xl w-full glow-border">
              <div className="flex flex-col lg:flex-row gap-3">
                {/* Location input */}
                <div className="flex-1 flex items-center gap-3 px-5 py-4 rounded-xl bg-background/50 border border-border hover:border-primary/50 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <input type="text" placeholder="Indtast by eller postnummer..." value={location} onChange={e => setLocation(e.target.value)} className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-lg" />
                </div>
                
                {/* Date picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-background/50 border border-border lg:w-60 cursor-pointer hover:border-accent/50 transition-all group">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                        <Calendar className="w-5 h-5 text-accent" />
                      </div>
                      <span className={cn("flex-1 text-left text-lg", startDate ? "text-foreground font-medium" : "text-muted-foreground")}>
                        {startDate ? format(startDate, "dd. MMM yyyy", {
                        locale: da
                      }) : "Vælg dato..."}
                      </span>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 glass-strong" align="center">
                    <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} disabled={date => date < new Date()} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                
                {/* Search button */}
                <Button variant="hero" size="xl" className="lg:px-10" onClick={handleSearch}>
                  <Search className="w-5 h-5" />
                  <span>Søg køretøjer</span>
                </Button>
              </div>
            </motion.div>

            {/* Trust badges */}
            <motion.div initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} transition={{
            duration: 0.5,
            delay: 0.5
          }} className="flex flex-wrap justify-center gap-8 mt-10">
              {[{
              icon: Shield,
              text: "Sikker betaling",
              color: "text-mint"
            }, {
              icon: CheckCircle2,
              text: "Automatiske kontrakter",
              color: "text-primary"
            }, {
              icon: Star,
              text: "Verificerede udlejere",
              color: "text-accent"
            }].map((item, i) => <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>)}
            </motion.div>
          </div>

          {/* Vehicle categories */}
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: 0.6
        }} className="grid grid-cols-3 md:grid-cols-6 gap-3 w-full mt-12">
            {[{
            emoji: "🚗",
            label: "Biler"
          }, {
            emoji: "🏍️",
            label: "MC"
          }, {
            emoji: "🛵",
            label: "Scootere"
          }, {
            emoji: "🏕️",
            label: "Campingvogne"
          }, {
            emoji: "🚐",
            label: "Autocampere"
          }, {
            emoji: "🚚",
            label: "Trailere"
          }].map((type, i) => <motion.div key={i} whileHover={{
            scale: 1.05,
            y: -4
          }} whileTap={{
            scale: 0.98
          }} className="text-center p-4 rounded-xl glass border-border/50 hover:border-primary/40 cursor-pointer group" onClick={() => navigate('/search')}>
                <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">{type.emoji}</span>
                <div className="font-display font-semibold text-foreground text-sm">{type.label}</div>
              </motion.div>)}
          </motion.div>

          {/* Secondary CTA */}
          <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.5,
          delay: 0.8
        }} className="mt-16 text-center">
            <p className="text-muted-foreground mb-4">Har du et køretøj du vil leje ud?</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="warm" size="lg" onClick={() => navigate('/auth')}>
                <Sparkles className="w-5 h-5" />
                Bliv udlejer
              </Button>
              <Button variant="glass" size="lg" onClick={() => navigate('/hvad-er-lejio')}>
                Læs mere om Lejio
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background via-background/60 to-transparent" />

      {/* === SLIDER PLACEHOLDER SECTION === */}
      <div className="relative z-10 mt-16 w-full">
        <div className="container mx-auto px-6">
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 text-center shadow-lg">
            <h3 className="font-display text-2xl font-semibold text-foreground mb-2">
              Featured Slider
            </h3>
            <p className="text-muted-foreground mb-4">
              Her kommer en slider med featured køretøjer, tilbud eller kampagner
            </p>
            <div className="h-48 bg-muted/50 border-dashed border-border flex items-center justify-center border-8 rounded-md">
              <span className="text-muted-foreground text-lg">Slider komponent placeholder</span>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;