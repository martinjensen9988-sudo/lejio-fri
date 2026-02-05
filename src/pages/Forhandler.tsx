import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  Check, 
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
  Sparkles,
  Car,
  Scale,
  Handshake,
  CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Forhandler = () => {
  const navigate = useNavigate();

  const trustPoints = [
    {
      icon: Scale,
      title: "Samme vilkår som alle",
      description: "Som forhandler får du præcis de samme vilkår, priser og fordele som alle andre udlejere på platformen. Ingen skjulte gebyrer eller særlige krav."
    },
    {
      icon: Handshake,
      title: "Transparent samarbejde",
      description: "Vi behandler alle udlejere ens – uanset om du er privatperson med én bil eller forhandler med 50. Vores model er 100% gennemsigtig."
    },
    {
      icon: Shield,
      title: "Din egen forsikring",
      description: "Du bruger din eksisterende erhvervsforsikring. Vi leverer dokumentationsværktøjer, kontrakter og check-in/out – så du altid står stærkt."
    },
    {
      icon: CreditCard,
      title: "Direkte betaling",
      description: "Lejeren betaler dig direkte. Du modtager pengene med det samme via din egen betalingsløsning – vi sender blot månedlig faktura på kommission."
    }
  ];

  const benefits = [
    {
      icon: Car,
      title: "Udnyt din lagerkapacitet",
      description: "Tjen penge på de biler der ellers bare står og samler støv. Demo-biler, værkstedsbiler og lager kan nu generere indtægt."
    },
    {
      icon: FileText,
      title: "Juridisk sikkerhed",
      description: "Automatiske kontrakter med digital signering. Fuld dokumentation af køretøjets tilstand før og efter hver udlejning."
    },
    {
      icon: Clock,
      title: "Spar tid med AI",
      description: "AI-scanner til check-in/out. Automatisk km-aflæsning, brændstofniveau og skadesdokumentation – på sekunder."
    },
    {
      icon: MapPin,
      title: "GPS & Geofencing",
      description: "Få besked hvis køretøjet forlader aftalte zoner. Dokumentation for lokation sker automatisk ved aflevering."
    },
    {
      icon: BarChart3,
      title: "Dashboard & statistik",
      description: "Komplet overblik over din flåde, bookinger, omsætning og kundeindsigt. Alt samlet ét sted."
    },
    {
      icon: Users,
      title: "Medarbejderstyring",
      description: "Giv dine ansatte adgang til systemet med forskellige roller og rettigheder."
    }
  ];

  const plans = [
    {
      name: "Starter",
      price: "349",
      period: "kr/md",
      description: "1-5 biler",
      highlight: true,
      badge: "Populær hos forhandlere",
      features: [
        "Op til 5 køretøjer",
        "Ubegrænsede bookinger",
        "Digitale kontrakter",
        "Dashboard & statistik"
      ],
      limitations: [
        "+ 3% kommission"
      ],
      cta: "Kom i gang",
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

  const quickStats = [
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
      icon: Scale,
      title: "Ens vilkår",
      description: "Samme pris for alle"
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
                <Building2 className="w-4 h-4 mr-2 text-primary" />
                For bilforhandlere & værksteder
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Velkommen til Lejio
                <span className="block text-primary">– på lige vilkår</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Som forhandler er du velkommen på præcis <strong>samme vilkår</strong> som alle andre udlejere. 
                Ingen særlige gebyrer, ingen skjulte krav – bare et professionelt værktøj til at tjene penge på dine biler.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8" onClick={() => navigate("/forhandler-opret")}>
                  Bliv partner
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => navigate("/kontakt")}>
                  Kontakt os
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mt-4">
                Ingen binding · Opsig når som helst · Samme pris som alle andre
              </p>
            </div>
          </div>
        </section>

        {/* Trust Banner */}
        <section className="py-8 border-y border-border bg-primary/5">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-primary" />
              <p className="text-lg font-medium">
                Forhandlere bruger <strong>samme vilkår og priser</strong> som private udlejere. 
                Se vores <a href="/udlejervilkaar" className="text-primary hover:underline">udlejervilkår</a> for den fulde aftale.
              </p>
            </div>
          </div>
        </section>

        {/* Quick stats */}
        <section className="py-12 border-b border-border bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {quickStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{stat.title}</h3>
                  <p className="text-sm text-muted-foreground">{stat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Points Section */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">
                <Handshake className="w-4 h-4 mr-2" />
                Tillid & Gennemsigtighed
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ens vilkår for alle udlejere
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Vi tror på fair behandling. Derfor får du som forhandler præcis de samme vilkår, 
                priser og support som alle andre på platformen.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {trustPoints.map((point, index) => (
                <Card key={index} className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                      <point.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{point.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{point.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">Fordele for forhandlere</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Professionelle værktøjer til din forretning
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Alt du behøver for at drive en professionel udlejningsforretning.
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
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">Priser</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Samme pris for alle – også forhandlere
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Vælg den plan der passer til dit antal biler. Ingen forhandlerrabat nødvendig – prisen er allerede fair.
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
              * Alle priser er ekskl. moms. Samme vilkår gælder for private og erhverv.{" "}
              <a href="/udlejervilkaar" className="text-primary hover:underline font-medium">
                Læs vores udlejervilkår →
              </a>
            </p>
          </div>
        </section>

        {/* Fleet Models Section - Commission Based */}
        <section id="fleet-plans" className="py-20 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">
                <Building2 className="w-4 h-4 mr-2" />
                Professionel Flåde
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Over 35 biler? Vælg ren kommission
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                For større flåder tilbyder vi 100% kommissionsbaserede modeller – ingen månedlig betaling, 
                kun en procentdel af din omsætning.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Partner Starter */}
              <Card className="border-border/50 hover:border-primary/30 transition-colors">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">Partner Starter</CardTitle>
                  <CardDescription>Selvstændig drift</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">15%</span>
                    <span className="text-muted-foreground ml-1">kommission</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Ubegrænset antal køretøjer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Du håndterer selv køretøjer & forsikring</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Platform & support fra LEJIO</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Ingen månedlig betaling</span>
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/kontakt")}>
                    Kontakt os
                  </Button>
                </CardContent>
              </Card>

              {/* Fleet Basic */}
              <Card className="border-primary shadow-lg shadow-primary/10 scale-105 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4">
                    <Star className="w-3 h-3 mr-1" />
                    Populær
                  </Badge>
                </div>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">Fleet Basic</CardTitle>
                  <CardDescription>LEJIO-styret platform</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">25%</span>
                    <span className="text-muted-foreground ml-1">kommission</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Ubegrænset antal køretøjer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">LEJIO håndterer booking & support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Du håndterer køretøjer & forsikring</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Dedikeret kontaktperson</span>
                    </li>
                  </ul>
                  <Button className="w-full" onClick={() => navigate("/kontakt")}>
                    Kontakt os
                  </Button>
                </CardContent>
              </Card>

              {/* Fleet Premium */}
              <Card className="border-border/50 hover:border-primary/30 transition-colors">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">Fleet Premium</CardTitle>
                  <CardDescription>Fuld service</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">35%</span>
                    <span className="text-muted-foreground ml-1">kommission</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Ubegrænset antal køretøjer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">LEJIO håndterer alt operationelt</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Afhentning, levering & klargøring</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Du læner dig tilbage</span>
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/kontakt")}>
                    Kontakt os
                  </Button>
                </CardContent>
              </Card>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8">
              Fleet-modeller kræver individuel aftale.{" "}
              <a href="/fleet-loesning" className="text-primary hover:underline font-medium">
                Læs mere om Fleet-løsningen →
              </a>
            </p>
          </div>
        </section>

        {/* === DUAL WINDOW SECTION === */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">
                <Sparkles className="w-4 h-4 mr-2" />
                Ekstra funktioner
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Mere på vej
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Her kommer snart flere muligheder og værktøjer til forhandlere
              </p>
            </div>
            
            {/* Two Window Layout */}
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Window 1 - Video */}
              <Card className="border-2 border-dashed border-border hover:border-primary/40 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Se hvordan det virker
                  </CardTitle>
                  <CardDescription>Video demonstration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 rounded-xl overflow-hidden">
                    <video 
                      className="w-full h-full object-cover"
                      controls
                      autoPlay
                      muted
                      loop
                      playsInline
                    >
                      <source src="/videos/forhandler-video.mp4" type="video/mp4" />
                      Din browser understøtter ikke video.
                    </video>
                  </div>
                </CardContent>
              </Card>
              
              {/* Window 2 */}
              <Card className="border-2 border-dashed border-border hover:border-primary/40 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-accent" />
                    Vindue 2
                  </CardTitle>
                  <CardDescription>Placeholder til nyt indhold</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted/50 rounded-xl flex items-center justify-center border border-border">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground">Vindue 2 indhold kommer her</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20">
          <div className="container mx-auto px-6 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-6 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Klar til at komme i gang?
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Opret en gratis konto i dag og se, hvordan Lejio kan hjælpe din forhandler med at tjene mere.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" onClick={() => navigate("/auth")}>
                Opret gratis konto
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => navigate("/hvad-er-lejio")}>
                Læs mere om Lejio
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Forhandler;
