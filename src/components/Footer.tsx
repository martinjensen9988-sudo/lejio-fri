import { forwardRef } from "react";
import { MapPin, Mail, Heart, ArrowRight, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import LejioLogo from "./LejioLogo";

const Footer = forwardRef<HTMLElement>((props, ref) => {
  const navigate = useNavigate();

  return (
    <footer ref={ref} className="relative overflow-hidden" {...props}>
      {/* CTA Section - Premium gradient */}
      <div className="relative py-24 overflow-hidden">
        {/* Background with mesh gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent/80" />
        <div className="absolute inset-0 bg-mesh opacity-50" />
        
        {/* Glow orbs */}
        <motion.div 
          className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute -bottom-20 -right-20 w-[300px] h-[300px] bg-accent/30 rounded-full blur-[80px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6"
          >
            Klar til at komme i gang?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-primary-foreground/80 text-lg max-w-xl mx-auto mb-10"
          >
            Opret en konto og begynd at leje ud eller find dit næste køretøj i dag.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button 
              size="xl" 
              className="bg-background text-foreground font-bold text-lg shadow-xl hover:bg-background/90 hover:-translate-y-1 transition-all"
              onClick={() => navigate('/auth')}
            >
              Opret konto
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              size="xl" 
              variant="outline" 
              className="font-bold text-lg border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm"
              onClick={() => navigate('/search')}
            >
              Udforsk køretøjer
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Main Footer - Premium dark teal */}
      <div className="py-16" style={{ background: 'hsl(180 50% 8%)' }}>
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              {/* Logo */}
              <div className="mb-6">
                <LejioLogo size="lg" />
              </div>
              <p className="text-white/60 max-w-xs mb-6">
                Danmarks smarteste platform til køretøjsudlejning. Private og forhandlere – alt samlet ét sted.
              </p>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <MapPin className="w-4 h-4" />
                <span>Danmark 🇩🇰</span>
              </div>
            </div>

            <div>
              <h4 className="font-display font-bold text-white text-lg mb-6">For lejere</h4>
              <ul className="space-y-4 text-white/60">
                <li><a href="/search" className="hover:text-primary transition-colors">Søg køretøjer</a></li>
                <li><a href="#how-it-works" className="hover:text-primary transition-colors">Hvordan det virker</a></li>
                <li><a href="/faq" className="hover:text-primary transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-bold text-white text-lg mb-6">For udlejere</h4>
              <ul className="space-y-4 text-white/60">
                <li><a href="/funktioner" className="hover:text-primary transition-colors">Alle funktioner</a></li>
                <li><a href="/bliv-udlejer" className="hover:text-primary transition-colors">Bliv privat udlejer</a></li>
                <li><a href="/forhandler" className="hover:text-primary transition-colors">For forhandlere</a></li>
                <li><a href="/privat-fleet" className="hover:text-primary transition-colors">Privat Fleet</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Priser</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-bold text-white text-lg mb-6">Kontakt os direkte</h4>
              <p className="text-white/60 text-sm mb-4">
                Vi sidder klar til at hjælpe 🙌
              </p>
              <div className="flex items-center gap-3 text-white/60 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <a href="tel:+4591998929" className="hover:text-primary transition-colors">+45 91 99 89 29</a>
                  <p className="text-xs text-white/40">Hverdage 09:00 - 16:00</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/60 mb-6">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-accent" />
                </div>
                <a href="mailto:hej@lejio.dk" className="hover:text-primary transition-colors">hej@lejio.dk</a>
              </div>
              
              {/* Company info */}
              <div className="text-sm text-white/50 space-y-1 mb-6">
                <p className="font-semibold text-white/70">LEJIO</p>
                <p>Erantisvej 2, st. 103</p>
                <p>8800 Viborg</p>
                <p>CVR: 44691507</p>
              </div>
              
              {/* Social icons */}
              <div className="flex gap-3">
                <a 
                  href="https://www.facebook.com/profile.php?id=61584959161176" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-lg bg-white/10 hover:bg-primary/30 flex items-center justify-center text-lg transition-all hover:scale-110"
                  aria-label="Facebook"
                >
                  📘
                </a>
                <a 
                  href="#" 
                  className="w-11 h-11 rounded-lg bg-white/10 hover:bg-accent/30 flex items-center justify-center text-lg transition-all hover:scale-110"
                  aria-label="Instagram"
                >
                  📸
                </a>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-white/50 flex items-center gap-2">
              © {new Date().getFullYear()} LEJIO. Lavet med <Heart className="w-4 h-4 text-accent" /> i Danmark
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-white/50">
              <a href="/om-os" className="hover:text-primary transition-colors">Om os</a>
              <a href="/privatlivspolitik" className="hover:text-primary transition-colors">Privatlivspolitik</a>
              <a href="/handelsbetingelser" className="hover:text-primary transition-colors">Handelsbetingelser</a>
              <a href="/udlejervilkaar" className="hover:text-primary transition-colors">Udlejervilkår</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
