import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Share2, Database, RefreshCw, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function GarageSyncPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/fri/login');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Share2,
      title: 'Kunde Synkronisering',
      description: 'Alle dine kunder synkroniseres automatisk til e-conomic.',
    },
    {
      icon: RefreshCw,
      title: 'Automatisk Faktura',
      description: 'Fakturaer sendes direkte til e-conomic uden manuel indtastning.',
    },
    {
      icon: Database,
      title: 'Bogføring Klar',
      description: 'Din bogføring er altid opdateret og klar til revisor.',
    },
    {
      icon: TrendingUp,
      title: 'CVR & Kontoplan',
      description: 'Automatisk CVR opslag og kontoplan mapping.',
    },
  ];

  const benefits = [
    'Mindre dobbeltindtastning',
    'Klar bogføring',
    'Samlet kundedata',
    'Automatisk rapporter',
    'Revision-sikker',
    'Åben.bogholderi integrering',
  ];

  const integrations = [
    { name: 'e-conomic', icon: '📊' },
    { name: 'CVR Opslag', icon: '🔍' },
    { name: 'Kontoplan', icon: '💼' },
    { name: 'Revisor Export', icon: '📋' },
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
                <h1 className="text-2xl font-bold text-white">GarageSync</h1>
                <p className="text-sm text-slate-400">Integration with e-conomic</p>
              </div>
            </div>
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Klar</Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Bogføring, der synkroniseres</h2>
            <p className="text-slate-300 text-lg mb-6">
              GarageSync forbinder dit værksted med e-conomic. Alle fakturaer og kundedata synkroniseres automatisk.
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white font-bold">
                Forbind e-conomic
              </Button>
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                Se setup guide
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
                  <Share2 className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-slate-400">Synk frekvens</p>
                    <p className="font-bold text-white">Real-time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-slate-400">Data sikkerhed</p>
                    <p className="font-bold text-white">Krypteret forbindelse</p>
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
              <Card key={idx} className="bg-slate-800/50 border-slate-700/50 hover:border-green-500/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-500/20 p-3 rounded-lg">
                      <feature.icon className="w-5 h-5 text-green-400" />
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
          <h2 className="text-2xl font-bold text-white mb-8">Understøttede Systemer</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {integrations.map((integration, idx) => (
              <Card key={idx} className="bg-slate-800/50 border-slate-700/50 text-center hover:border-green-500/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-2">{integration.icon}</div>
                  <p className="text-sm text-slate-300">{integration.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Klar til integration?</h2>
          <p className="text-green-50 mb-6 max-w-2xl mx-auto">
            Forbind e-conomic på 5 minutter. Vi holder styr på resten.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-white text-green-600 hover:bg-green-50 font-bold">
              Forbind nu
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-green-100 text-white hover:bg-green-700"
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

export default GarageSyncPage;
