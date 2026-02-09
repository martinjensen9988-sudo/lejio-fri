import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  BarChart3, 
  Users, 
  FileText, 
  Shield, 
  Clock, 
  CheckCircle2, 
  Smartphone,
  MapPin,
  DollarSign,
  Bell,
  Lock,
  ArrowRight,
  Settings,
  Cloud,
  TrendingUp,
  Calendar,
  CreditCard,
  Database,
  Workflow,
  MessageSquare,
  Package,
  Truck,
  TrendingDown,
  Crown
} from 'lucide-react';

export function FriFeaturesPage() {
  const garageModules = [
    { name: 'GaragePlan', tag: 'Planlægning', status: 'Klar' },
    { name: 'GarageTeam', tag: 'HR/Bemanding', status: 'Klar' },
    { name: 'GarageBooks', tag: 'Fakturering', status: 'Klar' },
    { name: 'GarageHub', tag: 'Guides', status: 'Klar' },
    { name: 'GarageQuote', tag: 'Tilbud', status: 'Under udvikling' },
    { name: 'GarageBook', tag: 'Online booking', status: 'Under udvikling' },
    { name: 'GarageSync', tag: 'e-conomic', status: 'Roadmap' },
    { name: 'GarageChat', tag: 'Beskeder', status: 'Roadmap' },
    { name: 'GarageTech', tag: 'Teknisk data', status: 'Roadmap' },
    { name: 'GarageParts', tag: 'Reservedele', status: 'Roadmap' },
    { name: 'GarageStock', tag: 'Lagerstyring', status: 'Roadmap' },
    { name: 'GarageDeal', tag: 'Bilsalg', status: 'Roadmap' },
    { name: 'GarageCommission', tag: 'Kommissionssalg', status: 'Roadmap' },
    { name: 'GarageRent', tag: 'Udlejning', status: 'Roadmap' },
    { name: 'GarageTires', tag: 'Dækhotel', status: 'Roadmap' },
    { name: 'GarageService', tag: 'Servicebog', status: 'Roadmap' },
  ];

  const features = [
    {
      category: '📊 ERP & Forretningsstyring',
      icon: Database,
      description: 'Fuld ERP-funktionalitet for auto-industrien',
      features: [
        'Kundeadministration (CRM)',
        'Ordreforvaltning',
        'Lagertyring & varekatalog',
        'Prislogik & rabatgrupper',
        'Medarbejderstyring & rolle-baseret adgang',
        'Regnskabsintegration (e-conomic)',
        'Rapportgenerering & analyse'
      ]
    },
    {
      category: '💳 Betalinger & Fakturering',
      icon: CreditCard,
      description: 'Komplette betalingsløsninger',
      features: [
        'Automatisk fakturagenerering',
        'Online betaling via Stripe, MobilePay',
        'Recurring billing & abonnement',
        'Betalingspåmindelser',
        'Kreditnota & returneringer',
        'PSD2-kompatibel for SEPA',
        'Betalingstracking & ledger'
      ]
    },
    {
      category: '📅 Planlægning & Ressourcer',
      icon: Calendar,
      description: 'Smart planlægning af hele operationen',
      features: [
        'Visuel dag/uge/månedsplanlægning',
        'Ressourceallokeringogning',
        'Tidsregistrering & timeseddel',
        'Arbejdskort & jobdelegering',
        'Kapacitetsplanlægning',
        'Påmindelser & notifikationer'
      ]
    },
    {
      category: '💬 Kommunikation & Automatisering',
      icon: MessageSquare,
      description: 'Automatiserede kundeprocesser',
      features: [
        'SMS & email dokumentation',
        'Automatiske påmindelser & bekræftelser',
        'Chatbot for bookinger',
        'Kundeportal med selvbetjening',
        'Real-time update til kunder',
        'Template-baseret kommunikation'
      ]
    },
    {
      category: '📦 Reservedele & Lager',
      icon: Package,
      description: 'Intelligent lagerstyring',
      features: [
        'Stregkodescanning',
        'Min/max lager & auto-bestilling',
        'Multi-lokations lager',
        'Vare-katalog med priser',
        'Leverandør-API integrationer',
        'Lagertælling & inventar'
      ]
    },
    {
      category: '🚗 Bilhandel & Kommission',
      icon: Truck,
      description: 'Bilsalg og kommissionssalg',
      features: [
        'Bilhandel workflow',
        'Kommissionsafregning',
        'Automatisk provisionsberegning',
        'Bilcontraktsgen­ere­ring',
        'Momsberegning',
        'Finansieringsintegration'
      ]
    },
    {
      category: '📊 Analytik & Rapporter',
      icon: BarChart3,
      description: 'Data-drevne indsigter',
      features: [
        'Omsætningsrapporter',
        'Kundeanalyse',
        'Medarbejder-performance',
        'Rentabilitetsanalyse',
        'Dashboard & KPI-tracking',
        'Eksportér til PDF/Excel'
      ]
    },
    {
      category: '👥 Teamsamarbejde',
      icon: Users,
      description: 'Hele holdet på samme side',
      features: [
        'Ubegrænsede teammedlemmer',
        'Rolle & tilladelsesstyring',
        'Fravær & ferieplanlægning',
        'Kompetenceprofiler',
        'Aktivitetslog & audit trail',
        'Intern kommunikation'
      ]
    },
    {
      category: '🔒 Sikkerhed & Compliance',
      icon: Shield,
      description: 'Enterprise-grade sikkerhed',
      features: [
        'SSL-kryptering end-to-end',
        'GDPR & compliance',
        'Totrins-autentificering',
        'Daglige backups',
        'Adgangskontrol & logging',
        'ISO 27001 standard',
        'SOC2 compliance'
      ]
    },
    {
      category: '🔗 Integrationer',
      icon: Workflow,
      description: 'Kobl til dine favorit-systemer',
      features: [
        'e-conomic (bogføring)',
        'Google Kalender & Outlook',
        'Stripe & MobilePay',
        'SMS-gateway & Email',
        'Google Maps & GPS',
        'Auto-parts APIs',
        'Custom webhooks & REST API'
      ]
    },
    {
      category: 'Flådestyring',
      icon: Zap,
      description: 'Administrer hele din bilflåde på ét sted',
      features: [
        'Registrer og organiser køretøjer',
        'Spor vedligeholdelse og inspektioner',
        'Administrer forsikring og registreringsdokumenter',
        'Billeder og dokumentation af køretøjer',
        'Tilstand og kilometer notater',
        'GPS-tracking og placeringsdata'
      ]
    },
    {
      category: 'Bookinger & Kalenderstyring',
      icon: Calendar,
      description: 'Modtag og administrer bookinger nemt',
      features: [
        'Online bookingkalender',
        'Automatisk bekræftelse af bookinger',
        'SMS og email påmindelser til kunder',
        'Fleksibel prissætning per køretøj',
        'Tilgængelighedsstyring',
        'Dubletbooking-beskyttelse'
      ]
    },
    {
      category: 'Mobil & Offline',
      icon: Smartphone,
      description: 'Arbejd hvor som helst',
      features: [
        'Native iOS & Android apps',
        'Offline mode',
        'Real-time sync',
        'Mobile-first design',
        'Biometric login',
        'Push notifications'
      ]
    },
    {
      category: 'Sikkerhed & Compliance',
      icon: Shield,
      description: 'Enterprise-grade sikkerhed',
      features: [
        '100% SSL-kryptering',
        'GDPR-kompatibel',
        'Totrins-autentificering',
        'Daglige backups',
        'Adgangskontrol og logging',
        'Sikker datacenter-hosting'
      ]
    },
    {
      category: 'Dokumenthåndtering',
      icon: FileText,
      description: 'Organisér alle dokumenter sikkert',
      features: [
        'Gem kontrakter og aftaler',
        'Forsikringsdokumenter',
        'Køretøjsdokumentation',
        'Kundeudtalelser og identifikation',
        'Version kontrol af dokumenter',
        'Nemt at dele med teammedlemmer'
      ]
    },
    {
      category: 'Kommunikation',
      icon: Bell,
      description: 'Hold kunderne orienteret',
      features: [
        'SMS og email integrations',
        'Automatiske påmindelser',
        'Kundebeskeder og notifikationer',
        'Tilpasbare email-skabeloner',
        'Booking-links til deling',
        'Chat-support'
      ]
    },
    {
      category: 'Branding & Tilpasning',
      icon: Settings,
      description: 'Gør platformen til dit eget brand',
      features: [
        'Indsæt dine farver og logo',
        'Tilpasset domæne',
        'Brugerdefinerede email-signaturer',
        'Tilpasset kundeportal',
        'Sidespecifikke branding',
        'Hvid-label mulighed'
      ]
    },
    {
      category: 'Integration & API',
      icon: Cloud,
      description: 'Forbind dine favoritværktøjer',
      features: [
        'Webhook-support',
        'REST API (Business plan+)',
        'Integration med regnskabssoftware',
        'Export til Excel/CSV',
        'Kalenderintegrationer',
        'Betaling gateway-integrationer'
      ]
    },
    {
      category: 'Support & Onboarding',
      icon: Clock,
      description: 'Vi hjælper dig på vejen',
      features: [
        'Personlig onboarding assistance',
        'Email support (24 timer responstid)',
        'Detaljeret dokumentation',
        'Video-tutorials',
        'FAQ og knowledge base',
        'Slack support (Business plan+)'
      ]
    },
    {
      category: 'Performance & Reliability',
      icon: TrendingUp,
      description: 'Hurtig og pålidelig drift',
      features: [
        '99.9% uptime garanteret',
        'Verden-klasse infrastruktur',
        'Automatiske opdateringer',
        'Mobiloptimeret',
        'Offline mode',
        'Synkronisering på alle enheder'
      ]
    }
  ];

  // Icon mapping since we can't pass icon functions directly
  const iconMap: { [key: string]: any } = {
    'Flådestyring': Zap,
    'Bookinger & Kalenderstyring': Calendar,
    'Fakturaering & Betalinger': DollarSign,
    'Analytik & Rapporter': BarChart3,
    'Teamsamarbejde': Users,
    'Sikkerhed & Compliance': Shield,
    'Dokumenthåndtering': FileText,
    'Kommunikation': Bell,
    'Branding & Tilpasning': Settings,
    'Integration & API': Cloud,
    'Support & Onboarding': Clock,
    'Performance & Reliability': TrendingUp
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_45%)]" />
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/fri" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.35)]">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Din platform</span>
          </Link>
          <div className="flex gap-4">
            <Link to="/fri/login">
              <Button variant="ghost" className="text-white/80 hover:text-amber-100 hover:bg-white/10">Log ind</Button>
            </Link>
            <Link to="/fri/trial">
              <Button className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-brown-900 hover:brightness-110">Start prøveperiode</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            Alle funktioner i <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">platformen</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
            En komplet løsning til bilutlejning. Ingen skjulte funktioner – alt er inkluderet i din plan.
          </p>
          <Link to="/fri/trial">
            <Button size="lg" className="gap-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-brown-900 hover:brightness-110">
              Start gratis prøveperiode <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = iconMap[feature.category];
            return (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all h-full">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/30">
                      {IconComponent && <IconComponent className="h-6 w-6 text-amber-300" />}
                    </div>
                  </div>
                  <CardTitle className="text-xl text-white">{feature.category}</CardTitle>
                  <CardDescription className="text-white/60">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.features.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                        <CheckCircle2 className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Comparison Section */}
      <section className="bg-white/5 backdrop-blur-sm py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Hvad er inkluderet på din plan?</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-amber-500/30">
                  <th className="text-left py-4 px-4 font-semibold text-white">Funktion</th>
                  <th className="text-center py-4 px-4 font-semibold text-white">Professional</th>
                  <th className="text-center py-4 px-4 font-semibold text-white">Business</th>
                  <th className="text-center py-4 px-4 font-semibold text-white">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/10 hover:bg-white/5">
                  <td className="py-4 px-4 text-white font-semibold">Flådestyring</td>
                  <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-amber-400 mx-auto" /></td>
                  <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-amber-400 mx-auto" /></td>
                  <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-amber-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/10 hover:bg-white/5">
                  <td className="py-4 px-4 text-white font-semibold">Bookinger</td>
                  <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-amber-400 mx-auto" /></td>
                  <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-amber-400 mx-auto" /></td>
                  <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-amber-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/10 hover:bg-white/5">
                  <td className="py-4 px-4 text-white font-semibold">Fakturaering</td>
                  <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-amber-400 mx-auto" /></td>
                  <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-amber-400 mx-auto" /></td>
                  <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-amber-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/10 hover:bg-white/5">
                  <td className="py-4 px-4 text-white font-semibold">Grundlæggende analytik</td>
                  <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-amber-400 mx-auto" /></td>
                  <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-amber-400 mx-auto" /></td>
                  <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-amber-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/10 hover:bg-white/5">
                  <td className="py-4 px-4 text-white font-semibold">Avanceret analytik</td>
                  <td className="text-center py-4 px-4 text-white/40">–</td>
                  <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-amber-400 mx-auto" /></td>
                  <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-amber-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/10 hover:bg-white/5">
                  <td className="py-4 px-4 text-white font-semibold">Teammedlemmer</td>
                  <td className="text-center py-4 px-4 text-white/70">3</td>
                  <td className="text-center py-4 px-4 text-white/70">10</td>
                  <td className="text-center py-4 px-4 text-white/70">Ubegrænset</td>
                </tr>
                <tr className="border-b border-white/10 hover:bg-white/5">
                  <td className="py-4 px-4 text-white font-semibold">API adgang</td>
                  <td className="text-center py-4 px-4 text-white/40">–</td>
                  <td className="text-center py-4 px-4 text-white/70">Read-only</td>
                  <td className="text-center py-4 px-4 text-white/70">Fuldt</td>
                </tr>
                <tr className="border-b border-white/10 hover:bg-white/5">
                  <td className="py-4 px-4 text-white font-semibold">Branding tilpasning</td>
                  <td className="text-center py-4 px-4 text-white/40">–</td>
                  <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-amber-400 mx-auto" /></td>
                  <td className="text-center py-4 px-4"><CheckCircle2 className="w-5 h-5 text-amber-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/10 hover:bg-white/5">
                  <td className="py-4 px-4 text-white font-semibold">Prioritets support</td>
                  <td className="text-center py-4 px-4 text-white/40">–</td>
                  <td className="text-center py-4 px-4 text-white/70">Email + Slack</td>
                  <td className="text-center py-4 px-4 text-white/70">24/7 prioritets</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="py-4 px-4 text-white font-semibold">SLA garanteret uptime</td>
                  <td className="text-center py-4 px-4 text-white/40">–</td>
                  <td className="text-center py-4 px-4 text-white/40">–</td>
                  <td className="text-center py-4 px-4 text-white/70">99.9%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-y border-amber-500/30 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">Klar til at se det hele i aktion?</h2>
          <p className="text-xl mb-8 text-white/70">
            Prøv alle funktioner helt gratis i 14 dage. Intet kreditkort påkrævet.
          </p>
          <Link to="/fri/trial">
            <Button size="lg" className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-brown-900 hover:brightness-110">
              Start gratis prøveperiode
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#070a12] text-white py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-lg mb-4 text-amber-200">Om platformen</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link to="/fri" className="hover:text-amber-300">Hjem</Link></li>
                <li><Link to="/fri/features" className="hover:text-amber-300">Funktioner</Link></li>
                <li><Link to="/fri/landing" className="hover:text-amber-300">Priser</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-amber-200">Support</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="mailto:support@yourdomain.com" className="hover:text-amber-300">support@yourdomain.com</a></li>
                <li><a href="#" className="hover:text-amber-300">Dokumentation</a></li>
                <li><a href="#" className="hover:text-amber-300">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-amber-200">Juridisk</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-amber-300">Privatlivspolitik</a></li>
                <li><a href="#" className="hover:text-amber-300">Vilkår & betingelser</a></li>
                <li><a href="#" className="hover:text-amber-300">GDPR</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-amber-200">Kontakt</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>Din virksomhed</li>
                <li>Danmark</li>
                <li><a href="tel:+4544889999" className="hover:text-amber-300">+45 44 88 99 99</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-sm text-white/40">
            <p>© 2026 Din platform. Alle rettigheder forbeholdt.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
