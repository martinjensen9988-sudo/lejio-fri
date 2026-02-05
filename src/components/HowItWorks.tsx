
import { Search, CreditCard, Key, Car, Wallet, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const HowItWorks = () => {
  const navigate = useNavigate();

  const renterSteps = [
    { step: 1, icon: Search, title: "Søg", desc: "Find køretøjer i dit område og vælg datoer", gradient: "from-primary to-primary/60" },
    { step: 2, icon: CreditCard, title: "Book & bekræft", desc: "Reservér dit køretøj online og modtag instruktioner til direkte afregning med udlejer", gradient: "from-mint to-mint/60" },
    { step: 3, icon: Car, title: "Hent & kør", desc: "Modtag nøgler, kontrakt og afsted!", gradient: "from-accent to-accent/60" },
  ];

  const lessorSteps = [
    { step: 1, icon: Car, title: "Opret køretøj", desc: "Indtast nummerplade – vi henter data automatisk", gradient: "from-accent to-accent/60" },
    { step: 2, icon: Users, title: "Modtag bookinger", desc: "Godkend anmodninger med ét enkelt klik", gradient: "from-lavender to-lavender/60" },
    { step: 3, icon: Wallet, title: "Modtag betaling", desc: "Du modtager leje og depositum direkte fra lejeren. Vi fakturerer blot vores kommission efterfølgende.", gradient: "from-mint to-mint/60" },
  ];

  return (
    <section id="how-it-works" className="py-32 relative overflow-hidden" style={{
      background: 'linear-gradient(180deg, hsl(180 40% 20%) 0%, hsl(180 45% 15%) 100%)'
    }}>
      {/* Subtle mesh overlay */}
      <div className="absolute inset-0 opacity-30" style={{
        background: 'radial-gradient(ellipse at 70% 20%, hsl(168 76% 42% / 0.12) 0%, transparent 50%), radial-gradient(ellipse at 30% 80%, hsl(174 72% 48% / 0.08) 0%, transparent 50%)'
      }} />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mint/20 border border-mint/40 text-sm font-bold text-mint mb-6">
            <CheckCircle2 className="w-4 h-4" />
            <span>Super enkelt</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black mb-6 text-white">
            Så{" "}
            <span className="text-primary">
              nemt
            </span>{" "}
            er det
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Fra søgning til kørsel – på under 5 minutter.
          </p>
        </motion.div>

        {/* Two columns */}
        <div className="grid lg:grid-cols-2 gap-10 w-full max-w-6xl mx-auto">
          {/* Renters */}
          <motion.div 
            className="bg-white/10 backdrop-blur-md rounded-[2rem] p-8 border border-white/20 hover-lift"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <Key className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-black text-white">For lejere</h3>
                <p className="text-white/70">Find og book dit drømmekøretøj</p>
              </div>
            </div>

            <div className="space-y-6 mb-8">
              {renterSteps.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div 
                    key={i} 
                    className="flex items-center gap-5 group"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-gray-900 text-xs font-bold flex items-center justify-center">
                        {item.step}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-display text-lg font-bold text-white">{item.title}</h4>
                      <p className="text-white/70">{item.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <Button 
              variant="hero"
              size="lg" 
              className="w-full font-bold text-lg py-6"
              onClick={() => navigate('/search')}
            >
              Find køretøj nu
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* Lessors */}
          <motion.div 
            className="bg-white/10 backdrop-blur-md rounded-[2rem] p-8 border border-white/20 hover-lift"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-lg">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-black text-white">For udlejere</h3>
                <p className="text-white/70">Tjen penge på dit køretøj</p>
              </div>
            </div>

            <div className="space-y-6 mb-8">
              {lessorSteps.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div 
                    key={i} 
                    className="flex items-center gap-5 group"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-gray-900 text-xs font-bold flex items-center justify-center">
                        {item.step}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-display text-lg font-bold text-white">{item.title}</h4>
                      <p className="text-white/70">{item.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <Button 
              variant="warm"
              size="lg" 
              className="w-full font-bold text-lg py-6"
              onClick={() => navigate('/auth')}
            >
              Bliv udlejer
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
