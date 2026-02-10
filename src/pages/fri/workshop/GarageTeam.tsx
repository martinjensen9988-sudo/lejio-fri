import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Users, Clock, Shield, BarChart3, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function GarageTeamPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/fri/login');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Users,
      title: 'Bemanningsplan',
      description: 'Overblik over hele dit team. Sådan at jobbet altid får den rette person.',
    },
    {
      icon: Clock,
      title: 'Fravær & Ferie',
      description: 'Håndter fravær, ferie og permissioner centralt. Automatisk kalender-markering.',
    },
    {
      icon: Shield,
      title: 'Rollebaseret adgang',
      description: 'Tildel rettigheder baseret på rolle. Mekanikere, ledere, administratorer.',
    },
    {
      icon: BarChart3,
      title: 'HR Rapporter',
      description: 'Analyser og rapporter over team-ressourcer, kapacitet og produktivitet.',
    },
  ];

  const benefits = [
    'Mindre planlægningskaos',
    'Bedre bemanding',
    'Hurtigere godkendelser',
    'Automatisk notifikationer',
    'Real-time team-status',
    'Transparent skiftplanlægning',
  ];

  const integrations = [
    { name: 'HR Rapporter', icon: '📊' },
    { name: 'Notifikationer', icon: '🔔' },
    { name: 'Team Kalender', icon: '📅' },
    { name: 'Godkendelsesflow', icon: '✅' },
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
                <h1 className="text-2xl font-bold text-white">GarageTeam</h1>
                <p className="text-sm text-slate-400">Human Resource Management</p>
              </div>
            </div>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Klar</Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Styr over hele dit team</h2>
            <p className="text-slate-300 text-lg mb-6">
              GarageTeam giver dig totalt overblik over ressourcer, fravær og skiftplanlægning. Sådan at alle ved hvad de skal gøre og når.
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white font-bold">
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
                  <Users className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-slate-400">Teams</p>
                    <p className="font-bold text-white">Ubegrænset</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-slate-400">Setup tid</p>
                    <p className="font-bold text-white">5 minutter</p>
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
              <Card key={idx} className="bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500/20 p-3 rounded-lg">
                      <feature.icon className="w-5 h-5 text-blue-400" />
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
          <h2 className="text-2xl font-bold text-white mb-8">Integrerer med</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {integrations.map((integration, idx) => (
              <Card key={idx} className="bg-slate-800/50 border-slate-700/50 text-center hover:border-blue-500/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-2">{integration.icon}</div>
                  <p className="text-sm text-slate-300">{integration.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Workflow */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">Sådan virker det</h2>
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Du inviterer dit team</p>
                    <p className="text-sm text-slate-400">Send invitationer til alle mekanikere og ledere</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">De accepterer invitation</p>
                    <p className="text-sm text-slate-400">Teamet opretter profil og sætter sig selv til rådighed</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Du opretter skiftplan</p>
                    <p className="text-sm text-slate-400">Planlæg skift baseret på ønskede kapacitet og kompetencer</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">4</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Teamet notificeres</p>
                    <p className="text-sm text-slate-400">Push notifikation + SMS - godt nyt, de ved hvornår de skal møde</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Klar til at starte?</h2>
          <p className="text-blue-50 mb-6 max-w-2xl mx-auto">
            GarageTeam er gratis de første 30 dage. Prøv det uden kreditkort.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-bold">
              Start gratis prøveperiode
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-blue-100 text-white hover:bg-blue-700"
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

export default GarageTeamPage;
