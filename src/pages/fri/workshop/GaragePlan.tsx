import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Calendar, Users, Clock, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function GaragePlanPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/fri/login');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Calendar,
      title: 'Smart Kalender',
      description: 'Planlæg dine arbejdsopgaver visuelt. Se alle jobs, tid og resurser på et blik.',
    },
    {
      icon: Users,
      title: 'Ressourceplanlægning',
      description: 'Fordel mekanikere effektivt. Sådan at ingen står stiller og ingen bliver overbelastet.',
    },
    {
      icon: Clock,
      title: 'Tidsregistrering',
      description: 'Automatisk sporing af arbejdstid. Præcis dokumentation for kundefakturering.',
    },
    {
      icon: Zap,
      title: 'Arbejdskort',
      description: 'Dynamiske arbejdskort der synkroniserer live. Mekanikerne ved præcis hvad der skal gøres.',
    },
  ];

  const benefits = [
    'Færre huller i kalenderen',
    'Bedre udnyttelse af kapacitet',
    'Højere kundetilfredshed',
    'Mindre planningschaos',
    'Automatisk SMS til kunder',
    'Real-time kalender-sync',
  ];

  const integrations = [
    { name: 'Google Kalender', icon: '📅' },
    { name: 'Outlook', icon: '📧' },
    { name: 'SMS Notifikationer', icon: '📱' },
    { name: 'Google Maps', icon: '🗺️' },
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
                <h1 className="text-2xl font-bold text-white">GaragePlan</h1>
                <p className="text-sm text-slate-400">Planlægning & Ressourcestyring</p>
              </div>
            </div>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Klar</Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-2xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Få styr på dit værksted</h2>
            <p className="text-slate-300 text-lg mb-6">
              GaragePlan er din digitale planlægger. Ingen papir, ingen møder - bare smart planlægning.
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-brown-900 font-bold">
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
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-slate-400">Tilgængelig</p>
                    <p className="font-bold text-white">Straks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-slate-400">Teams</p>
                    <p className="font-bold text-white">Ubegrænset</p>
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
              <Card key={idx} className="bg-slate-800/50 border-slate-700/50 hover:border-amber-500/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-500/20 p-3 rounded-lg">
                      <feature.icon className="w-6 h-6 text-amber-400" />
                    </div>
                    <CardTitle className="text-white">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">Hvad får du?</h2>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-300">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">Integrerer med</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {integrations.map((integration, idx) => (
              <Card key={idx} className="bg-slate-800/50 border-slate-700/50 text-center hover:border-amber-500/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-2">{integration.icon}</div>
                  <p className="text-sm text-slate-300">{integration.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ-Style Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">The Perfect Workflow</h2>
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Sådan fungerer GaragePlan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="bg-amber-500 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <span className="text-brown-900 font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-semibold text-white">Kunde ringer/booker online</p>
                  <p className="text-sm text-slate-400">Job oprettes automatisk i systemet</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-amber-500 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <span className="text-brown-900 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-semibold text-white">Du tildeler mekanikere</p>
                  <p className="text-sm text-slate-400">GaragePlan finder den bedste ressource automatisk</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-amber-500 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <span className="text-brown-900 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-semibold text-white">Mekaniker modtager arbejdskort</p>
                  <p className="text-sm text-slate-400">Push notifikation + SMS - de ved hvad der skal gøres</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-amber-500 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <span className="text-brown-900 font-bold text-sm">4</span>
                </div>
                <div>
                  <p className="font-semibold text-white">Arbejde afsluttes</p>
                  <p className="text-sm text-slate-400">Tidsregistrering + kundefakturering sker automatisk</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-amber-600 to-yellow-600 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Klar til at starte?</h2>
          <p className="text-amber-50 mb-6 max-w-2xl mx-auto">
            GaragePlan er gratis de første 30 dage. Prøv det uden kreditortkort.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-white text-amber-600 hover:bg-amber-50 font-bold">
              Start gratis prøveperiode
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-amber-100 text-white hover:bg-amber-700"
              onClick={() => navigate('/fri/trial')}
            >
              Mere info
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GaragePlanPage;
