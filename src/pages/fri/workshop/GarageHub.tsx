import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, BookOpen, Lightbulb, Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function GarageHubPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/fri/login');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: BookOpen,
      title: 'Guides & Dokumentation',
      description: 'Best practice guides, video tutorials og step-by-step dokumentation.',
    },
    {
      icon: Lightbulb,
      title: 'Tips & Tricks',
      description: 'Eksperimenter deler deres erfaringer og får mere ud af GaragePlan.',
    },
    {
      icon: Users,
      title: 'Community Forum',
      description: 'Stil spørgsmål til andre værkstedsledere og få svar hurtigt.',
    },
  ];

  const benefits = [
    'Lær i dit tempo',
    'Bedre praksis',
    'Mindre fejl',
    'Del erfaringer',
    'Community support',
    'Nye features først',
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
                <h1 className="text-2xl font-bold text-white">GarageHub</h1>
                <p className="text-sm text-slate-400">News, Guides & Community</p>
              </div>
            </div>
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">Klar</Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-2xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Dit værksted lærer bedre</h2>
            <p className="text-slate-300 text-lg mb-6">
              GarageHub er dit knowledge center. Guides, tips og community support - alt samlet ét sted.
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold">
                Udforsker nu
              </Button>
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                Se nyhedsbrev
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
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="text-sm text-slate-400">Guides</p>
                    <p className="font-bold text-white">50+ artikler</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-slate-400">Community</p>
                    <p className="font-bold text-white">1000+ medlemmer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">Hvad kan du finde?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="bg-slate-800/50 border-slate-700/50 hover:border-indigo-500/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-500/20 p-3 rounded-lg">
                      <feature.icon className="w-5 h-5 text-indigo-400" />
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

        {/* Featured Articles */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">Seneste Guides</h2>
          <div className="space-y-3">
            {[
              'Sådan planlægger du værkstedet optimalt',
              'Best practice: Tidsregistrering, der virker',
              'Opsætning af ressourceplanlægning',
              'Tips til at minimere overlidelse',
            ].map((article) => (
              <div key={article} className="flex items-center gap-3 bg-slate-800/30 border border-slate-700/30 rounded-lg p-4 hover:border-indigo-500/50 cursor-pointer transition-colors">
                <BookOpen className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <span className="text-slate-300 flex-1">{article}</span>
                <span className="text-slate-500 text-sm">→</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Bliv del af communityspirit</h2>
          <p className="text-indigo-50 mb-6 max-w-2xl mx-auto">
            Lær af andre værkstedsledere og del dine erfaringer.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold">
              Gå til GarageHub
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-indigo-100 text-white hover:bg-indigo-700"
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

export default GarageHubPage;
