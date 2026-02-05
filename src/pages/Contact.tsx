import { Phone, Mail, MapPin, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";

const Contact = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-6">
              Vi sidder klar til at hjælpe 🙌
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Har du spørgsmål til din booking, brug for hjælp til at oprette dit køretøj, eller noget helt tredje? Ræk ud til os – vi elsker at snakke med vores brugere.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
              Kontakt os direkte
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-16">
              {/* Phone Card */}
              <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Phone className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-foreground mb-1">Telefon</h3>
                      <a 
                        href="tel:+4591998929" 
                        className="text-xl font-semibold text-primary hover:underline"
                      >
                        +45 91 99 89 29
                      </a>
                      <p className="text-sm text-muted-foreground mt-2">
                        Hverdage 09:00 - 16:00
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email Card */}
              <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Mail className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-foreground mb-1">E-mail</h3>
                      <a 
                        href="mailto:hej@lejio.dk" 
                        className="text-xl font-semibold text-primary hover:underline"
                      >
                        hej@lejio.dk
                      </a>
                      <p className="text-sm text-muted-foreground mt-2">
                        Vi svarer inden for 24 timer
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Company Info */}
            <div className="bg-muted/30 rounded-3xl p-8 md:p-12">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
                Virksomhedsoplysninger
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center shadow-sm">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground mb-1">LEJIO</h3>
                    <p className="text-muted-foreground">CVR: 44691507</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center shadow-sm">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground mb-1">Adresse</h3>
                    <p className="text-muted-foreground">
                      Erantisvej 2, st. 103<br />
                      8800 Viborg
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ CTA */}
            <div className="mt-16 text-center">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Ofte stillede spørgsmål
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Find svar på de mest almindelige spørgsmål om LEJIO, udlejning og booking.
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate('/faq')}
                className="font-bold"
              >
                Se FAQ
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
