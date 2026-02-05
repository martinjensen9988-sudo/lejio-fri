import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Car, 
  User, 
  CreditCard, 
  Shield, 
  FileText, 
  HelpCircle, 
  Bot, 
  Wrench, 
  TrendingDown, 
  Languages, 
  Percent,
  Store,
  Camera,
  Receipt,
  MapPin,
  Bike,
  Gift,
  Building2,
  BarChart3,
  Zap
} from "lucide-react";

const FAQ = () => {
  const faqCategories = [
    {
      title: "For lejere",
      icon: User,
      questions: [
        {
          q: "Hvordan lejer jeg en bil på LEJIO?",
          a: "Det er nemt! Søg efter en bil i din ønskede lokation, vælg datoer, udfyld dine oplysninger og book. Du modtager en lejekontrakt, som du skal underskrive digitalt, før udlejningen kan begynde."
        },
        {
          q: "Hvad skal jeg have med for at leje en bil?",
          a: "Du skal have gyldigt kørekort (minimum 2 år gammelt), gyldigt ID (pas eller kørekort), og du skal være mindst 21 år gammel. Nogle udlejere kan have yderligere krav."
        },
        {
          q: "Hvordan fungerer depositum?",
          a: "Udlejeren kan kræve et depositum som sikkerhed. Dette tilbagebetales efter returneringen af bilen, fratrukket eventuelle omkostninger til skader, manglende brændstof eller andre udeståender."
        },
        {
          q: "Hvad sker der, hvis bilen får en skade under min leje?",
          a: "Du skal straks kontakte udlejeren og dokumentere skaden med billeder. Skader dækkes typisk af udlejers forsikring, men du kan være ansvarlig for selvrisikoen. Ved groft uagtsom kørsel kan du hæfte for hele skaden."
        },
        {
          q: "Kan jeg afbestille min booking?",
          a: "Ja, men afbestillingsreglerne afhænger af tidspunktet: Mere end 48 timer før = fuld refundering, 24-48 timer før = 50% refundering, mindre end 24 timer før = ingen refundering."
        },
        {
          q: "Hvordan kontakter jeg udlejeren?",
          a: "Du kan bruge vores beskedsystem til at kommunikere direkte med udlejeren. Gå til 'Beskeder' i menuen for at se dine samtaler."
        },
        {
          q: "Kan jeg få beskeder oversat automatisk?",
          a: "Ja! Vores AI-drevne oversættelsesfunktion kan automatisk oversætte beskeder fra udenlandske lejere eller udlejere. Tryk på oversæt-ikonet ved en besked for at få den oversat til dansk."
        },
        {
          q: "Hvad er en advarsel, og hvordan påvirker det mig?",
          a: "En advarsel gives ved brud på lejeaftalen eller god skik. Hvis du har modtaget en advarsel, du er uenig i, har du ret til at gøre indsigelse. Kontakt os på hej@lejio.dk, hvis du ønsker at få revurderet en advarsel eller få den slettet, hvis dokumentationen ikke er korrekt."
        },
        {
          q: "Hvordan fungerer dynamisk selvrisiko?",
          a: "Nogle udlejere tilbyder reduceret selvrisiko baseret på din lejerhistorik. Har du mange gode bookinger og høje ratings, kan du kvalificere dig til lavere selvrisiko. Dette ses ved booking."
        },
        {
          q: "Kan jeg bruge en rabatkode?",
          a: "Ja! Hvis du har en rabatkode, kan du indtaste den ved booking. Rabatten trækkes automatisk fra den samlede pris."
        },
        {
          q: "Hvad er henvisningsprogrammet?",
          a: "Når du henviser en ven til LEJIO, får I begge 500 kr. i kredit. Del din personlige henvisningskode, og få kredit når din ven gennemfører sin første booking."
        }
      ]
    },
    {
      title: "For udlejere",
      icon: Car,
      questions: [
        {
          q: "Hvordan kommer jeg i gang som udlejer?",
          a: "Opret en konto, vælg om du er privat udlejer eller forhandler, tilføj dine køretøjer med billeder og priser, og du er klar til at modtage bookinger!"
        },
        {
          q: "Hvad koster det at bruge LEJIO?",
          a: "For private udlejere koster det 59 kr pr. booking. For professionelle forhandlere har vi tre pakker: Starter (349 kr./md.), Standard (599 kr./md.) og Enterprise (899 kr./md.). Alle professionelle pakker tillægges en kommission på 3% pr. gennemført udlejning."
        },
        {
          q: "Hvordan får jeg mine penge?",
          a: "LEJIO fungerer som den tekniske platform, der formidler kontakten og kontrakten. Selve betalingen for lejen og depositum afregnes direkte mellem lejer og udlejer (f.eks. via MobilePay eller bankoverførsel). LEJIO fakturerer efterfølgende udlejeren for platformens kommission."
        },
        {
          q: "Skal jeg have forsikring på min bil?",
          a: "Som udlejer på LEJIO er det dit eget ansvar at sikre, at dit køretøj er korrekt forsikret til udlejning. LEJIO tilbyder ikke en kollektiv forsikring. Vi anbefaler altid, at du kontakter dit forsikringsselskab og informerer dem om, at du udlejer dit køretøj via en platform."
        },
        {
          q: "Hvordan opretter jeg en advarsel mod en lejer?",
          a: "Gå til din booking i dashboardet og vælg 'Opret advarsel'. Udfyld årsagen og beskrivelsen. Lejeren vil blive informeret og kan klage over advarslen."
        },
        {
          q: "Hvad er forskellen på Privat og Forhandler?",
          a: "Private udlejere betaler pr. booking (59 kr), mens Forhandlere (med CVR) betaler fast månedsbeløb (fra 349 kr/md) + 3% kommission pr. booking. Forhandlere kan uploade firmalogo til kontrakter og får adgang til alle Pro-funktioner."
        },
        {
          q: "Hvordan fungerer LEJIO Varetager?",
          a: "Med LEJIO Varetager håndterer vi platform og kundeservice (15% kommission), eller alt inkl. afhentning, levering og rengøring (10% kommission). Kontakt os for mere info."
        },
        {
          q: "Kan jeg have flere udlejningslokationer?",
          a: "Ja! Som forhandler kan du oprette flere lokationer med individuelle adresser, åbningstider og kontaktinfo. Hver lokation kan have egne køretøjer tilknyttet."
        },
        {
          q: "Hvordan fungerer sæsonpriser?",
          a: "Du kan indstille forskellige priser for høj- og lavsæson. Systemet skifter automatisk mellem priserne baseret på de datoer, du definerer."
        }
      ]
    },
    {
      title: "Lokationer & Afdelinger",
      icon: Store,
      questions: [
        {
          q: "Hvordan opretter jeg en ny lokation?",
          a: "Gå til 'Lokationer' i dit dashboard og klik 'Tilføj lokation'. Indtast navn, adresse, telefon, email og åbningstider. Du kan også angive forberedelsestid mellem bookinger."
        },
        {
          q: "Hvad er forberedelsestid?",
          a: "Forberedelsestid er den tid du skal bruge til at klargøre bilen mellem to bookinger (rengøring, tankning, tjek). Du kan indstille dette individuelt for hver lokation."
        },
        {
          q: "Kan lejere vælge afhentningslokation?",
          a: "Ja! Ved booking kan lejere se alle dine aktive lokationer og vælge, hvor de vil afhente og aflevere bilen. Lokationsinfo inkluderes automatisk i kontrakten."
        },
        {
          q: "Hvordan tilknytter jeg biler til lokationer?",
          a: "Ved oprettelse eller redigering af et køretøj kan du vælge, hvilken lokation bilen tilhører. Dette hjælper med overblik og vises til lejere ved søgning."
        },
        {
          q: "Kan jeg have forskellige åbningstider pr. lokation?",
          a: "Ja! Hver lokation kan have sine egne åbningstider og særlige lukkedage. Dette påvirker, hvornår lejere kan afhente og aflevere."
        }
      ]
    },
    {
      title: "Check-in & Check-out",
      icon: Camera,
      questions: [
        {
          q: "Hvordan fungerer nummerplade-scanning?",
          a: "Vores AI-værktøjer hjælper med at identificere køretøjet og læse data, men teknikken er kun vejledende. Det er altid dit eget ansvar som udlejer at kontrollere, at de scannede oplysninger (f.eks. kilometertal og brændstofniveau) stemmer overens med virkeligheden, før du godkender check-in."
        },
        {
          q: "Hvad er dashboard-foto med AI?",
          a: "Tag et foto af instrumentbrættet ved check-in og check-out. Vores AI aflæser automatisk kilometerstand og brændstofniveau, så du slipper for manuel indtastning."
        },
        {
          q: "Hvad er GPS-lokationsverifikation?",
          a: "Ved aflevering kan systemet tjekke, om bilen befinder sig på den aftalte lokation. Du får en advarsel, hvis bilen afleveres et forkert sted."
        },
        {
          q: "Hvordan beregnes km-overskridelse?",
          a: "Systemet sammenligner start- og slut-kilometertal med det inkluderede antal km på kontrakten. Overskridelser ganges med den aftalte km-pris og tilføjes automatisk til opgørelsen."
        },
        {
          q: "Hvad er QR-kode check-in?",
          a: "Du kan generere en QR-kode, som lejeren scanner ved afhentning. Dette starter check-in processen automatisk og gør selv-check-in muligt uden fysisk overdragelse."
        },
        {
          q: "Hvordan dokumenterer jeg bilens stand?",
          a: "Både ved udlevering og aflevering skal der tages tydelige billeder af køretøjet fra alle fire sider samt af interiør og kilometerstand. Disse billeder er jeres primære dokumentation i tilfælde af en skade. LEJIO gemmer disse billeder sammen med lejekontrakten, men det er altid udlejerens ansvar at sikre, at billederne er skarpe og dækkende."
        }
      ]
    },
    {
      title: "Bøder & Afgifter",
      icon: Receipt,
      questions: [
        {
          q: "Hvordan sender jeg en bøde videre til lejeren?",
          a: "Hvis du modtager en parkeringsbøde eller en fartbøde i udlejningsperioden, skal du som udlejer indsende dokumentation for lejeforholdet (lejekontrakten fra LEJIO) til den relevante myndighed eller p-selskab. Herefter vil ansvaret for bøden normalt blive overført til lejeren."
        },
        {
          q: "Kan jeg tage et administrationsgebyr?",
          a: "Ja! Som udlejer kan du opkræve et administrationsgebyr for håndtering af bøder, hvis dette er angivet i dine lejebetingelser. LEJIO anbefaler et standardgebyr på f.eks. 250 kr. for besværet. Du kan indstille gebyret fra 0-800 kr i dit dashboard."
        },
        {
          q: "Hvordan ved lejeren, at de har fået en bøde?",
          a: "Lejeren modtager automatisk en email med bødedetaljer, dokumentation og betalingsinstruktioner. Du kan følge status fra 'Afventer' til 'Betalt' i systemet."
        },
        {
          q: "Hvad hvis lejeren bestrider bøden?",
          a: "Kommuniker med lejeren via beskedsystemet. Har du dokumentation fra check-in/check-out, kan denne bruges som bevis. Ved alvorlige tvister kan LEJIO mægle."
        },
        {
          q: "Hvilke typer afgifter kan jeg registrere?",
          a: "Du kan registrere fartbøder, parkeringsbøder, brobizz-afgifter, P-afgifter og andre trafikrelaterede afgifter. Hver type får sin egen kategori."
        }
      ]
    },
    {
      title: "GPS & Flådestyring",
      icon: MapPin,
      questions: [
        {
          q: "Hvordan forbinder jeg en GPS-tracker?",
          a: "Gå til 'GPS-sporing' i dit dashboard og tilføj din GPS-enhed. Vi understøtter de fleste GPS-udbydere via webhook-integration. Du får en unik webhook-URL til din tracker."
        },
        {
          q: "Hvad er reglerne for GPS-sporing og GDPR?",
          a: "Hvis dit køretøj er udstyret med GPS, skal dette oplyses i annoncen. Sporing må kun anvendes til at verificere afhentning/aflevering eller i tilfælde af mistanke om tyveri eller kontraktbrud. Uberettiget overvågning af lejeren kan være i strid med GDPR og privatlivets fred."
        },
        {
          q: "Hvad er geofencing?",
          a: "Udlejere kan opsætte Geofencing-alarmer, der definerer geografiske grænser for køretøjet. Hvis en lejer overtræder de geografiske begrænsninger, der er sat i kontrakten, betragtes det som et væsentligt brud på lejeaftalen. Dette kan give udlejer ret til at annullere lejemålet med øjeblikkelig virkning og kræve køretøjet returneret."
        },
        {
          q: "Kan jeg se bilernes position i realtid?",
          a: "Ja, GPS-kortet viser dine biler med aktuel position. Bemærk dog, at realtidssporing kun bør bruges til sikkerhedsformål (tyverisikring) eller ved konkret mistanke om kontraktbrud – ikke til generel overvågning af lejeren."
        },
        {
          q: "Opdateres kilometertallet automatisk?",
          a: "Ja, hvis din GPS-tracker sender kilometerdata, opdateres køretøjets kilometertal automatisk. Dette bruges til serviceintervaller og check-in/check-out."
        },
        {
          q: "Hvilke GPS-udbydere understøttes?",
          a: "Vi understøtter alle GPS-udbydere der kan sende data via webhook (HTTP POST). Det inkluderer bl.a. Teltonika, Ruptela, Concox og mange andre. Kontakt os for hjælp til opsætning."
        }
      ]
    },
    {
      title: "Motorcykel & Scooter",
      icon: Bike,
      questions: [
        {
          q: "Hvordan validerer LEJIO MC-kørekort?",
          a: "Ved booking af motorcykler tjekker systemet automatisk lejerens kørekorttype (A1, A2, A) mod motorcyklens effekt. Er kørekortet ikke tilstrækkeligt, afvises bookingen."
        },
        {
          q: "Hvad er MC-specifik vedligeholdelse?",
          a: "Ud over standard service kan du spore MC-specifikke ting som kædeservice, dækslid, bremseklodser og væskestand. Systemet minder dig, når det er tid til vedligeholdelse."
        },
        {
          q: "Hvad er sæson-tjeklisten?",
          a: "Om foråret og efteråret får du automatiske påmindelser om at gøre motorcyklerne klar til sæsonen – batteritjek, dækskift, væskestand og generel gennemgang."
        },
        {
          q: "Er der særlig check-in for motorcykler?",
          a: "Ja! MC Check-in guiden fokuserer på MC-specifikke kontrolpunkter som kæde, dæk, bremser, lys og udstyr (hjelm, handsker). Dette sikrer grundig dokumentation."
        },
        {
          q: "Kan jeg leje scootere ud via LEJIO?",
          a: "Absolut! Scootere og knallerter håndteres på samme måde som motorcykler, med passende kørekortvalidering (AM/A1) afhængig af scooterens specifikationer."
        }
      ]
    },
    {
      title: "Henvisning & Rabatter",
      icon: Gift,
      questions: [
        {
          q: "Hvordan fungerer henvisningsprogrammet?",
          a: "Del din personlige henvisningskode med venner. Når de opretter sig og gennemfører en booking, får I begge 500 kr. i kredit, som kan bruges på fremtidige bookinger."
        },
        {
          q: "Hvordan finder jeg min henvisningskode?",
          a: "Gå til 'Indstillinger' og find afsnittet 'Henvisning'. Her ser du din unikke kode og kan dele den direkte på sociale medier eller via SMS."
        },
        {
          q: "Hvornår kan jeg bruge min kredit?",
          a: "Kredit tildeles, når den henviste person gennemfører sin første booking. Du kan derefter bruge kreditten på din næste booking – den trækkes automatisk fra."
        },
        {
          q: "Hvordan opretter jeg rabatkoder som udlejer?",
          a: "Gå til 'Rabatkoder' i dit dashboard. Opret koder med procentrabat eller fast beløb, sæt gyldighedsperiode og maksimalt antal brug. Del koderne med dine kunder."
        },
        {
          q: "Kan rabatkoder kombineres med henvisningskredit?",
          a: "Ja! En lejer kan både bruge en rabatkode og sin optjente henvisningskredit på samme booking for maksimal besparelse."
        }
      ]
    },
    {
      title: "Erhverv & Flåde",
      icon: Building2,
      questions: [
        {
          q: "Hvad er en erhvervskonto?",
          a: "Erhvervskonti giver virksomheder særlige vilkår: månedlig samlet faktura, EAN-understøttelse, afdelingsbudgetter og mulighed for at administrere flere medarbejderes adgang."
        },
        {
          q: "Hvordan oprettes afdelingsbudgetter?",
          a: "Som erhvervskunde kan du oprette afdelinger med separate budgetter. Når medarbejdere booker, allokeres udgiften til deres afdeling, og du kan trække rapporter pr. afdeling."
        },
        {
          q: "Kan medarbejdere booke selv?",
          a: "Ja! Du inviterer medarbejdere til erhvervskontoen, og de kan herefter selv booke biler inden for deres afdelings budget og regler. Alt samles på virksomhedens faktura."
        },
        {
          q: "Hvad er flåde-afregning?",
          a: "Store flådeejere kan få månedlig afregning med kommission i stedet for pr. booking gebyr. Kontakt os for at høre om betingelserne."
        },
        {
          q: "Understøtter I EAN-fakturering?",
          a: "Ja! Erhvervskunder kan angive EAN-nummer, og alle fakturaer sendes automatisk via EAN til jeres økonomisystem."
        },
        {
          q: "Hvad er CVR-opslag?",
          a: "Når du indtaster et CVR-nummer, henter systemet automatisk virksomhedsoplysninger som navn, adresse og kontaktinfo fra CVR-registeret."
        }
      ]
    },
    {
      title: "Statistik & Rapporter",
      icon: BarChart3,
      questions: [
        {
          q: "Hvilke statistikker kan jeg se?",
          a: "Du får overblik over indtjening, antal bookinger, udnyttelsesgrad, gennemsnitlig dagspris og mest populære køretøjer – alt fordelt på perioder og køretøjer."
        },
        {
          q: "Hvad er udnyttelsesgrad?",
          a: "Udnyttelsesgraden viser, hvor mange dage dine biler har været udlejet i forhold til tilgængelige dage. 80% udnyttelse betyder, at bilen var lejet ud 80% af tiden."
        },
        {
          q: "Kan jeg eksportere data til regnskab?",
          a: "Ja! Du kan downloade månedlige rapporter som PDF eller Excel med alle bookinger, indtægter og gebyrer – perfekt til bogføring og SKAT."
        },
        {
          q: "Hvad er AI Dashboard-analyse?",
          a: "Vores AI analyserer dine data og giver dig personlige anbefalinger: prisjusteringer, optimale lokationer, populære perioder og forslag til at øge din indtjening."
        },
        {
          q: "Kan jeg se udvikling over tid?",
          a: "Ja! Grafer viser din indtjening, bookinger og udnyttelse over tid. Sammenlign måneder og år for at se, hvordan din forretning udvikler sig."
        }
      ]
    },
    {
      title: "AI Flådestyring",
      icon: Bot,
      questions: [
        {
          q: "Hvad er Auto-Dispatch AI?",
          a: "Auto-Dispatch er vores AI-drevne flådefordelingssystem. Det analyserer søgemønstre, efterspørgsel og dine køretøjers placering for at anbefale, hvor du bør flytte biler hen for at maksimere udlejning."
        },
        {
          q: "Hvordan virker AI-anbefalingerne?",
          a: "Systemet ser på historiske bookinger, aktuelle søgninger efter lokation og biltype, samt dine ledige køretøjer. Du får konkrete anbefalinger som 'Flyt VW Golf fra København til Aarhus - forventet 1.500 kr ekstra indtægt'."
        },
        {
          q: "Skal jeg følge AI-anbefalingerne?",
          a: "Nej, anbefalingerne er kun forslag. Du kan acceptere eller afvise hver anbefaling. Systemet lærer over tid af dine valg og bliver bedre til at give relevante forslag."
        },
        {
          q: "Kan jeg se efterspørgslen i forskellige områder?",
          a: "Ja! Dashboard-kortet viser et heatmap over søgeaktivitet. Røde områder har høj efterspørgsel, grønne har lav. Placér dine biler hvor efterspørgslen er størst."
        },
        {
          q: "Hvordan bruger jeg AI prisforslag?",
          a: "AI-systemet analyserer markedet og foreslår optimale priser for hvert køretøj. Du kan godkende forslagene med ét klik eller justere manuelt."
        }
      ]
    },
    {
      title: "Dynamisk Selvrisiko",
      icon: TrendingDown,
      questions: [
        {
          q: "Hvad er dynamisk selvrisiko?",
          a: "Dynamisk selvrisiko betyder at erfarne lejere med god historik kan få lavere selvrisiko. Du som udlejer definerer reglerne."
        },
        {
          q: "Hvordan opsætter jeg selvrisiko-profiler?",
          a: "Gå til 'Selvrisiko' i dashboardet og opret profiler. For hver profil kan du sætte krav til antal gennemførte bookinger, minimum rating og maksimal bilværdi."
        },
        {
          q: "Kan lejeren se sin selvrisiko før booking?",
          a: "Ja! Ved booking vises den aktuelle selvrisiko baseret på lejerens profil. Dette skaber gennemsigtighed og incitament til god opførsel."
        },
        {
          q: "Kan jeg tilbyde selvrisikonedsættelse mod betaling?",
          a: "Ja! Du kan aktivere en premium-mulighed, hvor lejere kan betale ekstra pr. dag for at få reduceret selvrisiko – uanset deres historik."
        },
        {
          q: "Hvad sker der ved skader?",
          a: "Ved skader opkræves selvrisikoen fra lejeren. Er skaden mindre end selvrisikoen, betaler lejeren kun skadens størrelse."
        }
      ]
    },
    {
      title: "Oversættelse & Sprog",
      icon: Languages,
      questions: [
        {
          q: "Hvordan fungerer automatisk oversættelse?",
          a: "Vores AI kan oversætte beskeder mellem lejer og udlejer. Tryk på oversæt-ikonet ved en besked for at få den oversat til dit foretrukne sprog."
        },
        {
          q: "Hvilke sprog understøttes?",
          a: "Vi understøtter de fleste europæiske sprog, inklusiv dansk, engelsk, tysk, fransk, spansk, italiensk, polsk og nederlandsk."
        },
        {
          q: "Oversættes kontrakter automatisk?",
          a: "Kontrakter genereres altid på dansk, da de er juridisk bindende. Lejeren kan dog få en automatisk oversættelse til forståelse."
        }
      ]
    },
    {
      title: "Rabatkoder",
      icon: Percent,
      questions: [
        {
          q: "Hvordan opretter jeg en rabatkode?",
          a: "Gå til 'Rabatkoder' i dit dashboard. Vælg type (procent eller fast beløb), indstil værdi, gyldighedsperiode og evt. brugsbegrænsning."
        },
        {
          q: "Kan jeg begrænse brugen af koder?",
          a: "Ja! Du kan sætte maksimalt antal brug, begrænse til specifikke køretøjer, definere minimum lejeperiode og sætte udløbsdato."
        },
        {
          q: "Kan jeg se hvem der har brugt mine koder?",
          a: "Ja! Under hver rabatkode kan du se statistik: antal brug, samlet rabat givet og hvornår koden sidst blev brugt."
        },
        {
          q: "Kan lejere kombinere rabatkoder?",
          a: "Nej, kun én rabatkode kan bruges pr. booking. Dog kan rabatkoder kombineres med henvisningskredit."
        }
      ]
    },
    {
      title: "Sikkerhed & Forsikring",
      icon: Shield,
      questions: [
        {
          q: "Hvordan verificerer LEJIO lejeres identitet?",
          a: "Vi kræver foto-upload af kørekort, som valideres med AI. Derudover kan du som udlejer kræve fysisk fremvisning ved afhentning."
        },
        {
          q: "Hvad dækker forsikringen?",
          a: "Som udlejer på LEJIO er det dit eget ansvar at sikre, at dit køretøj er korrekt forsikret til udlejning. LEJIO tilbyder ikke en kollektiv forsikring. Vi anbefaler altid, at du kontakter dit forsikringsselskab og informerer dem om, at du udlejer dit køretøj via en platform."
        },
        {
          q: "Hvordan håndteres skader?",
          a: "Hvis der opstår en skade, skal den registreres i LEJIO-appen med det samme ved check-out. Da forsikringsforholdet er mellem udlejer og dennes forsikringsselskab, skal skadesanmeldelsen ske direkte til forsikringen. LEJIO leverer de nødvendige data (kontrakt, tjekliste og fotos) til brug for din skadessag."
        },
        {
          q: "Hvad er vanvidskørsel-klausulen?",
          a: "I lejekontrakten, som genereres via LEJIO, accepterer lejeren det fulde økonomiske ansvar for køretøjets værdi i tilfælde af vanvidskørsel. Dette betyder, at hvis bilen beslaglægges eller konfiskeres af politiet som følge af lejerens kørsel, hæfter lejeren for bilens fulde værdi over for ejeren."
        }
      ]
    },
    {
      title: "Betaling & Økonomi",
      icon: CreditCard,
      questions: [
        {
          q: "Hvordan modtager jeg betaling?",
          a: "LEJIO fungerer som den tekniske platform, der formidler kontakten og kontrakten. Selve betalingen for lejen og depositum afregnes direkte mellem lejer og udlejer (f.eks. via MobilePay eller bankoverførsel). LEJIO fakturerer efterfølgende udlejeren for platformens kommission."
        },
        {
          q: "Hvad koster det at bruge LEJIO?",
          a: "For private udlejere koster det 59 kr pr. booking. For professionelle forhandlere har vi tre pakker: Starter (349 kr./md.), Standard (599 kr./md.) og Enterprise (899 kr./md.). Alle professionelle pakker tillægges en kommission på 3% pr. gennemført udlejning."
        },
        {
          q: "Hvordan betaler jeg platformgebyr?",
          a: "Platformgebyrer faktureres månedligt. Du kan betale via kort eller bankoverførsel direkte i systemet."
        },
        {
          q: "Kan jeg se min betalingshistorik?",
          a: "Ja! Under 'Økonomi' kan du se alle transaktioner, indbetalinger fra lejere og platformgebyrer."
        }
      ]
    },
    {
      title: "Kontrakter & Dokumenter",
      icon: FileText,
      questions: [
        {
          q: "Hvordan genereres kontrakter?",
          a: "Kontrakter genereres automatisk med alle bookingdetaljer, køretøjsinfo, vilkår og priser. Begge parter underskriver digitalt."
        },
        {
          q: "Kan jeg tilpasse kontrakterne?",
          a: "Du kan uploade dit firmalogo og tilføje specielle vilkår. Standard juridiske vilkår kan ikke ændres for at sikre gyldighed."
        },
        {
          q: "Hvor længe gemmes kontrakter?",
          a: "Alle kontrakter gemmes permanent i systemet og kan downloades som PDF når som helst."
        },
        {
          q: "Hvad hvis lejeren ikke underskriver?",
          a: "Udlever aldrig nøglerne til et køretøj, før lejekontrakten er underskrevet digitalt via LEJIO, og du har set gyldig legitimation (kørekort). En udlevering uden underskrevet kontrakt betyder, at du ikke er dækket af platformens vilkår eller din forsikring."
        }
      ]
    },
    {
      title: "Teknisk Support",
      icon: HelpCircle,
      questions: [
        {
          q: "Hvordan kontakter jeg support?",
          a: "Brug Live Chat i appen for hurtig hjælp. Du kan også ringe til os på 91 99 89 29 eller sende email til support@lejio.dk på hverdage 9-17."
        },
        {
          q: "Er der videoguides?",
          a: "Ja! Vi har videoguides til alle funktioner. Find dem under 'Hjælp' i menuen eller på vores YouTube-kanal."
        },
        {
          q: "Hvad gør jeg ved tekniske fejl?",
          a: "Prøv først at genindlæse siden. Virker det ikke, kontakt support med en beskrivelse og evt. screenshots."
        },
        {
          q: "Kan jeg foreslå nye funktioner?",
          a: "Absolut! Vi elsker feedback. Send dine idéer via Live Chat eller email – vi læser alle forslag."
        }
      ]
    },
    {
      title: "Værksted & Service",
      icon: Wrench,
      questions: [
        {
          q: "Hvad er Smart Service?",
          a: "Smart Service er vores samarbejde med værksteder. Du kan booke service direkte i systemet, og vi koordinerer afhentning og levering."
        },
        {
          q: "Hvordan fungerer syns-påmindelser?",
          a: "Systemet holder styr på synsdatoer og minder dig i god tid. Du kan markere synet som gennemført og opdatere næste synsdato."
        },
        {
          q: "Kan jeg registrere dækskift?",
          a: "Ja! Under hvert køretøj kan du registrere dæksæt (sommer/vinter), dækhotel-lokation og seneste skiftedato."
        },
        {
          q: "Hvad er byttebil-funktionen?",
          a: "Hvis en bil skal på værksted midt i en booking, kan du tilbyde lejeren en byttebil. Systemet håndterer kontrakttilpasning automatisk."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative py-24 sm:py-32 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-[120px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-mint/10 rounded-full blur-[150px] rotate-12" />
          </div>
          
          {/* Geometric shapes */}
          <div className="absolute top-32 right-20 w-24 h-24 border-4 border-primary/20 rotate-45 hidden lg:block" />
          <div className="absolute bottom-32 left-20 w-16 h-16 bg-accent/10 rounded-full hidden lg:block" />
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-bold text-primary mb-8 animate-slide-up">
                <Zap className="w-4 h-4" />
                <span>Alt du skal vide om LEJIO</span>
              </div>
              
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <span className="block">OFTE STILLEDE</span>
                <span className="block bg-gradient-to-r from-primary via-accent to-mint bg-clip-text text-transparent">
                  SPØRGSMÅL
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
                Find svar på alle dine spørgsmål om billedning, udlejning, kontrakter, betalinger og meget mere.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="py-16 relative">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto space-y-8">
              {faqCategories.map((category, categoryIndex) => {
                const Icon = category.icon;
                return (
                  <div 
                    key={categoryIndex} 
                    className="rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-6 sm:p-8 hover:shadow-xl transition-all"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h2 className="font-display text-2xl font-black">{category.title}</h2>
                    </div>

                    <Accordion type="single" collapsible className="space-y-2">
                      {category.questions.map((faq, faqIndex) => (
                        <AccordionItem 
                          key={faqIndex} 
                          value={`${categoryIndex}-${faqIndex}`}
                          className="border-b border-border/50 last:border-b-0"
                        >
                          <AccordionTrigger className="text-left font-semibold hover:text-primary transition-colors py-4">
                            {faq.q}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground pb-4">
                            {faq.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default FAQ;