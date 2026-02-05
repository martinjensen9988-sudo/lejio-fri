import { Car, Camera, FileCheck, CreditCard, Shield, Phone, Calendar, CheckCircle2, Sparkles, ArrowRight, Clock, Users, Wrench, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PrivateFleetExplainer = () => {
  const navigate = useNavigate();

  const steps = [
    {
      number: "1",
      icon: Car,
      title: "Kontakt os",
      description: "Fortæl os om dit køretøj. Vi vurderer bilen og laver en aftale.",
      details: [
        "Kontakt LEJIO via telefon, mail eller formular",
        "Vi vurderer bilen og fastsætter månedsprisen",
        "Du sørger for forsikring der dækker udlejning",
        "Vi udarbejder en samarbejdsaftale"
      ],
      color: "mint"
    },
    {
      number: "2",
      icon: Car,
      title: "Aflever bilen til os",
      description: "Du afleverer bilen til LEJIO – herefter tager vi os af absolut alt.",
      details: [
        "Aflever bilen på vores adresse",
        "Vi tager professionelle billeder af bilen",
        "Vi dokumenterer bilens stand grundigt",
        "Bilen opbevares sikkert hos os"
      ],
      color: "accent"
    },
    {
      number: "3",
      icon: Users,
      title: "Vi opretter annoncen",
      description: "LEJIO sætter prisen, tager billeder og opretter en professionel annonce.",
      details: [
        "Vi fastsætter den optimale månedspris",
        "Professionelle billeder og beskrivelse",
        "Din bil udbydes som abonnement (min. 30 dage)",
        "Annoncen vises på LEJIO's platform"
      ],
      color: "primary"
    },
    {
      number: "4",
      icon: Calendar,
      title: "Vi finder abonnenter",
      description: "Bilen udlejes kun på abonnement – minimum 30 dage ad gangen.",
      details: [
        "Vi screener og verificerer alle lejere",
        "Håndtering af alle spørgsmål og bookinger",
        "Lejer tegner abonnement – ikke dagsleje",
        "Stabil indtægt måned efter måned"
      ],
      color: "lavender"
    },
    {
      number: "5",
      icon: FileCheck,
      title: "Kontrakt & udlevering",
      description: "Vi håndterer kontrakt, check-in og udlevering af bilen til lejeren.",
      details: [
        "Abonnementskontrakt genereres af os",
        "Lejers kørekort og ID verificeres",
        "Grundig check-in med fotodokumentation",
        "Nøgler udleveres af LEJIO"
      ],
      color: "secondary"
    },
    {
      number: "6",
      icon: CreditCard,
      title: "Månedlig udbetaling",
      description: "Lejeren betaler månedligt, og vi overfører din andel til dig.",
      details: [
        "Lejer betaler abonnement hver måned",
        "Vi tilbageholder 30% til LEJIO",
        "Du modtager 70% af lejeindtægten",
        "Fast udbetaling hver måned"
      ],
      color: "mint"
    },
    {
      number: "7",
      icon: Shield,
      title: "Skadeshåndtering",
      description: "Hvis uheldet er ude, håndterer vi hele processen med lejer.",
      details: [
        "Regelmæssig inspektion af bilen",
        "Vi opkræver selvrisiko fra lejer ved skader",
        "Du kontaktes kun ved større skader",
        "Du skal ikke løfte en finger"
      ],
      color: "accent"
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: "Spar tid",
      description: "Ingen mails, opkald eller koordinering. Vi klarer alt."
    },
    {
      icon: Shield,
      title: "Tryg udlejning",
      description: "Professionel kontrakt, ID-verifikation og skadesdokumentation."
    },
    {
      icon: CreditCard,
      title: "Sikker betaling",
      description: "Vi opkræver og udbetaler – ingen risiko for manglende betaling."
    },
    {
      icon: Wrench,
      title: "Support 24/7",
      description: "Lejere kontakter os – ikke dig – ved spørgsmål."
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; icon: string; badge: string; gradient: string }> = {
      mint: { bg: "bg-mint/10", border: "border-mint/30", icon: "text-mint", badge: "bg-mint/20", gradient: "from-mint to-mint/60" },
      accent: { bg: "bg-accent/10", border: "border-accent/30", icon: "text-accent", badge: "bg-accent/20", gradient: "from-accent to-accent/60" },
      primary: { bg: "bg-primary/10", border: "border-primary/30", icon: "text-primary", badge: "bg-primary/20", gradient: "from-primary to-primary/60" },
      lavender: { bg: "bg-lavender/10", border: "border-lavender/30", icon: "text-lavender", badge: "bg-lavender/20", gradient: "from-lavender to-lavender/60" },
      secondary: { bg: "bg-secondary/10", border: "border-secondary/30", icon: "text-secondary", badge: "bg-secondary/20", gradient: "from-secondary to-secondary/60" },
    };
    return colors[color] || colors.primary;
  };

  return (
    <section id="private-fleet" className="relative overflow-hidden">
      {/* Hero Section */}
      <div className="relative py-24 sm:py-32">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-mint/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[150px] rotate-12" />
        </div>
        
        {/* Geometric shapes */}
        <div className="absolute top-32 right-20 w-24 h-24 border-4 border-mint/20 rotate-45 hidden lg:block" />
        <div className="absolute bottom-32 left-20 w-16 h-16 bg-accent/10 rounded-full hidden lg:block" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="w-full max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-mint/10 border border-mint/20 text-sm font-bold text-mint mb-8 animate-slide-up">
              <Sparkles className="w-4 h-4" />
              <span>Nyt: Privat Fleet</span>
            </div>
            
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <span className="block">LAD OS TJENE</span>
              <span className="block bg-gradient-to-r from-mint via-accent to-primary bg-clip-text text-transparent">
                PENGE FOR DIG
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Du ejer bilen – vi klarer resten. LEJIO håndterer alt fra markedsføring til kontrakter og dokumentation, 
              så du kan læne dig tilbage og se pengene tikke ind.
            </p>
            
            {/* Split highlight */}
            <div className="inline-flex items-center gap-6 p-6 rounded-3xl bg-card/50 backdrop-blur-sm border-2 border-mint/30 shadow-xl animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="text-center">
                <p className="font-display text-5xl font-black text-foreground">70%</p>
                <p className="text-sm text-muted-foreground font-medium">til dig</p>
              </div>
              <div className="w-px h-16 bg-border" />
              <div className="text-center">
                <p className="font-display text-5xl font-black text-mint">30%</p>
                <p className="text-sm text-muted-foreground font-medium">til LEJIO</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-step process */}
      <div className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-bold text-primary mb-6">
              <Zap className="w-4 h-4" />
              <span>7 simple trin</span>
            </div>
            <h2 className="font-display text-4xl font-black">
              Sådan fungerer det
            </h2>
          </div>
          
          <div className="space-y-6 w-full max-w-4xl mx-auto">
            {steps.map((step, index) => {
              const colors = getColorClasses(step.color);
              const Icon = step.icon;
              
              return (
                <div 
                  key={index}
                  className={`rounded-3xl ${colors.bg} border-2 ${colors.border} p-6 sm:p-8 hover:shadow-xl transition-all`}
                >
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Step number and icon */}
                    <div className="flex sm:flex-col items-center gap-4 sm:gap-3">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg`}>
                        <span className="font-display text-3xl font-black text-white">{step.number}</span>
                      </div>
                      <div className={`w-12 h-12 rounded-xl ${colors.badge} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${colors.icon}`} />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="font-display text-2xl font-black mb-2">{step.title}</h3>
                      <p className="text-muted-foreground mb-4 text-lg">{step.description}</p>
                      
                      <div className="grid sm:grid-cols-2 gap-3">
                        {step.details.map((detail, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <CheckCircle2 className={`w-5 h-5 mt-0.5 ${colors.icon} flex-shrink-0`} />
                            <span className="text-sm text-muted-foreground">{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Benefits grid */}
      <div className="py-20 relative bg-muted/30">
        <div className="container mx-auto px-6">
          <h3 className="font-display text-3xl font-black text-center mb-12">
            Hvorfor vælge Privat Fleet?
          </h3>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mx-auto">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div 
                  key={index}
                  className="rounded-3xl bg-card border-2 border-border p-8 text-center hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mint to-accent flex items-center justify-center mx-auto mb-6 shadow-lg shadow-mint/20">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-display text-xl font-black mb-2">{benefit.title}</h4>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pricing by car size */}
      <div className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="w-full max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="font-display text-3xl font-black mb-4">
                💰 Hvad kan du tjene?
              </h3>
              <p className="text-muted-foreground">Estimerede månedlige indtægter baseret på biltype</p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { size: "Lille bil", example: "Aygo, Up, i10", price: 3500, icon: "🚗" },
                { size: "Mellem bil", example: "Golf, Ceed, Focus", price: 4500, icon: "🚙" },
                { size: "Stor bil", example: "Passat, Mondeo, A4", price: 5500, icon: "🚘" },
                { size: "SUV", example: "Tiguan, Tucson, Q5", price: 6000, icon: "🚐" },
              ].map((tier, index) => {
                const yourShare = Math.round(tier.price * 0.7);
                return (
                  <div 
                    key={index}
                    className="rounded-3xl bg-gradient-to-br from-mint/10 to-accent/5 border-2 border-mint/30 p-6 text-center hover:shadow-xl hover:-translate-y-1 transition-all"
                  >
                    <span className="text-4xl mb-3 block">{tier.icon}</span>
                    <h4 className="font-bold text-lg mb-1">{tier.size}</h4>
                    <p className="text-xs text-muted-foreground mb-4">{tier.example}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Abonnement</span>
                        <span className="font-medium">{tier.price.toLocaleString('da-DK')} kr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">LEJIO (30%)</span>
                        <span className="text-muted-foreground">-{Math.round(tier.price * 0.3).toLocaleString('da-DK')} kr</span>
                      </div>
                      <div className="pt-3 border-t border-border/50">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Du får</span>
                          <span className="font-display text-2xl font-black text-mint">{yourShare.toLocaleString('da-DK')} kr</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">pr. måned</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="text-center mt-8 p-4 rounded-2xl bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                ⚠️ <strong>Bemærk:</strong> Priserne er vejledende. Den faktiske pris kan være <strong>højere eller lavere</strong> afhængigt af bilens stand, årgang, kilometertal og udstyr.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-20 relative bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h3 className="font-display text-3xl font-black text-center mb-12">
              Ofte stillede spørgsmål
            </h3>
            
            <div className="space-y-4">
              {[
                {
                  q: "Hvordan fungerer det i praksis?",
                  a: "Du afleverer din bil til os, og vi tager os af absolut alt derefter. Vi tager billeder, sætter prisen, opretter annonce, finder abonnenter, håndterer kontrakter og betaling. Du behøver ikke gøre noget."
                },
                {
                  q: "Hvad betyder abonnement?",
                  a: "Bilen udlejes kun på abonnement med minimum 30 dages binding. Det giver dig stabil indtægt og mindre slid på bilen sammenlignet med korttidsudlejning."
                },
                {
                  q: "Hvem sætter prisen?",
                  a: "Det gør vi. LEJIO fastsætter den optimale månedspris baseret på bilens stand, model og markedet. Vi sørger for at maksimere din indtjening."
                },
                {
                  q: "Hvem står for forsikringen?",
                  a: "Du står selv for forsikringen af din bil – det er dit ansvar som ejer. Sørg for at din bilforsikring dækker udlejning til tredjemand."
                },
                {
                  q: "Hvor afleverer jeg bilen?",
                  a: "Du afleverer bilen på vores adresse. Vi tager professionelle billeder og dokumenterer bilens stand. Herefter står vi for alt."
                },
                {
                  q: "Hvordan får jeg mine penge?",
                  a: "Lejer betaler abonnement hver måned. Vi udbetaler din andel (70%) til din bankkonto månedligt."
                },
                {
                  q: "Kan jeg få bilen tilbage?",
                  a: "Ja! Giv os besked i god tid (typisk 30 dage), så sørger vi for at bilen er klar til afhentning når nuværende abonnement udløber."
                },
                {
                  q: "Hvad koster det at komme i gang?",
                  a: "Ingenting! Der er ingen opstartsgebyr. Vi tager kun 30% af abonnementsindtægten."
                }
              ].map((faq, index) => (
                <div 
                  key={index}
                  className="rounded-2xl border-2 border-border bg-card p-6 hover:shadow-lg transition-all"
                >
                  <h4 className="font-bold text-lg mb-2">{faq.q}</h4>
                  <p className="text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="w-full max-w-4xl mx-auto text-center p-12 rounded-[3rem] bg-gradient-to-br from-mint/20 via-accent/10 to-primary/10 border-2 border-mint/30">
            <h3 className="font-display text-4xl font-black mb-4">
              Klar til at tjene penge på din bil?
            </h3>
            <p className="text-xl text-muted-foreground mb-8">
              Opret profil og tilmeld din bil på under 5 minutter.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-mint to-accent hover:opacity-90 text-white font-bold px-10 py-6 text-lg shadow-lg shadow-mint/30"
              onClick={() => navigate('/auth')}
            >
              Kom i gang nu
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrivateFleetExplainer;