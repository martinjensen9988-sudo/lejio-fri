import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { FileText } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Bold geometric background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 via-background to-primary/10" />
            <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-primary rounded-full blur-[100px] opacity-15 animate-float-slow" />
            <div className="absolute top-1/4 -right-32 w-[400px] h-[400px] bg-accent rounded-full blur-[80px] opacity-20 animate-float" />
            
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
              backgroundSize: '60px 60px'
            }} />
          </div>
          
          <div className="container mx-auto px-6 py-16 relative z-10">
            <div className="max-w-4xl animate-slide-up">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/40 text-sm font-bold text-foreground mb-6">
                <FileText className="w-4 h-4 text-primary" />
                <span>Juridisk dokument</span>
              </div>
              
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.9] mb-6">
                <span className="block bg-gradient-to-r from-primary via-accent to-mint bg-clip-text text-transparent py-2">
                  Handelsbetingelser
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Sidst opdateret: 22. januar 2026
              </p>
            </div>
          </div>
        </section>
        
        <section className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-[2rem] border-2 border-border p-8 sm:p-12 shadow-xl">
              <div className="prose prose-lg max-w-none space-y-8 text-muted-foreground">
                <p className="text-lg">
                  Disse handelsbetingelser gælder for alle brugere af LEJIO's platform. LEJIO er en formidlingsplatform 
                  og er ikke part i selve lejeaftalen mellem lejer og udlejer.
                </p>

                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">1. Om LEJIO</h2>
                  <p>
                    LEJIO (lejio.dk) formidler kontakt mellem private/erhvervsmæssige udlejere og lejere af køretøjer.
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li><strong>CVR:</strong> 44691507</li>
                    <li><strong>Adresse:</strong> Erantisvej 2, st. 103, 8800 Viborg</li>
                    <li><strong>E-mail:</strong> hej@lejio.dk</li>
                    <li><strong>Telefon:</strong> 91 99 89 29</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">2. Brugerkrav</h2>
                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">Lejer</h3>
                  <p>
                    Skal være min. 21 år (medmindre udlejer kræver højere alder) og have haft gyldigt kørekort i min. 2 år.
                  </p>
                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">Udlejer</h3>
                  <p>
                    Skal være min. 18 år og eje/have råderet over et lovligt, forsikret og trafiksikkert køretøj.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">3. Booking og Ingen Fortrydelsesret</h2>
                  <p>
                    En booking er bindende, når lejekontrakten er underskrevet digitalt.
                  </p>
                  <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mt-4">
                    <p className="text-foreground font-medium">
                      <strong>Bemærk:</strong> Jf. Forbrugeraftalelovens § 18, stk. 2, nr. 12, er der ingen 14 dages 
                      fortrydelsesret ved leje af køretøjer til en specifik dato.
                    </p>
                  </div>
                  <p className="mt-4">Afbestilling følger LEJIO's afbestillingspolitik:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li>Afbestilling skal ske <strong>senest 48 timer</strong> før lejeperiodens start for at få refundering (minus gebyrer).</li>
                    <li>Ved afbestilling <strong>senere end 48 timer</strong> før gives ingen refundering.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">4. Prisstruktur (ekskl. moms)</h2>
                  <p>
                    Følgende prisstruktur gælder for LEJIO's modeller. Alle priser er ekskl. moms.
                  </p>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">4.1 Software-modellen (Udlej selv)</h3>
                  <p>Abonnement pr. måned (baseret på antal biler), plus 3% kommission pr. booking:</p>
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left px-4 py-3 font-semibold text-foreground border-b border-border">Plan</th>
                          <th className="text-left px-4 py-3 font-semibold text-foreground border-b border-border">Pris</th>
                          <th className="text-left px-4 py-3 font-semibold text-foreground border-b border-border">Antal biler</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border">
                          <td className="px-4 py-3 font-medium">Starter</td>
                          <td className="px-4 py-3">349 kr./md + 3% kommission</td>
                          <td className="px-4 py-3">1-5 biler</td>
                        </tr>
                        <tr className="border-t border-border bg-muted/30">
                          <td className="px-4 py-3 font-medium">Standard</td>
                          <td className="px-4 py-3">599 kr./md + 3% kommission</td>
                          <td className="px-4 py-3">6-15 biler</td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="px-4 py-3 font-medium">Enterprise</td>
                          <td className="px-4 py-3">899 kr./md + 3% kommission</td>
                          <td className="px-4 py-3">16-35 biler</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">4.2 Partner-modellen</h3>
                  <p><strong>Partner-modellen:</strong> 18% pr. booking</p>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">4.3 Fleet-modeller</h3>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li><strong>Fleet Basic:</strong> 20% pr. booking</li>
                    <li><strong>Fleet Premium:</strong> 35% pr. booking</li>
                  </ul>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">4.4 Depositum</h3>
                  <p>
                    Udlejer fastsætter depositum. Dette reserveres/opkræves ved booking og refunderes automatisk efter 
                    lejeperiodens ophør (typisk indenfor 8 hverdage), forudsat at der ikke er anmeldt skader eller krav.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">5. Vanvidskørsel og Erstatningsansvar</h2>
                  <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
                    <p className="text-foreground font-medium">
                      Lejer bærer det fulde personlige og økonomiske ansvar ved konfiskation af køretøjet som følge af 
                      vanvidskørsel (jf. Færdselsloven).
                    </p>
                  </div>
                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">Bilens værdi</h3>
                  <p>
                    Erstatningskravet mod lejer udgør altid køretøjets fulde handelsværdi på tidspunktet for konfiskationen.
                  </p>
                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">Fastlæggelse af beløb</h3>
                  <p>
                    Udlejer angiver køretøjets værdi i lejekontrakten. LEJIO foretager løbende stikprøvekontrol, hvor 
                    udlejer skal kunne fremvise bevis for bilens pris/værdi (f.eks. købsfaktura eller aktuel vurdering) 
                    for at sikre, at kravet mod lejer er retfærdigt og dokumenteret.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">6. Forsikring</h2>
                  <p>
                    Udlejer er ansvarlig for, at køretøjet er lovmæssigt forsikret til udlejning. LEJIO hæfter ikke for skader, 
                    der ikke dækkes af udlejers forsikring.
                  </p>
                  <p className="mt-4">
                    Lejer hæfter for selvrisiko og skader ej dækket af kasko (f.eks. stenslag, jf. lejekontrakten).
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">7. Advarselssystem og Data</h2>
                  <p>
                    LEJIO registrerer oplysninger om kontraktbrud, skader og vanvidskørsel for at beskytte platformens brugere.
                  </p>
                  <p className="mt-4">
                    Behandling af personoplysninger sker i overensstemmelse med vores{" "}
                    <a href="/privatlivspolitik" className="text-primary hover:underline">Privatlivspolitik</a> og GDPR.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">8. Ansvarsfraskrivelse</h2>
                  <p>
                    LEJIO er ikke part i lejeaftalen og hæfter ikke for køretøjets stand, brugernes adfærd eller 
                    økonomiske tab opstået i forbindelse med udlejningen.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">9. Klagemulighed</h2>
                  <p>
                    Tvister søges løst mellem lejer og udlejer. Kan der ikke opnås enighed, kan der klages til:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Center for Klageløsning (Nævnenes Hus)</li>
                    <li>
                      EU's online klageportal (ODR):{" "}
                      <a 
                        href="http://ec.europa.eu/consumers/odr/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        http://ec.europa.eu/consumers/odr/
                      </a>
                    </li>
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
