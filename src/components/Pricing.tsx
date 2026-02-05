import { useState } from "react";
import { ArrowRight, User, Building2, Shield, Sparkles, Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Pricing = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"privat" | "erhverv">("privat");

  return (
    <section id="pricing" className="py-32 relative overflow-hidden" style={{
      background: 'linear-gradient(180deg, hsl(180 45% 15%) 0%, hsl(180 50% 10%) 100%)'
    }}>
      {/* Subtle mesh overlay */}
      <div className="absolute inset-0 opacity-30" style={{
        background: 'radial-gradient(ellipse at 40% 30%, hsl(168 76% 42% / 0.12) 0%, transparent 50%), radial-gradient(ellipse at 60% 70%, hsl(174 72% 48% / 0.08) 0%, transparent 50%)'
      }} />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/40 text-sm font-bold text-accent mb-6">
            <Crown className="w-4 h-4" />
            <span>Gennemsigtige priser</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black mb-6 text-white">
            Vælg den plan der{" "}
            <span className="text-primary">
              passer dig
            </span>
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Ingen skjulte gebyrer. Gennemsigtig prissætning fra dag ét.
          </p>
        </motion.div>

        {/* Tab toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1.5 rounded-full bg-white/10 border border-white/20">
            <button
              onClick={() => setActiveTab("privat")}
              className={`px-8 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
                activeTab === "privat"
                  ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Privatperson
              </span>
            </button>
            <button
              onClick={() => setActiveTab("erhverv")}
              className={`px-8 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
                activeTab === "erhverv"
                  ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Erhverv / Forhandler
              </span>
            </button>
          </div>
        </div>

        {/* Privat pricing cards */}
        {activeTab === "privat" && (
          <motion.div 
            className="grid md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Privat Udlejer */}
            <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-8 border border-white/20 hover:border-accent/50 transition-all duration-300 hover-lift">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center mb-8 shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>

              <h3 className="font-display text-2xl font-black text-white mb-2">Privat Udlejer</h3>
              <p className="text-white/70 mb-8">Gør det selv – fuld kontrol over din udlejning</p>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-6xl font-black text-white">0</span>
                  <span className="text-white/70 text-lg">kr/md</span>
                </div>
                <p className="text-accent font-bold mt-2 text-lg">+ 59 kr per booking</p>
              </div>

              <ul className="space-y-4 mb-10">
                {["Ingen månedlig betaling", "Automatisk kontrakt", "Kalender & booking", "Direkte kundekontakt", "Du styrer alt selv"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-white/80">{f}</span>
                  </li>
                ))}
              </ul>

              <Button variant="warm" size="lg" className="w-full font-bold text-lg py-6" onClick={() => navigate('/auth')}>
                Kom i gang
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Privat Fleet - Featured */}
            <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-8 border border-mint/50 hover:border-mint transition-all duration-300 relative hover-lift">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full bg-gradient-to-r from-mint to-accent text-white text-sm font-bold shadow-lg flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Populær
              </div>

              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mint to-accent flex items-center justify-center mb-8 shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>

              <h3 className="font-display text-2xl font-black text-white mb-2">Privat Fleet</h3>
              <p className="text-white/70 mb-8">Vi driver udlejningen for dig – ingen besvær</p>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-6xl font-black text-white">30</span>
                  <span className="text-white/70 text-lg">%</span>
                </div>
                <p className="text-mint font-bold mt-2 text-lg">Du beholder 70% af omsætningen</p>
              </div>

              <ul className="space-y-4 mb-10">
                {["LEJIO håndterer alt for dig", "Min. 30 dages abonnement", "70% udbetalt direkte til dig", "Ingen bekymringer", "Perfekt til privatbiler"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-mint/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-mint" />
                    </div>
                    <span className="text-white/80">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-3">
                <Button variant="mint" size="lg" className="w-full font-bold text-lg py-6" onClick={() => navigate('/auth')}>
                  Kom i gang
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" className="w-full text-mint hover:text-mint/80 font-medium" onClick={() => navigate('/privat-fleet')}>
                  Læs mere om Privat Fleet →
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Erhverv pricing cards */}
        {activeTab === "erhverv" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Three tier pricing */}
            <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto mb-12">
              {/* Starter */}
              <div className="glass-strong rounded-[2rem] p-8 border border-primary/20 hover:border-primary/50 transition-all duration-300 relative hover-lift">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-accent text-white text-sm font-bold shadow-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Anbefalet
                </div>

                <h3 className="font-display text-2xl font-black text-foreground mb-1 mt-4">Starter</h3>
                <p className="text-muted-foreground text-sm mb-6">1-5 biler</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-5xl font-black text-foreground">349</span>
                    <span className="text-muted-foreground text-sm">kr/md</span>
                  </div>
                  <p className="text-primary font-bold mt-2 text-sm">+ 3% kommission</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {["Op til 5 køretøjer", "Ubegrænsede bookinger", "Digitale kontrakter", "Dashboard & statistik"].map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground text-sm">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button variant="hero" size="lg" className="w-full font-bold" onClick={() => navigate('/auth')}>
                  Vælg Starter
                </Button>
              </div>

              {/* Standard */}
              <div className="glass-strong rounded-[2rem] p-8 border border-border/50 hover:border-primary/30 transition-all duration-300 hover-lift">
                <h3 className="font-display text-2xl font-black text-foreground mb-1">Standard</h3>
                <p className="text-muted-foreground text-sm mb-6">6-15 biler</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-5xl font-black text-foreground">599</span>
                    <span className="text-muted-foreground text-sm">kr/md</span>
                  </div>
                  <p className="text-primary font-bold mt-2 text-sm">+ 3% kommission</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {["Op til 15 køretøjer", "Ubegrænsede bookinger", "Digitale kontrakter", "Dashboard & statistik", "Prioriteret support"].map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground text-sm">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button variant="glass" size="lg" className="w-full font-bold" onClick={() => navigate('/auth')}>
                  Vælg Standard
                </Button>
              </div>

              {/* Enterprise */}
              <div className="glass-strong rounded-[2rem] p-8 border border-border/50 hover:border-primary/30 transition-all duration-300 hover-lift">
                <h3 className="font-display text-2xl font-black text-foreground mb-1">Enterprise</h3>
                <p className="text-muted-foreground text-sm mb-6">16-35 biler</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-5xl font-black text-foreground">899</span>
                    <span className="text-muted-foreground text-sm">kr/md</span>
                  </div>
                  <p className="text-primary font-bold mt-2 text-sm">+ 3% kommission</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {["Op til 35 køretøjer", "Ubegrænsede bookinger", "Digitale kontrakter", "Dashboard & statistik", "Dedikeret support", "API adgang"].map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground text-sm">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button variant="glass" size="lg" className="w-full font-bold mb-4" onClick={() => navigate('/auth')}>
                  Vælg Enterprise
                </Button>
                
                <p className="text-center text-sm text-muted-foreground">
                  Har du mere end 35 biler?{' '}
                  <button 
                    onClick={() => document.getElementById('fleet-plans')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-primary hover:underline font-medium"
                  >
                    Se vores Fleet-løsninger
                  </button>
                </p>
              </div>
            </div>

            {/* Fleet plans */}
            <div id="fleet-plans" className="glass-strong rounded-[2.5rem] p-10 border border-border/50 w-full max-w-5xl mx-auto scroll-mt-24">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lavender/10 border border-lavender/20 text-sm font-bold text-lavender mb-4">
                  <Shield className="w-4 h-4" />
                  <span>Alternativ til SaaS</span>
                </div>
                <h3 className="font-display text-3xl font-black mb-3">Fleet-planer</h3>
                <p className="text-muted-foreground text-lg">Lad LEJIO drive din udlejning – vi tager os af alt</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Partner Starter */}
                <div className="rounded-2xl glass border border-accent/30 p-6 hover:border-accent/50 transition-all duration-300 hover-lift">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-lg">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-display text-lg font-black text-foreground">Partner Starter</h4>
                      <p className="text-xs text-muted-foreground">Samarbejdspartner</p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-5">
                    <span className="font-display text-4xl font-black text-foreground">15%</span>
                    <span className="text-accent font-bold text-sm">af omsætningen</span>
                  </div>

                  <ul className="space-y-2 mb-6 text-sm">
                    {["Ingen månedlig udgift", "Platform & support", "Du styrer køretøjer"].map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-accent" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button variant="glass" size="sm" className="w-full" onClick={() => navigate('/kontakt')}>
                    Kontakt os
                  </Button>
                </div>

                {/* Fleet Basic */}
                <div className="rounded-2xl glass border border-lavender/30 p-6 hover:border-lavender/50 transition-all duration-300 hover-lift">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lavender to-lavender/60 flex items-center justify-center shadow-lg">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-display text-lg font-black text-foreground">Fleet Basic</h4>
                      <p className="text-xs text-muted-foreground">Vi driver udlejningen</p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-5">
                    <span className="font-display text-4xl font-black text-foreground">25%</span>
                    <span className="text-lavender font-bold text-sm">af omsætningen</span>
                  </div>

                  <ul className="space-y-2 mb-6 text-sm">
                    {["Ingen månedlig udgift", "LEJIO håndterer alt", "Badge på køretøjer"].map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-lavender" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button variant="glass" size="sm" className="w-full" onClick={() => navigate('/kontakt')}>
                    Kontakt os
                  </Button>
                </div>

                {/* Fleet Premium */}
                <div className="rounded-2xl glass border border-mint/30 p-6 hover:border-mint/50 transition-all duration-300 hover-lift relative">
                  <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-mint to-accent text-white text-xs font-bold">
                    Premium
                  </div>
                  
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mint to-accent flex items-center justify-center shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-display text-lg font-black text-foreground">Fleet Premium</h4>
                      <p className="text-xs text-muted-foreground">Full-service løsning</p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-5">
                    <span className="font-display text-4xl font-black text-foreground">35%</span>
                    <span className="text-mint font-bold text-sm">af omsætningen</span>
                  </div>

                  <ul className="space-y-2 mb-6 text-sm">
                    {["Alt i Fleet Basic", "Inkl. GPS-tracking", "Garanteret min. udlejning"].map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-mint" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button variant="mint" size="sm" className="w-full" onClick={() => navigate('/kontakt')}>
                    Kontakt os
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Pricing;
