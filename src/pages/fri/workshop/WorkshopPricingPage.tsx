import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WORKSHOP_TIERS, getAllTiers } from '@/data/workshopTiers';
import { workshopModules } from '@/data/workshopModules';
import { Check, Zap } from 'lucide-react';

export function WorkshopPricingPage() {
  const navigate = useNavigate();
  const tiers = getAllTiers();

  // Group modules by tier for display
  const modulesByTier = {
    basic: workshopModules.filter(m => m.minTier === 'basic').slice(0, 3),
    professional: workshopModules.filter(m => m.minTier === 'professional').slice(0, 3),
    premium: workshopModules.filter(m => m.minTier === 'premium').slice(0, 6),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-12 px-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Vælg din Garage Workshop Plan
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          Starter med Basic og upgrade når dit værksted vokser. Alle planer har ubegrænset adgang til de inkluderede moduler.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <Card
            key={tier.id}
            className={`relative overflow-hidden transition-all ${
              tier.highlighted
                ? 'md:scale-105 border-amber-500 bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl'
                : 'bg-slate-800 border-slate-700'
            }`}
          >
            {tier.badge && (
              <div className="absolute top-0 right-0">
                <Badge className="rounded-none rounded-bl-lg bg-amber-500 text-black font-bold">
                  {tier.badge}
                </Badge>
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-white text-2xl">{tier.name}</CardTitle>
              <CardDescription className="text-slate-300">{tier.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">{tier.priceMonthly}</span>
                  <span className="text-slate-300">kr/måned</span>
                </div>
                <p className="text-xs text-slate-400">Factureres månedligt. Ingen binding.</p>
              </div>

              {/* CTA Button */}
              <Button
                className={`w-full ${
                  tier.highlighted
                    ? 'bg-amber-500 hover:bg-amber-600 text-black font-bold'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
                size="lg"
                onClick={() => navigate('/fri/settings?tab=subscription')}
              >
                {tier.id === 'premium' ? 'Få Premium Adgang' : `Upgrade til ${tier.name}`}
              </Button>

              {/* Module Count */}
              <div className="bg-slate-700/50 rounded-lg p-4 text-center border border-slate-600">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-white">{tier.modules.length} moduler</span>
                </div>
                <p className="text-xs text-slate-400">
                  Fulde adgang til alle {tier.modules.length} moduler i denne plan
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-200">Hvad du får:</h4>
                <ul className="space-y-2">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sample Modules */}
              <div className="space-y-2 border-t border-slate-700 pt-6">
                <h4 className="text-xs font-semibold text-slate-200 uppercase">
                  Eksempel moduler
                </h4>
                <div className="flex flex-wrap gap-2">
                  {modulesByTier[tier.id as keyof typeof modulesByTier].map((module) => (
                    <Badge
                      key={module.id}
                      variant="outline"
                      className="text-xs bg-slate-700 border-slate-600 text-slate-200"
                    >
                      {module.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Support Info */}
              <div className="text-xs text-slate-400 text-center pt-4 border-t border-slate-700">
                {tier.id === 'basic' && '✉️ Email support'}
                {tier.id === 'professional' && '⭐ Prioriteret support'}
                {tier.id === 'premium' && '🎯 VIP support (24/7)'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto mt-16 space-y-6">
        <h2 className="text-3xl font-bold text-white text-center mb-8">Hyppigt stillede spørgsmål</h2>

        <div className="grid gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Kan jeg skifte plan når som helst?</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 text-sm">
              Ja! Du kan opgrader eller nedgradera din plan til enhver tid. Ændringer træder i kraft næste faktureringsdato.
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Er der en gratis prøveperiode?</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 text-sm">
              Ja! Få 30 dage gratis adgang til alle moduler for at teste systemet fuldt ud. Intet kreditkort krævet.
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Hvad hvis jeg skal have moduler fra flere niveauer?</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 text-sm">
              Ingen problemer! Premium-planen indeholder alle 16 moduler, inkluderet de der kommer snart. Det giver dig fleksibilitet til at vokse.
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Hvad med support?</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 text-sm">
              Basic tilbyder email support, Professional prioriteret support, og Premium får VIP support via prioriteret kanal + telefonlinje.
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-2xl mx-auto mt-16 bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl p-8 text-center">
        <h3 className="text-2xl font-bold text-white mb-3">Klar til at få gang i det?</h3>
        <p className="text-amber-100 mb-6 text-sm">
          Join hundredvis af værksteder der allerede bruger Garage til at drive deres forretning mere effektivt.
        </p>
        <Button
          className="bg-white text-amber-600 hover:bg-amber-50 font-bold text-lg px-8"
          size="lg"
          onClick={() => navigate('/fri/settings?tab=subscription')}
        >
          Start 30 dages gratis prøveperiode
        </Button>
      </div>
    </div>
  );
}
