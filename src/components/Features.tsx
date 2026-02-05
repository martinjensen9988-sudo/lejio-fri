import { Car, MapPin, Shield, Clock, CreditCard, Star, ArrowRight, Zap, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from '@/integrations/azure/client';

const Features = () => {
  const navigate = useNavigate();

  // Mapping til admin feature keys
  const featureKeyMap = {
    "Smart Booking-kalender": "booking_calendar",
    "Automatisk tilgængelighed": "auto_availability",
    "Abonnementsudlejning": "subscription_rental",
    "AI-prissætning": "ai_pricing",
    "Sæsonpriser": "season_pricing",
    "Multi-lokation support": "multi_location",
    "Åbningstider pr. lokation": "location_hours",
    "Særlige lukkedage": "special_closures",
    "Lokation på køretøj": "location_on_vehicle",
    "Automatisk kontraktgenerering": "contract_generation",
    "Digital underskrift": "digital_signature",
    "PDF-download & Email": "pdf_email",
    "Skaderapporter med AI": "damage_ai",
    "Lokationsinfo i kontrakt": "location_in_contract",
    "Nummerplade-scanning": "license_plate_scan",
    "Dashboard-foto med AI": "dashboard_photo_ai",
    "GPS-lokationsverifikation": "gps_verification",
    "Automatisk opgørelse": "auto_statement",
    "QR-kode check-in": "qr_checkin",
    "Flere betalingsmetoder": "payment_methods",
    "Automatisk abonnementsbetaling": "auto_subscription_payment",
    "Depositumhåndtering": "deposit_handling",
    "Selvrisiko-forsikring": "selfrisk_insurance",
    "Brændstofpolitik": "fuel_policy",
    "Platformgebyr-betaling": "platform_fee_payment",
    "GPS-sikkerhed": "gps_security",
    "Geofencing-alarmer": "geofencing",
    "Kilometerregistrering": "km_registration",
    "Webhook-integration": "webhook_gps",
    "MC-kørekort validering": "mc_license_validation",
    "MC-specifik vedligeholdelse": "mc_maintenance",
    "Sæson-tjekliste": "season_checklist",
    "MC Check-in guide": "mc_checkin_guide",
    "Smart Service hos LEJIO": "smart_service",
    "Syns-påmindelser": "inspection_reminders",
    "Dækstyring": "tire_management",
    "Byttebil-funktion": "replacement_car",
    "Service-booking": "service_booking",
    "Auto-Dispatch AI": "auto_dispatch_ai",
    "Dashboard-analyse": "ai_dashboard_analysis",
    // Tilføj flere hvis nødvendigt
  };

  const [featureLinks, setFeatureLinks] = useState({});

  useEffect(() => {
    const fetchLinks = async () => {
      const { data, error } = await supabase.from('feature_links').select('feature_key, video, image, page');
      if (!error && data) {
        const linksObj = {};
        data.forEach(row => {
          linksObj[row.feature_key] = {
            video: row.video || '',
            image: row.image || '',
            page: row.page || ''
          };
        });
        setFeatureLinks(linksObj);
      }
    };
    fetchLinks();
  }, []);

  const renterFeatures = [
    {
      icon: Car,
      title: "Stort udvalg",
      description: "Biler, motorcykler, scootere, campingvogne, autocampere og trailere fra lokale udlejere.",
      gradient: "from-primary to-primary/60",
    },
    {
      icon: MapPin,
      title: "Tæt på dig",
      description: "Find køretøjer i dit lokalområde. Søg på postnummer eller by.",
      gradient: "from-accent to-accent/60",
    },
    {
      icon: Shield,
      title: "Direkte afregning",
      description: "Afregn leje og depositum direkte med udlejeren via MobilePay eller bankoverførsel. Enkelt og gennemskueligt.",
      gradient: "from-mint to-mint/60",
    },
    {
      icon: Clock,
      title: "Hurtig booking",
      description: "Book på under 5 minutter. Modtag kontrakt og bekræftelse med det samme.",
      gradient: "from-lavender to-lavender/60",
    },
    {
      icon: CreditCard,
      title: "Gennemsigtige priser",
      description: "Se den fulde pris inkl. alt før du booker. Ingen skjulte gebyrer.",
      gradient: "from-secondary to-muted",
    },
    {
      icon: Star,
      title: "Verificerede udlejere",
      description: "Læs anmeldelser og ratings fra andre lejere før du booker.",
      gradient: "from-yellow-500 to-yellow-600",
    }
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden" style={{
      background: 'linear-gradient(180deg, hsl(180 35% 28%) 0%, hsl(180 40% 20%) 100%)'
    }}>
      {/* Subtle mesh overlay */}
      <div className="absolute inset-0 opacity-30" style={{
        background: 'radial-gradient(ellipse at 25% 30%, hsl(168 76% 42% / 0.12) 0%, transparent 50%), radial-gradient(ellipse at 75% 70%, hsl(174 72% 48% / 0.08) 0%, transparent 50%)'
      }} />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/40 text-sm font-bold text-primary mb-6">
            <CheckCircle2 className="w-4 h-4" />
            <span>For lejere</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black mb-6 text-white">
            Hvorfor leje hos{" "}
            <span className="text-primary">
              LEJIO?
            </span>
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Vi gør det nemt, sikkert og gennemsigtigt at leje køretøjer fra lokale udlejere.
          </p>
        </motion.div>

        {/* Feature cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-16">
          {renterFeatures.map((feature, i) => {
            const Icon = feature.icon;
            // Find admin key
            const adminKey = featureKeyMap[feature.title];
            const links = adminKey ? featureLinks[adminKey] : undefined;
            return (
              <motion.div 
                key={i}
                className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-primary/50 transition-all duration-300 hover-lift"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{feature.description}</p>
                {/* VIS LINKS */}
                {links && (links.video || links.image || links.page) && (
                  <div className="mt-4 flex flex-col gap-2">
                    {links.video && (
                      <a href={links.video} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">Video</a>
                    )}
                    {links.image && (
                      <a href={links.image} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">Billede</a>
                    )}
                    {links.page && (
                      <a href={links.page} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">Læs mere</a>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* CTA for renters */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button 
            variant="hero"
            size="xl" 
            className="text-lg font-bold px-12"
            onClick={() => navigate('/search')}
          >
            Find dit køretøj nu
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* Divider */}
        <div className="flex items-center gap-4 max-w-xl mx-auto mb-16">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <span className="text-white/60 text-sm font-medium px-4">Eller</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>

        {/* Provider teaser */}
        <motion.div 
          className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/20 w-full max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/40 text-sm font-bold text-accent mb-6">
            <Sparkles className="w-4 h-4" />
            <span>For udlejere</span>
          </div>
          
          <h3 className="font-display text-3xl md:text-4xl font-black mb-4 text-white">
            Har du et køretøj?{" "}
            <span className="text-accent">
              Tjen penge på det
            </span>
          </h3>
          
          <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
            Bliv udlejer på LEJIO og lad dit køretøj arbejde for dig. Vi håndterer kontrakter, booking og formidling – så du kan fokusere på udlejningen.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[
              { icon: CheckCircle2, text: "Fra 349 kr/md", color: "text-mint" },
              { icon: CheckCircle2, text: "Auto-kontrakter", color: "text-accent" },
              { icon: CheckCircle2, text: "Enkel afregning", color: "text-primary" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-sm font-medium text-white">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="warm"
              size="lg" 
              className="font-bold text-lg px-8"
              onClick={() => navigate('/auth')}
            >
              Bliv udlejer
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              variant="glass"
              size="lg" 
              className="font-bold text-lg px-8"
              onClick={() => navigate('/hvad-er-lejio')}
            >
              Læs mere om platformen
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
