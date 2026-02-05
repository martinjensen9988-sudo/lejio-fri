import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Shield, Lock, MapPin, Camera, Users, Clock, Cookie, AlertTriangle, Mail, Phone, Globe } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Bold geometric background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-mint/20 via-background to-primary/10" />
            <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-mint rounded-full blur-[100px] opacity-15 animate-float-slow" />
            <div className="absolute top-1/4 -right-32 w-[400px] h-[400px] bg-primary rounded-full blur-[80px] opacity-20 animate-float" />
            
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
              backgroundSize: '60px 60px'
            }} />
          </div>
          
          <div className="container mx-auto px-6 py-16 relative z-10">
            <div className="max-w-4xl animate-slide-up">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mint/20 border border-mint/40 text-sm font-bold text-foreground mb-6">
                <Lock className="w-4 h-4 text-mint" />
                <span>GDPR-compliant</span>
              </div>
              
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.9] mb-6">
                <span className="block bg-gradient-to-r from-mint via-primary to-accent bg-clip-text text-transparent py-2">
                  Privatlivspolitik
                </span>
              </h1>
              <p className="text-muted-foreground">
                Senest opdateret: Januar 2026
              </p>
            </div>
          </div>
        </section>
        
        <section className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Section 1: Dataansvarlig */}
            <div className="bg-card rounded-[2rem] border-2 border-border p-8 sm:p-10 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">1. Dataansvarlig</h2>
              </div>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  <strong className="text-foreground">LEJIO</strong><br />
                  CVR-nr.: 44691507<br />
                  Adresse: Erantisvej 2, st. 103, 8800 Viborg, Danmark<br />
                  E-mail: <a href="mailto:hej@lejio.dk" className="text-primary hover:underline">hej@lejio.dk</a><br />
                  Hjemmeside: <a href="https://www.lejio.dk" className="text-primary hover:underline">www.lejio.dk</a>
                </p>
                <p>
                  LEJIO (herefter "LEJIO", "vi", "os" eller "vores") er dataansvarlig for behandlingen af de personoplysninger, 
                  som vi modtager om dig. Denne privatlivspolitik beskriver, hvordan vi indsamler, anvender, opbevarer og beskytter 
                  dine personoplysninger i overensstemmelse med Europa-Parlamentets og Rådets forordning (EU) 2016/679 af 27. april 2016 (GDPR) 
                  samt den danske databeskyttelseslov.
                </p>
              </div>
            </div>

            {/* Section 2: Hvilke personoplysninger */}
            <div className="bg-card rounded-[2rem] border-2 border-border p-8 sm:p-10 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">2. Hvilke personoplysninger indsamler vi?</h2>
              </div>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
                
                <div>
                  <h3 className="font-display text-xl font-medium text-foreground mb-4">2.1 Oplysninger du selv afgiver</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Kategori</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Eksempler</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">Identitetsoplysninger</td>
                          <td className="py-3 px-4">Fulde navn, fødselsdato, profilbillede</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">Kontaktoplysninger</td>
                          <td className="py-3 px-4">E-mailadresse, telefonnummer, adresse</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">Identifikationsdokumentation</td>
                          <td className="py-3 px-4">Kørekort, MitID-verifikation</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">Betalingsoplysninger</td>
                          <td className="py-3 px-4">Betalingsreferencer/transaktions-id, status for betaling og depositum. Afregning sker direkte mellem parterne.</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">Køretøjsoplysninger (udlejere)</td>
                          <td className="py-3 px-4">Registreringsnummer, køretøjstype, billeder, forsikringsoplysninger</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-medium">Kommunikation</td>
                          <td className="py-3 px-4">Beskeder sendt via platformen, kundeservicehenvendelser</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="font-display text-xl font-medium text-foreground mb-4">2.2 Oplysninger vi indsamler automatisk</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Kategori</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Eksempler</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">Tekniske data</td>
                          <td className="py-3 px-4">IP-adresse, browsertype, enhedstype, operativsystem</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">Brugsdata</td>
                          <td className="py-3 px-4">Sidevisninger, klikaktivitet, søgehistorik på platformen</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">Lokationsdata</td>
                          <td className="py-3 px-4">Omtrentlig geografisk placering baseret på IP-adresse</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">GPS-data</td>
                          <td className="py-3 px-4">Lokationsdata fra GPS-enhed i forbindelse med udlejning, herunder position og tidsstempel, når det er aktiveret for det konkrete køretøj</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-medium">Cookiedata</td>
                          <td className="py-3 px-4">Se nærmere i sektion 9 om cookies</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="font-display text-xl font-medium text-foreground mb-4">2.3 Oplysninger fra tredjeparter</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Kilde</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Type af oplysninger</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">MitID</td>
                          <td className="py-3 px-4">Identitetsverifikation</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">Betalingsudbydere</td>
                          <td className="py-3 px-4">Bekræftelse af betalingstransaktioner</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">Offentlige registre</td>
                          <td className="py-3 px-4">Køretøjsoplysninger via Motorregistret</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">Andre brugere</td>
                          <td className="py-3 px-4">Anmeldelser og vurderinger</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-medium">AI-/scanningsløsninger</td>
                          <td className="py-3 px-4">Billeddata og udtrukne oplysninger fra billeder (f.eks. nummerplade og instrumentbræt) i forbindelse med dokumentation ved afhentning/aflevering</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Formål med behandlingen */}
            <div className="bg-card rounded-[2rem] border-2 border-border p-8 sm:p-10 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mint to-mint/60 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">3. Formål med behandlingen</h2>
              </div>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
                
                <div>
                  <h3 className="font-display text-xl font-medium text-foreground mb-3">3.1 Opfyldelse af aftale (GDPR art. 6, stk. 1, litra b)</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Oprette og administrere din brugerkonto</li>
                    <li>Formidle udlejningsaftaler mellem lejere og udlejere</li>
                    <li>Håndtere betalinger, depositum og udbetalinger</li>
                    <li>Generere og administrere lejekontrakter</li>
                    <li>Videreformidle nødvendige kontaktoplysninger (f.eks. navn, telefonnummer og e-mail) mellem lejer og udlejer, så parterne kan koordinere afhentning/aflevering og opfylde lejekontrakten</li>
                    <li>Kommunikere med dig om aktive bookinger</li>
                    <li>Levere kundesupport</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-display text-xl font-medium text-foreground mb-3">3.2 Retlig forpligtelse (GDPR art. 6, stk. 1, litra c)</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Overholde bogførings- og regnskabslovgivning</li>
                    <li>Opfylde skattemæssige indberetningsforpligtelser</li>
                    <li>Efterkomme retslige påbud og myndighedsanmodninger</li>
                    <li>Forebygge og opdage svindel og hvidvask</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-display text-xl font-medium text-foreground mb-3">3.3 Legitime interesser (GDPR art. 6, stk. 1, litra f)</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Forbedre og udvikle vores platform og tjenester</li>
                    <li>Analysere brugeradfærd for at optimere brugeroplevelsen</li>
                    <li>Forebygge misbrug af platformen</li>
                    <li>Administrere vores advarselssystem (se sektion 6)</li>
                    <li>Behandle GPS-data, hvor det er aktiveret for det konkrete køretøj, til tyverisikring, lokalisering af køretøjet samt dokumentation ved tvister</li>
                    <li>Behandle billeddata, herunder billeder og AI-scanning af nummerplader og instrumentbræt, til dokumentation af køretøjets stand, kilometerstand og brug ved tvister/skades- og forsikringssager</li>
                    <li>Markedsføre vores tjenester til eksisterende kunder</li>
                    <li>Beskytte vores juridiske interesser ved tvister</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-display text-xl font-medium text-foreground mb-3">3.4 Samtykke (GDPR art. 6, stk. 1, litra a)</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Udsende nyhedsbreve og markedsføringsmateriale</li>
                    <li>Placere ikke-nødvendige cookies</li>
                    <li>Behandle følsomme personoplysninger, hvor relevant</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 4: Deling af oplysninger */}
            <div className="bg-card rounded-[2rem] border-2 border-border p-8 sm:p-10 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lavender to-lavender/60 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">4. Deling af personoplysninger</h2>
              </div>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
                
                <div>
                  <h3 className="font-display text-xl font-medium text-foreground mb-3">4.1 Andre brugere af platformen</h3>
                  <p>
                    Når du opretter en booking eller udlejer et køretøj, deles relevante oplysninger med modparten 
                    for at kunne opfylde lejekontrakten og gennemføre udlejningen:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li><strong>Lejere ser:</strong> Udlejers fornavn, profilbillede, telefonnummer, e-mail, omtrentlig lokation, anmeldelser og køretøjsoplysninger</li>
                    <li><strong>Udlejere ser:</strong> Lejers fulde navn, telefonnummer, e-mail, kørekortsoplysninger og anmeldelser</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-display text-xl font-medium text-foreground mb-3">4.2 Databehandlere og samarbejdspartnere</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Partner</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Formål</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Lokation</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">Betalingsudbyder (Stripe/Nets)</td>
                          <td className="py-3 px-4">Betalingshåndtering</td>
                          <td className="py-3 px-4">EU/USA (med EU-godkendte overførselsgarantier)</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">Cloud-udbyder</td>
                          <td className="py-3 px-4">Hosting af data</td>
                          <td className="py-3 px-4">EU</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">E-mailudbyder</td>
                          <td className="py-3 px-4">Udsendelse af transaktionsmails</td>
                          <td className="py-3 px-4">EU</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">Kundesupportsystem</td>
                          <td className="py-3 px-4">Håndtering af henvendelser</td>
                          <td className="py-3 px-4">EU</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-medium">Analyseværktøjer</td>
                          <td className="py-3 px-4">Forståelse af platformens brug</td>
                          <td className="py-3 px-4">EU/USA (med EU-godkendte overførselsgarantier)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="font-display text-xl font-medium text-foreground mb-3">4.3 Myndigheder og tredjeparter</h3>
                  <p>Vi kan videregive dine oplysninger til:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Politiet ved mistanke om strafbare forhold (herunder vanvidskørsel)</li>
                    <li>SKAT i henhold til skattemæssige indberetningsforpligtelser</li>
                    <li>Domstole ved retssager eller tvister</li>
                    <li>Forsikringsselskaber ved skadesanmeldelser (med dit samtykke eller hvor lovligt påkrævet)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 5: Overførsel til tredjelande */}
            <div className="bg-card rounded-[2rem] border-2 border-border p-8 sm:p-10 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">5. Overførsel til tredjelande</h2>
              </div>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p>
                  Hvis dine personoplysninger overføres til lande uden for EU/EØS, sikrer vi, at der er et 
                  tilstrækkeligt beskyttelsesniveau gennem:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>EU-Kommissionens standardkontraktbestemmelser (SCCs)</li>
                  <li>Bindende virksomhedsregler (BCRs)</li>
                  <li>Certificeringsordninger (f.eks. EU-US Data Privacy Framework)</li>
                </ul>
                <p className="mt-4">
                  Du kan kontakte os for at få en kopi af de relevante overførselsgarantier.
                </p>
              </div>
            </div>

            {/* Section 6: Advarselssystemet */}
            <div className="bg-card rounded-[2rem] border-2 border-border p-8 sm:p-10 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-destructive to-destructive/60 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">6. Advarselssystemet</h2>
              </div>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
                <p>
                  For at beskytte alle brugere på platformen har LEJIO implementeret et advarselssystem, 
                  der registrerer overtrædelser af vores handelsbetingelser.
                </p>

                <div>
                  <h3 className="font-display text-xl font-medium text-foreground mb-3">6.1 Hvad registreres?</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Dokumenterede overtrædelser af vilkår (f.eks. forsinket aflevering, skader på køretøj, manglende betaling)</li>
                    <li>Bekræftede klager fra modparter</li>
                    <li>Alvorlige overtrædelser (f.eks. vanvidskørsel)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-display text-xl font-medium text-foreground mb-3">6.2 Konsekvenser</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Advarsler kan medføre midlertidig eller permanent udelukkelse fra platformen</li>
                    <li>Ved alvorlige overtrædelser kan vi indberette til relevante myndigheder</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-display text-xl font-medium text-foreground mb-3">6.3 Din ret til indsigelse og sletning</h3>
                  <p>Du har ret til at:</p>
                  <ol className="list-decimal pl-6 space-y-2 mt-4">
                    <li>Få indsigt i eventuelle registrerede advarsler på din profil</li>
                    <li>Gøre indsigelse mod en advarsel, hvis du mener, den er uberettiget</li>
                    <li>Anmode om sletning af en advarsel, hvis du kan dokumentere, at den er fejlagtig</li>
                  </ol>
                </div>

                <div className="p-5 bg-mint/10 border border-mint/30 rounded-xl">
                  <h4 className="font-semibold text-foreground mb-3">Proces for indsigelse:</h4>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Send en skriftlig indsigelse/klage til <a href="mailto:hej@lejio.dk" className="text-primary hover:underline">hej@lejio.dk</a> med dokumentation for din påstand</li>
                    <li>Vi genvurderer sagen inden for 14 dage fra modtagelse</li>
                    <li>Hvis indsigelsen imødekommes, slettes advarslen straks</li>
                    <li>Hvis indsigelsen afvises, modtager du en begrundet afgørelse, som du kan indbringe for Datatilsynet</li>
                  </ol>
                  <p className="mt-4 text-sm">
                    Advarsler slettes automatisk efter 3 år fra registreringsdatoen, medmindre der er tale om 
                    alvorlige overtrædelser, som kan opbevares i op til 5 år.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 7: Opbevaringsperiode */}
            <div className="bg-card rounded-[2rem] border-2 border-border p-8 sm:p-10 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">7. Opbevaring af personoplysninger</h2>
              </div>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p>Vi opbevarer dine personoplysninger så længe, det er nødvendigt for at opfylde de formål, de blev indsamlet til:</p>
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Datakategori</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Opbevaringsperiode</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-4 font-medium">Kontooplysninger</td>
                        <td className="py-3 px-4">Så længe kontoen er aktiv + 3 år efter sletning</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-4 font-medium">Transaktionsdata</td>
                        <td className="py-3 px-4">5 år (bogføringslovens krav)</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-4 font-medium">Kontrakter og aftaler</td>
                        <td className="py-3 px-4">5 år efter aftalens ophør</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-4 font-medium">Dokumentation (fotos, AI-scanninger)</td>
                        <td className="py-3 px-4">5 år (af hensyn til bogføringsloven samt forældelsesfrister)</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-4 font-medium">Kommunikation via platformen</td>
                        <td className="py-3 px-4">2 år efter afsluttet booking</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-4 font-medium">Advarsler</td>
                        <td className="py-3 px-4">3-5 år afhængigt af alvorlighed</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-4 font-medium">Markedsføringssamtykke</td>
                        <td className="py-3 px-4">Indtil samtykke tilbagekaldes</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium">Logfiler og tekniske data</td>
                        <td className="py-3 px-4">12 måneder</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-4">Herefter slettes eller anonymiseres dine oplysninger.</p>
              </div>
            </div>

            {/* Section 8: Dine rettigheder */}
            <div className="bg-card rounded-[2rem] border-2 border-border p-8 sm:p-10 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">8. Dine rettigheder</h2>
              </div>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>I henhold til GDPR har du følgende rettigheder:</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong className="text-foreground">Ret til indsigt (art. 15):</strong> Du har ret til at få bekræftet, om vi behandler personoplysninger om dig, og i givet fald få adgang til disse oplysninger.</li>
                  <li><strong className="text-foreground">Ret til berigtigelse (art. 16):</strong> Du har ret til at få urigtige personoplysninger om dig rettet uden unødig forsinkelse.</li>
                  <li><strong className="text-foreground">Ret til sletning (art. 17):</strong> Du har i visse tilfælde ret til at få slettet dine personoplysninger. Dette gælder dog ikke, hvis vi er retligt forpligtet til at opbevare oplysningerne.</li>
                  <li><strong className="text-foreground">Ret til begrænsning (art. 18):</strong> Du har i visse tilfælde ret til at få begrænset behandlingen af dine personoplysninger.</li>
                  <li><strong className="text-foreground">Ret til dataportabilitet (art. 20):</strong> Du har ret til at modtage dine personoplysninger i et struktureret, almindeligt anvendt og maskinlæsbart format.</li>
                  <li><strong className="text-foreground">Ret til indsigelse (art. 21):</strong> Du har ret til at gøre indsigelse mod vores behandling af dine personoplysninger baseret på vores legitime interesser.</li>
                  <li><strong className="text-foreground">Ret til at tilbagekalde samtykke:</strong> Hvis behandlingen er baseret på samtykke, kan du til enhver tid tilbagekalde dit samtykke.</li>
                </ul>
                <div className="mt-6 p-5 bg-mint/10 border border-mint/30 rounded-xl">
                  <h4 className="font-semibold text-foreground mb-3">Sådan udøver du dine rettigheder</h4>
                  <p>
                    Kontakt os på <a href="mailto:privacy@lejio.dk" className="text-primary hover:underline">privacy@lejio.dk</a> med 
                    din anmodning. Vi besvarer din henvendelse inden for 30 dage. Ved komplekse anmodninger kan fristen forlænges med yderligere 60 dage.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 9: Cookies */}
            <div className="bg-card rounded-[2rem] border-2 border-border p-8 sm:p-10 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mint to-mint/60 flex items-center justify-center">
                  <Cookie className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">9. Cookies og sporingsteknologier</h2>
              </div>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
                <p>
                  Vi bruger cookies og lignende teknologier på vores platform. En cookie er en lille tekstfil, 
                  der gemmes på din enhed.
                </p>

                <div>
                  <h3 className="font-display text-xl font-medium text-foreground mb-3">9.1 Typer af cookies</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Type</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Formål</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Varighed</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">Nødvendige cookies</td>
                          <td className="py-3 px-4">Sikrer platformens grundlæggende funktionalitet, f.eks. login og betalingshåndtering</td>
                          <td className="py-3 px-4">Session/1 år</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">Funktionelle cookies</td>
                          <td className="py-3 px-4">Husker dine præferencer, f.eks. sprog og gemte søgninger</td>
                          <td className="py-3 px-4">1 år</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium">Analytiske cookies</td>
                          <td className="py-3 px-4">Hjælper os med at forstå, hvordan platformen bruges</td>
                          <td className="py-3 px-4">Op til 2 år</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-medium">Markedsføringscookies</td>
                          <td className="py-3 px-4">Bruges til at vise relevante annoncer</td>
                          <td className="py-3 px-4">Op til 2 år</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <p>
                  Du kan til enhver tid ændre dine cookieindstillinger via vores cookiebanner eller i din browsers 
                  indstillinger. Bemærk, at blokering af nødvendige cookies kan påvirke platformens funktionalitet.
                </p>
              </div>
            </div>

            {/* Section 10: Sikkerhed */}
            <div className="bg-card rounded-[2rem] border-2 border-border p-8 sm:p-10 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lavender to-lavender/60 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">10. Sikkerhed</h2>
              </div>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p>
                  Vi tager beskyttelsen af dine personoplysninger alvorligt og har implementeret passende tekniske 
                  og organisatoriske sikkerhedsforanstaltninger, herunder:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>Kryptering af data under overførsel (TLS/SSL)</li>
                  <li>Kryptering af følsomme data i hvile</li>
                  <li>Adgangskontrol og logning</li>
                  <li>Regelmæssige sikkerhedsopdateringer og -test</li>
                  <li>Medarbejderuddannelse i databeskyttelse</li>
                  <li>Incident response-procedurer</li>
                </ul>
              </div>
            </div>

            {/* Section 11: Ændringer */}
            <div className="bg-card rounded-[2rem] border-2 border-border p-8 sm:p-10 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">11. Ændringer til privatlivspolitikken</h2>
              </div>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p>
                  Vi kan opdatere denne privatlivspolitik fra tid til anden. Ved væsentlige ændringer vil vi informere 
                  dig via e-mail eller en tydelig meddelelse på platformen. Den seneste version vil altid være 
                  tilgængelig på www.lejio.dk/privatlivspolitik.
                </p>
              </div>
            </div>

            {/* Section 12: Klageadgang */}
            <div className="bg-card rounded-[2rem] border-2 border-border p-8 sm:p-10 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">12. Klageadgang</h2>
              </div>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p>
                  Hvis du er utilfreds med vores behandling af dine personoplysninger, kan du klage til:
                </p>
                <div className="mt-4 p-5 bg-muted/50 rounded-xl">
                  <p className="font-semibold text-foreground">Datatilsynet</p>
                  <p>Carl Jacobsens Vej 35</p>
                  <p>2500 Valby</p>
                  <p>Telefon: 33 19 32 00</p>
                  <p>E-mail: <a href="mailto:dt@datatilsynet.dk" className="text-primary hover:underline">dt@datatilsynet.dk</a></p>
                  <p>Hjemmeside: <a href="https://www.datatilsynet.dk" className="text-primary hover:underline">www.datatilsynet.dk</a></p>
                </div>
                <p className="mt-4">
                  Vi opfordrer dig dog til først at kontakte os, så vi kan forsøge at løse problemet.
                </p>
              </div>
            </div>

            {/* Section 13: Kontakt */}
            <div className="bg-card rounded-[2rem] border-2 border-border p-8 sm:p-10 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mint to-mint/60 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">13. Kontakt</h2>
              </div>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p>
                  Har du spørgsmål til denne privatlivspolitik eller vores behandling af dine personoplysninger, 
                  er du velkommen til at kontakte os:
                </p>
                <div className="mt-4 p-5 bg-mint/10 border border-mint/30 rounded-xl">
                  <p className="font-semibold text-foreground">LEJIO</p>
                  <p>E-mail: <a href="mailto:privacy@lejio.dk" className="text-primary hover:underline">privacy@lejio.dk</a></p>
                  <p>Hjemmeside: <a href="https://www.lejio.dk" className="text-primary hover:underline">www.lejio.dk</a></p>
                </div>
                <p className="mt-6 text-sm text-muted-foreground">
                  Denne privatlivspolitik er gældende fra januar 2026.
                </p>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
