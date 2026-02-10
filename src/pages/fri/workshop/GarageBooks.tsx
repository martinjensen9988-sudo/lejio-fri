import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Receipt, CreditCard, FileText, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function GarageBooks() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/fri/login');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Receipt,
      title: 'Automatisk Faktura',
      description: 'Fakturaer oprettes automatisk fra jobs. Ingen manuel indtastning.',
    },
    {
      icon: CreditCard,
      title: 'Betaling & Flow',
      description: 'Håndter betalinger, kreditnoter og tilbagekrav centralt.',
    },
    {
      icon: FileText,
      title: 'Prislogik pr. Opgave',
      description: 'Definer priser baseret på type, tidsestimat og kompleksitet.',
    },
    {
      icon: TrendingUp,
      title: 'Økonomi Dashboard',
      description: 'Real-time indsigt i omsætning, margin og kundedetaljer.',
    },
  ];

  const benefits = [
    'Hurtigere betaling',
    'Mindre manuelt arbejde',
    'Færre fejl i faktura',
    'Bedre pengestrøm',
    'Automatisk relancer',
    'Kunde-oversigt',
  ];

  const integrations = [
    { name: 'MobilePay', icon: '💳' },
    { name: 'Stripe', icon: '🔗' },
    { name: 'PDF Eksport', icon: '📄' },
    { name: 'e-conomic', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/fri')}
                className="hover:bg-slate-800 p-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">GarageBooks</h1>
                <p className="text-sm text-slate-400">Customers & Invoicing</p>
              </div>
            </div>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Klar</Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Fakturering, der virker</h2>
            <p className="text-slate-300 text-lg mb-6">
              GarageBooks håndterer alt omkring kundebetalinger. Automatisk faktura, betalings-tracking og økonomi-oversigt på et blik.
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="bg-purple-500 hover:bg-purple-600 text-white font-bold">
                Start gratis
              </Button>
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                Se demo
              </Button>
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-slate-400">Status</p>
                    <p className="font-bold text-white">Fuld implementering</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-slate-400">Betalings metoder</p>
                    <p className="font-bold text-white">3+ integreret</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Receipt className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-slate-400">Fakturaer</p>
                    <p className="font-bold text-white">Auto-genereret</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">Funktioner</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="bg-slate-800/50 border-slate-700/50 hover:border-purple-500/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-500/20 p-3 rounded-lg">
                      <feature.icon className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-white">{feature.title}</CardTitle>
                      <CardDescription className="text-slate-400 mt-2">{feature.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">Fordele</h2>
          <div className="grid grid-cols-2 gap-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 bg-slate-800/30 border border-slate-700/30 rounded-lg p-4">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-slate-300">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Integrations */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">Betalings Integrationer</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {integrations.map((integration, idx) => (
              <Card key={idx} className="bg-slate-800/50 border-slate-700/50 text-center hover:border-purple-500/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-2">{integration.icon}</div>
                  <p className="text-sm text-slate-300">{integration.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Gem timer på administration</h2>
          <p className="text-purple-50 mb-6 max-w-2xl mx-auto">
            GarageBooks er gratis de første 30 dage. Prøv det uden kreditkort.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50 font-bold">
              Start gratis prøveperiode
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-purple-100 text-white hover:bg-purple-700"
              onClick={() => navigate('/fri')}
            >
              Tilbage til dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GarageBooks;
