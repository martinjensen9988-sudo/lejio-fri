import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Car, FileText, DollarSign, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function GarageDealPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/fri/login');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Car,
      title: 'Bilhandel Flow',
      description: 'Fra optik til papirer - hele salgsprocessen på ét sted.',
    },
    {
      icon: DollarSign,
      title: 'Momsberegning',
      description: 'Automatisk korrekt momsafregning for biltransaktioner.',
    },
    {
      icon: FileText,
      title: 'Kontraktskabeloner',
      description: 'Juridisk sikre kontraktskabeloner, klar til underskrift.',
    },
  ];

  const benefits = [
    'Sikker momsafregning',
    'Hurtigere salg',
    'Færre manuelle trin',
    'Compliance sikret',
    'Digital underskrift',
    'Automatisk registrering',
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
                <h1 className="text-2xl font-bold text-white">GarageDeal</h1>
                <p className="text-sm text-slate-400">Car Sales Module</p>
              </div>
            </div>
            <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Klar</Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Bilsalg gjort nemt</h2>
            <p className="text-slate-300 text-lg mb-6">
              GarageDeal håndterer hele bilsalgsprocessen med korrekt momsafregning og automatisk dokumentation.
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white font-bold">
                Start nu
              </Button>
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                Læs mere
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
                  <DollarSign className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm text-slate-400">Moms</p>
                    <p className="font-bold text-white">Automatisk beregnet</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-slate-400">Kontrakt</p>
                    <p className="font-bold text-white">Template baseret</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">Funktioner</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="bg-slate-800/50 border-slate-700/50 hover:border-red-500/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="bg-red-500/20 p-3 rounded-lg">
                      <feature.icon className="w-5 h-5 text-red-400" />
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

        {/* CTA */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Skalerer dine biler hurtigt</h2>
          <p className="text-red-50 mb-6 max-w-2xl mx-auto">
            Automatisk momsafregning og kontraktbehandling. Gratis i 30 dage.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-white text-red-600 hover:bg-red-50 font-bold">
              Start gratis prøveperiode
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-red-100 text-white hover:bg-red-700"
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

export default GarageDealPage;
