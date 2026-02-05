import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  Calendar, 
  FileText, 
  CreditCard, 
  MapPin, 
  Bell, 
  Shield, 
  Users, 
  BarChart3, 
  MessageSquare, 
  Car, 
  Settings, 
  Clock,
  Repeat,
  Wrench,
  Gauge,
  CircleDot,
  FileCheck,
  Smartphone,
  Truck,
  Star,
  Gift,
  Receipt,
  Camera,
  Brain,
  BadgeCheck,
  Wallet,
  Building2,
  Scan,
  ShieldCheck,
  Navigation as NavigationIcon,
  Store,
  Bike,
  CalendarClock,
  Thermometer,
  AlertTriangle,
  QrCode,
  Share2,
  Globe,
  Zap,
  TrendingDown,
  ArrowRight,
  Play,
  Check,
  Lock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { supabase } from '@/integrations/azure/client';

const Features = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [compareMode, setCompareMode] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [featureLinks, setFeatureLinks] = useState({});

  // Hent globale feature links fra Supabase og lyt realtime
  useEffect(() => {
    const subscriptionRef: { current?: unknown } = { current: undefined };
    const fetchLinks = async () => {
      const { data, error } = await supabase.from('feature_links').select('feature_key, video, image, page');
      if (!error && data) {
        const linksObj = {};
        data.forEach(row => {
          linksObj[row.feature_key] = {
            video: row.video || '',
            image: row.image || '',
            page: row.page || ''
          };
        });
        setFeatureLinks(linksObj);
      }
    };
    fetchLinks();
    // Realtime subscription
    subscriptionRef.current = supabase.channel('feature_links_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feature_links' }, () => {
        fetchLinks();
      })
      .subscribe();
    return () => {
      const sub = subscriptionRef.current as { unsubscribe?: () => void } | undefined;
      if (sub && sub.unsubscribe) {
        sub.unsubscribe();
      }
    };
  }, []);

  // DEBUG: Log featureLinks for at se hvad der hentes fra Supabase
  useEffect(() => {
     
    console.log('featureLinks fra Supabase:', featureLinks);
  }, [featureLinks]);

  // DEBUG: Log alle feature keys der bruges i UI og om de matcher noget fra Supabase (console.table for overblik)
  useEffect(() => {
    if (Object.keys(featureLinks).length === 0) return;
    const allFeatureKeys = featureCategories.flatMap(cat => cat.features.map(f => f.title.toLowerCase().replace(/[^a-z0-9_]+/gi, '_')));
    const table = allFeatureKeys.map(key => ({
      feature_key: key,
      match: !!featureLinks[key],
      links: featureLinks[key] || null
    }));
     
    console.table(table);

    // Ekstra: Print alle feature_keys som array til copy-paste
     
    console.log('Alle feature_keys til Supabase:', JSON.stringify(allFeatureKeys, null, 2));
  }, [featureLinks]);

  const featureCategories = [
    {
      title: "Booking & Kalender",
      id: "booking",
      icon: Calendar,
      color: "from-primary to-primary/60",
      tier: "starter",
      features: [
        { title: "Smart Booking-kalender", description: "Visuel oversigt over alle dine bookinger med drag-and-drop funktionalitet.", icon: Calendar, status: "Fuldt implementeret", badge: undefined, demoUrl: undefined, tier: undefined },
        { title: "Automatisk tilgængelighed", description: "Systemet blokerer automatisk datoer ved nye bookinger.", icon: Clock, status: "Fuldt implementeret", badge: undefined, demoUrl: undefined, tier: undefined },
        { title: "Abonnementsudlejning", description: "Tilbyd månedlig bilabonnement med automatisk kortbetaling.", icon: Repeat, status: "Beta", badge: undefined, demoUrl: undefined, tier: undefined },
        { title: "AI-prissætning", description: "Få intelligente prisforslag baseret på marked, sæson og efterspørgsel.", icon: Brain, status: "Planlagt", badge: "Ny", demoUrl: undefined, tier: "pro" },
        { title: "Sæsonpriser", description: "Indstil forskellige priser for høj- og lavsæson automatisk.", icon: CalendarClock, status: "Fuldt implementeret", badge: "Ny", demoUrl: undefined, tier: "pro" },
      ],
    },
    {
      title: "Lokationer & Afdelinger",
      id: "locations",
      icon: Store,
      color: "from-emerald-500 to-emerald-500/60",
      tier: "pro",
      features: [
        { title: "Multi-lokation support", description: "Administrer flere udlejningslokationer fra ét dashboard.", icon: Store, badge: "Ny", status: "Fuldt implementeret" },
        { title: "Åbningstider pr. lokation", description: "Indstil individuelle åbningstider for hver lokation.", icon: Clock, badge: "Ny", status: "Fuldt implementeret" },
        { title: "Særlige lukkedage", description: "Tilføj helligdage og særlige lukkedage pr. lokation.", icon: CalendarClock, badge: "Ny", status: "Fuldt implementeret" },
        { title: "Forberedelsestid", description: "Indstil hvor lang tid der skal bruges til klargøring mellem bookinger.", icon: Wrench, badge: "Ny", status: "Beta" },
        { title: "Lokation på køretøj", description: "Tildel køretøjer til specifikke lokationer for bedre overblik.", icon: MapPin, badge: "Ny", status: "Fuldt implementeret" },
      ],
    },
    {
      title: "Kontrakter & Dokumentation",
      id: "contracts",
      icon: FileText,
      color: "from-accent to-accent/60",
      tier: "starter",
      features: [
        { title: "Automatisk kontraktgenerering", description: "Juridisk korrekte lejekontrakter genereres automatisk med alle detaljer.", icon: FileText, status: "Fuldt implementeret", demoUrl: "https://yourdomain.com/demo/contracts" },
        { title: "Digital underskrift", description: "Både udlejer og lejer underskriver digitalt direkte i systemet.", icon: FileCheck, status: "Fuldt implementeret" },
        { title: "PDF-download & Email", description: "Kontrakter sendes automatisk til begge parter som PDF.", icon: Smartphone, status: "Fuldt implementeret" },
        { title: "Skaderapporter med AI", description: "Dokumentér bilens stand med AI-analyse af fotos og skader.", icon: Scan, status: "Beta", demoUrl: "https://yourdomain.com/demo/damage" },
        { title: "Lokationsinfo i kontrakt", description: "Afhentningslokation med adresse og telefonnummer inkluderes automatisk.", icon: Store, badge: "Ny", status: "Fuldt implementeret" },
      ],
    },
    {
      title: "Check-in & Check-out",
      id: "checkin",
      icon: Camera,
      color: "from-teal-500 to-teal-500/60",
      tier: "starter",
      features: [
        { title: "Nummerplade-scanning", description: "Scan nummerpladen ved udlevering og aflevering for automatisk verifikation.", icon: Scan, status: "Fuldt implementeret" },
        { title: "Dashboard-foto med AI", description: "Tag foto af instrumentbrættet – AI aflæser km-stand og brændstofniveau.", icon: Camera, status: "Beta", demoUrl: "https://yourdomain.com/demo/dashboard-photo" },
        { title: "GPS-lokationsverifikation", description: "Bekræft at bilen afleveres det rigtige sted med GPS-tjek.", icon: MapPin, status: "Fuldt implementeret" },
        { title: "Automatisk opgørelse", description: "Systemet beregner km-overskridelse og brændstofgebyr automatisk.", icon: Receipt, status: "Fuldt implementeret" },
        { title: "QR-kode check-in", description: "Generér QR-koder til hurtig selv-check-in for lejere.", icon: QrCode, badge: "Ny", status: "Planlagt", tier: "pro" },
      ],
    },
    {
      title: "Betaling & Økonomi",
      id: "payment",
      icon: CreditCard,
      color: "from-secondary to-secondary/60",
      tier: "starter",
      features: [
        { title: "Flere betalingsmetoder", description: "Modtag betaling via kort, MobilePay, bankoverførsel eller kontant.", icon: CreditCard, status: "Fuldt implementeret" },
        { title: "Automatisk abonnementsbetaling", description: "Ved månedlig leje trækkes beløbet automatisk fra lejerens kort.", icon: Repeat, status: "Fuldt implementeret" },
        { title: "Depositumhåndtering", description: "Administrer depositum og frigivelse sikkert gennem systemet.", icon: Shield, status: "Fuldt implementeret" },
        { title: "Selvrisiko-forsikring", description: "Tilbyd lejere at reducere selvrisiko til 0 kr. for kun 49 kr./dag.", icon: ShieldCheck, status: "Beta" },
        { title: "Brændstofpolitik", description: "Automatisk beregning af brændstofgebyr ved manglende tank.", icon: Gauge, status: "Fuldt implementeret" },
        { title: "Platformgebyr-betaling", description: "Administrer og betal platformgebyrer direkte i systemet.", icon: Wallet, badge: "Ny", status: "Planlagt", tier: "enterprise" },
      ],
    },
    {
      title: "GPS & Flådestyring",
      id: "gps",
      icon: MapPin,
      color: "from-green-500 to-green-500/60",
      tier: "pro",
      features: [
        { title: "GPS-sikkerhed", description: "Få besked ved uautoriseret brug eller hvis køretøjet forlader aftalte zoner.", icon: MapPin, status: "Fuldt implementeret", demoUrl: "https://yourdomain.com/demo/gps" },
        { title: "Geofencing-alarmer", description: "Få besked når en bil forlader et defineret område.", icon: CircleDot, status: "Fuldt implementeret" },
        { title: "Kilometerregistrering", description: "Automatisk opdatering af kilometertal via GPS-tracker.", icon: Gauge, status: "Fuldt implementeret" },
        { title: "Webhook-integration", description: "Modtag GPS-data fra alle førende GPS-udbydere via webhook.", icon: Zap, badge: "Ny", status: "Beta" },
      ],
    },
    {
      title: "Motorcykel & Scooter",
      id: "motorcycle",
      icon: Bike,
      color: "from-yellow-500 to-yellow-500/60",
      tier: "pro",
      features: [
        { title: "MC-kørekort validering", description: "Automatisk tjek af kørekortstype (A1, A2, A) mod motorcyklens effekt.", icon: BadgeCheck, badge: "Ny", status: "Planlagt" },
        { title: "MC-specifik vedligeholdelse", description: "Spor kædeservice, dækslid og andre MC-specifikke serviceintervaller.", icon: Wrench, badge: "Ny", status: "Beta" },
        { title: "Sæson-tjekliste", description: "Automatiske påmindelser om forårsgøring og vinterklargøring.", icon: Thermometer, badge: "Ny", status: "Planlagt" },
        { title: "MC Check-in guide", description: "Specialiseret check-in flow med MC-specifikke kontrolpunkter.", icon: FileCheck, badge: "Ny", status: "Beta" },
      ],
    },
    {
      title: "Værksted & Service",
      id: "service",
      icon: Wrench,
      color: "from-orange-500 to-orange-500/60",
      tier: "pro",
      features: [
        { title: "Smart Service hos LEJIO", description: "Book værkstedstider direkte i systemet – vi klarer servicen for dig.", icon: Wrench, status: "Fuldt implementeret" },
        { title: "Syns-påmindelser", description: "Automatisk påmindelse når syn nærmer sig.", icon: Bell, status: "Fuldt implementeret" },
        { title: "Dækstyring", description: "Administrer sommer/vinterdæk og dækhotel-lokationer.", icon: CircleDot, status: "Beta" },
        { title: "Byttebil-funktion", description: "Udskift køretøj midt i lejeperiode ved service eller nedbrud.", icon: Truck, status: "Fuldt implementeret" },
        { title: "Service-booking", description: "Book og administrer service- og værkstedsaftaler direkte i systemet.", icon: CalendarClock, badge: "Ny", status: "Beta" },
      ],
    },
    {
      title: "AI-funktioner",
      id: "ai",
      icon: Brain,
      color: "from-purple-500 to-purple-500/60",
      tier: "pro",
      features: [
        { title: "Auto-Dispatch AI", description: "AI-drevet flådefordeling baseret på efterspørgsel og søgemønstre.", icon: Brain, badge: "AI", status: "Beta", demoUrl: "https://yourdomain.com/demo/auto-dispatch" },
        { title: "AI-prissætning", description: "Intelligente prisforslag baseret på marked og konkurrence.", icon: TrendingDown, badge: "AI", status: "Beta", demoUrl: "https://yourdomain.com/demo/pricing-ai" },
        { title: "Dashboard-analyse", description: "AI analyserer dine data og giver personlige anbefalinger.", icon: BarChart3, badge: "AI", status: "Planlagt" },
        { title: "Skade-AI", description: "Automatisk analyse og kategorisering af skadebilleder.", icon: Camera, badge: "AI", status: "Beta" },
        { title: "AI-oversættelse", description: "Automatisk oversættelse af beskeder mellem sprog.", icon: Globe, badge: "AI", status: "Planlagt" },
      ],
    },
    {
      title: "Kommunikation",
      id: "communication",
      icon: MessageSquare,
      color: "from-indigo-500 to-indigo-500/60",
      tier: "starter",
      features: [
        { title: "Indbygget beskedsystem", description: "Kommuniker direkte med lejere gennem platformen.", icon: MessageSquare, status: "Fuldt implementeret" },
        { title: "Push-notifikationer", description: "Få besked på telefonen ved nye bookinger og beskeder.", icon: Bell, status: "Fuldt implementeret" },
        { title: "Automatiske emails", description: "Bookingbekræftelser og påmindelser sendes automatisk.", icon: Smartphone, status: "Fuldt implementeret" },
        { title: "Live Chat Support", description: "AI-assisteret kundesupport direkte i appen.", icon: MessageSquare, status: "Fuldt implementeret" },
        { title: "Ulæste beskeder", description: "Se altid hvor mange ulæste beskeder du har i menuen.", icon: Bell, badge: "Ny", status: "Fuldt implementeret" },
      ],
    },
    {
      title: "Lejer-administration",
      id: "renter",
      icon: Users,
      color: "from-blue-500 to-blue-500/60",
      tier: "starter",
      features: [
        { title: "Kørekortsverifikation", description: "AI-verificerer kørekort med foto-upload og automatisk godkendelse.", icon: BadgeCheck, status: "Fuldt implementeret", demoUrl: "https://yourdomain.com/demo/license-verification" },
        { title: "Lejerhistorik", description: "Se alle tidligere bookinger og interaktioner med hver lejer.", icon: Users, status: "Fuldt implementeret" },
        { title: "Lejer-rating", description: "Bedøm lejere og se deres gennemsnitlige rating.", icon: Star, status: "Fuldt implementeret" },
        { title: "Advarselsregister", description: "Se advarsler på problematiske lejere på tværs af platformen.", icon: AlertTriangle, status: "Beta" },
        { title: "Kundesegmenter", description: "Opdel dine lejere i segmenter baseret på adfærd og værdi.", icon: Users, badge: "Ny", status: "Planlagt", tier: "pro" },
        { title: "Favorit-lejere", description: "Gem dine bedste lejere som favoritter for hurtig adgang.", icon: Star, badge: "Ny", status: "Fuldt implementeret" },
      ],
    },
    {
      title: "Erhverv & Flåde",
      id: "corporate",
      icon: Building2,
      color: "from-slate-500 to-slate-500/60",
      tier: "enterprise",
      features: [
        { title: "Erhvervskonti", description: "Særlige vilkår og fakturering for erhvervskunder med EAN-nummer.", icon: Building2, status: "Fuldt implementeret" },
        { title: "Afdelingsbudgetter", description: "Fordel kørsel på afdelinger med separate budgetter og rapporter.", icon: BarChart3, status: "Fuldt implementeret" },
        { title: "Medarbejder-administration", description: "Administrer hvilke medarbejdere der må leje hvilke biler.", icon: Users, status: "Beta" },
        { title: "Månedlig samlet faktura", description: "Én faktura for alle bookinger med EAN/CVR-nummer.", icon: Receipt, status: "Fuldt implementeret" },
        { title: "Flåde-afregning", description: "Månedlig afregning med kommission for store flådeejere.", icon: Wallet, badge: "Ny", status: "Planlagt" },
        { title: "CVR-opslag", description: "Automatisk opslag af virksomhedsdata via CVR-nummer.", icon: Building2, badge: "Ny", status: "Fuldt implementeret" },
      ],
    },
  ];

  // Filter og søg logik
  const filteredCategories = useMemo(() => {
    let filtered = [...featureCategories];

    // Filter by selected categories
    if (selectedCategories.size > 0) {
      filtered = filtered.filter((cat: unknown) => selectedCategories.has(cat.id));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.map((category: unknown) => ({
        ...category,
        features: category.features.filter((feature: unknown) =>
          feature.title.toLowerCase().includes(query) ||
          feature.description.toLowerCase().includes(query)
        )
      })).filter((cat: unknown) => cat.features.length > 0);
    }

    return filtered;
  }, [searchQuery, selectedCategories]);

  const toggleCategory = (categoryId: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
  };

  const toggleFeatureCompare = (featureTitle: string) => {
    const newSelected = new Set(selectedFeatures);
    if (newSelected.has(featureTitle)) {
      newSelected.delete(featureTitle);
    } else {
      newSelected.add(featureTitle);
    }
    setSelectedFeatures(newSelected);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Fuldt implementeret":
        return "bg-green-100 text-green-800 border-green-200";
      case "Beta":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Planlagt":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTierBg = (tier: string) => {
    switch (tier) {
      case "starter":
        return "bg-slate-50 border-slate-200";
      case "pro":
        return "bg-blue-50 border-blue-200";
      case "enterprise":
        return "bg-purple-50 border-purple-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

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
          <div className="absolute top-1/2 right-32 w-8 h-32 bg-mint/10 rounded-full hidden lg:block" />
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-bold text-primary mb-8 animate-slide-up">
                <Zap className="w-4 h-4" />
                <span>100+ funktioner • 12 kategorier • AI-drevet</span>
              </div>
              
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <span className="block">ALT DU BEHØVER</span>
                <span className="block bg-gradient-to-r from-primary via-accent to-mint bg-clip-text text-transparent">
                  TIL BILUDLEJNING
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                Fra booking til betaling, fra GPS-sporing til AI-prissætning. 
                LEJIO har alle funktioner du behøver for at drive en succesfuld udlejningsforretning.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <Button size="lg" className="font-bold text-lg px-8 py-6 shadow-lg shadow-primary/20" onClick={() => navigate('/auth')}>
                  Kom i gang
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button variant="outline" size="lg" className="font-bold text-lg px-8 py-6" onClick={() => navigate('/faq')}>
                  Se alle FAQ
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 relative">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { number: "100+", label: "Funktioner" },
                { number: "12", label: "Kategorier" },
                { number: "5", label: "AI-funktioner" },
                { number: "24/7", label: "Support" },
              ].map((stat, index) => (
                <div key={index} className="text-center p-6 rounded-2xl bg-card/50 border border-border/50">
                  <div className="font-display text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Search & Filter Section */}
        <section className="py-8 relative border-b border-border/50">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Search Bar */}
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Søg blandt alle funktioner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    onClick={() => setSearchQuery("")}
                    className="px-4"
                  >
                    Ryd
                  </Button>
                )}
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-semibold text-muted-foreground self-center">Filtrer:</span>
                {featureCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategories.has(category.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleCategory(category.id)}
                    className="rounded-full"
                  >
                    {category.title}
                  </Button>
                ))}
                {selectedCategories.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCategories(new Set())}
                    className="text-xs"
                  >
                    Nulstil
                  </Button>
                )}
              </div>

              {/* Compare Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant={compareMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setCompareMode(!compareMode);
                    if (!compareMode) setSelectedFeatures(new Set());
                  }}
                  className="rounded-full"
                >
                  {compareMode ? "Sammenligning aktiv" : "Sammenlign features"}
                  {selectedFeatures.size > 0 && ` (${selectedFeatures.size})`}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 relative">
          <div className="container mx-auto px-6">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">Ingen features matcher dine søgekritier</p>
              </div>
            ) : (
              <div className="space-y-16">
                {filteredCategories.map((category, categoryIndex) => {
                  const CategoryIcon = category.icon;
                  return (
                    <div key={categoryIndex} className="space-y-8">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}>
                          <CategoryIcon className="w-7 h-7 text-white" />
                        </div>
                        <h2 className="font-display text-3xl font-black">{category.title}</h2>
                      </div>

                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {category.features.map((feature, featureIndex) => {
                          const FeatureIcon = feature.icon;
                          const isSelected = compareMode && selectedFeatures.has(feature.title);
                          // Find links fra Supabase
                          const key = feature.title.toLowerCase().replace(/[^a-z0-9_]+/gi, '_');
                          const links = featureLinks[key] || {};
                          return (
                            <Card 
                              key={featureIndex}
                              className={`group hover:shadow-xl hover:-translate-y-1 transition-all backdrop-blur-sm cursor-pointer relative ${
                                getTierBg(feature.tier || category.tier)
                              } ${isSelected ? "ring-2 ring-primary" : ""}`}
                              onClick={() => compareMode && toggleFeatureCompare(feature.title)}
                            >
                              {/* Tier Lock Badge */}
                              {(feature.tier || category.tier) !== "starter" && (
                                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-100 text-yellow-800 text-xs font-bold">
                                  <Lock className="w-3 h-3" />
                                  {(feature.tier || category.tier) === "pro" ? "Pro" : "Enterprise"}
                                </div>
                              )}

                              {/* Compare Checkbox */}
                              {compareMode && (
                                <div className="absolute top-3 left-3">
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                    isSelected ? "bg-primary border-primary" : "border-border bg-background"
                                  }`}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                </div>
                              )}

                              <CardHeader className={`pb-3 ${compareMode ? "pt-8" : ""}`}>
                                <div className="flex items-start justify-between">
                                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                                    <FeatureIcon className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="flex flex-col gap-1 items-end">
                                    {feature.badge && (
                                      <Badge variant="secondary" className="text-xs font-bold">
                                        {feature.badge}
                                      </Badge>
                                    )}
                                    {feature.status && (
                                      <Badge variant="outline" className={`text-xs font-bold border ${getStatusColor(feature.status)}`}>
                                        {feature.status}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <CardTitle className="text-base font-bold mt-3">{feature.title}</CardTitle>
                              </CardHeader>
                              <CardContent className="pt-0 space-y-3">
                                <CardDescription className="text-sm">{feature.description}</CardDescription>
                                {/* Globale links fra admin - vis ALLE links hvis de findes for dette feature */}
                                {links.video && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-center gap-2 text-primary hover:text-primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(links.video, "_blank");
                                    }}
                                  >
                                    <Play className="w-4 h-4" />
                                    Se video
                                  </Button>
                                )}
                                {links.image && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-center gap-2 text-primary hover:text-primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(links.image, "_blank");
                                    }}
                                  >
                                    <Play className="w-4 h-4" />
                                    Se billede
                                  </Button>
                                )}
                                {links.page && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-center gap-2 text-primary hover:text-primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(links.page, "_blank");
                                    }}
                                  >
                                    <ArrowRight className="w-4 h-4" />
                                    Se side
                                  </Button>
                                )}
                                {/* Demo-link fra feature data */}
                                {feature.demoUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-center gap-2 text-primary hover:text-primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(feature.demoUrl, "_blank");
                                    }}
                                  >
                                    <Play className="w-4 h-4" />
                                    Se demo
                                  </Button>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center p-12 rounded-[3rem] bg-gradient-to-br from-primary/10 via-accent/10 to-mint/10 border-2 border-primary/20">
              <h2 className="font-display text-4xl font-black mb-4">
                Klar til at komme i gang?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Opret din konto og oplev alle funktioner selv.
              </p>
              <Button size="lg" className="font-bold text-lg px-10 py-6 shadow-lg shadow-primary/20" onClick={() => navigate('/auth')}>
                Kom i gang nu
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Features;