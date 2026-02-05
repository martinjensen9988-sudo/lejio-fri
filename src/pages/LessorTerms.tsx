import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { FileText, Scale } from "lucide-react";

const LessorTerms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Bold geometric background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
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
                <Scale className="w-4 h-4 text-primary" />
                <span>Juridisk dokument</span>
              </div>
              
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.9] mb-6">
                <span className="block bg-gradient-to-r from-primary via-accent to-lavender bg-clip-text text-transparent py-2">
                  Udlejervilkår
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Gældende fra: 22. januar 2026
              </p>
            </div>
          </div>
        </section>
        
        <section className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-[2rem] border-2 border-border p-8 sm:p-12 shadow-xl">
              <div className="prose prose-lg max-w-none space-y-8 text-muted-foreground">
                
                {/* Section 1 */}
                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">1. Introduktion</h2>
                  <p>
                    Velkommen som udlejer på LEJIO. Disse vilkår ("Udlejervilkårene") regulerer dit forhold til LEJIO som platformudbyder, når du vælger at udleje dit køretøj via vores platform på www.lejio.dk.
                  </p>
                  <p className="mt-4">
                    Ved at oprette en udlejerprofil og liste køretøjer på LEJIO accepterer du disse vilkår i deres helhed.
                  </p>
                  <p className="mt-4">
                    LEJIO er en formidlingsplatform, der forbinder private og erhvervsmæssige udlejere med lejere. LEJIO er ikke part i lejeaftalen mellem dig og lejeren.
                  </p>
                </section>

                {/* Section 2 */}
                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">2. Definitioner</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-border rounded-xl overflow-hidden">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold text-foreground">Begreb</th>
                          <th className="px-4 py-3 text-left font-bold text-foreground">Betydning</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border"><td className="px-4 py-3 font-medium">Platformen</td><td className="px-4 py-3">LEJIOs hjemmeside (www.lejio.dk) og tilhørende applikationer</td></tr>
                        <tr className="border-t border-border bg-muted/30"><td className="px-4 py-3 font-medium">Udlejer</td><td className="px-4 py-3">En fysisk eller juridisk person, der lister køretøjer til udlejning på Platformen</td></tr>
                        <tr className="border-t border-border"><td className="px-4 py-3 font-medium">Lejer</td><td className="px-4 py-3">En fysisk eller juridisk person, der lejer et køretøj via Platformen</td></tr>
                        <tr className="border-t border-border bg-muted/30"><td className="px-4 py-3 font-medium">Køretøj</td><td className="px-4 py-3">Biler, motorcykler, scootere, campingvogne, autocampere og trailere</td></tr>
                        <tr className="border-t border-border"><td className="px-4 py-3 font-medium">Booking</td><td className="px-4 py-3">En bekræftet reservation af et Køretøj</td></tr>
                        <tr className="border-t border-border bg-muted/30"><td className="px-4 py-3 font-medium">Lejeperiode</td><td className="px-4 py-3">Tidsrummet fra afhentning til aflevering af Køretøjet</td></tr>
                        <tr className="border-t border-border"><td className="px-4 py-3 font-medium">Kommission</td><td className="px-4 py-3">Det gebyr, LEJIO opkræver for formidling af udlejningen</td></tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Section 3 */}
                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">3. Oprettelse af udlejerprofil</h2>
                  
                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">3.1 Krav til udlejere</h3>
                  <p>For at blive udlejer på LEJIO skal du:</p>
                  <ol className="list-[lower-alpha] pl-6 space-y-2 mt-4">
                    <li>Være fyldt 18 år eller være en registreret virksomhed i Danmark.</li>
                    <li>Oprette en profil med fuldstændige og korrekte oplysninger, herunder:
                      <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li>Fulde navn eller virksomhedsnavn</li>
                        <li>Adresse</li>
                        <li>Telefonnummer</li>
                        <li>E-mailadresse</li>
                        <li>CPR-nummer (skjult) eller CVR-nummer</li>
                        <li>Bankoplysninger til udbetaling</li>
                      </ul>
                    </li>
                    <li>Verificere din identitet via det af LEJIO anviste verifikationssystem.</li>
                    <li>Acceptere disse Udlejervilkår samt LEJIOs generelle Handelsbetingelser og Privatlivspolitik.</li>
                  </ol>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">3.2 Verifikation af køretøjer</h3>
                  <p>Alle køretøjer skal verificeres, før de kan udlejes. Du skal uploade:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Registreringsattest (del 1)</li>
                    <li>Billeder af køretøjet (minimum 5 stk., inkl. alle sider og eventuelle skader)</li>
                    <li>Dokumentation for gyldig forsikring, der dækker udlejning</li>
                    <li>Seneste synsrapport (hvis relevant)</li>
                  </ul>
                  <p className="mt-4">
                    LEJIO forbeholder sig retten til at afvise køretøjer, der ikke lever op til vores kvalitetsstandarder.
                  </p>
                </section>

                {/* Section 4 */}
                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">4. Abonnementer og priser</h2>
                  
                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">4.1 Abonnementstyper</h3>
                  <p>LEJIO tilbyder følgende planer for udlejere:</p>
                  
                  <div className="overflow-x-auto mt-4">
                    <table className="min-w-full border border-border rounded-xl overflow-hidden">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold text-foreground">Plan</th>
                          <th className="px-4 py-3 text-left font-bold text-foreground">Pris</th>
                          <th className="px-4 py-3 text-left font-bold text-foreground">Kommission</th>
                          <th className="px-4 py-3 text-left font-bold text-foreground">Fordele</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border"><td className="px-4 py-3 font-medium">Privat</td><td className="px-4 py-3">0 kr./md.</td><td className="px-4 py-3">59 kr pr. booking</td><td className="px-4 py-3">Grundlæggende funktioner, maks. 3 køretøjer</td></tr>
                        <tr className="border-t border-border bg-muted/30"><td className="px-4 py-3 font-medium">Starter/Standard/Enterprise</td><td className="px-4 py-3">349-899 kr./md.</td><td className="px-4 py-3">3% per booking</td><td className="px-4 py-3">Alle Pro-funktioner</td></tr>
                        <tr className="border-t border-border"><td className="px-4 py-3 font-medium">Fleet</td><td className="px-4 py-3">Kontakt os</td><td className="px-4 py-3">Efter aftale</td><td className="px-4 py-3">Til større flåder og særlige behov</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="mt-6">For forhandlere/professionelle udlejere tilbyder LEJIO følgende betalte abonnementer:</p>
                  
                  <div className="overflow-x-auto mt-4">
                    <table className="min-w-full border border-border rounded-xl overflow-hidden">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold text-foreground">Plan</th>
                          <th className="px-4 py-3 text-left font-bold text-foreground">Pris</th>
                          <th className="px-4 py-3 text-left font-bold text-foreground">Kommission</th>
                          <th className="px-4 py-3 text-left font-bold text-foreground">Kapacitet</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border"><td className="px-4 py-3 font-medium">Starter</td><td className="px-4 py-3">349 kr./md.</td><td className="px-4 py-3">3% per booking</td><td className="px-4 py-3">Op til 5 køretøjer</td></tr>
                        <tr className="border-t border-border bg-muted/30"><td className="px-4 py-3 font-medium">Standard</td><td className="px-4 py-3">599 kr./md.</td><td className="px-4 py-3">3% per booking</td><td className="px-4 py-3">Op til 15 køretøjer</td></tr>
                        <tr className="border-t border-border"><td className="px-4 py-3 font-medium">Enterprise</td><td className="px-4 py-3">899 kr./md.</td><td className="px-4 py-3">3% per booking</td><td className="px-4 py-3">16-35 køretøjer</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="mt-4 text-sm">
                    Alle priser er angivet ekskl. moms for CVR-registrerede virksomheder og inkl. moms for private.
                  </p>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">4.2 Binding og opsigelse</h3>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li><strong>Gratis:</strong> Ingen binding. Kan opsiges når som helst.</li>
                    <li><strong>Pro:</strong> Abonnementet kan opsiges med løbende måned + 30 dages varsel.</li>
                    <li><strong>Starter/Standard/Enterprise:</strong> Abonnementet kan opsiges med løbende måned + 30 dages varsel.</li>
                    <li><strong>Fleet:</strong> Vilkår for binding og opsigelse aftales individuelt.</li>
                  </ul>
                  <p className="mt-4">Opsigelse sker via din udlejerprofil eller ved skriftlig henvendelse til support@lejio.dk.</p>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">4.3 Ændring af abonnement</h3>
                  <p>
                    Du kan til enhver tid opgradere dit abonnement med øjeblikkelig virkning. Ved nedgradering træder ændringen i kraft ved næste faktureringsperiode, dog tidligst ved udløb af eventuel bindingsperiode.
                  </p>
                </section>

                {/* Section 5 */}
                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">5. Kommission og betaling</h2>
                  
                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">5.1 Kommission og abonnement – fakturering</h3>
                  <p>LEJIO tilbyder følgende afregningsmodeller (som aftales pr. samarbejde/opsætning):</p>
                  <div className="overflow-x-auto mt-4">
                    <table className="min-w-full border border-border rounded-xl overflow-hidden">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold text-foreground">Model</th>
                          <th className="px-4 py-3 text-left font-bold text-foreground">Kommission/Revenue Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border"><td className="px-4 py-3 font-medium">Software</td><td className="px-4 py-3">3%</td></tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <p className="mt-4 text-sm italic">
                    Følgende tre modeller er Fleet-/Partner-løsninger og er særskilte aftaler, som ikke følger prisstrukturen for de faste månedsabonnementer (Starter/Standard/Enterprise) i pkt. 4:
                  </p>
                  <div className="overflow-x-auto mt-4">
                    <table className="min-w-full border border-border rounded-xl overflow-hidden">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold text-foreground">Model</th>
                          <th className="px-4 py-3 text-left font-bold text-foreground">Kommission/Revenue Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border"><td className="px-4 py-3 font-medium">Partner Starter</td><td className="px-4 py-3">15%</td></tr>
                        <tr className="border-t border-border bg-muted/30"><td className="px-4 py-3 font-medium">Fleet Basic</td><td className="px-4 py-3">25% revenue share</td></tr>
                        <tr className="border-t border-border"><td className="px-4 py-3 font-medium">Fleet Premium</td><td className="px-4 py-3">35% revenue share</td></tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <p className="mt-6">Kommissionen beregnes på baggrund af den samlede lejepris (ekskl. depositum).</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li><strong>Gratis:</strong> 5% kommission pr. booking.</li>
                    <li><strong>Pro:</strong> 3% kommission pr. booking.</li>
                    <li><strong>Starter/Standard/Enterprise:</strong> 3% kommission pr. booking.</li>
                  </ul>
                  
                  <p className="mt-4">LEJIO fakturerer kommission og (hvis relevant) abonnement/kontingent månedligt:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Der faktureres bagudrettet hver den 1. i måneden for den foregående måned.</li>
                    <li>Betalingsfrist og betalingsmåde fremgår af fakturaen.</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Fleet:</strong> Kommission, abonnement og/eller revenue share samt afregningsmodel følger særskilt aftale.
                  </p>
                  <p className="mt-4">
                    <strong>Eksempel:</strong> Ved en booking på 1.000 kr. og en kommission på 3% udgør kommissionen 30 kr.
                  </p>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">5.2 Betaling (pengevejen) – leje og depositum</h3>
                  <p className="font-medium text-foreground">Privat, Starter, Standard og Enterprise (direkte afregning mellem lejer og udlejer):</p>
                  <p className="mt-2">
                    Leje og depositum afregnes direkte mellem lejer og udlejer via LEJIOs tekniske betalingsintegration. LEJIO modtager, opbevarer eller udbetaler ikke leje/depositum under disse abonnementer.
                  </p>
                  <p className="mt-4">Som udlejer skal du derfor:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Oprette og vedligeholde din egen konto hos den integrerede betalingsudbyder, og</li>
                    <li>Sikre, at dine udbetalings- og virksomhedsoplysninger (f.eks. bankkonto, CVR/CPR, m.v.) er korrekte hos betalingsudbyderen.</li>
                  </ul>
                  <p className="mt-4 font-medium text-foreground">Fleet (særskilt aftale):</p>
                  <p className="mt-2">
                    Fleet-løsningen følger en særskilt aftale vedrørende betalingshåndtering, herunder om LEJIO håndterer opkrævning og/eller udbetaling (payouts), samt vilkår for timing og eventuelle forudsætninger.
                  </p>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">5.3 Depositum</h3>
                  <p>LEJIO håndterer depositum på vegne af dig:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Depositummet reserveres på lejerens betalingskort ved bookingbekræftelse.</li>
                    <li>Efter endt lejeperiode frigives depositummet til lejeren, medmindre du inden for 48 timer indrapporterer skader eller mangler med tilhørende dokumentation.</li>
                    <li>Ved dokumenterede skader udbetales det relevante beløb til dig, jf. LEJIOs Handelsbetingelser.</li>
                  </ul>
                </section>

                {/* Section 6 */}
                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">6. Prisfastsættelse og annoncering</h2>
                  
                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">6.1 Din prissætning</h3>
                  <p>Du fastsætter selv prisen for dit køretøj, herunder:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Dagspris</li>
                    <li>Ugepris (valgfri rabat)</li>
                    <li>Månedspris (valgfri rabat)</li>
                    <li>Kilometergrænse og pris pr. ekstra kilometer</li>
                    <li>Depositum (anbefalet: 10-20% af køretøjets værdi)</li>
                  </ul>
                  <p className="mt-4">LEJIO kan give vejledende prisanbefalinger, men den endelige pris er dit ansvar.</p>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">6.2 Køretøjets værdi</h3>
                  <p>
                    Du skal angive en realistisk markedsværdi for dit køretøj. Denne værdi anvendes ved beregning af erstatning ved totalskade eller vanvidskørsel. LEJIO forbeholder sig ret til at foretage stikprøvekontrol og justere urimeligt høje værdisætninger.
                  </p>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">6.3 Annoncekvalitet</h3>
                  <p>Din annonce skal:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Indeholde præcise og opdaterede oplysninger om køretøjet.</li>
                    <li>Inkludere billeder af høj kvalitet, der viser køretøjets aktuelle stand.</li>
                    <li>Tydeligt angive eventuelle begrænsninger (f.eks. ingen kæledyr, ingen rygning).</li>
                  </ul>
                </section>

                {/* Section 7 */}
                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">7. Forsikring</h2>
                  
                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">7.1 Dit ansvar</h3>
                  <p>
                    Du er som udlejer fuldt ansvarlig for, at dit køretøj til enhver tid er korrekt og tilstrækkeligt forsikret til udlejning.
                  </p>
                  <p className="mt-4">Det betyder, at du – før du udlejer – selv skal sikre, at:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Din eksisterende forsikring udtrykkeligt dækker udlejning til tredjemand, eller</li>
                    <li>Du tegner en særskilt udlejningsforsikring, der dækker tredjemands brug af dit køretøj.</li>
                  </ul>
                  <p className="mt-4">
                    LEJIO stiller ikke forsikring til rådighed for udlejere og foretager ikke en forsikringsretlig vurdering af din dækning.
                  </p>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">7.2 Dokumentation</h3>
                  <p>
                    LEJIO kan til enhver tid anmode om dokumentation for gyldig forsikringsdækning. Manglende dokumentation kan medføre midlertidig deaktivering af dine annoncer.
                  </p>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">7.3 Ansvarsfraskrivelse</h3>
                  <p>
                    LEJIO påtager sig intet ansvar for skader, tab eller erstatningskrav, der opstår som følge af manglende eller utilstrækkelig forsikringsdækning.
                  </p>
                </section>

                {/* Section 8 */}
                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">8. Dine forpligtelser som udlejer</h2>
                  
                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">8.1 Generelle forpligtelser</h3>
                  <p>Som udlejer på LEJIO forpligter du dig til at:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Levere køretøjet i den stand, der er beskrevet i annoncen.</li>
                    <li>Sikre, at køretøjet er rengjort, tanket/opladet og klar til brug ved afhentning.</li>
                    <li>Gennemgå køretøjet sammen med lejeren ved både afhentning og aflevering.</li>
                    <li>Dokumentere køretøjets stand med billeder før og efter hver udlejning.</li>
                    <li>Svare på henvendelser fra lejere inden for 24 timer.</li>
                    <li>Overholde alle gældende love og regler, herunder skatte- og momsregler.</li>
                  </ul>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">8.2 Tilgængelighed og kalender</h3>
                  <p>
                    Du er ansvarlig for at holde din tilgængelighedskalender opdateret. Hvis du accepterer en booking, er du forpligtet til at gennemføre udlejningen.
                  </p>
                  <p className="mt-4">Gentagne aflysninger fra din side kan medføre:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Advarsler</li>
                    <li>Midlertidig suspension</li>
                    <li>Permanent udelukkelse fra Platformen</li>
                  </ul>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">8.3 Skattemæssige forhold</h3>
                  <p>
                    Indtægter fra udlejning er skattepligtige. Du er selv ansvarlig for at indberette dine indtægter til SKAT. LEJIO indberetter årligt oplysninger om udbetalinger til relevante myndigheder i overensstemmelse med gældende lovgivning.
                  </p>
                </section>

                {/* Section 9 */}
                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">9. Bookinger og aflysninger</h2>
                  
                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">9.1 Accept af bookinger</h3>
                  <p>
                    Når en lejer anmoder om at booke dit køretøj, har du 24 timer til at acceptere eller afvise anmodningen. Reagerer du ikke, afvises bookingen automatisk.
                  </p>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">9.2 Aflysning fra din side</h3>
                  <p>Hvis du aflyser en bekræftet booking:</p>
                  <p className="mt-4">Ved 3 eller flere aflysninger inden for 6 måneder kan din profil suspenderes.</p>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">9.3 Force majeure</h3>
                  <p>
                    Aflysninger grundet force majeure (f.eks. køretøj stjålet, totalskadet ved uheld) medfører ikke gebyr, såfremt du kan dokumentere omstændighederne.
                  </p>
                </section>

                {/* Section 10 */}
                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">10. Skader og tvister</h2>
                  
                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">10.1 Skader på køretøjet</h3>
                  <p>Ved skader på dit køretøj under en lejeperiode skal du:</p>
                  <ol className="list-[lower-alpha] pl-6 space-y-2 mt-4">
                    <li>Dokumentere skaden med billeder og skriftlig beskrivelse inden for 48 timer efter aflevering.</li>
                    <li>Indrapportere skaden via Platformens tvistfunktion.</li>
                    <li>Indhente minimum 2 uafhængige reparationstilbud.</li>
                  </ol>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">10.2 Tvistløsning</h3>
                  <p>LEJIO faciliterer tvister mellem udlejere og lejere. Processen er:</p>
                  <ol className="list-decimal pl-6 space-y-2 mt-4">
                    <li>Lejeren får mulighed for at kommentere på dit krav inden for 48 timer.</li>
                    <li>LEJIO gennemgår dokumentationen fra begge parter.</li>
                    <li>LEJIO træffer afgørelse om udbetaling af depositum (helt, delvist eller intet).</li>
                  </ol>
                  <p className="mt-4">
                    LEJIOs afgørelse er bindende for begge parter inden for rammerne af det stillede depositum. Ved krav, der overstiger depositummet, henvises til de almindelige domstole.
                  </p>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">10.3 Vanvidskørsel</h3>
                  <p>
                    Ved dokumenteret vanvidskørsel (som defineret i LEJIOs Handelsbetingelser) hæfter lejeren for køretøjets fulde værdi, uanset depositummets størrelse. LEJIO bistår med opkrævning, men garanterer ikke fuld inddrivelse.
                  </p>
                </section>

                {/* Section 11 */}
                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">11. LEJIOs GPS-udstyr (valgfrit)</h2>
                  
                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">11.1 Tilbud om GPS</h3>
                  <p>LEJIO tilbyder GPS-trackere til udlejere på Pro- og Fleet-abonnementer:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li><strong>Leje:</strong> 29 kr./md. pr. enhed</li>
                    <li><strong>Køb:</strong> 499 kr. pr. enhed (engangsbetaling)</li>
                  </ul>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">11.2 Brug af GPS-data</h3>
                  <p>GPS-data anvendes til:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Positionsbestemmelse ved tyveri eller vanvidskørsel.</li>
                    <li>Dokumentation af kørte kilometer.</li>
                    <li>Automatisk registrering af aflevering.</li>
                  </ul>
                  <p className="mt-4">Lejere informeres om GPS-tracking i forbindelse med bookingen, jf. LEJIOs Privatlivspolitik.</p>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">11.3 Ansvar for udstyr og installation</h3>
                  <p>
                    Lejet GPS-udstyr forbliver LEJIOs ejendom og skal returneres ved ophør af abonnement. Ved bortkomst eller beskadigelse opkræves 499 kr. pr. enhed.
                  </p>
                  <p className="mt-4">
                    Hvis du som udlejer vælger en GPS-løsning (uanset om det er LEJIOs udstyr eller andet), er du selv ansvarlig for korrekt og lovlig installation, opsætning og drift, herunder at udstyret ikke skader køretøjet eller påvirker køretøjets funktion.
                  </p>
                </section>

                {/* Section 12 */}
                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">12. Immaterielle rettigheder</h2>
                  
                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">12.1 Dit indhold</h3>
                  <p>
                    Du bevarer alle rettigheder til de billeder og beskrivelser, du uploader. Ved at uploade indhold til Platformen giver du LEJIO en ikke-eksklusiv, vederlagsfri licens til at anvende materialet i forbindelse med markedsføring af Platformen.
                  </p>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">12.2 LEJIOs indhold</h3>
                  <p>
                    Alt indhold på Platformen, herunder logoer, design og tekster, tilhører LEJIO og må ikke kopieres eller anvendes uden skriftlig tilladelse.
                  </p>
                </section>

                {/* Section 13 */}
                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">13. Suspension og ophør</h2>
                  
                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">13.1 Suspension</h3>
                  <p>LEJIO kan midlertidigt suspendere din profil ved:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Mistanke om svigagtig adfærd.</li>
                    <li>Gentagne klager fra lejere.</li>
                    <li>Overtrædelse af disse vilkår.</li>
                    <li>Manglende forsikringsdokumentation.</li>
                  </ul>
                  <p className="mt-4">Du vil blive underrettet om suspensionen og årsagen hertil.</p>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">13.2 Permanent udelukkelse</h3>
                  <p>LEJIO kan permanent udelukke dig fra Platformen ved:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Grov eller gentagen overtrædelse af vilkårene.</li>
                    <li>Svindel eller dokumentfalsk.</li>
                    <li>Trusler eller chikane mod lejere eller LEJIO-medarbejdere.</li>
                  </ul>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">13.3 Din opsigelse</h3>
                  <p>Du kan til enhver tid opsige din udlejerprofil. Ved opsigelse:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Eksisterende bookinger skal gennemføres eller aflyses efter reglerne i pkt. 9.2.</li>
                    <li>Eventuelle udestående udbetalinger sker efter normal procedure.</li>
                    <li>Lejet GPS-udstyr skal returneres inden 14 dage.</li>
                  </ul>
                </section>

                {/* Section 14 */}
                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">14. Ansvarsbegrænsning</h2>
                  
                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">14.1 LEJIOs ansvar</h3>
                  <p>LEJIO er alene formidler og påtager sig ikke ansvar for:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Skader på dit køretøj forårsaget af lejere.</li>
                    <li>Lejeres manglende betalingsevne ud over det stillede depositum.</li>
                    <li>Tab af indtægt grundet tekniske fejl på Platformen.</li>
                    <li>Indirekte tab, herunder driftstab eller tabt fortjeneste.</li>
                  </ul>

                  <h3 className="font-display text-xl font-medium text-foreground mt-6 mb-3">14.2 Maksimalt ansvar</h3>
                  <p>
                    LEJIOs samlede ansvar over for dig kan aldrig overstige det beløb, du har betalt i kommission og abonnementsgebyrer de seneste 12 måneder.
                  </p>
                </section>

                {/* Section 15 */}
                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">15. Ændringer af vilkårene</h2>
                  <p>
                    LEJIO kan ændre disse vilkår med 30 dages varsel. Ændringer varsles via e-mail og/eller besked på Platformen.
                  </p>
                  <p className="mt-4">
                    Hvis du ikke kan acceptere de ændrede vilkår, kan du opsige din profil inden ikrafttrædelsesdatoen. Fortsat brug af Platformen efter ikrafttrædelse betragtes som accept af de nye vilkår.
                  </p>
                </section>

                {/* Section 16 */}
                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">16. Lovvalg og værneting</h2>
                  <p>
                    Disse vilkår er underlagt dansk ret. Eventuelle tvister, der ikke kan løses i mindelighed, afgøres ved de danske domstole med Københavns Byret som første instans.
                  </p>
                </section>

                {/* Section 17 */}
                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">17. Kontakt</h2>
                  <p>
                    Har du spørgsmål til disse vilkår, er du velkommen til at kontakte os:
                  </p>
                  <div className="mt-4 p-5 bg-primary/10 border border-primary/30 rounded-xl">
                    <p className="font-semibold text-foreground">LEJIO</p>
                    <p>CVR: 44691507</p>
                    <p>Adresse: Erantisvej 2, st. 103, 8800 Viborg</p>
                    <p>E-mail: <a href="mailto:support@lejio.dk" className="text-primary hover:underline">support@lejio.dk</a></p>
                    <p>Hjemmeside: <a href="https://www.lejio.dk" className="text-primary hover:underline">www.lejio.dk</a></p>
                  </div>
                  <p className="mt-6 text-sm text-muted-foreground italic">
                    Disse Udlejervilkår er senest opdateret den 22. januar 2026.
                  </p>
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

export default LessorTerms;