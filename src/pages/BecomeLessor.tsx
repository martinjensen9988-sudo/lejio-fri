import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  Check, 
  Car, 
  Shield, 
  TrendingUp, 
  Clock, 
  FileText, 
  CreditCard, 
  MapPin,
  Zap,
  Users,
  BarChart3,
  Smartphone,
  Star,
  ArrowRight,
  Building2,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const BecomeLessor = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: TrendingUp,
      title: "Øg din indtjening",
      description: "Tjen penge på dine køretøjer når de ellers står stille. Gennemsnitlig udlejer tjener 8.000-15.000 kr./md."
    },
    {
      icon: Shield,
      title: "Brug din egen forsikring",
      description: "Som udlejer bruger du din egen forsikring. Vi hjælper dig med automatisk skadesdokumentation og lynhurtig check-in/out, så du altid står stærkt."
    },
    {
      icon: FileText,
      title: "Automatiske kontrakter",
      description: "Juridisk bindende kontrakter genereres automatisk med digital signering."
    },
    {
      icon: CreditCard,
      title: "Direkte afregning",
      description: "Lejeren betaler dig direkte via din valgte betalingsløsning. Du har pengene med det samme, og vi sender dig blot en samlet faktura på vores kommission en gang om måneden."
    },
    {
      icon: Clock,
      title: "Spar tid",
      description: "AI-scanner til check-in/out. Automatisk km-aflæsning og skadesdokumentation."
    },
    {
      icon: MapPin,
      title: "GPS-sikkerhed",
      description: "Få besked ved uautoriseret brug eller hvis køretøjet forlader aftalte zoner (Geofencing). Dokumentation for lokation og kilometerstand sker automatisk."
    }
  ];

  const plans = [
    {
      name: "Starter",
      price: "349",
      period: "kr/md",
      description: "1-5 biler",
      highlight: true,
      badge: "Anbefalet",
      features: [
        "Op til 5 køretøjer",
        "Ubegrænsede bookinger",
        "Digitale kontrakter",
        "Dashboard & statistik"
      ],
      limitations: [
        "+ 3% kommission"
      ],
      cta: "Vælg Starter",
      ctaVariant: "default" as const
    },
    {
      name: "Standard",
      price: "599",
      period: "kr/md",
      description: "6-15 biler",
      highlight: false,
      features: [
        "Op til 15 køretøjer",
        "Ubegrænsede bookinger",
        "Digitale kontrakter",
        "Dashboard & statistik",
        "Prioriteret support"
      ],
      limitations: [
        "+ 3% kommission"
      ],
      cta: "Vælg Standard",
      ctaVariant: "outline" as const
    },
    {
      name: "Enterprise",
      price: "899",
      period: "kr/md",
      description: "16-35 biler",
      highlight: false,
      features: [
        "Op til 35 køretøjer",
        "Ubegrænsede bookinger",
        "Digitale kontrakter",
        "Dashboard & statistik",
        "Dedikeret support",
        "API adgang"
      ],
      limitations: [
        "+ 3% kommission"
      ],
      cta: "Vælg Enterprise",
      ctaVariant: "outline" as const
    }
  ];

  const features = [
    {
      icon: Smartphone,
      title: "Mobil-først",
      description: "Styr alt fra din telefon"
    },
    {
      icon: Zap,
      title: "Hurtig opstart",
      description: "Klar på under 5 minutter"
    },
    {
      icon: Users,
      title: "Stort netværk",
      description: "Tusindvis af aktive lejere"
    },
    {
      icon: BarChart3,
      title: "Indsigt & data",
      description: "Se hvad der virker"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="flex-1">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] opacity-50" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 px-4 py-2 text-sm border-primary/30 bg-primary/5">
              <Sparkles className="w-4 h-4 mr-2 text-primary" />
              Kom i gang – ingen binding
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Tjen penge på din bil
              <span className="block text-primary">– helt automatisk</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Lejio leverer de juridiske kontrakter og dokumentationsværktøjer, der sikrer dig i tilfælde af skader. 
              Du læner dig tilbage og tjener penge.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" onClick={() => navigate("/auth")}>
                Kom i gang nu
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => navigate("/hvad-er-lejio")}>
                Læs mere om Lejio
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              Ingen binding · Opsig når som helst
            </p>
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Fordele</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Alt hvad du behøver som udlejer
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Vi har bygget værktøjerne så du kan fokusere på det vigtige – at tjene penge.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-border/50 hover:border-primary/30 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Priser</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simpel og gennemsigtig prissætning
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Vælg den plan der passer til dig. Ingen skjulte gebyrer.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.highlight ? 'border-primary shadow-lg shadow-primary/10 scale-105' : 'border-border/50'}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4">
                      <Star className="w-3 h-3 mr-1" />
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-1">{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {plan.limitations.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      {plan.limitations.map((limitation, i) => (
                        <p key={i} className="text-sm text-muted-foreground">{limitation}</p>
                      ))}
                    </div>
                  )}
                  
                  <Button 
                    variant={plan.ctaVariant}
                    className="w-full"
                    onClick={() => navigate("/auth")}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Link to terms */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            * Alle priser er ekskl. moms. Betaling sker via Stripe. Du kan til enhver tid ændre eller annullere dit abonnement.{" "}
            <a href="/udlejervilkaar" className="text-primary hover:underline font-medium">
              Læs vores udlejervilkår →
            </a>
          </p>
        </div>
      </section>

      {/* For Businesses */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-10 h-10 text-primary" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">
                    Driver du en bilforhandler eller flåde?
                  </h3>
                  <p className="text-muted-foreground text-lg mb-0 md:mb-0">
                    Få en skræddersyet løsning med multi-lokationer, medarbejder-styring og API-adgang. 
                    Vi hjælper dig med at digitalisere din udlejningsforretning.
                  </p>
                </div>
                <a href="https://www.lejio.dk/forhandler" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="shrink-0" asChild>
                    <span>
                      Læs om Fleet-løsningen
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </span>
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>


      </main>

      <Footer />
    </div>
  );
};

export default BecomeLessor;
